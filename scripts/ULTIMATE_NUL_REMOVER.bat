@echo off
title ULTIMATE NUL FILE REMOVER
color 0C
cls

echo ===============================================
echo    ULTIMATE NUL FILE REMOVER - ADMIN MODE
echo ===============================================
echo.
echo This script will forcefully remove ALL nul files
echo from D:\_100W\rrxsxyz_next directory
echo.
echo IMPORTANT: Run this as Administrator!
echo.
pause

echo.
echo [1] Changing to project directory...
cd /d "D:\_100W\rrxsxyz_next"

echo.
echo [2] Taking ownership of nul files...
for /r %%i in (nul) do (
    echo Taking ownership: %%~nxi
    takeown /f "\\?\%%i" /a 2>CON
    icacls "\\?\%%i" /grant administrators:F 2>CON
)

echo.
echo [3] Forcefully deleting nul files...
for /r %%i in (nul) do (
    echo Deleting: %%~fi
    del /f /q "\\?\%%i" 2>CON
    if exist "\\?\%%i" (
        rd /s /q "\\?\%%i" 2>CON
    )
)

echo.
echo [4] Second pass with PowerShell...
powershell -Command "Get-ChildItem -Path '.' -Recurse -Filter 'nul' -Force -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item -LiteralPath \"\\?\$($_.FullName)\" -Force -ErrorAction SilentlyContinue }"

echo.
echo [5] Verifying cleanup...
set count=0
for /r %%i in (nul) do set /a count+=1

echo.
echo ===============================================
if %count%==0 (
    color 0A
    echo SUCCESS! All NUL files have been removed!
) else (
    color 0E
    echo WARNING: %count% NUL files still remain.
    echo.
    echo Try Method 2: Boot to Safe Mode and run this again.
)
echo ===============================================
echo.
pause