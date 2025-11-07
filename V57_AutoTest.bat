@echo off
REM ================================================================================
REM V57.0 Auto Startup + Gemba Test Script
REM ================================================================================
REM This script will:
REM 1. Start both frontend (8080) and backend (3001) services
REM 2. Wait for services to be ready
REM 3. Run Gemba-Agent automated tests
REM 4. Open the test report in browser
REM ================================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo V57.0 Auto Startup + Gemba Test
echo ================================================================================
echo.

REM Check current directory
cd /d "D:\_100W\rrxsxyz_next" || (
    echo ERROR: Cannot access D:\_100W\rrxsxyz_next
    pause
    exit /b 1
)

echo [STEP 1] Checking port availability...
netstat -ano | findstr "8080" 2>CON && echo WARNING: Port 8080 already in use && pause
netstat -ano | findstr "3001" 2>CON && echo WARNING: Port 3001 already in use && pause

echo [STEP 2] Starting Frontend Service (Port 8080)...
cd /d "D:\_100W\rrxsxyz_next"
start "Frontend-V57.0" python -m http.server 8080
echo   Frontend service started in new window
timeout /t 3 /nobreak

echo [STEP 3] Starting Backend Service (Port 3001)...
cd /d "D:\_100W\rrxsxyz_next\server"
start "Backend-V57.0" cmd /k npm run dev
echo   Backend service started in new window
timeout /t 5 /nobreak

echo [STEP 4] Waiting for services to be ready...
set count=0
:wait_loop
timeout /t 2 /nobreak 2>CON
set /a count+=1
echo   Attempt !count!/15 - Checking services...
curl -s -m 1 http://localhost:8080/duomotai/ 2>CON 2>&1 && (
    curl -s -m 1 http://localhost:3001/health 2>CON 2>&1 && (
        echo   SUCCESS: Both services are ready!
        goto services_ready
    )
)
if !count! lss 15 goto wait_loop

echo WARNING: Services may not be fully ready. Continuing anyway...

:services_ready
echo.
echo [STEP 5] Running Gemba-Agent automated tests...
echo.
cd /d "D:\_100W\rrxsxyz_next"
node scripts/gemba-agent.js

echo.
echo [STEP 6] Opening test report...
if exist "duomotai\gemba-reports\gemba-report.html" (
    start "" "duomotai\gemba-reports\gemba-report.html"
    echo Test report opened in browser
) else (
    echo WARNING: Test report not found
)

echo.
echo ================================================================================
echo V57.0 Gemba Test Complete!
echo ================================================================================
echo.
echo Press any key to close this window...
pause

