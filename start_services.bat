@echo off
chcp 65001 2>CON
echo ========================================
echo   Starting RRXS.XYZ Services
echo ========================================
echo.

REM 浣跨敤鑴氭湰鐩稿璺緞鑷姩鑾峰彇椤圭洰鏍圭洰褰?
cd /d "%~dp0"

REM Start backend (port 3001)
echo [1/2] Starting backend service (port 3001)...
start "RRXS Backend" /min cmd /c "cd /d "%~dp0server" && npm run dev"
timeout /t 3 /nobreak 2>CON

REM Start frontend (port 8080)
echo [2/2] Starting frontend service (port 8080)...
start "RRXS Frontend" /min cmd /c "cd /d "%~dp0" && python -m http.server 8080"
timeout /t 2 /nobreak 2>CON

echo.
echo Services started! Wait 5 seconds and check:
echo   - Backend:  http://localhost:3001/health
echo   - Frontend: http://localhost:8080/
echo.
pause

