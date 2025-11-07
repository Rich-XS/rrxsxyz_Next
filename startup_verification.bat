@echo off
REM LTP系统启动和验证脚本
REM 目的: 启动OneDrive, WSearch, 验证VSCode/VSCodium
REM 执行时间: 2025-10-31 (用户离开20分钟)

setlocal enabledelayedexpansion

echo.
echo ============================================
echo LTP 系统启动和验证脚本
echo ============================================
echo.

REM 步骤1: 启动WSearch (Windows Search索引)
echo [STEP 1] 启动Windows Search索引服务...
net start WSearch 2>CON
timeout /t 3 >CON

REM 步骤2: 启动OneDrive
echo [STEP 2] 启动OneDrive...
REM 方法1: 尝试从标准位置启动
if exist "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe" (
    echo 找到OneDrive.exe，启动中...
    start "" "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe"
    timeout /t 3 >CON
) else (
    echo OneDrive.exe未找到（需要从Microsoft Store安装）
)

echo.
echo [STEP 3] 验证系统状态...
echo.

REM 验证WSearch
echo ✓ Windows Search索引服务:
sc query WSearch | findstr /i "STATE" || echo (检查中...)

echo.
echo ✓ OneDrive进程:
tasklist | findstr /i "OneDrive" || echo (可能正在启动...)

echo.
echo ✓ VSCode/VSCodium可用性:
where Code >nul 2>&1 && echo VSCode: 已安装 || echo VSCode: 未安装
where VSCodium >nul 2>&1 && echo VSCodium: 已安装 || echo VSCodium: 未安装

echo.
echo ============================================
echo 等待系统初始化...
echo ============================================
echo.
timeout /t 5 >CON

REM 最终验证
echo [最终状态检查]
echo.
tasklist | findstr /i "OneDrive" >nul && (
    echo ✅ OneDrive: 已启动
) || (
    echo ⚠️  OneDrive: 仍未启动（请手动启动或检查安装）
)

sc query WSearch 2>CON | findstr /i "RUNNING" >nul && (
    echo ✅ WSearch: 运行中
) || (
    echo ⚠️  WSearch: 未运行
)

echo.
echo ============================================
echo 脚本执行完成!
echo ============================================
echo.
pause
