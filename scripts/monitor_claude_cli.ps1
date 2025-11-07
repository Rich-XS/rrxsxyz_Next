# monitor_claude_cli.ps1
# Claude CLI 循环监控脚本
# 用途：检测并报警Claude CLI异常循环，防止资源耗尽

param(
    [int]$ThresholdMinutes = 5,  # Code.exe创建频率阈值（分钟）
    [int]$ThresholdCount = 10,   # 阈值时间内Code.exe创建数量
    [string]$LogFile = "D:\_100W\rrxsxyz_next\INCIDENT\claude_cli_monitor.log"
)

$ErrorActionPreference = "SilentlyContinue"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

Write-Log "===== Claude CLI Monitor Started ====="

# 检查是否有Claude CLI进程在运行
function Check-ClaudeCLI {
    $claudeProcesses = Get-Process | Where-Object {
        $_.ProcessName -eq "node" -and
        (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine -like "*claude-code*"
    }

    if ($claudeProcesses) {
        Write-Log "⚠️ 发现Claude CLI进程:"
        foreach ($proc in $claudeProcesses) {
            $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($proc.Id)").CommandLine
            Write-Log "  PID: $($proc.Id) | CMD: $cmdLine"

            # 检查是否使用危险参数
            if ($cmdLine -like "*--dangerously-skip-permissions*") {
                Write-Log "  🔴 警告：发现危险参数 --dangerously-skip-permissions！"
            }
        }
        return $true
    }
    return $false
}

# 检查Code.exe创建频率（从code_creation.log）
function Check-CodeCreationRate {
    $logPath = "D:\_100W\rrxsxyz_next\INCIDENT\code_creation.log"
    if (-not (Test-Path $logPath)) {
        Write-Log "code_creation.log 不存在，跳过频率检查"
        return $false
    }

    $now = Get-Date
    $threshold = $now.AddMinutes(-$ThresholdMinutes)

    $recentCreations = Get-Content $logPath -Tail 100 | Where-Object {
        if ($_ -match "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})") {
            $timestamp = [DateTime]::ParseExact($matches[1], "yyyy-MM-dd HH:mm:ss", $null)
            $timestamp -gt $threshold
        }
    }

    $count = ($recentCreations | Measure-Object).Count
    Write-Log "最近 $ThresholdMinutes 分钟内创建了 $count 个Code.exe进程"

    if ($count -gt $ThresholdCount) {
        Write-Log "🔴 警告：Code.exe创建频率异常！超过阈值 $ThresholdCount"
        return $true
    }
    return $false
}

# 主检查逻辑
$hasClaudeCLI = Check-ClaudeCLI
$highFrequency = Check-CodeCreationRate

if ($hasClaudeCLI -or $highFrequency) {
    Write-Log "🚨 检测到异常！建议手动检查："
    Write-Log "  1. 运行: tasklist | findstr node.exe"
    Write-Log "  2. 检查: D:\_100W\rrxsxyz_next\INCIDENT\code_creation.log"
    Write-Log "  3. 如需清理: taskkill /F /IM node.exe"
} else {
    Write-Log "✅ 系统正常，无异常检测到"
}

Write-Log "===== Claude CLI Monitor Finished ====="
