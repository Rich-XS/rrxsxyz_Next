@echo off
chcp 65001 2>CON
echo ========================================
echo   RRXS.XYZ Local Development Server
echo   (D-68/D-80 绔彛淇濇姢鏈哄埗)
echo ========================================
echo.

REM Detect current directory
set "PROJECT_DIR=%~dp0"
echo 椤圭洰鐩綍: %PROJECT_DIR%
echo.

REM ============================================
REM 馃敀 Step 1: 绔彛瀹夊叏妫€鏌?(D-68/D-80瑙勫垯)
REM ============================================
echo [Step 1/3] 妫€鏌ョ鍙ｅ崰鐢ㄦ儏鍐?..
echo.

set "PORT_3001_BUSY=0"
set "PORT_8080_BUSY=0"

REM 妫€鏌?3001 绔彛锛堝悗绔?API锛?netstat -ano | findstr ":3001 " 2>CON 2>&1
if %errorlevel% equ 0 (
    set "PORT_3001_BUSY=1"
    echo 鈿狅笍  绔彛 3001 宸茶鍗犵敤锛堝悗绔?API锛?    echo.
    echo    鍗犵敤杩涚▼淇℃伅:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do (
        echo    PID: %%a
        tasklist /FI "PID eq %%a" /FO LIST | findstr "鏄犲儚鍚嶇О:"
    )
    echo.
)

REM 妫€鏌?8080 绔彛锛堝墠绔湇鍔″櫒锛?netstat -ano | findstr ":8080 " 2>CON 2>&1
if %errorlevel% equ 0 (
    set "PORT_8080_BUSY=1"
    echo 鈿狅笍  绔彛 8080 宸茶鍗犵敤锛堝墠绔湇鍔″櫒锛?    echo.
    echo    鍗犵敤杩涚▼淇℃伅:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do (
        echo    PID: %%a
        tasklist /FI "PID eq %%a" /FO LIST | findstr "鏄犲儚鍚嶇О:"
    )
    echo.
)

REM 濡傛灉绔彛琚崰鐢紝璇㈤棶鐢ㄦ埛鏄惁娓呯悊
if %PORT_3001_BUSY% equ 1 (
    echo.
    echo 馃敡 妫€娴嬪埌绔彛 3001 琚崰鐢ㄣ€?    echo.
    choice /C YN /M "鏄惁浣跨敤瀹夊叏娓呯悊鑴氭湰娓呯悊绔彛锛堥伒瀹圖-68璺ㄩ」鐩繚鎶よ鍒欙級锛?
    if errorlevel 2 (
        echo.
        echo 鉂?鐢ㄦ埛鍙栨秷娓呯悊锛岄€€鍑哄惎鍔ㄦ祦绋嬨€?        echo    寤鸿鎵嬪姩娓呯悊绔彛鍚庨噸鏂拌繍琛屻€?        pause
        goto :eof
    )
    if errorlevel 1 (
        echo.
        echo 鉁?璋冪敤瀹夊叏娓呯悊鑴氭湰...
        powershell -ExecutionPolicy Bypass -File "%PROJECT_DIR%scripts\safe_port_cleanup.ps1"
        echo.
        timeout /t 2 /nobreak 2>CON
    )
)

if %PORT_8080_BUSY% equ 1 (
    echo.
    echo 馃敡 妫€娴嬪埌绔彛 8080 琚崰鐢ㄣ€?    echo.
    choice /C YN /M "鏄惁浣跨敤瀹夊叏娓呯悊鑴氭湰娓呯悊绔彛锛堥伒瀹圖-68璺ㄩ」鐩繚鎶よ鍒欙級锛?
    if errorlevel 2 (
        echo.
        echo 鉂?鐢ㄦ埛鍙栨秷娓呯悊锛岄€€鍑哄惎鍔ㄦ祦绋嬨€?        echo    寤鸿鎵嬪姩娓呯悊绔彛鍚庨噸鏂拌繍琛屻€?        pause
        goto :eof
    )
    if errorlevel 1 (
        echo.
        echo 鉁?璋冪敤瀹夊叏娓呯悊鑴氭湰...
        powershell -ExecutionPolicy Bypass -File "%PROJECT_DIR%scripts\safe_port_cleanup.ps1"
        echo.
        timeout /t 2 /nobreak 2>CON
    )
)

