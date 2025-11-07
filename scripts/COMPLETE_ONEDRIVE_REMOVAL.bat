@echo off
REM Complete OneDrive Uninstall & Clean
REM Purpose: Completely remove OneDrive and all traces

setlocal enabledelayedexpansion

echo ===============================================
echo  COMPLETE ONEDRIVE REMOVAL
echo ===============================================
echo.
echo This will completely uninstall OneDrive
echo and clean all associated files.
echo.
echo DO NOT INTERRUPT THIS PROCESS!
echo.
pause

REM Step 1: Kill all OneDrive processes
echo [Step 1/5] Killing OneDrive processes...
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM explorer.exe 2>CON
timeout /t 3 /nobreak

REM Step 2: Uninstall OneDrive
echo [Step 2/5] Uninstalling OneDrive...
REM Try Windows Store version first
powershell -Command "Get-AppxPackage *OneDrive* | Remove-AppxPackage -ErrorAction SilentlyContinue" 2>CON
timeout /t 3 /nobreak

REM Step 3: Delete all OneDrive folders
echo [Step 3/5] Removing OneDrive directories...
if exist "%LOCALAPPDATA%\Microsoft\OneDrive" (
    echo Removing: %LOCALAPPDATA%\Microsoft\OneDrive
    rmdir /s /q "%LOCALAPPDATA%\Microsoft\OneDrive" 2>CON
)

if exist "%ProgramFiles%\Microsoft OneDrive" (
    echo Removing: %ProgramFiles%\Microsoft OneDrive
    rmdir /s /q "%ProgramFiles%\Microsoft OneDrive" 2>CON
)

if exist "%ProgramFiles(x86)%\Microsoft OneDrive" (
    echo Removing: %ProgramFiles(x86)%\Microsoft OneDrive
    rmdir /s /q "%ProgramFiles(x86)%\Microsoft OneDrive" 2>CON
)

REM Step 4: Clean registry
echo [Step 4/5] Cleaning registry entries...
powershell -Command @"
Remove-Item -Path 'HKCU:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'HKLM:\Software\Microsoft\OneDrive' -Recurse -Force -ErrorAction SilentlyContinue
"@ 2>CON

timeout /t 2 /nobreak

REM Step 5: Restart Explorer
echo [Step 5/5] Restarting Windows Explorer...
start "" explorer.exe
timeout /t 3 /nobreak

echo.
echo ===============================================
echo  OneDrive Removal Complete
echo ===============================================
echo.
echo Next steps:
echo 1. Download OneDrive from Microsoft Store
echo 2. Or run: winget install Microsoft.OneDrive
echo 3. Sign in with your Microsoft account
echo.
pause
