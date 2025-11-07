# OneDrive NUL文件问题终极修复脚本
# 创建时间: 2025-10-30
# 决策依据: D-106 (Phantom NUL Files根因分析)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "OneDrive NUL文件问题终极修复脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1: 停止OneDrive进程
Write-Host "[步骤1/5] 停止OneDrive进程..." -ForegroundColor Yellow
$oneDriveProcess = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($oneDriveProcess) {
    Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "✅ OneDrive进程已停止" -ForegroundColor Green
} else {
    Write-Host "⚠️ OneDrive进程未运行" -ForegroundColor Yellow
}

# 步骤2: 查找并删除所有nul文件
Write-Host ""
Write-Host "[步骤2/5] 查找并删除所有nul文件..." -ForegroundColor Yellow

$searchPaths = @(
    "C:\Users\rrxs",
    "D:\_100W\rrxsxyz_next"
)

$totalDeleted = 0
foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "扫描: $path" -ForegroundColor Gray
        $nulFiles = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'nul' }

        foreach ($file in $nulFiles) {
            try {
                Remove-Item -Path $file.FullName -Force -ErrorAction Stop
                Write-Host "✅ 已删除: $($file.FullName)" -ForegroundColor Green
                $totalDeleted++
            } catch {
                Write-Host "❌ 无法删除: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

if ($totalDeleted -eq 0) {
    Write-Host "✅ 未找到真实的nul文件（可能都是phantom文件）" -ForegroundColor Green
} else {
    Write-Host "✅ 已删除 $totalDeleted 个nul文件" -ForegroundColor Green
}

# 步骤3: 重置OneDrive同步数据库
Write-Host ""
Write-Host "[步骤3/5] 重置OneDrive同步数据库..." -ForegroundColor Yellow

$oneDrivePath = "$env:LOCALAPPDATA\Microsoft\OneDrive\onedrive.exe"
if (Test-Path $oneDrivePath) {
    try {
        Start-Process -FilePath $oneDrivePath -ArgumentList "/reset" -NoNewWindow
        Write-Host "✅ OneDrive重置命令已执行" -ForegroundColor Green
        Write-Host "⏳ 等待30秒让OneDrive完成重置..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
    } catch {
        Write-Host "❌ OneDrive重置失败: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 未找到OneDrive可执行文件: $oneDrivePath" -ForegroundColor Red
}

# 步骤4: 重新启动OneDrive
Write-Host ""
Write-Host "[步骤4/5] 重新启动OneDrive..." -ForegroundColor Yellow

if (Test-Path $oneDrivePath) {
    try {
        Start-Process -FilePath $oneDrivePath
        Write-Host "✅ OneDrive已重新启动" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } catch {
        Write-Host "❌ OneDrive启动失败: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 无法启动OneDrive" -ForegroundColor Red
}

# 步骤5: 验证OneDrive状态
Write-Host ""
Write-Host "[步骤5/5] 验证OneDrive状态..." -ForegroundColor Yellow

$oneDriveRunning = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue
if ($oneDriveRunning) {
    Write-Host "✅ OneDrive正在运行 (PID: $($oneDriveRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ OneDrive未运行，请手动启动" -ForegroundColor Red
}

# 最终报告
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "修复完成！" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 检查OneDrive任务栏图标，确认是否还提示'重命名 1 个项目'"
Write-Host "2. 如果还提示，点击'了解详细信息'查看具体文件位置"
Write-Host "3. 如果问题解决，OneDrive应该正常同步"
Write-Host ""
Write-Host "如果问题仍然存在，请运行: C:\Users\rrxs\night_auto_fix.ps1" -ForegroundColor Gray
Write-Host ""

# 记录到日志
$logPath = "D:\_100W\rrxsxyz_next\INCIDENT\onedrive_fix_log.txt"
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] OneDrive NUL文件修复脚本执行完成 - 删除了 $totalDeleted 个nul文件"
Add-Content -Path $logPath -Value $logEntry -ErrorAction SilentlyContinue

Write-Host "✅ 日志已保存到: $logPath" -ForegroundColor Gray
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
