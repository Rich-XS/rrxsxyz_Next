@echo off
REM OneDrive 完全批处理修复版本 (D-112)
REM 不依赖PowerShell，避免编码问题

setlocal enabledelayedexpansion
cd /d "%~dp0"

color 0A
title OneDrive 修复工具 - D-112

echo.
echo ================================================
echo OneDrive 自动修复脚本（批处理版）
echo ================================================
echo.

REM ============ 步骤1: 停止OneDrive进程 ============
echo [步骤 1/6] 停止OneDrive进程...
taskkill /F /IM OneDrive.exe 2>CON
timeout /t 1 /nobreak

REM ============ 步骤2: 清理OneDrive目录 ============
echo [步骤 2/6] 清理OneDrive配置文件...
set ONEDRIVE_PATH=%USERPROFILE%\AppData\Local\Microsoft\OneDrive

if exist "!ONEDRIVE_PATH!" (
    echo 发现OneDrive目录，正在删除...
    rmdir /s /q "!ONEDRIVE_PATH!" 2>CON
    echo ✓ 目录已删除
) else (
    echo ✓ 目录不存在（正常）
)

timeout /t 1 /nobreak

REM ============ 步骤3: 清理注册表 ============
echo [步骤 3/6] 清理注册表项...
reg delete "HKCU\Software\Microsoft\OneDrive" /f 2>CON
reg delete "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /f 2>CON
echo ✓ 注册表已清理

timeout /t 1 /nobreak

REM ============ 步骤4: 使用winget重新安装 ============
echo [步骤 4/6] 重新安装OneDrive...
echo 执行: winget install --id=Microsoft.OneDrive -e --force
winget install --id=Microsoft.OneDrive -e --force 2>CON
echo ✓ 安装命令已执行

timeout /t 3 /nobreak

REM ============ 步骤5: 启动OneDrive ============
echo [步骤 5/6] 启动OneDrive...

REM 方式A: 从AppData启动
set ONEDRIVE_EXE=%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe
if exist "!ONEDRIVE_EXE!" (
    echo ✓ 发现OneDrive.exe: !ONEDRIVE_EXE!
    start "" "!ONEDRIVE_EXE!" /background
    echo ✓ OneDrive已启动（后台模式）
) else (
    echo 未找到OneDrive.exe，尝试系统命令启动...
    start "" OneDrive.exe /background 2>CON
)

timeout /t 2 /nobreak

REM ============ 步骤6: 验证 ============
echo [步骤 6/6] 验证OneDrive状态...
tasklist | findstr /i "OneDrive" >nul
if errorlevel 1 (
    echo ⚠ OneDrive进程未检测到（可能需要等待或手动启动）
) else (
    echo ✓ OneDrive进程正在运行
)

echo.
echo ================================================
echo 修复流程完成！
echo ================================================
echo.
echo 请检查以下项目：
echo 1. 系统托盘（右下角）是否有OneDrive云图标 ☁
echo 2. 如果没有，请等待1-2分钟后重新检查
echo 3. 或手动启动: OneDrive.exe /background
echo.
echo 按任意键关闭窗口...
pause >nul
