@echo off
chcp 65001 2>CON
setlocal enabledelayedexpansion

:: 棰勮鐨?AUTH_TOKEN锛堝彲鍦ㄦ淇敼锛?
:: 娉ㄦ剰锛氬鏋滃€间腑鍖呭惈 & 璇峰湪鍙充晶浣跨敤 ^& 鏉ヨ浆涔夛紝渚嬪 rrxsJP^&544
:: 棰勮鐨?AUTH_TOKEN 鍚嶇О涓庡€硷紙鍙湪姝や慨鏀癸級
:: 鍚嶇О淇濆瓨鍦?PRESET_NAME_*, 瀵瑰簲 key 淇濆瓨鍦?PRESET_TOKEN_*
:: 娉ㄦ剰锛氬鏋?key 涓寘鍚?& 绛夌壒娈婂瓧绗︼紝璇风敤 ^& 杞箟
set "PRESET_NAME_1=rrxs"
set "PRESET_TOKEN_1=sk-UYtYTnT9niLlGk8jVaNomM92dcLzvGERjEI1oVOL6f5zzxQl"

set "PRESET_NAME_2=rrxsJP"
set "PRESET_TOKEN_2=sk-nHrKveoItYeIkhX6FAGbT0M6zMmOa9xJ5EDqQ19WYuabMdqE"

set "PRESET_NAME_3=mx"
set "PRESET_TOKEN_3=mx.YHZ"

set "PRESET_NAME_4="
set "PRESET_TOKEN_4="

set "PRESET_NAME_5="
set "PRESET_TOKEN_5="

:: 璁剧疆鑴氭湰璺緞
set "SCRIPT_DIR=%~dp0"
set "CONFIG_FILE=%SCRIPT_DIR%anthro_config.json"

echo.
echo ========================================
echo      Anthropic 鐜鍙橀噺閰嶇疆宸ュ叿
echo ========================================
echo.

:: 妫€鏌ラ厤缃枃浠舵槸鍚﹀瓨鍦?
if not exist "%CONFIG_FILE%" (
    echo 閿欒: 閰嶇疆鏂囦欢 anthropic_config.json 涓嶅瓨鍦?
    echo 璇风‘淇濋厤缃枃浠跺瓨鍦ㄤ簬鑴氭湰鍚岀洰褰曚笅銆?
    pause
    exit /b 1
)

:: 鏄剧ず褰撳墠鐜鍙橀噺
echo 褰撳墠鐜鍙橀噺鐘舵€?
echo ANTHROPIC_BASE_URL = %ANTHROPIC_BASE_URL%
echo ANTHROPIC_AUTH_TOKEN = %ANTHROPIC_AUTH_TOKEN%
echo.

