@echo off
echo ==========================================
echo RRXS.XYZ 蹇€熷惎鍔ㄨ剼鏈?
echo ==========================================
echo.

REM 娓呯悊绔彛
echo [1/4] 娓呯悊绔彛鍗犵敤...
taskkill /F /IM python.exe 22>CON
taskkill /F /IM node.exe 22>CON
taskkill /F /IM http-server 22>CON
timeout /t 2 2>CON

REM 鍚姩鍚庣鏈嶅姟鍣?
echo [2/4] 鍚姩鍚庣API鏈嶅姟鍣?(绔彛 3001)...
cd server
start /min cmd /c "npm run dev"
cd ..
timeout /t 3 2>CON

REM 鍚姩鍓嶇鏈嶅姟鍣?
echo [3/4] 鍚姩鍓嶇HTTP鏈嶅姟鍣?(绔彛 8080)...
start /min cmd /c "python -m http.server 8080"
timeout /t 2 2>CON

REM 鏄剧ず璁块棶鍦板潃
echo [4/4] 鏈嶅姟鍚姩瀹屾垚锛?
echo.
echo ==========================================
echo 璁块棶鍦板潃锛?
echo - 澶氶瓟姹扮郴缁? http://localhost:8080/duomotai/
echo - 涓婚〉: http://localhost:8080/
echo - 鐧鹃棶鑷祴: http://localhost:8080/baiwen.html
echo - 鍚庣API: http://localhost:3001/
echo ==========================================
echo.
echo 鏈嶅姟宸插湪鍚庡彴杩愯锛屽彲浠ュ叧闂绐楀彛銆?
pause
