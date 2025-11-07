@echo off
chcp 65001 2>CON

REM 蹇€熷惎鍔ㄨ剼鏈?- 鐧句竾琚姩鏀跺叆涔嬭矾鍚庣鏈嶅姟

echo 馃殌 姝ｅ湪鍚姩鐧句竾琚姩鏀跺叆涔嬭矾鍚庣鏈嶅姟...
echo.

REM 妫€鏌ode.js鐜
node --version 2>CON 2>&1
if errorlevel 1 (
    echo 鉂?閿欒锛氭湭鎵惧埌Node.js锛岃鍏堝畨瑁匩ode.js
    echo    涓嬭浇鍦板潃锛歨ttps://nodejs.org/
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set nodeversion=%%i
echo 鉁?Node.js鐗堟湰: %nodeversion%

REM 杩涘叆鏈嶅姟鍣ㄧ洰褰?if not exist "server" (
    echo 鉂?閿欒锛氭湭鎵惧埌server鐩綍
    pause
    exit /b 1
)

cd server

REM 妫€鏌ackage.json
if not exist "package.json" (
    echo 鉂?閿欒锛氭湭鎵惧埌package.json鏂囦欢
    pause
    exit /b 1
)

REM 瀹夎渚濊禆
if not exist "node_modules" (
    echo 馃摝 姝ｅ湪瀹夎渚濊禆鍖?..
    npm install
    if errorlevel 1 (
        echo 鉂?渚濊禆瀹夎澶辫触
        pause
        exit /b 1
    )
    echo 鉁?渚濊禆瀹夎瀹屾垚
) else (
    echo 馃摝 渚濊禆鍖呭凡瀛樺湪
)

REM 妫€鏌ョ幆澧冨彉閲忔枃浠?if not exist ".env" (
    echo 鈿欙笍 鍒涘缓鐜鍙橀噺鏂囦欢...
    if exist ".env.example" (
        copy ".env.example" ".env" 2>CON
        echo 鉁?宸插鍒?env.example涓?env
        echo 鈿狅笍  璇风紪杈?env鏂囦欢锛屽～鍏ョ湡瀹炵殑API瀵嗛挜鍜岄偖绠遍厤缃?        echo.
        echo 馃摟 閭欢閰嶇疆鎺ㄨ崘锛堝厤璐规柟妗堬級锛?        echo    - QQ閭锛欵MAIL_SERVICE=qq
        echo    - 163閭锛欵MAIL_SERVICE=163
        echo.
        echo 馃 AI鏈嶅姟瀵嗛挜锛?        echo    - Qwen锛歈WEN_API_KEY=your_qwen_key
        echo    - DeepSeek锛欴EEPSEEK_API_KEY=your_deepseek_key
        echo.
        pause
    ) else (
        echo 鉂?閿欒锛氭湭鎵惧埌.env.example鏂囦欢
        pause
        exit /b 1
    )
)

echo.
echo 馃殌 鍚姩鍚庣鏈嶅姟鍣?..
echo 馃摗 鏈嶅姟鍦板潃锛歨ttp://localhost:3000
echo 馃敆 鍋ュ悍妫€鏌ワ細http://localhost:3000/health
echo.
echo 馃挕 浣跨敤璇存槑锛?echo    1. 纭繚.env鏂囦欢宸叉纭厤缃?echo    2. 鎵撳紑鍓嶇HTML鏂囦欢寮€濮嬫祴璇?echo    3. 鏌ョ湅鎺у埗鍙版棩蹇椾簡瑙ｈ繍琛岀姸鎬?echo.
echo 鎸塁trl+C鍋滄鏈嶅姟鍣?echo ================================

REM 鍚姩鏈嶅姟鍣?npm run dev
