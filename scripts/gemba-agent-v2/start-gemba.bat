@echo off
echo ============================================
echo     Gemba Agent 2.0 - Quick Start
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
echo OK - Node.js installed

echo.
echo [2/3] Installing dependencies...
call npm install

echo.
echo [3/3] Starting Gemba Agent 2.0...
echo.
echo ============================================
echo Choose running mode:
echo [1] Auto Mode (Full autonomous)
echo [2] Dry Run (Simulation only)
echo [3] Manual Mode (Requires confirmation)
echo [4] Generate Report
echo [5] Exit
echo ============================================
choice /c 12345 /n /m "Select option: "

if errorlevel 5 exit
if errorlevel 4 goto report
if errorlevel 3 goto manual
if errorlevel 2 goto dryrun
if errorlevel 1 goto auto

:auto
echo.
echo Starting in AUTO MODE...
npm start
goto end

:dryrun
echo.
echo Starting in DRY RUN MODE (no actual changes)...
npm run gemba:dry
goto end

:manual
echo.
echo Starting in MANUAL MODE...
npm run gemba:manual
goto end

:report
echo.
echo Generating report...
npm run gemba:report
goto end

:end
echo.
echo ============================================
echo Gemba Agent stopped.
echo ============================================
pause