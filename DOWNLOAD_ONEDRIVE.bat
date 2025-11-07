@echo off
REM OneDrive Setup 下载器 (D-113 v2)
REM 使用多种方法下载最新的OneDriveSetup.exe

setlocal enabledelayedexpansion
title OneDrive Setup Downloader - D-113 v2

echo ============================================
echo  OneDrive Setup Downloader (D-113 v2)
echo ============================================
echo.

set "DOWNLOAD_DIR=E:\Downloads"
set "SETUP_EXE=%DOWNLOAD_DIR%\OneDriveSetup_NEW.exe"
set "SETUP_EXE_OLD=%DOWNLOAD_DIR%\OneDriveSetup.exe"

REM 备份旧文件
if exist "%SETUP_EXE_OLD%" (
    echo [1] Backing up old OneDriveSetup.exe...
    move /y "%SETUP_EXE_OLD%" "%SETUP_EXE_OLD%.bak" 2>CON
    echo ✓ Backup saved as OneDriveSetup.exe.bak
)

echo.
echo [2] Downloading OneDriveSetup.exe...
echo    Target: %SETUP_EXE%
echo.

REM 方法1：使用curl（如果系统有curl的话）
where curl >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Using curl...
    curl -L -o "%SETUP_EXE%" "https://go.microsoft.com/fwlink/p/?LinkID=248256" 2>CON
    if %errorlevel% equ 0 (
        echo ✓ Download with curl successful
        goto verify
    )
)

REM 方法2：使用bitsadmin
echo ✓ Trying bitsadmin...
bitsadmin /create OneDriveDownload 2>CON
bitsadmin /resume OneDriveDownload 2>CON
bitsadmin /transfer OneDriveDownload /download /priority foreground "https://go.microsoft.com/fwlink/p/?LinkID=248256" "%SETUP_EXE%" 2>CON

if %errorlevel% equ 0 (
    echo ✓ Download with bitsadmin successful
    bitsadmin /complete OneDriveDownload 2>CON
    goto verify
)

REM 方法3：使用VBScript下载
echo ✓ Using VBScript downloader...
(
echo Set objXMLHTTP = CreateObject("MSXML2.XMLHTTP")
echo objXMLHTTP.open "GET", "https://go.microsoft.com/fwlink/p/?LinkID=248256", false
echo objXMLHTTP.send()
echo Set objADOStream = CreateObject("ADODB.Stream")
echo objADOStream.Type = 1
echo objADOStream.Open()
echo objADOStream.Write objXMLHTTP.ResponseBody
echo objADOStream.SaveToFile "%SETUP_EXE%"
echo objADOStream.Close()
) > "%TEMP%\download_onedrive.vbs"

cscript.exe "%TEMP%\download_onedrive.vbs" 2>CON
del /f /q "%TEMP%\download_onedrive.vbs" 2>CON

:verify
echo.
echo [3] Verifying download...

if exist "%SETUP_EXE%" (
    for /f "tokens=5" %%A in ('dir "%SETUP_EXE%" ^| findstr "OneDrive"') do set SIZE=%%A
    echo ✓ File downloaded successfully
    echo   Size: !SIZE! bytes

    if !SIZE! gtr 1000000 (
        echo ✓ File size looks good (>1MB)
    ) else (
        echo ❌ File size suspicious (<%1MB) - may be corrupted
    )
) else (
    echo ❌ Download failed
    echo.
    echo Troubleshooting:
    echo 1. Check internet connection
    echo 2. Check firewall settings
    echo 3. Try downloading manually:
    echo    https://www.microsoft.com/en-us/microsoft-365/onedrive/download
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo 接下来步骤:
echo ============================================
echo.
echo 1. 关闭此窗口
echo 2. 运行: INSTALL_ONEDRIVE.bat
echo.
pause