:: 鏄剧ず鑿滃崟
echo 璇烽€夋嫨閰嶇疆閫夐」:
echo.
echo 1. 榛樿閰嶇疆 (api.anthropic.com)
echo 2. AnyRouter.Top
echo 3. AnyRouter澶ч檰浼樺寲CDN
echo 4. AnyRouter3
echo 5. 鏈湴娴嬭瘯 (localhost)
echo 6. 鎵嬪姩璁剧疆 BASE_URL
echo 7. 鎵嬪姩璁剧疆 AUTH_TOKEN
echo 8. 娓呴櫎鐜鍙橀噺
echo 9. 鏄剧ず鎵€鏈夐厤缃?
echo 10. 缂栬緫閰嶇疆鏂囦欢
echo 11. 閫夋嫨/搴旂敤 AUTH_TOKEN 棰勮 (5 涓?
echo 0. 閫€鍑?
echo.

set /p choice="璇疯緭鍏ラ€夋嫨 (0-11): "

if "%choice%"=="1" goto :set_default
if "%choice%"=="2" goto :set_proxy
if "%choice%"=="3" goto :set_anyrouter_cdn
if "%choice%"=="4" goto :set_anyrouter3
if "%choice%"=="5" goto :set_local
if "%choice%"=="6" goto :manual_base_url
if "%choice%"=="7" goto :manual_auth_token
if "%choice%"=="8" goto :clear_vars
if "%choice%"=="9" goto :show_configs
if "%choice%"=="10" goto :edit_config
if "%choice%"=="11" goto :choose_token
if "%choice%"=="0" goto :exit
goto :invalid_choice

:set_default
echo 璁剧疆榛樿閰嶇疆...
call :extract_config "default"
goto :end

:set_proxy
echo 璁剧疆AnyRouter.Top閰嶇疆...
call :extract_config "proxy"
goto :end

:set_anyrouter_cdn
echo 璁剧疆AnyRouter澶ч檰浼樺寲CDN閰嶇疆...
call :extract_config "anyrouter_cdn"
goto :end

:set_anyrouter3
echo 璁剧疆AnyRouter3閰嶇疆...
call :extract_config "anyrouter3"
goto :end

:set_local
echo 璁剧疆鏈湴娴嬭瘯閰嶇疆...
call :extract_config "local"
goto :end

:extract_config
set "config_name=%~1"
echo 姝ｅ湪瑙ｆ瀽閰嶇疆鏂囦欢...

:: 浣跨敤PowerShell璇诲彇JSON閰嶇疆
for /f "delims=" %%i in ('powershell -Command "$json = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $json.configs.%config_name%.base_url"') do set "BASE_URL=%%i"
for /f "delims=" %%i in ('powershell -Command "$json = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $json.configs.%config_name%.auth_token"') do set "AUTH_TOKEN=%%i"
for /f "delims=" %%i in ('powershell -Command "$json = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $json.configs.%config_name%.name"') do set "CONFIG_NAME=%%i"

if "!BASE_URL!"=="" (
    echo 閿欒: 鏃犳硶璇诲彇閰嶇疆 %config_name%
    goto :end
)

echo 搴旂敤閰嶇疆: !CONFIG_NAME!
setx ANTHROPIC_BASE_URL "!BASE_URL!" 2>CON
setx ANTHROPIC_AUTH_TOKEN "!AUTH_TOKEN!" 2>CON

echo 璁剧疆瀹屾垚:
echo ANTHROPIC_BASE_URL = !BASE_URL!
echo ANTHROPIC_AUTH_TOKEN = !AUTH_TOKEN!
echo.
echo 娉ㄦ剰: 鐜鍙橀噺宸叉案涔呰缃紝闇€瑕侀噸鏂版墦寮€缁堢鎵嶈兘鐢熸晥銆?
goto :return

:manual_base_url
echo.
set /p new_base_url="璇疯緭鍏ユ柊鐨?BASE_URL: "
if "!new_base_url!"=="" (
    echo 杈撳叆涓虹┖锛屾搷浣滃彇娑堛€?
    goto :end
)
setx ANTHROPIC_BASE_URL "!new_base_url!" 2>CON
echo ANTHROPIC_BASE_URL 宸茶缃负: !new_base_url!
goto :end

:manual_auth_token
echo.
set /p new_auth_token="璇疯緭鍏ユ柊鐨?AUTH_TOKEN: "
if "!new_auth_token!"=="" (
    echo 杈撳叆涓虹┖锛屾搷浣滃彇娑堛€?
    goto :end
)
setx ANTHROPIC_AUTH_TOKEN "!new_auth_token!" 2>CON
echo ANTHROPIC_AUTH_TOKEN 宸茶缃畬鎴?(宸查殣钘忔樉绀?
goto :end

:choose_token
echo.
:: 鍑嗗閬斀鏄剧ず锛堝彇鍓?8 涓瓧绗︿綔涓虹ず渚嬶級
set "MASK1="
set "MASK2="
set "MASK3="
set "MASK4="
set "MASK5="
if defined PRESET_TOKEN_1 set "MASK1=!PRESET_TOKEN_1:~0,8!"
if defined PRESET_TOKEN_2 set "MASK2=!PRESET_TOKEN_2:~0,8!"
if defined PRESET_TOKEN_3 set "MASK3=!PRESET_TOKEN_3:~0,8!"
if defined PRESET_TOKEN_4 set "MASK4=!PRESET_TOKEN_4:~0,8!"
if defined PRESET_TOKEN_5 set "MASK5=!PRESET_TOKEN_5:~0,8!"

echo ========== AUTH_TOKEN 棰勮鍒楄〃 ==========
if not "%PRESET_NAME_1%"=="" (
    echo 1. %PRESET_NAME_1% - !MASK1!... 
) else (
    if defined PRESET_TOKEN_1 (
        echo 1. (鏈懡鍚? - !MASK1!... 
    ) else (
        echo 1. (绌?
    )
)
if not "%PRESET_NAME_2%"=="" (
    echo 2. %PRESET_NAME_2% - !MASK2!... 
) else (
    if defined PRESET_TOKEN_2 (
        echo 2. (鏈懡鍚? - !MASK2!... 
    ) else (
        echo 2. (绌?
    )
)
if not "%PRESET_NAME_3%"=="" (
    echo 3. %PRESET_NAME_3% - !MASK3!... 
) else (
    if defined PRESET_TOKEN_3 (
        echo 3. (鏈懡鍚? - !MASK3!... 
    ) else (
        echo 3. (绌?
    )
)
if not "%PRESET_NAME_4%"=="" (
    echo 4. %PRESET_NAME_4% - !MASK4!... 
) else (
    if defined PRESET_TOKEN_4 (
        echo 4. (鏈懡鍚? - !MASK4!... 
    ) else (
        echo 4. (绌?
    )
)
if not "%PRESET_NAME_5%"=="" (
    echo 5. %PRESET_NAME_5% - !MASK5!... 
) else (
    if defined PRESET_TOKEN_5 (
        echo 5. (鏈懡鍚? - !MASK5!... 
    ) else (
        echo 5. (绌?
    )
)

echo 6. 鎵嬪姩杈撳叆鏂?AUTH_TOKEN
echo 0. 杩斿洖涓昏彍鍗?
echo.
set /p tchoice="璇烽€夋嫨瑕佸簲鐢ㄧ殑 token (0-6): "

if "%tchoice%"=="0" goto :end
if "%tchoice%"=="6" goto :manual_auth_token

if "%tchoice%"=="1" set "SELECTED_TOKEN=%PRESET_TOKEN_1%"
if "%tchoice%"=="2" set "SELECTED_TOKEN=%PRESET_TOKEN_2%"
if "%tchoice%"=="3" set "SELECTED_TOKEN=%PRESET_TOKEN_3%"
if "%tchoice%"=="4" set "SELECTED_TOKEN=%PRESET_TOKEN_4%"
if "%tchoice%"=="5" set "SELECTED_TOKEN=%PRESET_TOKEN_5%"

:: 濡傛灉閫夋嫨鐨勯璁句负绌烘垨鏈畾涔夛紝鍒欐彁绀鸿緭鍏?
if "!SELECTED_TOKEN!"=="" (
        echo 閫夊畾鐨勯璁句负绌烘垨鏈厤缃紝璇疯緭鍏?AUTH_TOKEN:
        set /p user_token="AUTH_TOKEN: "
        if "!user_token!"=="" (
                echo 杈撳叆涓虹┖锛屾搷浣滃彇娑堛€?
                goto :end
        )
        set "SELECTED_TOKEN=!user_token!"
)

:: 搴旂敤閫夋嫨鐨?token锛堝啓鍏ョ敤鎴风幆澧冨彉閲忥級
setx ANTHROPIC_AUTH_TOKEN "!SELECTED_TOKEN!" 2>CON
echo ANTHROPIC_AUTH_TOKEN 宸茶缃负: !SELECTED_TOKEN:~0,8!... 
echo 娉ㄦ剰: 鐜鍙橀噺宸叉案涔呰缃紝闇€瑕侀噸鏂版墦寮€缁堢鎵嶈兘鐢熸晥銆?
goto :end

:clear_vars
echo 娓呴櫎鐜鍙橀噺...
setx ANTHROPIC_BASE_URL "" 2>CON
setx ANTHROPIC_AUTH_TOKEN "" 2>CON
echo 鐜鍙橀噺宸叉竻闄ゃ€?
goto :end

:show_configs
echo.
echo 鎵€鏈夊彲鐢ㄩ厤缃?
echo.
powershell -Command "$json = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $json.configs.PSObject.Properties | ForEach-Object { Write-Host \"[$($_.Name)] $($_.Value.name)\" -ForegroundColor Yellow; Write-Host \"  BASE_URL: $($_.Value.base_url)\" -ForegroundColor Cyan; Write-Host \"  AUTH_TOKEN: $($_.Value.auth_token.Substring(0,[Math]::Min(20,$_.Value.auth_token.Length)))...\" -ForegroundColor Green; Write-Host \"\" }"
echo.
echo 褰撳墠 AUTH_TOKEN 棰勮:
echo 1: %PRESET_TOKEN_1%
echo 2: %PRESET_TOKEN_2%
echo 3: %PRESET_TOKEN_3%
echo 4: %PRESET_TOKEN_4%
echo 5: %PRESET_TOKEN_5%
goto :end

:edit_config
echo 姝ｅ湪鎵撳紑閰嶇疆鏂囦欢杩涜缂栬緫...
start notepad "%CONFIG_FILE%"
echo 閰嶇疆鏂囦欢宸叉墦寮€锛岀紪杈戝畬鎴愬悗璇烽噸鏂拌繍琛屾鑴氭湰銆?
goto :end

:invalid_choice
echo 鏃犳晥閫夋嫨锛岃閲嶆柊杈撳叆銆?
echo.
goto :end

:end
echo.
echo 鎿嶄綔瀹屾垚銆?
pause

:exit
echo 閫€鍑虹▼搴忋€?
exit /b 0

:return
goto :end
