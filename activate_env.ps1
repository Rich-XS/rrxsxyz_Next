# PowerShell启动脚本 - 自动激活虚拟环境
# 检查是否在项目根目录
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "检测到虚拟环境，正在激活..." -ForegroundColor Green
    & ".venv\Scripts\Activate.ps1"
    Write-Host "虚拟环境已激活: $env:VIRTUAL_ENV" -ForegroundColor Yellow
} else {
    Write-Host "未检测到虚拟环境" -ForegroundColor Red
}

# 显示Python版本和路径
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonVersion = python --version
    $pythonPath = python -c "import sys; print(sys.executable)"
    Write-Host "Python版本: $pythonVersion" -ForegroundColor Cyan
    Write-Host "Python路径: $pythonPath" -ForegroundColor Cyan
}

# 设置工作目录为项目根目录
Set-Location (Split-Path $MyInvocation.MyCommand.Path)