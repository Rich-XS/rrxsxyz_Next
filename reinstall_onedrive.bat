@echo off
REM OneDrive 重新安装脚本
REM 执行时间: 2025-10-31
REM 目的: 重新安装OneDrive并验证

setlocal enabledelayedexpansion

echo.
echo ============================================
echo OneDrive 重新安装脚本
echo ============================================
echo.

REM 方法1: 使用 winget 安装（需要Windows 10/11）
echo [方法1] 尝试使用 winget 安装OneDrive...
winget install --id=Microsoft.OneDrive -e --accept-source-agreements 2>CON
timeout /t 3 >CON

if %ERRORLEVEL% EQU 0 (
    echo ✅ winget 安装成功
) else (
    echo ⚠️  winget 安装失败，尝试方法2...
)

echo.
echo [方法2] 从Microsoft Store安装（推荐）...
echo.
echo 请手动操作:
echo 1. 打开 Microsoft Store (Win+R, 输入 ms-windows-store:)
echo 2. 搜索 "OneDrive"
echo 3. 点击"安装"或"获取"
echo 4. 等待安装完成（约1-2分钟）
echo.
pause

REM 验证安装
echo [验证安装]
echo.
echo 1. 检查OneDrive进程...
tasklist | findstr /i "OneDrive" >nul && (
    echo ✅ OneDrive 已运行
) || (
    echo ⚠️  OneDrive 未运行，需要手动启动
)

echo.
echo 2. 寻找OneDrive.exe...
if exist "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe" (
    echo ✅ 找到 OneDrive.exe
    echo 位置: %USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe
) else (
    echo ❌ 未找到 OneDrive.exe
    echo 请检查Microsoft Store安装是否成功
)

echo.
echo ============================================
echo 脚本执行完成
echo ============================================
echo.
pause
