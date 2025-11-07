@echo off
REM =====================================================
REM 鍏ㄩ潰鏍规不NUL鏂囦欢闂 - 涓€閿慨澶嶈剼鏈?
REM 浣滆€? Claude
REM 鏃ユ湡: 2025-10-29
REM =====================================================

echo ========================================
echo  NUL鏂囦欢鐏鹃毦鏍规不鏂规 v1.0
echo ========================================
echo.

REM 姝ラ1: 鍋滄鎵€鏈夊彲鑳界殑杩涚▼
echo [姝ラ 1/6] 鍋滄鎵€鏈夌浉鍏宠繘绋?..
taskkill /F /IM node.exe 2>CON >CON
taskkill /F /IM python.exe 2>CON >CON
taskkill /F /IM OneDrive.exe 2>CON >CON
taskkill /F /IM Code.exe 2>CON >CON
taskkill /F /IM VSCodium.exe 2>CON >CON
echo 鉁?杩涚▼宸插仠姝?
echo.

REM 姝ラ2: 娓呯悊鎵€鏈塶ul鏂囦欢
echo [姝ラ 2/6] 娓呯悊鐜版湁nul鏂囦欢...
powershell -Command "Get-ChildItem -Path 'D:\' -Filter 'nul' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { cmd /c 'del \"\\?\$($_.FullName)\"' }"
echo 鉁?nul鏂囦欢娓呯悊瀹屾垚
echo.

REM 姝ラ3: 淇rrxsxyz_next椤圭洰
echo [姝ラ 3/6] 淇rrxsxyz_next椤圭洰鎵瑰鐞嗘枃浠?..
cd /d "D:\_100W\rrxsxyz_next"

REM 澶囦唤鍘熷鏂囦欢
if exist port_check.bat (
    copy port_check.bat port_check.bat.backup 2>CON >CON
    powershell -Command "(Get-Content 'port_check.bat') -replace '2>CON', '2^>CON' | Set-Content 'port_check.bat'"
    echo 鉁?port_check.bat 宸蹭慨澶?
)

if exist shutdown_services.bat (
    copy shutdown_services.bat shutdown_services.bat.backup 2>CON >CON
    powershell -Command "(Get-Content 'shutdown_services.bat') -replace '2>CON', '2^>CON' | Set-Content 'shutdown_services.bat'"
    echo 鉁?shutdown_services.bat 宸蹭慨澶?
)
echo.

REM 姝ラ4: 鍒涘缓nodemon閰嶇疆
echo [姝ラ 4/6] 閰嶇疆nodemon蹇界暐瑙勫垯...
echo { > server\nodemon.json
echo   "watch": ["server.js", "src/**/*.js", "routes/**/*.js"], >> server\nodemon.json
echo   "ignore": ["nul", "**/nul", "*.zip", "*.log", "*.bak", "node_modules/**", ".git/**"], >> server\nodemon.json
echo   "delay": "2500", >> server\nodemon.json
echo   "verbose": false >> server\nodemon.json
echo } >> server\nodemon.json
echo 鉁?nodemon.json 宸查厤缃?
echo.

REM 姝ラ5: 鍒涘缓.gitignore瑙勫垯
echo [姝ラ 5/6] 鏇存柊.gitignore瑙勫垯...
echo # 闃叉nul鏂囦欢杩涘叆鐗堟湰鎺у埗 >> .gitignore
echo nul >> .gitignore
echo **/nul >> .gitignore
echo *.nul >> .gitignore
echo 鉁?.gitignore 宸叉洿鏂?
echo.

REM 姝ラ6: 鍒涘缓鐩戞帶鑴氭湰
echo [姝ラ 6/6] 鍒涘缓鐩戞帶鑴氭湰...
echo @echo off > monitor_nul.bat
echo :loop >> monitor_nul.bat
echo cls >> monitor_nul.bat
echo echo NUL鏂囦欢鐩戞帶涓?.. >> monitor_nul.bat
echo powershell -Command "Get-ChildItem -Path 'D:\_100W' -Filter 'nul' -Recurse -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count" >> monitor_nul.bat
echo timeout /t 3600 2^>CON ^>CON >> monitor_nul.bat
echo goto loop >> monitor_nul.bat
echo 鉁?鐩戞帶鑴氭湰宸插垱寤?
echo.

echo ========================================
echo  鉁?鏍规不鏂规鎵ц瀹屾垚锛?
echo ========================================
echo.
echo 鍚庣画寤鸿锛?
echo 1. 鏆傛椂涓嶈鍚姩OneDrive
echo 2. 杩愯 chkdsk D: /f 妫€鏌ユ枃浠剁郴缁?
echo 3. 鑰冭檻灏嗗紑鍙戠洰褰曠Щ鍑篛neDrive鍚屾鑼冨洿
echo.
pause