REM ============================================
REM 馃殌 Step 2: 閫夋嫨鍚姩妯″紡
REM ============================================
echo.
echo ========================================
echo [Step 2/3] 閫夋嫨鏈嶅姟鍚姩妯″紡
echo ========================================
echo.
echo [1] 浠呭墠绔?(Python HTTP Server)
echo     - 绔彛: 8080
echo     - URL: http://localhost:8080/
echo     - 閫傜敤鍦烘櫙: 闈欐€侀〉闈㈡祴璇?echo.
echo [2] 浠呭悗绔?(Node.js API Server)
echo     - 绔彛: 3001 (淇涓?CLAUDE.md 瑙勮寖绔彛)
echo     - 棣栨杩愯闇€瑕? cd server ^&^& npm install
echo     - 閫傜敤鍦烘櫙: API 鎺ュ彛娴嬭瘯
echo.
echo [3] 鍏ㄦ爤妯″紡 (Python 鍓嶇 + Node 鍚庣) 猸?鎺ㄨ崘
echo     - 鍓嶇: 8080 (Python)
echo     - 鍚庣: 3001 (Node.js)
echo     - 閫傜敤鍦烘櫙: 瀹屾暣鍔熻兘娴嬭瘯
echo.
echo [4] Node.js 闈欐€佹湇鍔″櫒 (http-server)
echo     - 绔彛: 8080
echo     - 浣跨敤 npm http-server 鍖?echo     - 閫傜敤鍦烘櫙: Node 鐜闈欐€佹祴璇?echo.
echo [5] 蹇€熸祴璇曟ā寮?(鑷姩娓呯悊绔彛鍐茬獊)
echo     - 鑷姩娓呯悊 3001/8080 绔彛鍐茬獊
echo     - 鑷姩鍚姩鍓嶅悗绔湇鍔?echo     - 鈿狅笍  璀﹀憡: 浼氬己鍒舵竻鐞嗙鍙ｏ紝鎱庣敤锛?echo.

set /p CHOICE="璇烽€夋嫨鍚姩妯″紡 (1-5): "

REM 鏍囧噯鍖栭€夐」
set "OPTION=%CHOICE%"
if "%OPTION%"=="" set "OPTION=3"
if "%OPTION:~0,1%"=="1" goto :python_server
if "%OPTION:~0,1%"=="2" goto :node_backend
if "%OPTION:~0,1%"=="3" goto :fullstack
if "%OPTION:~0,1%"=="4" goto :node_static
if "%OPTION:~0,1%"=="5" goto :quick_test

echo 鉂?鏃犳晥閫夐」锛岄粯璁や娇鐢ㄥ叏鏍堟ā寮?[3]
goto :fullstack

REM ============================================
REM 馃寪 妯″紡 1: 浠呭墠绔?(Python)
REM ============================================
:python_server
echo.
echo ========================================
echo [Step 3/3] 鍚姩鍓嶇鏈嶅姟鍣?..
echo ========================================
echo.
echo 馃殌 姝ｅ湪鍚姩 Python HTTP Server (绔彛 8080)...
echo.
cd "%PROJECT_DIR%"
python -m http.server 8080
goto :eof

REM ============================================
REM 馃敡 妯″紡 2: 浠呭悗绔?(Node.js)
REM ============================================
:node_backend
echo.
echo ========================================
echo [Step 3/3] 鍚姩鍚庣鏈嶅姟鍣?..
echo ========================================
echo.
echo 馃攳 妫€鏌?server/server.js 绔彛閰嶇疆...
cd "%PROJECT_DIR%server"

REM 妫€鏌?server/server.js 鏄惁浣跨敤 3001 绔彛
findstr /C:"3001" server.js 2>CON 2>&1
if %errorlevel% neq 0 (
    echo 鈿狅笍  璀﹀憡: server/server.js 鍙兘鏈娇鐢?3001 绔彛
    echo    CLAUDE.md 瑙勮寖绔彛涓?3001
    echo    寤鸿妫€鏌?server/server.js 涓殑 PORT 閰嶇疆
    echo.
    pause
)

echo 馃殌 姝ｅ湪鍚姩 Node.js Backend Server (绔彛 3001)...
echo.
npm install
node server.js
goto :eof

REM ============================================
REM 猸?妯″紡 3: 鍏ㄦ爤妯″紡 (Python + Node)
REM ============================================
:fullstack
echo.
echo ========================================
echo [Step 3/3] 鍚姩鍏ㄦ爤鏈嶅姟...
echo ========================================
echo.
echo 馃殌 姝ｅ湪鍚姩鍓嶇鏈嶅姟鍣?(Python, 绔彛 8080)...
start /min cmd /c "cd \"%PROJECT_DIR%\" & title RRXS-Frontend-8080 & python -m http.server 8080"
timeout /t 2 /nobreak 2>CON

