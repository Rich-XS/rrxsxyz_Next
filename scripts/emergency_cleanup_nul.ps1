# 紧急清理所有 nul 文件
# 2025-10-29 05:10

$projectRoot = "D:\_100W\rrxsxyz_next"

Write-Host "========================================" -ForegroundColor Red
Write-Host "   紧急清理 NUL 文件" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# 查找所有 nul 文件
Write-Host "正在扫描项目..." -ForegroundColor Yellow
$nulFiles = Get-ChildItem -Path $projectRoot -Filter "nul" -Recurse -ErrorAction SilentlyContinue -File

$count = $nulFiles.Count
Write-Host "找到 $count 个 nul 文件" -ForegroundColor Yellow
Write-Host ""

if ($count -eq 0) {
    Write-Host "✅ 无需清理" -ForegroundColor Green
    exit 0
}

# 删除所有 nul 文件
Write-Host "开始删除..." -ForegroundColor Yellow
$deleted = 0
$failed = 0

foreach ($file in $nulFiles) {
    try {
        Remove-Item -Path $file.FullName -Force -ErrorAction Stop
        $deleted++
        if ($deleted % 100 -eq 0) {
            Write-Host "已删除 $deleted 个..." -ForegroundColor Gray
        }
    } catch {
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "清理完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "删除成功: $deleted" -ForegroundColor Green
Write-Host "删除失败: $failed" -ForegroundColor Yellow

# 验证
$remaining = (Get-ChildItem -Path $projectRoot -Filter "nul" -Recurse -ErrorAction SilentlyContinue -File).Count
Write-Host "剩余文件: $remaining" -ForegroundColor $(if ($remaining -eq 0) { "Green" } else { "Red" })

# 记录到日志
$logFile = Join-Path $projectRoot "nul_cleanup.log"
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Cleaned $deleted nul files (failed: $failed, remaining: $remaining)"
Add-Content -Path $logFile -Value $logEntry

Write-Host ""
Write-Host "日志已保存: $logFile" -ForegroundColor Cyan
