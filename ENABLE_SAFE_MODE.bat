@echo off
REM 进入安全模式脚本 (D-113 最终方案)
REM 在安全模式中重新安装OneDrive

setlocal enabledelayedexpansion
title 安全模式启动 - OneDrive修复 (D-113)

echo ============================================
echo   进入安全模式 (D-113 最终方案)
echo ============================================
echo.
echo 此脚本将：
echo 1. 配置系统启动到安全模式（带网络）
echo 2. 在30秒后重启计算机
echo 3. 重启后手动运行 INSTALL_SAFE_MODE.bat
echo.
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

echo [1] 配置启动选项...
REM 启用启动菜单
bcdedit /set {bootmgr} displaybootmenu yes 2>CON
if %errorlevel% equ 0 (
    echo ✓ 启动菜单已启用
) else (
    echo ❌ 启用启动菜单失败
    pause
    exit /b 1
)

echo.
echo [2] 设置安全模式启动（带网络）...
REM 设置下次启动为安全模式
bcdedit /set {default} safeboot network 2>CON
if %errorlevel% equ 0 (
    echo ✓ 已配置为安全模式启动
) else (
    echo ❌ 配置失败
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ 配置完成！
echo ============================================
echo.
echo 计算机将在30秒后重启
echo 重启后会自动进入 "安全模式（带网络）"
echo.
echo 安全模式中的操作步骤：
echo ────────────────────────────
echo 1. 登录Windows（使用你的账户）
echo 2. 打开文件管理器
echo 3. 导航到: D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\
echo 4. 双击运行: INSTALL_SAFE_MODE.bat
echo 5. 完成安装后重启
echo.
echo 按任意键继续...
echo.
pause

echo [3] 30秒后重启...
timeout /t 30 /nobreak 2>CON

echo [4] 执行重启...
shutdown /r /t 5 /c "OneDrive安全模式修复"

echo.
echo 系统将立即重启...
