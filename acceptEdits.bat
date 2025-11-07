@echo off
REM Usage: acceptEdits FULL   OR   acceptEdits STATUS
SETLOCAL
if "%1"=="" (
    echo Missing argument. Usage: acceptEdits [ON|OFF|FULL|STATUS]
    exit /b 1
)
node "%~dp0\.claude\acceptEdits-cli.js" %1
ENDLOCAL
