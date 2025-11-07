@echo off
echo ============================================
echo     Gemba Agent 2.0 - Safe Start
echo ============================================
echo.

cd /d "%~dp0"

:: 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: 选择运行模式
echo Choose version to run:
echo [1] Standalone (No dependencies required)
echo [2] Full Version (Requires npm install)
echo [3] Diagnose Issues
echo [4] Exit
echo.
choice /c 1234 /n /m "Select: "

if errorlevel 4 exit
if errorlevel 3 goto diagnose
if errorlevel 2 goto full
if errorlevel 1 goto standalone

:standalone
echo.
echo Starting Standalone Version...
echo ============================================
node standalone.js
if errorlevel 1 (
    echo.
    echo ERROR: Standalone version failed
    echo Check error messages above
)
goto end

:full
echo.
echo Starting Full Version...
echo First installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed
    pause
    goto end
)
echo.
echo Starting Gemba Agent...
node index.js
if errorlevel 1 (
    echo.
    echo ERROR: Full version failed
    echo Trying standalone version instead...
    timeout /t 3
    goto standalone
)
goto end

:diagnose
echo.
echo Running diagnostics...
echo ============================================
echo.
echo 1. Node version:
node --version
echo.
echo 2. NPM version:
call npm --version 2>nul
if errorlevel 1 echo NPM not found or error
echo.
echo 3. Current directory:
echo %CD%
echo.
echo 4. Files in directory:
dir /b *.js
echo.
echo 5. Testing standalone.js:
node -c standalone.js 2>&1
if errorlevel 1 (
    echo Syntax error in standalone.js
) else (
    echo Syntax OK
)
echo.
echo 6. Testing index.js:
node -c index.js 2>&1
if errorlevel 1 (
    echo Syntax error in index.js
) else (
    echo Syntax OK
)
echo.
pause
goto end

:end
echo.
echo ============================================
echo Press any key to exit...
pause >nul