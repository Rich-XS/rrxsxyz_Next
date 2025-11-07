@echo off
REM Final Verification Script
REM Created: 2025-10-30

echo ========================================
echo Final Verification
echo ========================================
echo.

echo [1/2] OneDrive Process Status:
tasklist | findstr "OneDrive"
if %ERRORLEVEL% EQU 0 (
    echo   Status: Running
) else (
    echo   Status: NOT Running
)
echo.

echo [2/2] Checking for nul files:
echo   OneDrive directory...
dir "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt\nul" 2>CON
if %ERRORLEVEL% EQU 0 (
    echo   ERROR: nul file still exists!
) else (
    echo   OK: No nul file found
)
echo.

echo   Project directory...
dir "D:\_100W\rrxsxyz_next\nul" /s 2>CON
if %ERRORLEVEL% EQU 0 (
    echo   ERROR: nul files found in project!
) else (
    echo   OK: No nul files in project
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Please check OneDrive tray icon status
echo.

pause
