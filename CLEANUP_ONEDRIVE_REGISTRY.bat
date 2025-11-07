@echo off
REM 深度注册表清理脚本 (D-113 强化版)
REM 使用reg delete删除所有OneDrive注册表项

echo ============================================
echo  深度注册表清理 (D-113 强化版)
echo ============================================
echo.

echo [1] 删除注册表项（需要管理员权限）...
echo.

REM 检查是否为管理员
net session 2>CON 1>CON
if errorlevel 1 (
    echo ❌ 需要管理员权限！
    echo.
    echo 请按以下步骤操作：
    echo 1. 右键点击此脚本
    echo 2. 选择"以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo ✓ 以管理员身份运行

REM 删除HKLM注册表项
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\OneDriveSetup.exe" /f 2>CON
if %errorlevel% equ 0 (
    echo ✓ Deleted: HKLM\...\OneDriveSetup.exe
) else (
    echo ⊘ HKLM entry not found (already deleted)
)

REM 删除HKCU注册表项
reg delete "HKCU\Software\Microsoft\OneDrive" /f /s 2>CON
if %errorlevel% equ 0 (
    echo ✓ Deleted: HKCU\Software\Microsoft\OneDrive
) else (
    echo ⊘ HKCU entry not found (already deleted)
)

REM 删除策略注册表项
reg delete "HKLM\SOFTWARE\Policies\Microsoft\OneDrive" /f /s 2>CON
if %errorlevel% equ 0 (
    echo ✓ Deleted: HKLM\SOFTWARE\Policies\Microsoft\OneDrive
) else (
    echo ⊘ Policy entry not found (already deleted)
)

echo.
echo [2] 清理完成！
echo.
echo 现在您可以运行: INSTALL_ONEDRIVE.bat
echo.
pause
