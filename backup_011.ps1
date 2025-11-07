$timestamp = Get-Date -Format "yyyyMMddHHmm"
$taskNumber = "011"
$keyword = "Opus500502Opted"
$backupName = "rrxsxyz_next_${timestamp}_${taskNumber}_${keyword}.zip"
$sourcePath = "D:\_100W\rrxsxyz_next"
$destPath = "D:\_100W\$backupName"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  项目备份: $keyword" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] 收集文件（排除 nul）..." -ForegroundColor Yellow

$items = Get-ChildItem -Path $sourcePath -Recurse |
         Where-Object { $_.Name -ne 'nul' } |
         Select-Object -ExpandProperty FullName

Write-Host "  找到 $($items.Count) 个文件/目录" -ForegroundColor Gray

Write-Host ""
Write-Host "[2/2] 创建压缩包..." -ForegroundColor Yellow

Compress-Archive -Path $items -DestinationPath $destPath -Force

$backup = Get-Item $destPath
$sizeMB = [math]::Round($backup.Length / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "文件名: $backupName" -ForegroundColor White
Write-Host "大小: $sizeMB MB" -ForegroundColor Cyan
Write-Host "路径: $destPath" -ForegroundColor Cyan
Write-Host ""
