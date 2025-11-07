@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ============================================
echo OneDrive Go-Gemba 现地诊断和修复
echo ============================================
echo.

REM GEMBA STEP 1: 检查OneDrive进程
echo [GEMBA STEP 1] 检查OneDrive进程...
tasklist | findstr /i "OneDrive" >nul 2>&1
if %ERRORLEVEL%==0 (
    echo ✅ OneDrive 进程: 运行中
) else (
    echo ❌ OneDrive 进程: 未运行
)

REM GEMBA STEP 2: 检查OneDrive.exe文件
echo.
echo [GEMBA STEP 2] 检查OneDrive.exe位置...
if exist "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe" (
    echo ✅ 找到: %USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe
    set "ONEDRIVE_PATH=%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe"
) else if exist "C:\Program Files\Microsoft OneDrive\OneDrive.exe" (
    echo ✅ 找到: C:\Program Files\Microsoft OneDrive\OneDrive.exe
    set "ONEDRIVE_PATH=C:\Program Files\Microsoft OneDrive\OneDrive.exe"
) else (
    echo ❌ OneDrive.exe 未找到 - 需要重新安装
    set "ONEDRIVE_PATH="
)

REM GEMBA STEP 3: 诊断结果
echo.
echo [GEMBA STEP 3] 诊断结果
if defined ONEDRIVE_PATH (
    echo ✅ OneDrive 已安装，路径: !ONEDRIVE_PATH!
    echo.
    echo 尝试启动OneDrive...
    start "" "!ONEDRIVE_PATH!"
    timeout /t 2 >CON
    echo ✅ OneDrive 启动命令已发送
) else (
    echo ❌ OneDrive 未安装
    echo.
    echo 需要重新安装! 尝试以下方案:
    echo.
    echo [方案1] 使用 winget 安装
    echo   winget install --id=Microsoft.OneDrive -e
    echo.
    echo [方案2] 从Microsoft Store安装 (推荐)
    echo   1. Win+I 打开设置
    echo   2. 搜索 "Microsoft Store"
    echo   3. 在 Store 搜索 "OneDrive"
    echo   4. 点击安装
    echo.
    echo 尝试 winget 自动安装...
    winget install --id=Microsoft.OneDrive -e --accept-source-agreements
    if %ERRORLEVEL%==0 (
        echo ✅ winget 安装完成
    ) else (
        echo ⚠️ winget 安装失败，请使用Microsoft Store手动安装
    )
)

echo.
echo ============================================
echo Go-Gemba 诊断完成！
echo ============================================
echo.
pause
