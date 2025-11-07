@echo off
echo Resetting OneDrive...
"%LOCALAPPDATA%\Microsoft\OneDrive\OneDrive.exe" /reset
timeout /t 5
echo Starting OneDrive...
"%LOCALAPPDATA%\Microsoft\OneDrive\OneDrive.exe"
echo OneDrive reset complete.
pause