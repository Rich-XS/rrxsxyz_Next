@echo off
REM 在安全模式下安装OneDrive (D-113 最终方案)
REM 这个脚本应该在安全模式中运行

setlocal enabledelayedexpansion
title OneDrive安全模式安装 - D-113

echo ============================================
echo   OneDrive安全模式安装 (D-113)
echo ============================================
echo.

REM 检查是否在安全模式
reg query "HKLM\SYSTEM\CurrentControlSet\Control\SafeBoot\Option" /v OptionValue 2>CON | findstr /i "1" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 已在安全模式中运行
) else (
    echo ⚠ 警告: 可能不在安全模式中
    echo 请确保系统已重启进入安全模式
    echo.
)

echo.
echo [1] 检查OneDriveSetup.exe...
set "SETUP_EXE=E:\Downloads\OneDriveSetup.exe"
if exist "%SETUP_EXE%" (
    echo ✓ 找到: %SETUP_EXE%
) else (
    echo ❌ 找不到安装文件
    pause
    exit /b 1
)

echo.
echo [2] 停止所有OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM OneDriveSetup.exe 2>CON
taskkill /F /IM FileCoAuth.exe 2>CON
timeout /t 2 2>CON
echo ✓ 完成

echo.
echo [3] 删除旧的安装文件和配置...
rd /s /q "C:\Program Files\Microsoft OneDrive" 2>CON
rd /s /q "C:\Program Files (x86)\Microsoft OneDrive" 2>CON
rd /s /q "%USERPROFILE%\AppData\Local\Microsoft\OneDrive" 2>CON
echo ✓ 完成

echo.
echo [4] 清理注册表...
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OneDriveSetup.exe" /f 2>CON
reg delete "HKCU\Software\Microsoft\OneDrive" /f /s 2>CON
echo ✓ 完成

echo.
echo [5] 执行OneDrive安装程序（安全模式）...
echo    文件: %SETUP_EXE%
echo    请等待安装完成...
echo.

REM 运行安装程序（不使用参数，让它自己处理）
"%SETUP_EXE%"

echo.
echo [6] 等待安装完成...
timeout /t 15 2>CON

echo.
echo [7] 验证安装...
if exist "C:\Program Files\Microsoft OneDrive\OneDrive.exe" (
    echo ✓ OneDrive.exe 已成功安装！
    echo.
    echo ✅ 安装成功！
) else (
    echo ❌ OneDrive.exe 未找到（安装可能失败）
)

echo.
echo ============================================
echo 接下来的步骤：
echo ============================================
echo.
echo 1. 关闭此窗口
echo 2. 重启计算机（返回正常模式）
echo 3. 重启后检查OneDrive是否已启动
echo.
pause

REM 提示重启
echo.
echo 现在重启计算机...
timeout /t 5 2>CON
shutdown /r /t 5 /c "OneDrive安装完成，返回正常模式"
