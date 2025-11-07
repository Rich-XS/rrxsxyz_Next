# Monitor VSCode Auto-Launch
# 监控VSCode自动启动，记录启动时间、父进程、命令行参数

$logFile = "D:\_100W\rrxsxyz_next\vscode_launch_monitor.log"
$checkInterval = 5  # 每5秒检查一次

Write-Host "🔍 开始监控VSCode自动启动..." -ForegroundColor Yellow
Write-Host "日志文件: $logFile" -ForegroundColor Cyan

while ($true) {
    $codeProcesses = Get-Process -Name Code* -ErrorAction SilentlyContinue

    if ($codeProcesses) {
        foreach ($proc in $codeProcesses) {
            try {
                $procInfo = Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue

                if ($procInfo) {
                    $parentPID = $procInfo.ParentProcessId
                    $parentProcess = Get-Process -Id $parentPID -ErrorAction SilentlyContinue
                    $commandLine = $procInfo.CommandLine

                    $logEntry = @"
[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] VSCode进程检测
- 进程名: $($proc.ProcessName)
- PID: $($proc.Id)
- 启动时间: $($proc.StartTime)
- 父进程: $($parentProcess.ProcessName) (PID: $parentPID)
- 命令行: $commandLine
- 路径: $($proc.Path)
---
"@
                    Add-Content -Path $logFile -Value $logEntry -Encoding UTF8
                    Write-Host "🚨 检测到VSCode进程: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
                }
            } catch {
                # 忽略错误
            }
        }
    }

    Start-Sleep -Seconds $checkInterval
}
