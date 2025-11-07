@echo off
REM OneDrive修复启动器（改进版 - 带错误显示）
REM D-112 修复脚本

cd /d "%~dp0"
echo 当前目录: %cd%
echo.

REM 检查PowerShell是否存在
where powershell >nul 2>&1
if errorlevel 1 (
    echo 错误: 找不到PowerShell！
    pause
    exit /b 1
)

echo ================================================
echo OneDrive 修复脚本启动器
echo ================================================
echo.
echo 正在启动修复脚本...
echo 脚本路径: %cd%\fix_onedrive_ultimate.ps1
echo.

REM 检查PS脚本是否存在
if not exist "%cd%\fix_onedrive_ultimate.ps1" (
    echo 错误: 找不到修复脚本!
    echo 期望位置: %cd%\fix_onedrive_ultimate.ps1
    pause
    exit /b 1
)

REM 执行PowerShell脚本
powershell -NoProfile -ExecutionPolicy Bypass -File "%cd%\fix_onedrive_ultimate.ps1"

REM 如果脚本执行失败，显示错误
if errorlevel 1 (
    echo.
    echo ================================================
    echo 警告: PowerShell脚本执行返回错误代码
    echo ================================================
    echo 请检查上面的错误信息
    echo.
)

echo.
echo 脚本执行完成（或出错）
echo 按任意键关闭...
pause >nul
