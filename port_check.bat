@echo off
REM ======================================================================
REM port_check.bat - 蹇€熸鏌ョ鍙ｅ崰鐢ㄦ儏鍐?
REM ======================================================================
REM
REM 鐢ㄩ€旓細妫€鏌ユ墍鏈夐」鐩浉鍏崇殑绔彛鍗犵敤鎯呭喌
REM 鐢ㄦ硶锛氱洿鎺ュ弻鍑绘垨鍦ㄥ懡浠よ杩愯
REM
REM 澶嶅埗鍒帮細鍚勪釜椤圭洰鏍圭洰褰?
REM
REM ======================================================================

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo =====================================================
echo 绔彛鍗犵敤妫€鏌ュ伐鍏?
REM echo =====================================================
echo.
echo 妫€鏌ユ椂闂? %date% %time%
echo.

REM ======================================================================
REM 妫€鏌ラ」鐩鍙?
REM ======================================================================

echo 銆恟rxsxyz_next 椤圭洰銆?
echo   绔彛 3001 (鍓嶅彴):
netstat -ano | findstr ":3001 " 2>CON && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":3001 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo   绔彛 8080 (鍚庡彴):
netstat -ano | findstr ":8080 " 2>CON && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":8080 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo.
echo 銆怉nyRouter_Refresh 椤圭洰銆?
echo   绔彛 6600 (ARB-API):
netstat -ano | findstr ":6600 " 2>CON && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":6600 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo   绔彛 6001 (Dashboard):
netstat -ano | findstr ":6001 " 2>CON && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":6001 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo.
echo 銆恗x_kc_gl 椤圭洰銆?
echo   绔彛 7000-7999 鑼冨洿:
netstat -ano | findstr ":700[0-9] " | findstr "LISTENING" 2>CON && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":700[0-9] " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo.
echo =====================================================
echo 杩涚▼鐘舵€?
echo =====================================================
echo.
echo Node.js 杩涚▼:
tasklist | findstr /i "node.exe" 2>CON && (
    tasklist | findstr /i "node.exe"
) || echo   (鏃?

echo.
echo Python 杩涚▼:
tasklist | findstr /i "python.exe" 2>CON && (
    tasklist | findstr /i "python.exe"
) || echo   (鏃?

echo.
echo =====================================================
echo 鎸変换鎰忛敭閫€鍑?..
pause >CON

