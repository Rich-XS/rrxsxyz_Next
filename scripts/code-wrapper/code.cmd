@echo off
REM wrapper to log invocations and return success
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0code.ps1" %*
exit /B 0
