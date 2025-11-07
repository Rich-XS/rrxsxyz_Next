@echo off
REM 安全模式OneDrive彻底清理脚本 - Safe Mode Cleanup
REM 此脚本仅在Windows安全模式下运行
REM 作者: Claude Code
REM 日期: 2025-10-30

title OneDrive Safe Mode Cleanup - Administrator

color 0A
cls

echo ================================================
echo   OneDrive 安全模式彻底清理
echo   Safe Mode Complete Cleanup
echo ================================================
echo.
echo 重要说明：
echo 1. 此脚本必须在安全模式下以管理员身份运行
echo 2. OneDrive进程已禁用（安全模式特性）
echo 3. 所有OneDrive目录将被永久删除
echo 4. 清理后需要重新安装OneDrive
echo.
echo Important:
echo 1. Run this script in Safe Mode as Administrator
echo 2. OneDrive disabled (Safe Mode feature)
echo 3. All OneDrive directories will be permanently deleted
echo 4. Reinstall OneDrive after cleanup
echo.
pause

REM 步骤1: 显示当前时间
echo.
echo [步骤1/5] 系统信息
echo ================================================
powershell -Command "Get-Date"
echo.

REM 步骤2: 删除OneDrive目录
echo [步骤2/5] 删除OneDrive应用目录
echo ================================================
echo 删除 C:\Users\rrxs\AppData\Local\Microsoft\OneDrive ...
if exist "C:\Users\rrxs\AppData\Local\Microsoft\OneDrive" (
    rmdir /s /q "C:\Users\rrxs\AppData\Local\Microsoft\OneDrive" 2>CON
    echo 已删除
) else (
    echo 已不存在
)
echo.

echo 删除 C:\Program Files\Microsoft OneDrive ...
if exist "C:\Program Files\Microsoft OneDrive" (
    rmdir /s /q "C:\Program Files\Microsoft OneDrive" 2>CON
    echo 已删除
) else (
    echo 已不存在
)
echo.

echo 删除 C:\Program Files ^(x86^)\Microsoft OneDrive ...
if exist "C:\Program Files (x86)\Microsoft OneDrive" (
    rmdir /s /q "C:\Program Files (x86)\Microsoft OneDrive" 2>CON
    echo 已删除
) else (
    echo 已不存在
)
echo.

REM 步骤3: 清理注册表
echo [步骤3/5] 清理注册表
echo ================================================
powershell -Command @"
Write-Host "清理HKCU:\Software\Microsoft\OneDrive ..."
Remove-Item -Path 'HKCU:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "清理HKLM:\Software\Microsoft\OneDrive ..."
Remove-Item -Path 'HKLM:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "清理HKLM:\Software\Policies\Microsoft\Windows\OneDrive ..."
Remove-Item -Path 'HKLM:\Software\Policies\Microsoft\Windows\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "已完成注册表清理"
"@
echo.

REM 步骤4: 清理nul文件
echo [步骤4/5] 清理项目目录中的nul文件
echo ================================================
echo 清理 D:\_100W\rrxsxyz_next ...
powershell -Command @"
Get-ChildItem -Path 'D:\_100W\rrxsxyz_next' -Recurse -Filter 'nul' -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -LiteralPath "\\?\$($_.FullName)" -Force -ErrorAction SilentlyContinue
}
Write-Host "项目目录清理完成"
"@
echo.

REM 步骤5: 验证
echo [步骤5/5] 验证清理结果
echo ================================================
echo.
echo 检查OneDrive目录...
echo.

powershell -Command @"
Write-Host "LocalAppData OneDrive: " -NoNewline
if (Test-Path 'C:\Users\rrxs\AppData\Local\Microsoft\OneDrive') {
    Write-Host "仍存在（需手动清理）" -ForegroundColor Red
} else {
    Write-Host "已删除 ✓" -ForegroundColor Green
}

Write-Host "ProgramFiles OneDrive: " -NoNewline
if (Test-Path 'C:\Program Files\Microsoft OneDrive') {
    Write-Host "仍存在（需手动清理）" -ForegroundColor Red
} else {
    Write-Host "已删除 ✓" -ForegroundColor Green
}

Write-Host "x86 OneDrive: " -NoNewline
if (Test-Path 'C:\Program Files (x86)\Microsoft OneDrive') {
    Write-Host "仍存在" -ForegroundColor Yellow
} else {
    Write-Host "已删除 ✓" -ForegroundColor Green
}

Write-Host ""
Write-Host "检查nul文件数量..."
`$nulCount = @(Get-ChildItem -Path 'D:\_100W\rrxsxyz_next' -Recurse -Filter 'nul' -Force -ErrorAction SilentlyContinue).Count
Write-Host "nul文件数: $nulCount" -ForegroundColor $(if ($nulCount -eq 0) {'Green'} else {'Yellow'})
"@

echo.
echo ================================================
echo   清理完成！
echo   Cleanup Completed!
echo ================================================
echo.
echo 后续步骤：
echo 1. 关闭此窗口
echo 2. 重启Windows（退出安全模式）
echo 3. OneDrive会自动重新同步或显示不可用
echo 4. 可选：从Microsoft Store重新安装OneDrive
echo.
echo Next Steps:
echo 1. Close this window
echo 2. Restart Windows (exit Safe Mode)
echo 3. OneDrive will auto-resync or show unavailable
echo 4. Optional: Reinstall OneDrive from Microsoft Store
echo.
pause
