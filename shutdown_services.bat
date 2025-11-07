@echo off
REM ======================================================================
REM shutdown_services.bat - 娓呯悊鎵€鏈夐」鐩殑鍚庡彴鏈嶅姟
REM ======================================================================
REM
REM 鐢ㄩ€旓細鍦ㄥ叧闂?VS Code 鍓嶏紝杩愯姝よ剼鏈互娓呯悊鍚庡彴杩涚▼
REM 杩欏彲浠ラ槻姝㈢鍙ｅ啿绐佸拰 IDE 宕╂簝
REM
REM 鐢ㄦ硶锛氱洿鎺ュ弻鍑绘垨鍦ㄥ懡浠よ杩愯
REM       shutdown_services.bat
REM
REM 澶嶅埗鍒帮細
REM   - D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\rrxsxyz_next\
REM   - D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\AnyRouter_Refresh\
REM   - D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl\
REM
REM ======================================================================

setlocal enabledelayedexpansion
color 0F
cls

echo.
echo =====================================================
echo 鍚庡彴鏈嶅姟娓呯悊鑴氭湰
echo =====================================================
echo.
echo 姝よ剼鏈皢锛?
echo 1. 鍋滄鎵€鏈?Node.js 杩涚▼ (rrxsxyz_next)
echo 2. 鍋滄鎵€鏈?Python 杩涚▼ (AnyRouter_Refresh, mx_kc_gl)
echo 3. 楠岃瘉娓呯悊缁撴灉
echo 4. 閲婃斁鎵€鏈夎鍗犵敤鐨勭鍙?
echo.

REM ======================================================================
REM 绗竴姝ワ細璇㈤棶鐢ㄦ埛纭
REM ======================================================================

echo [纭] 鏄惁缁х画娓呯悊? 杩欏皢鍋滄鎵€鏈夊悗鍙版湇鍔°€?
echo.
set /p confirm="璇疯緭鍏?yes 纭锛屾垨鎸?Ctrl+C 鍙栨秷: "

if /i not "%confirm%"=="yes" (
    echo.
    echo 宸插彇娑堟竻鐞嗘搷浣溿€?
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo 寮€濮嬫竻鐞?..
echo =====================================================
echo.

REM ======================================================================
REM 绗簩姝ワ細鍋滄 Node.js 杩涚▼
REM ======================================================================

echo [姝ラ 1/4] 鍋滄 Node.js 杩涚▼ (rrxsxyz_next)...

tasklist | findstr /i "node.exe" 2>CON

if !errorlevel! equ 0 (
    echo   - 鍙戠幇 Node.js 杩涚▼锛屾鍦ㄥ仠姝?..
    taskkill /F /IM node.exe /FI "WINDOWTITLE eq*rrxsxyz*" 22>CON
    taskkill /F /IM node.exe 22>CON
    echo   鉁?Node.js 杩涚▼宸插仠姝?
    ping -n 3 127.0.0.1 2>CON
) else (
    echo   鈸? 鏃?Node.js 杩涚▼杩愯
)

echo.

REM ======================================================================
REM 绗笁姝ワ細鍋滄 Python 杩涚▼
REM ======================================================================

echo [姝ラ 2/4] 鍋滄 Python 杩涚▼ (AnyRouter_Refresh, mx_kc_gl)...

tasklist | findstr /i "python.exe" 2>CON

if !errorlevel! equ 0 (
    echo   - 鍙戠幇 Python 杩涚▼锛屾鍦ㄥ仠姝?..
    taskkill /F /IM python.exe 22>CON
    echo   鉁?Python 杩涚▼宸插仠姝?
    ping -n 3 127.0.0.1 2>CON
) else (
    echo   鈸? 鏃?Python 杩涚▼杩愯
)

echo.

REM ======================================================================
REM 绗洓姝ワ細楠岃瘉娓呯悊缁撴灉
REM ======================================================================

echo [姝ラ 3/4] 楠岃瘉娓呯悊缁撴灉...
echo.

tasklist | findstr /i "node.exe python.exe" 2>CON

if !errorlevel! equ 0 (
    echo   鈿狅笍  璀﹀憡锛氫粛鏈夎繘绋嬪湪杩愯
    echo.
    echo   杩愯涓殑杩涚▼锛?
    tasklist | findstr /i "node.exe python.exe"
    echo.
    echo   寤鸿锛氫娇鐢ㄥ己鍒舵柟娉?
    taskkill /F /IM node.exe 22>CON
    taskkill /F /IM python.exe 22>CON
    ping -n 2 127.0.0.1 2>CON

    REM 鍐嶆鏌ヤ竴娆?
    tasklist | findstr /i "node.exe python.exe" 2>CON
    if !errorlevel! equ 0 (
        echo   鉂?娓呯悊澶辫触锛氫粛鏈夎繘绋嬪湪杩愯
        echo      鍙兘闇€瑕侀€氳繃 Windows 浠诲姟绠＄悊鍣ㄦ墜鍔ㄦ竻鐞?
    ) else (
        echo   鉁?鎵€鏈夎繘绋嬪凡娓呯悊
    )
) else (
    echo   鉁?鎵€鏈夎繘绋嬪凡娓呯悊鎴愬姛
)

echo.

REM ======================================================================
REM 绗簲姝ワ細妫€鏌ョ鍙ｇ姸鎬?
REM ======================================================================

echo [姝ラ 4/4] 妫€鏌ョ鍙ｇ姸鎬?..
echo.

echo   妫€鏌ュ叧閿鍙ｏ細
echo   - 绔彛 3001 (rrxsxyz_next 鍓嶅彴):
netstat -ano | findstr ":3001" 2>CON && (
    echo     鈿狅笍  绔彛琚崰鐢?
    netstat -ano | findstr ":3001"
) || echo     鉁?绔彛绌洪棽

echo.
echo   - 绔彛 8080 (rrxsxyz_next 鍚庡彴):
netstat -ano | findstr ":8080" 2>CON && (
    echo     鈿狅笍  绔彛琚崰鐢?
    netstat -ano | findstr ":8080"
) || echo     鉁?绔彛绌洪棽

echo.
echo   - 绔彛 6600 (ARB-API):
netstat -ano | findstr ":6600" 2>CON && (
    echo     鈿狅笍  绔彛琚崰鐢?
    netstat -ano | findstr ":6600"
) || echo     鉁?绔彛绌洪棽

echo.
echo   - 绔彛 7000-7999 (mx_kc_gl):
netstat -ano | findstr ":700[0-9]" 2>CON && (
    echo     鈿狅笍  绔彛琚崰鐢?
    netstat -ano | findstr ":700[0-9]"
) || echo     鉁?绔彛绌洪棽

echo.

REM ======================================================================
REM 瀹屾垚
REM ======================================================================

echo =====================================================
echo 鉁?娓呯悊瀹屾垚锛?
echo =====================================================
echo.
echo 鐜板湪鍙互瀹夊叏鍦帮細
echo   1. 鍏抽棴鎵€鏈?VS Code 绐楀彛
echo   2. 閲嶅惎 VS Code
echo   3. 鍚姩鏂扮殑椤圭洰鍜屾湇鍔?
echo.
echo 鎸変换鎰忛敭缁х画...
pause 2>CON

exit /b 0

