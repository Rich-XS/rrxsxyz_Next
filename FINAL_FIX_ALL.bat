@echo off
REM =====================================================
REM 鏈€缁堟牴娌绘柟妗?- 涓€閿墽琛?
REM 2025-10-29
REM =====================================================

cls
echo =========================================
echo    NUL鏂囦欢鐏鹃毦鏈€缁堟牴娌绘柟妗?
echo =========================================
echo.

REM 1. 鍋滄鎵€鏈夎繘绋?
echo [1/5] 鍋滄鎵€鏈夌浉鍏宠繘绋?..
taskkill /F /IM node.exe 2>CON
taskkill /F /IM OneDrive.exe 2>CON
taskkill /F /IM python.exe 2>CON
echo 鉁?瀹屾垚
echo.

REM 2. 娓呯悊鎵€鏈塶ul鏂囦欢
echo [2/5] 娓呯悊鎵€鏈塶ul鏂囦欢...
powershell -Command "Get-ChildItem -Path 'D:\' -Filter 'nul' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item -LiteralPath \"\\?\$($_.FullName)\" -Force -ErrorAction SilentlyContinue }"
echo 鉁?瀹屾垚
echo.

REM 3. 淇mx_kc_gl椤圭洰
echo [3/5] 淇mx_kc_gl椤圭洰...
cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl" 2>CON
if exist port_check.bat (
    copy port_check.bat port_check.bat.backup 2>CON
    powershell -Command "(Get-Content 'port_check.bat') -replace '2>CON', '2>CON' | Set-Content 'port_check.bat'"
    echo 鉁?port_check.bat 宸蹭慨澶?
)
if exist shutdown_services.bat (
    copy shutdown_services.bat shutdown_services.bat.backup 2>CON
    powershell -Command "(Get-Content 'shutdown_services.bat') -replace '2>CON', '2>CON' | Set-Content 'shutdown_services.bat'"
    echo 鉁?shutdown_services.bat 宸蹭慨澶?
)
echo.

REM 4. 淇LTP_Opt椤圭洰
echo [4/5] 淇LTP_Opt椤圭洰...
cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\LTP_Opt\organized\04_Scripts" 2>CON
if exist port_check.bat (
    copy port_check.bat port_check.bat.backup 2>CON
    powershell -Command "(Get-Content 'port_check.bat') -replace '2>CON', '2>CON' | Set-Content 'port_check.bat'"
    echo 鉁?port_check.bat 宸蹭慨澶?
)
if exist shutdown_services.bat (
    copy shutdown_services.bat shutdown_services.bat.backup 2>CON
    powershell -Command "(Get-Content 'shutdown_services.bat') -replace '2>CON', '2>CON' | Set-Content 'shutdown_services.bat'"
    echo 鉁?shutdown_services.bat 宸蹭慨澶?
)
echo.

REM 5. 鍒涘缓鍏ㄥ眬鐩戞帶鑴氭湰
echo [5/5] 鍒涘缓鐩戞帶鏈哄埗...
echo @echo off > "D:\_100W\MONITOR_NUL.bat"
echo :loop >> "D:\_100W\MONITOR_NUL.bat"
echo echo 鐩戞帶nul鏂囦欢... >> "D:\_100W\MONITOR_NUL.bat"
echo powershell -Command "Write-Host '褰撳墠nul鏂囦欢鏁? ' -NoNewline; (Get-ChildItem -Path 'D:\' -Filter 'nul' -Recurse -ErrorAction SilentlyContinue).Count" >> "D:\_100W\MONITOR_NUL.bat"
echo timeout /t 3600 /nobreak 2^>CON ^>CON >> "D:\_100W\MONITOR_NUL.bat"
echo goto loop >> "D:\_100W\MONITOR_NUL.bat"
echo 鉁?鐩戞帶鑴氭湰宸插垱寤? D:\_100W\MONITOR_NUL.bat
echo.

echo =========================================
echo    鉁?鏍规不鏂规鎵ц瀹屾垚锛?
echo =========================================
echo.
echo 閲嶈鍚庣画姝ラ锛?
echo.
echo 1. 杩愯纾佺洏妫€鏌ワ紙閲嶅惎鍚庢墽琛岋級:
echo    chkdsk D: /f
echo.
echo 2. OneDrive鍚屾鎺掗櫎璁剧疆:
echo    - 鎵撳紑OneDrive璁剧疆
echo    - 閫夋嫨"閫夋嫨鏂囦欢澶?
echo    - 鍙栨秷鍕鹃€夊紑鍙戦」鐩枃浠跺す
echo.
echo 3. 瀹氭湡鐩戞帶锛堝彲閫夛級:
echo    杩愯 D:\_100W\MONITOR_NUL.bat
echo.
pause
