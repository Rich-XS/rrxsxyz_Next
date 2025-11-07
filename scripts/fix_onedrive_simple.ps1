# OneDrive NUL文件修复脚本 - 简化版
# 创建时间: 2025-10-30
# 决策依据: D-106 Phantom NUL Files根因分析

Write-Host "OneDrive NUL文件修复脚本 - 简化版" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1: 停止OneDrive
Write-Host "[1/4] 停止OneDrive..." -ForegroundColor Yellow
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# 步骤2: 查找并删除nul文件
Write-Host "[2/4] 查找并删除nul文件..." -ForegroundColor Yellow
$totalDeleted = 0

# 搜索C:\Users\rrxs
$path1 = "C:\Users\rrxs"
if (Test-Path $path1) {
    Write-Host "扫描: $path1"
    $files1 = Get-ChildItem -Path $path1 -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'nul' }
    foreach ($file in $files1) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "删除: $($file.FullName)" -ForegroundColor Gray
        $totalDeleted++
    }
}

# 搜索D:\_100W\rrxsxyz_next
$path2 = "D:\_100W\rrxsxyz_next"
if (Test-Path $path2) {
    Write-Host "扫描: $path2"
    $files2 = Get-ChildItem -Path $path2 -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'nul' }
    foreach ($file in $files2) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "删除: $($file.FullName)" -ForegroundColor Gray
        $totalDeleted++
    }
}

Write-Host "总共删除: $totalDeleted 个nul文件" -ForegroundColor Green
Write-Host ""

# 步骤3: 重置OneDrive
Write-Host "[3/4] 重置OneDrive..." -ForegroundColor Yellow
$oneDrivePath = "$env:LOCALAPPDATA\Microsoft\OneDrive\onedrive.exe"
if (Test-Path $oneDrivePath) {
    Start-Process -FilePath $oneDrivePath -ArgumentList "/reset" -NoNewWindow -ErrorAction SilentlyContinue
    Write-Host "OneDrive重置命令已执行" -ForegroundColor Green
    Write-Host "等待30秒..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
} else {
    Write-Host "未找到OneDrive" -ForegroundColor Red
}
Write-Host ""

# 步骤4: 重新启动OneDrive
Write-Host "[4/4] 重新启动OneDrive..." -ForegroundColor Yellow
if (Test-Path $oneDrivePath) {
    Start-Process -FilePath $oneDrivePath -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
    Write-Host "OneDrive已启动" -ForegroundColor Green
} else {
    Write-Host "无法启动OneDrive" -ForegroundColor Red
}
Write-Host ""

# 验证
$running = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "✅ OneDrive正在运行 (PID: $($running.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ OneDrive未运行" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复完成！请检查OneDrive是否还提示重命名" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 记录日志
$logPath = "D:\_100W\rrxsxyz_next\INCIDENT\onedrive_fix_log.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] 修复完成 - 删除了 $totalDeleted 个nul文件" -ErrorAction SilentlyContinue
