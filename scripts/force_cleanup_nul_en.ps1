# 强制清理 nul 文件 - 使用特殊路径格式
# 2025-10-29 05:12
# 参考: Windows nul 是保留设备名，需要使用 \\?\ 前缀

$projectRoot = "D:\_100W\rrxsxyz_next"

Write-Host "========================================" -ForegroundColor Red
Write-Host "   强制清理 NUL 文件（使用特殊路径）" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# 查找所有 nul 文件
Write-Host "正在扫描..." -ForegroundColor Yellow
$nulFiles = Get-ChildItem -Path $projectRoot -Filter "nul" -Recurse -ErrorAction SilentlyContinue -File

$count = $nulFiles.Count
Write-Host "找到 $count 个 nul 文件" -ForegroundColor Yellow

if ($count -eq 0) {
    Write-Host "✅ 无需清理" -ForegroundColor Green
    exit 0
}

# 使用 \\?\ 前缀删除（绕过 Windows 保留设备名检查）
Write-Host "使用特殊路径格式删除..." -ForegroundColor Yellow
$deleted = 0
$failed = 0

foreach ($file in $nulFiles) {
    try {
        # 使用 \\?\ 前缀
        $specialPath = "\\?\$($file.FullName)"
        [System.IO.File]::Delete($specialPath)
        $deleted++
        if ($deleted % 100 -eq 0) {
            Write-Host "已删除 $deleted 个..." -ForegroundColor Gray
        }
    } catch {
        # 尝试第二种方法：使用 cmd del
        try {
            cmd /c "del /F /Q `"$($file.FullName)`" 2>nul"
            $deleted++
        } catch {
            $failed++
        }
    }
}

Write-Host ""
Write-Host "删除成功: $deleted" -ForegroundColor Green
Write-Host "删除失败: $failed" -ForegroundColor Yellow

# 验证
$remaining = (Get-ChildItem -Path $projectRoot -Filter "nul" -Recurse -ErrorAction SilentlyContinue -File).Count
Write-Host "剩余文件: $remaining" -ForegroundColor $(if ($remaining -eq 0) { "Green" } else { "Red" })

# 记录
$logFile = Join-Path $projectRoot "nul_cleanup_force.log"
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Force cleaned $deleted nul files (failed: $failed, remaining: $remaining)"
Add-Content -Path $logFile -Value $logEntry

Write-Host "日志: $logFile" -ForegroundColor Cyan
