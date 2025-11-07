# 生成 token 统计并输出 summary.md
$dir = Join-Path -Path (Get-Location) -ChildPath '.\.claude\debate_round1'
if (-not (Test-Path $dir)) { Write-Output "DIR_MISSING: $dir"; exit 1 }

# 找到最新的 raw_round1_*.log
$raw = Get-ChildItem -Path $dir -Filter 'raw_round1_*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $raw) { Write-Output "NO_RAW"; exit 0 }
$rawPath = $raw.FullName
Write-Output "USING_RAW: $rawPath"

$outCsv = Join-Path $dir 'token_stats.csv'
$summaryMd = Join-Path $dir 'summary.md'

# 简单的 token 频率统计（按空白拆分），并只保留非空 token
Get-Content -Path $rawPath -Raw | ForEach-Object {
    $_ -split '\s+'
} | Where-Object { $_ -ne '' } | Group-Object | Sort-Object Count -Descending | Select-Object @{Name='Token';Expression={$_.Name}}, @{Name='Count';Expression={$_.Count}} | Export-Csv -NoTypeInformation -Path $outCsv -Encoding UTF8

# 生成 summary，包含 top 20 token
$top = Import-Csv -Path $outCsv | Select-Object -First 20
$now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$header = @("# Round1 Token Summary", "", "Generated: $now", "", "Top tokens:", "")
$body = $top | ForEach-Object { ("- {0} — {1}" -f $_.Token, $_.Count) }
$all = $header + $body
$all | Out-File -FilePath $summaryMd -Encoding UTF8

Write-Output "CSV_WRITTEN: $outCsv"
Write-Output "SUMMARY_WRITTEN: $summaryMd"