echo 馃殌 姝ｅ湪鍚姩鍚庣鏈嶅姟鍣?(Node.js, 绔彛 3001)...
start /min cmd /c "cd \"%PROJECT_DIR%server\" & title RRXS-Backend-3001 & npm install & node server.js"
timeout /t 3 /nobreak 2>CON

echo.
echo ========================================
echo 鉁?鍏ㄦ爤鏈嶅姟鍚姩瀹屾垚
echo ========================================
echo.
echo 馃搶 鏈嶅姟鍦板潃:
echo    - 鍓嶇: http://localhost:8080/
echo    - 鍚庣: http://localhost:3001/
echo.
echo 馃搶 娴嬭瘯椤甸潰:
echo    - 棣栭〉: http://localhost:8080/
echo    - 鐧鹃棶鑷祴: http://localhost:8080/baiwen.html
echo    - 澶氶瓟姹? http://localhost:8080/duomotai/
echo.
echo 馃敡 绠＄悊鍛戒护:
echo    - 鏌ョ湅绔彛: netstat -ano ^| findstr "3001 8080"
echo    - 瀹夊叏娓呯悊: powershell -ExecutionPolicy Bypass -File scripts\safe_port_cleanup.ps1
echo.
echo 鈿狅笍  娉ㄦ剰: 鍏抽棴鏈獥鍙ｄ笉浼氬仠姝㈡湇鍔★紝闇€鎵嬪姩鍏抽棴鏈嶅姟绐楀彛
echo.
pause
goto :eof

REM ============================================
REM 馃敡 妯″紡 4: Node.js 闈欐€佹湇鍔″櫒
REM ============================================
:node_static
echo.
echo ========================================
echo [Step 3/3] 鍚姩 Node.js 闈欐€佹湇鍔″櫒...
echo ========================================
echo.
echo 馃攳 妫€鏌?http-server 鏄惁宸插畨瑁?..
where http-server 2>CON 2>&1
if %errorlevel% neq 0 (
    echo 鈿狅笍  http-server 鏈畨瑁咃紝姝ｅ湪瀹夎...
    npm install -g http-server
)

echo 馃殌 姝ｅ湪鍚姩 Node.js Static Server (绔彛 8080)...
echo.
http-server "%PROJECT_DIR%" -p 8080
goto :eof

REM ============================================
REM 鈿?妯″紡 5: 蹇€熸祴璇曟ā寮忥紙寮哄埗娓呯悊绔彛锛?REM ============================================
:quick_test
echo.
echo ========================================
echo [Step 3/3] 蹇€熸祴璇曟ā寮?..
echo ========================================
echo.
echo 鈿狅笍  璀﹀憡: 姝ゆā寮忎細寮哄埗娓呯悊 3001 鍜?8080 绔彛
echo    濡傛灉鍏朵粬椤圭洰姝ｅ湪浣跨敤杩欎簺绔彛锛屽彲鑳戒細琚鏉€
echo    寤鸿浣跨敤妯″紡 [3] 鍏ㄦ爤妯″紡锛堝畨鍏ㄦ竻鐞嗭級
echo.
choice /C YN /M "纭缁х画蹇€熸祴璇曟ā寮忥紵"
if errorlevel 2 (
    echo 鉂?鐢ㄦ埛鍙栨秷锛岃繑鍥炰富鑿滃崟
    goto :eof
)

echo.
echo 馃敡 寮哄埗娓呯悊绔彛 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do (
    echo    缁堟杩涚▼ PID: %%a
    taskkill /PID %%a /F 2>CON 2>&1
)

echo 馃敡 寮哄埗娓呯悊绔彛 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do (
    echo    缁堟杩涚▼ PID: %%a
    taskkill /PID %%a /F 2>CON 2>&1
)

echo 鉁?绔彛娓呯悊瀹屾垚锛岀瓑寰?2 绉?..
timeout /t 2 /nobreak 2>CON

echo.
echo 馃殌 鍚姩鍓嶇鏈嶅姟鍣?(Python, 绔彛 8080)...
start /min cmd /c "cd \"%PROJECT_DIR%\" & title RRXS-Frontend-8080 & python -m http.server 8080"

echo 馃殌 鍚姩鍚庣鏈嶅姟鍣?(Node.js, 绔彛 3001)...
start /min cmd /c "cd \"%PROJECT_DIR%server\" & title RRXS-Backend-3001 & npm install & node server.js"

echo.
echo 鉁?蹇€熸祴璇曟ā寮忓惎鍔ㄥ畬鎴?echo.
echo 馃搶 鏈嶅姟鍦板潃:
echo    - 鍓嶇: http://localhost:8080/
echo    - 鍚庣: http://localhost:3001/
echo.
pause
goto :eof

:eof

