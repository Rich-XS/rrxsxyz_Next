# 分析项目中最大的文件（按行数）
# UTF-8 编码，避免中文乱码

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$projectPath = "D:\_100W\rrxsxyz_next"
$excludePaths = @("node_modules", ".git", "server\node_modules")
$includeExtensions = @("*.md", "*.html", "*.js", "*.css", "*.json")

Write-Host "正在分析文件..." -ForegroundColor Green

$files = Get-ChildItem -Path $projectPath -Recurse -File -Include $includeExtensions -ErrorAction SilentlyContinue |
    Where-Object {
        $exclude = $false
        foreach ($excludePath in $excludePaths) {
            if ($_.FullName -like "*$excludePath*") {
                $exclude = $true
                break
            }
        }
        -not $exclude -and $_.Length -lt 5MB -and $_.Name -ne "package-lock.json"
    }

$results = @()

foreach ($file in $files) {
    try {
        $lineCount = (Get-Content -Path $file.FullName -ErrorAction Stop | Measure-Object -Line).Lines
        $relativePath = $file.FullName.Replace($projectPath + "\", "")

        $results += [PSCustomObject]@{
            Name = $file.Name
            Path = $relativePath
            Lines = $lineCount
            SizeKB = [math]::Round($file.Length / 1KB, 2)
        }
    }
    catch {
        # 跳过无法读取的文件
    }
}

Write-Host "`n前10大文件（按行数）：" -ForegroundColor Cyan
$results | Sort-Object -Property Lines -Descending | Select-Object -First 10 | Format-Table -AutoSize

Write-Host "`n前10大文件（按大小KB）：" -ForegroundColor Cyan
$results | Sort-Object -Property SizeKB -Descending | Select-Object -First 10 | Format-Table -AutoSize
