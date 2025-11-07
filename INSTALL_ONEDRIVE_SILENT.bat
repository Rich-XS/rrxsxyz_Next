@echo off
REM OneDrive 强制安装脚本 (D-113 v3 - 后台模式)
REM 使用无声安装参数确保安装执行

setlocal enabledelayedexpansion
title OneDrive 强制安装 - D-113 v3

echo ============================================
echo  OneDrive 强制安装 (D-113 v3 - 后台模式)
echo ============================================
echo.

set "SETUP_EXE=D:\Downloads\OneDriveSetup.exe"

REM 验证文件存在
if not exist "%SETUP_EXE%" (
    echo ❌ 找不到: %SETUP_EXE%
    echo.
    pause
    exit /b 1
)

echo [1] 验证文件...
for /f "tokens=5" %%A in ('dir "%SETUP_EXE%" ^| findstr "OneDrive"') do set SIZE=%%A
echo ✓ 文件大小: !SIZE! 字节

echo.
echo [2] 停止所有OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM OneDriveSetup.exe 2>CON
taskkill /F /IM FileCoAuth.exe 2>CON
timeout /t 2 2>CON
echo ✓ 完成

echo.
echo [3] 删除旧的setup文件夹...
rd /s /q "C:\Program Files\Microsoft OneDrive\setup" 2>CON
echo ✓ 完成

echo.
echo [4] 执行安装程序（无声模式）...
echo    命令: "%SETUP_EXE%" /allusers /defaultalluser /silent /skipBootstrap
echo.

REM 使用无声模式执行
"%SETUP_EXE%" /allusers /defaultalluser /silent /skipBootstrap 2>CON

REM 等待安装完成
echo    等待安装完成... (30秒)
timeout /t 30 /nobreak 2>CON

echo.
echo [5] 验证安装结果...

REM 检查OneDrive.exe
if exist "C:\Program Files\Microsoft OneDrive\OneDrive.exe" (
    echo ✓ OneDrive.exe 已安装
) else (
    echo ⚠ OneDrive.exe 未找到（可能仍在复制中）
)

REM 检查进程
tasklist | findstr /i "onedrive.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ OneDrive 进程正在运行
) else (
    echo ⚠ OneDrive 进程未启动（需要重启）
)

echo.
echo [6] 启动OneDrive...
REM 尝试手动启动
if exist "C:\Program Files\Microsoft OneDrive\OneDrive.exe" (
    start "" "C:\Program Files\Microsoft OneDrive\OneDrive.exe" 2>CON
    timeout /t 3 2>CON
    echo ✓ OneDrive 已启动
)

echo.
echo ============================================
echo ✅ 安装流程完成！
echo ============================================
echo.
echo 检查清单:
echo □ 任务栏右下角是否有OneDrive图标？
echo □ 如果没有，请重启计算机
echo □ 重启后OneDrive应该会自动启动
echo.
pause
