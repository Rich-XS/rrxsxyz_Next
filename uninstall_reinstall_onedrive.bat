@echo off
echo ========================================
echo OneDrive完全卸载和重装脚本
echo ========================================
echo.
echo 步骤1: 停止OneDrive进程...
taskkill /f /im OneDrive.exe 2>CON

echo.
echo 步骤2: 卸载当前OneDrive...
echo 请在弹出的窗口中确认卸载
%SystemRoot%\System32\OneDriveSetup.exe /uninstall
if not exist %SystemRoot%\System32\OneDriveSetup.exe (
    %SystemRoot%\SysWOW64\OneDriveSetup.exe /uninstall
)

echo.
echo 步骤3: 清理残留文件...
rd "%USERPROFILE%\OneDrive" /s /q 2>CON
rd "%LOCALAPPDATA%\Microsoft\OneDrive" /s /q 2>CON
rd "%PROGRAMDATA%\Microsoft OneDrive" /s /q 2>CON

echo.
echo 步骤4: 清理注册表（可选）...
echo 正在清理注册表项...
reg delete "HKEY_CURRENT_USER\Software\Microsoft\OneDrive" /f 2>CON

echo.
echo ========================================
echo 卸载完成！
echo.
echo 请手动下载并安装最新版OneDrive:
echo https://www.microsoft.com/zh-cn/microsoft-365/onedrive/download
echo.
echo 或使用Windows Store安装:
echo 打开Microsoft Store搜索"OneDrive"
echo ========================================
pause