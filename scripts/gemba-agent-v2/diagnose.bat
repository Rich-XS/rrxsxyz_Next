@echo off
echo ============================================
echo     Gemba Agent 2.0 - Diagnostic Start
echo ============================================
echo.

cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo [1/4] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo [2/4] Checking npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found.
    pause
    exit /b 1
)

echo.
echo [3/4] Checking if package.json exists...
if not exist package.json (
    echo ERROR: package.json not found in current directory
    echo Creating minimal package.json...
    echo {"name":"gemba-agent-v2","version":"2.0.0","main":"index.js"} > package.json
)

echo.
echo [4/4] Testing index.js...
echo.
echo Running: node index.js
echo ----------------------------------------
node index.js 2>&1
echo ----------------------------------------
echo.
echo Exit code: %ERRORLEVEL%

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start Gemba Agent
    echo Common issues:
    echo 1. Missing dependencies - run: npm install
    echo 2. Module not found - check require statements
    echo 3. Syntax errors - check the code
)

echo.
pause