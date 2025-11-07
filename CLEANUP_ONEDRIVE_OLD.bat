@echo off
REM OneDrive 旧版本彻底清理脚本 (D-112)
REM 清除注册表和残留文件，为新版本安装铺路

setlocal enabledelayedexpansion
cls

color 0A
title OneDrive 旧版本清理工具

echo.
echo ================================================
echo OneDrive 旧版本彻底清理脚本
echo ================================================
echo.
echo 此脚本将：
echo 1. 停止OneDrive进程
echo 2. 删除注册表项
echo 3. 清理AppData残留文件
echo 4. 为新版本安装做准备
echo.
echo ================================================
pause

REM ============ 步骤1: 停止OneDrive进程 ============
echo [步骤 1/4] 停止OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM "OneDriveSetup.exe" 2>CON
taskkill /F /IM "OneDriveSetup (1).exe" 2>CON
timeout /t 1 /nobreak

REM ============ 步骤2: 删除注册表 ============
echo [步骤 2/4] 删除OneDrive注册表项...
reg delete "HKCU\Software\Microsoft\OneDrive" /f 2>CON
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2\##OneDrive" /f 2>CON
reg delete "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /f 2>CON
echo 完成

timeout /t 1 /nobreak

REM ============ 步骤3: 清理AppData文件 ============
echo [步骤 3/4] 清理AppData中的OneDrive残留...

set ONEDRIVE_LOCAL=%USERPROFILE%\AppData\Local\Microsoft\OneDrive
set ONEDRIVE_ROAMING=%USERPROFILE%\AppData\Roaming\Microsoft\OneDrive

if exist "!ONEDRIVE_LOCAL!" (
    echo 删除: !ONEDRIVE_LOCAL!
    rmdir /s /q "!ONEDRIVE_LOCAL!" 2>CON
)

if exist "!ONEDRIVE_ROAMING!" (
    echo 删除: !ONEDRIVE_ROAMING!
    rmdir /s /q "!ONEDRIVE_ROAMING!" 2>CON
)

echo 完成

timeout /t 1 /nobreak

REM ============ 步骤4: 清理Program Files ============
echo [步骤 4/4] 清理Program Files中的旧版本...

if exist "%ProgramFiles%\Microsoft OneDrive" (
    echo 删除: %ProgramFiles%\Microsoft OneDrive
    rmdir /s /q "%ProgramFiles%\Microsoft OneDrive" 2>CON
)

echo 完成

echo.
echo ================================================
echo 清理完成！
echo ================================================
echo.
echo 现在可以重新安装OneDrive了
echo.
echo 方式A: 直接运行安装程序
echo   按 Win + R，输入: OneDriveSetup.exe
echo.
echo 方式B: 从Microsoft Store安装
echo   按 Win + S，搜索: OneDrive
echo   点击"获取"或"安装"
echo.
echo ================================================
pause
