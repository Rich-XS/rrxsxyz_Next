@echo off
echo 正在启动带虚拟环境的PowerShell...
cd /d "%~dp0"
if exist ".venv\Scripts\Activate.ps1" (
    echo 检测到虚拟环境，正在激活...
    powershell -NoExit -Command "& '.venv\Scripts\Activate.ps1'; Write-Host '虚拟环境已激活' -ForegroundColor Green"
) else (
    echo 未检测到虚拟环境，启动普通PowerShell...
    powershell -NoExit
)