@echo off
REM =====================================================
REM 紧急修复：停止nul文件增长
REM 2025-10-29 03:30 - EMERGENCY FIX
REM =====================================================

echo [1] 停止所有后台服务...
taskkill /F /IM node.exe 2>con
taskkill /F /IM python.exe 2>con
taskkill /F /IM OneDrive.exe 2>con

echo [2] 清理现有nul文件...
powershell -ExecutionPolicy Bypass -File cleanup_nul_files.ps1

echo [3] 修改nodemon配置排除nul...
echo { "ignore": ["nul", "**/nul", "*.zip", "*.log", "*.bak"] } > server\nodemon.json

echo [4] 创建.gitignore规则...
echo nul >> .gitignore
echo **/nul >> .gitignore

echo.
echo ✅ 紧急措施已执行
echo.
echo 下一步：
echo 1. 不要启动OneDrive
echo 2. 运行 chkdsk D: /f
echo 3. 手动检查并删除所有nul文件
pause