@echo off
chcp 65001 >nul
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

choice /c 1234 /n /m "Enter option (1-4): "

if errorlevel 4 goto :node_static
if errorlevel 3 goto :fullstack
if errorlevel 2 goto :node_backend
if errorlevel 1 goto :python_server

:python_server
echo.
echo ========================================
echo   Starting Python HTTP Server
echo ========================================
cd /d "%PROJECT_DIR%"
echo Current Dir: %CD%
echo.
echo Starting server on port: 8080
echo.
python -m http.server 8080
goto :end

:node_backend
echo.
echo ========================================
echo   Starting Node.js Backend Server
echo ========================================
cd /d "%PROJECT_DIR%server"
echo Current Dir: %CD%
echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo First run - installing dependencies...
    call npm install
)
echo.
echo Starting backend server on port: 3000
echo.
call npm run dev
goto :end

:fullstack
echo.
echo ========================================
echo   Starting Full Stack Servers
echo ========================================
echo.
echo Note: Will open 2 windows
echo   - Window 1: Python HTTP (Frontend) :8080
echo   - Window 2: Node.js API (Backend) :3000
echo.
pause

REM Start Python frontend server (new window)
start "RRXS-Frontend :8080" cmd /k "cd /d "%PROJECT_DIR%" && python -m http.server 8080"

REM Wait 1 second
timeout /t 1 /nobreak >nul

REM Start Node backend server (new window)
start "RRXS-Backend-API :3000" cmd /k "cd /d "%PROJECT_DIR%server" && npm run dev"

echo.
echo [OK] Two servers started in separate windows
echo.
echo Access URLs:
echo   - Frontend: http://localhost:8080/
echo   - Backend API: http://localhost:3000/
echo   - Baiwen Test: http://localhost:8080/baiwen.html
echo   - Duomotai: http://localhost:8080/duomotai/
echo.
echo Closing this window will NOT stop servers
echo To stop servers, close the respective windows
pause
goto :end

:node_static
echo.
echo ========================================
echo   Starting Node.js Static Server
echo ========================================
cd /d "%PROJECT_DIR%"
echo Current Dir: %CD%
echo.
echo Using npx http-server (no install needed)
echo Port: 8080
echo.
npx http-server -p 8080 -c-1
goto :end

:end
echo.
echo Server stopped
pause