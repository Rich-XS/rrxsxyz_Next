@echo off
REM OneDrive NUL File Fix Script
REM Created: 2025-10-30
REM Decision: D-106 Phantom NUL Files Root Cause Analysis

echo ========================================
echo OneDrive NUL File Fix Script
echo ========================================
echo.

echo [1/4] Stopping OneDrive...
taskkill /F /IM OneDrive.exe 2>CON
timeout /t 3 >CON
echo Done
echo.

echo [2/4] Deleting NUL files...
echo Scanning C:\Users\rrxs...
del /F /S "C:\Users\rrxs\nul" 2>CON
echo Scanning D:\_100W\rrxsxyz_next...
del /F /S "D:\_100W\rrxsxyz_next\nul" 2>CON
echo Done
echo.

echo [3/4] Resetting OneDrive...
"%localappdata%\Microsoft\OneDrive\onedrive.exe" /reset
echo Waiting 30 seconds...
timeout /t 30 >CON
echo Done
echo.

echo [4/4] Restarting OneDrive...
start "" "%localappdata%\Microsoft\OneDrive\onedrive.exe"
timeout /t 5 >CON
echo Done
echo.

echo ========================================
echo Fix Complete!
echo Please check OneDrive tray icon
echo ========================================
echo.

REM Log the action
echo [%date% %time%] OneDrive NUL fix completed >> "D:\_100W\rrxsxyz_next\INCIDENT\onedrive_fix_log.txt"

pause
