@echo off
chcp 65001 2>CON
echo ========================================
echo   RRXS.XYZ Local Development Server
echo ========================================
echo.

REM Detect current directory
set "PROJECT_DIR=%~dp0"
echo Project Dir: %PROJECT_DIR%
echo.

REM Menu options
echo Choose server type:
echo.
echo [1] Python HTTP Server (Recommended)
echo     - Port: 8080
echo     - URL: http://localhost:8080/
echo.
echo [2] Node.js Backend Server (API)
echo     - Port: 3000 (API Server)
echo     - First run: cd server ^&^& npm install
echo.
echo [3] Full Stack (Python + Node)
echo     - Python: 8080 (Frontend)
echo     - Node: 3000 (Backend API)
echo.
echo [4] Node.js Static Server
echo     - Port: 8080
echo     - Using http-server
echo.
echo [5] Quick Test (Auto-detect port conflicts)
echo     - Auto-detect and close 3000 port conflicts
echo     - Auto-start backend and frontend services
echo.

REM Use 'choice' if available; otherwise fall back to set /p for compatibility
:: removed choice detection to use a simple prompt so the prompt is always visible and reliable
set /p CHOICE="Enter option (1-5): "

REM Normalize and branch based on CHOICE (support both numeric input)
set "OPTION=%CHOICE%"
if "%OPTION%"=="" set "OPTION=1"
if "%OPTION:~0,1%"=="1" goto :python_server
if "%OPTION:~0,1%"=="2" goto :node_backend
if "%OPTION:~0,1%"=="3" goto :fullstack
if "%OPTION:~0,1%"=="4" goto :node_static
if "%OPTION:~0,1%"=="5" goto :quick_test

:python_server
echo Starting Python HTTP Server...
cd "%PROJECT_DIR%"
python -m http.server 8080
goto :eof

:node_backend
echo Starting Node.js Backend Server...
cd "%PROJECT_DIR%server"
npm install
node server.js
goto :eof

:fullstack
echo Starting Full Stack (Python + Node)...
start cmd /c "cd \"%PROJECT_DIR%\" & python -m http.server 8080"
start cmd /c "cd \"%PROJECT_DIR%server\" & npm install & node server.js"
goto :eof

:node_static
echo Starting Node.js Static Server...
npm install -g http-server
http-server "%PROJECT_DIR%" -p 8080
goto :eof

:quick_test
echo Performing Quick Test...
REM Detect and close port conflicts
netstat -ano | findstr :3000 2>CON 2>&1 && (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F
)
start cmd /c "cd \"%PROJECT_DIR%\" & python -m http.server 8080"
start cmd /c "cd \"%PROJECT_DIR%server\" & npm install & node server.js"
goto :eof

:eof
