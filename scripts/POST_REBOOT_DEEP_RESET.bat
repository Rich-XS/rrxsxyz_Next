@echo off
REM Deep OneDrive Reset Script - Post Reboot Cleanup
REM Purpose: Complete OneDrive reset to clear Phantom NUL files

setlocal enabledelayedexpansion

echo ===============================================
echo  OneDrive Deep Reset - Post Reboot
echo ===============================================
echo.

REM Step 1: Kill OneDrive
echo [1] Stopping OneDrive...
taskkill /F /IM OneDrive.exe 2>CON
timeout /t 3 /nobreak

REM Step 2: Clear cache
echo [2] Clearing OneDrive cache...
if exist "%LOCALAPPDATA%\Microsoft\OneDrive" (
    rmdir /s /q "%LOCALAPPDATA%\Microsoft\OneDrive" 2>CON
)
timeout /t 2 /nobreak

REM Step 3: Clean NUL files from project
echo [3] Cleaning NUL files from project directory...
cd /d "D:\_100W\rrxsxyz_next"
for /r %%i in (nul) do (
    del /f /q "\\?\%%i" 2>CON
)

REM Step 4: Restart OneDrive
echo [4] Restarting OneDrive...
timeout /t 3 /nobreak
start "" "C:\Program Files\Microsoft OneDrive\OneDrive.exe"
timeout /t 3 /nobreak

REM Step 5: Verify
echo [5] Verifying...
echo.
powershell -Command "Get-ChildItem -Path 'D:\_100W\rrxsxyz_next' -Recurse -Filter 'nul' | Measure-Object | Select-Object Count"

echo.
echo ===============================================
echo  OneDrive Reset Complete
echo ===============================================
echo.
pause
