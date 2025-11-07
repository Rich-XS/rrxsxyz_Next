@echo off
REM =====================================================
REM 淇鐗坧ort_check.bat - 涓嶄娇鐢╪ul閲嶅畾鍚?
REM 淇鏃堕棿: 2025-10-29
REM 闂: 2>CON 浼氬垱寤哄疄浣撴枃浠?
REM 瑙ｅ喅: 浣跨敤 2>con 鎴?>con 鏇夸唬
REM =====================================================

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo =====================================================
echo 绔彛鍗犵敤妫€鏌ュ伐鍏凤紙淇鐗堬級
echo =====================================================
echo.
echo 妫€鏌ユ椂闂? %date% %time%
echo.

REM 淇锛氫娇鐢?2^>con 鏇夸唬 ^2>CON
echo 銆恟rxsxyz_next 椤圭洰銆?
echo   绔彛 3001 (鍚庣):
netstat -ano | findstr ":3001 " 2>con && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":3001 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo   绔彛 8080 (鍓嶇):
netstat -ano | findstr ":8080 " 2>con && (
    echo     鉂?琚崰鐢?
    netstat -ano | findstr ":8080 " | findstr "LISTENING"
) || echo     鉁?绌洪棽

echo.
echo 銆愯繘绋嬫鏌ャ€?
tasklist | findstr /i "node.exe" 2>con && (
    echo   鉂?Node.js 杩愯涓?
) || echo   鉁?Node.js 鏈繍琛?

tasklist | findstr /i "python.exe" 2>con && (
    echo   鉂?Python 杩愯涓?
) || echo   鉁?Python 鏈繍琛?

echo.
echo 鎸変换鎰忛敭閫€鍑?..
pause >con
