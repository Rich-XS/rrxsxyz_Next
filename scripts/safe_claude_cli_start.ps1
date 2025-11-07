# safe_claude_cli_start.ps1
# 安全的Claude CLI启动脚本
# 用途：启动Claude CLI前自动清理旧进程，防止循环累积

param(
    [string]$WorkDir = "D:\_100W\rrxsxyz_next",
    [switch]$DryRun = $false  # 仅检查，不实际清理
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $color = @{
        "INFO" = "White"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }[$Type]
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

Write-Status "===== Safe Claude CLI Starter ====="

# Step 1: 检查旧进程
Write-Status "步骤1: 检查是否有旧的Claude CLI进程..."
$oldProcesses = Get-Process | Where-Object {
    $_.ProcessName -eq "node" -and
    (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine -like "*claude-code*"
}

if ($oldProcesses) {
    Write-Status "发现 $($oldProcesses.Count) 个旧进程" "WARNING"
    foreach ($proc in $oldProcesses) {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($proc.Id)").CommandLine
        Write-Status "  PID: $($proc.Id) | 运行时间: $($proc.StartTime)" "WARNING"
        Write-Status "  命令行: $cmdLine" "WARNING"
    }

    if (-not $DryRun) {
        Write-Status "清理旧进程..." "WARNING"
        $oldProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Status "旧进程已清理" "SUCCESS"
    } else {
        Write-Status "DryRun模式：跳过清理" "INFO"
    }
} else {
    Write-Status "未发现旧进程" "SUCCESS"
}

# Step 2: 禁止使用危险参数
Write-Status "步骤2: 安全检查..."
Write-Status "⚠️ 注意：绝对禁止使用 --dangerously-skip-permissions 参数！" "ERROR"
Write-Status "推荐使用方式: claude-code（无额外参数）" "INFO"

# Step 3: 启动新进程（可选）
if (-not $DryRun) {
    Write-Status "步骤3: 启动Claude CLI..."
    Write-Status "请在当前目录手动运行: claude-code" "INFO"
    Write-Status "工作目录: $WorkDir" "INFO"
} else {
    Write-Status "DryRun模式：跳过启动" "INFO"
}

Write-Status "===== 完成 =====" "SUCCESS"
Write-Status "提示：如需监控Claude CLI运行状态，请运行: powershell -File scripts\monitor_claude_cli.ps1" "INFO"
