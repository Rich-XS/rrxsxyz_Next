# AcceptEdits PowerShell 函数
# 添加到 PowerShell Profile 中，使 acceptEdits 命令全局可用

function acceptEdits {
    param(
        [Parameter(Position=0)]
        [string]$Command = "STATUS"
    )
    
    $scriptPath = Join-Path $PWD "acceptEdits.bat"
    
    if (Test-Path $scriptPath) {
        & $scriptPath $Command
    } else {
        Write-Host "错误: acceptEdits.bat 文件不存在于当前目录" -ForegroundColor Red
        Write-Host "请确保您在项目根目录中运行此命令" -ForegroundColor Yellow
    }
}

# 导出函数以便在 PowerShell 会话中使用
Export-ModuleMember -Function acceptEdits