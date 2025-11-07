@echo off
REM OneDrive修复启动器
setlocal enabledelayedexpansion

echo 正在启动OneDrive修复脚本...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\fix_onedrive_ultimate.ps1"

echo.
echo 修复脚本执行完成
pause
