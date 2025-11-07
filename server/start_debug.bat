@echo off
REM 使用脚本相对路径自动获取 server 目录
cd /D "%~dp0"
echo Starting Node.js server with debug logging...
node server.js
pause
