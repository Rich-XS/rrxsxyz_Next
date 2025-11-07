@echo off
REM OneDrive 修复 - 超简化版
REM 这个脚本使用最基础的命令，避免复杂问题

echo 开始OneDrive修复...
echo.

echo 1. 停止OneDrive...
taskkill /F /IM OneDrive.exe 2>CON
echo 完成

echo 2. 清理注册表...
reg delete HKCU\Software\Microsoft\OneDrive /f 2>CON
echo 完成

echo 3. 清理目录...
rmdir /s /q "%USERPROFILE%\AppData\Local\Microsoft\OneDrive" 2>CON
echo 完成

echo 4. 重新安装OneDrive...
winget install --id=Microsoft.OneDrive -e
echo 完成

echo 5. 启动OneDrive...
start "" "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe" /background
echo 完成

echo.
echo 修复完成！请检查系统托盘
pause
