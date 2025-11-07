@echo off
echo ========================================
echo  Claude 閰嶇疆鏂囦欢淇宸ュ叿
echo ========================================
echo.

echo [1] 澶囦唤褰撳墠鎹熷潖鐨勯厤缃枃浠?..
copy "C:\Users\rrxs\.claude.json" "C:\Users\rrxs\.claude_backup_%date:~0,4%%date:~5,2%%date:~8,2%.json" 22>CON
if %errorlevel%==0 (
    echo 鉁?澶囦唤鎴愬姛
) else (
    echo 脳 澶囦唤澶辫触锛屾枃浠跺彲鑳戒笉瀛樺湪
)

echo.
echo [2] 鍒犻櫎鎹熷潖鐨勯厤缃枃浠?..
del "C:\Users\rrxs\.claude.json" 22>CON
if %errorlevel%==0 (
    echo 鉁?鍒犻櫎鎴愬姛
) else (
    echo 脳 鍒犻櫎澶辫触
)

echo.
echo [3] 鍒涘缓鏂扮殑绌洪厤缃枃浠?..
echo {} > "C:\Users\rrxs\.claude.json"
echo 鉁?鏂伴厤缃枃浠跺凡鍒涘缓

echo.
echo ========================================
echo  淇瀹屾垚锛?
echo ========================================
echo.
echo 鎻愮ず锛?
echo - 鏃ч厤缃凡澶囦唤鍒?.claude_backup_鏃ユ湡.json
echo - Claude灏嗗湪涓嬫鍚姩鏃堕噸鏂板垵濮嬪寲閰嶇疆
echo - 杩欎笉浼氬奖鍝嶄綘鐨勫璇濆巻鍙诧紙瀛樺偍鍦ㄤ簯绔級
echo.
pause
