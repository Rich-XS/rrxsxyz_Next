param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    [string]$OutDir = '.\\.claude\\debate_round1',
    [string]$Pattern = 'Round1|debate|token'
)

if (-not (Test-Path $SourcePath)) { Write-Error "SourcePath not found: $SourcePath"; exit 1 }
if (-not (Test-Path $OutDir)) { New-Item -Path $OutDir -ItemType Directory -Force | Out-Null }

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$rawFile = Join-Path $OutDir "raw_round1_live.log"
Write-Output "Watching: $SourcePath -> $rawFile (pattern: $Pattern)"

# 使用 Get-Content -Wait 实时跟踪新追加的行，只捕获匹配的行并追加到 raw 文件
try {
    Get-Content -Path $SourcePath -Encoding UTF8 -Tail 0 -Wait | ForEach-Object {
        $line = $_
        if ($line -match $Pattern) {
            $line | Out-File -FilePath $rawFile -Append -Encoding UTF8
        }
    }
} catch {
    Write-Error "Watcher stopped with error: $_"
}
