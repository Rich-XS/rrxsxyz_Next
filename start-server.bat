@echo off
echo Starting local HTTP server...
echo Make sure Python is installed
echo.
cd /d "D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\100W\rrxs.xyz Next\html\projects"
echo Current directory: %CD%
echo.
echo Starting Python HTTP server on port 8080...
python -m http.server 8080
echo.
echo Server started!
echo Please visit: http://localhost:8080/media-assessment-v4.html
echo Press any key to close...
pause