@echo off
REM OneDrive 安装脚本 (D-113 修正版)
REM 使用现有的OneDriveSetup.exe文件

setlocal enabledelayedexpansion
title OneDrive Installation - D-113

REM 优先级：E:\Downloads > C:\Users\rrxs\Downloads
set SETUP_EXE1=E:\Downloads\OneDriveSetup.exe
set SETUP_EXE2=C:\Users\rrxs\Downloads\OneDriveSetup.exe
set SETUP_EXE=

echo ============================================
echo   OneDrive Installation (D-113 修正版)
echo ============================================
echo.

REM 查找OneDriveSetup.exe
echo [1] Locating OneDriveSetup.exe...
if exist "%SETUP_EXE1%" (
    set "SETUP_EXE=%SETUP_EXE1%"
    echo ✓ Found: %SETUP_EXE1%
) else if exist "%SETUP_EXE2%" (
    set "SETUP_EXE=%SETUP_EXE2%"
    echo ✓ Found: %SETUP_EXE2%
) else (
    echo ❌ OneDriveSetup.exe not found in:
    echo    - %SETUP_EXE1%
    echo    - %SETUP_EXE2%
    echo.
    echo Please download from:
    echo https://www.microsoft.com/en-us/microsoft-365/onedrive/download
    echo.
    pause
    exit /b 1
)

echo.
echo [2] Checking for running OneDrive processes...
tasklist | findstr /i "onedrive" 2>CON
if errorlevel 1 (
    echo ✓ No OneDrive processes found
) else (
    echo ⚠ Stopping OneDrive processes...
    taskkill /F /IM OneDrive.exe 2>CON
    taskkill /F /IM OneDriveSetup.exe 2>CON
    timeout /t 2 2>CON
)

echo.
echo [3] Running OneDrive installer...
echo    File: %SETUP_EXE%
echo    Mode: /allusers /defaultalluser
echo.
echo (Installation window will appear - please wait for it to complete)
echo.

REM 运行安装程序
"%SETUP_EXE%" /allusers /defaultalluser 2>CON

REM 等待安装完成（给足时间）
timeout /t 5 2>CON

echo [4] Verifying installation...
echo.

REM 检查OneDrive.exe是否存在
if exist "C:\Program Files\Microsoft OneDrive\OneDrive.exe" (
    echo ✓ OneDrive.exe file found
    echo ✓ Installation appears successful!
) else if exist "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe" (
    echo ✓ OneDrive.exe file found (x86 version)
    echo ✓ Installation appears successful!
) else (
    echo ⚠ OneDrive.exe not found yet
    echo   It may take a moment to start...
)

echo.
REM 检查OneDrive进程
tasklist | findstr /i "onedrive.exe" 2>CON
if %errorlevel% equ 0 (
    echo ✓ OneDrive process is RUNNING
    echo.
    echo ✅ SUCCESS! OneDrive has been installed.
    echo.
    echo Next steps:
    echo 1. Look for OneDrive icon in taskbar (bottom-right corner)
    echo 2. Click to open and sign in with Microsoft account
    echo 3. Wait for initial sync to complete
) else (
    echo ⚠ OneDrive process not started yet
    echo.
    echo Possible next steps:
    echo 1. Check taskbar for OneDrive icon
    echo 2. If no icon, restart your computer
    echo 3. Run "OneDrive.exe" manually if needed
)

echo.
echo ============================================
pause
