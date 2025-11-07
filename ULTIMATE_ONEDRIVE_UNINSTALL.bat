@echo off
REM 核武级OneDrive完全卸载脚本 (D-113 终极版)
REM 使用多种方法彻底删除OneDrive残留

setlocal enabledelayedexpansion
title OneDrive 终极卸载 - D-113

echo ============================================
echo  OneDrive 核武级卸载 (D-113 终极版)
echo ============================================
echo.

REM 检查管理员权限
net session 2>CON 1>CON
if errorlevel 1 (
    echo ❌ 需要管理员权限！
    echo.
    echo 请右键 → 以管理员身份运行此脚本
    echo.
    pause
    exit /b 1
)

echo [1] 停止所有OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM OneDriveSetup.exe 2>CON
taskkill /F /IM FileCoAuth.exe 2>CON
timeout /t 2 2>CON
echo ✓ Done

echo.
echo [2] 删除OneDrive安装目录...
REM 多种可能的安装位置
for %%D in (
    "C:\Program Files\Microsoft OneDrive"
    "C:\Program Files (x86)\Microsoft OneDrive"
    "%USERPROFILE%\AppData\Local\Microsoft\OneDrive"
    "%USERPROFILE%\AppData\Roaming\Microsoft\OneDrive"
) do (
    if exist "%%D" (
        echo  Removing: %%D
        rd /s /q "%%D" 2>CON
    )
)
echo ✓ Done

echo.
echo [3] 删除注册表项（方法1：REG DELETE）...
REM 使用reg delete删除
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OneDriveSetup.exe" /f 2>CON
reg delete "HKCU\Software\Microsoft\OneDrive" /f /s 2>CON
reg delete "HKLM\SOFTWARE\Policies\Microsoft\OneDrive" /f /s 2>CON
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2" /f /s 2>CON
echo ✓ Done

echo.
echo [4] 删除注册表项（方法2：PowerShell深层清理）...
powershell -NoProfile -Command "
Remove-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{0C2D3CA7-D5A3-4A80-8E4C-DB0A0C04A9E0}' -Force -ErrorAction SilentlyContinue 2>$null
Remove-Item -Path 'HKCU:\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}' -Force -ErrorAction SilentlyContinue 2>$null
Get-ChildItem -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall' -ErrorAction SilentlyContinue | Where-Object { \$_.GetValue('DisplayName') -match 'OneDrive' } | ForEach-Object { Remove-Item -Path \$_.PSPath -Force -ErrorAction SilentlyContinue }
" 2>CON
echo ✓ Done

echo.
echo [5] 清理临时文件...
del /f /q "%TEMP%\OneDrive*" 2>CON
del /f /q "%TEMP%\Microsoft.OneDrive*" 2>CON
echo ✓ Done

echo.
echo [6] 清空缓存...
net stop "OneDrive Sync Engine" 2>CON
REM 注意：此服务可能不存在，继续下一步
echo ✓ Done

echo.
echo ============================================
echo ✅ 核武级卸载完成！
echo ============================================
echo.
echo 现在可以运行安装脚本了：
echo   INSTALL_ONEDRIVE.bat
echo.
echo 如果仍然出现"A newer version"错误，
echo 请执行以下步骤（终极方案）：
echo.
echo   1. 重启计算机
echo   2. 登录后再运行 INSTALL_ONEDRIVE.bat
echo.
pause
