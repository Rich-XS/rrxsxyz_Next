# Port Conflict Auto-Cleanup Agent
# 集成到启动流程，自动清理端口冲突

param([switch]$AutoCleanup = $true)

$projectPorts = @(3001, 8080, 3000)
$conflictFound = $false

Write-Host "🔍 检查端口占用..." -ForegroundColor Cyan

foreach ($port in $projectPorts) {
    $connections = netstat -ano | findstr ":$port "

    if ($connections) {
        $conflictFound = $true
        Write-Host "⚠️  端口 $port 被占用" -ForegroundColor Yellow

        # 提取PID
        $pids = $connections | ForEach-Object {
            if ($_ -match '\s+(\d+)\s*$') { $Matches[1] }
        } | Select-Object -Unique

        foreach ($pid in $pids) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId=$pid").CommandLine

                # 检查是否为本项目进程
                if ($cmdline -like "*rrxsxyz_next*" -or $cmdline -like "*server*" -or $process.Name -eq "python") {
                    if ($AutoCleanup) {
                        Write-Host "  🗑️  清理本项目旧进程: PID $pid ($($process.Name))" -ForegroundColor Green
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    } else {
                        Write-Host "  ℹ️  本项目进程: PID $pid ($($process.Name))" -ForegroundColor White
                    }
                } else {
                    Write-Host "  🛡️  保护其他项目: PID $pid ($($process.Name))" -ForegroundColor Magenta
                    Write-Host "     命令行: $cmdline" -ForegroundColor Gray
                }
            }
        }
    }
}

if (-not $conflictFound) {
    Write-Host "✅ 所有端口空闲" -ForegroundColor Green
}

# 等待端口释放
Start-Sleep -Seconds 2

# 验证端口已释放
Write-Host "`n🔍 验证端口状态..." -ForegroundColor Cyan
$stillOccupied = @()
foreach ($port in $projectPorts) {
    $check = netstat -ano | findstr ":$port "
    if ($check) {
        $stillOccupied += $port
    }
}

if ($stillOccupied.Count -eq 0) {
    Write-Host "✅ 端口清理成功，可以启动服务" -ForegroundColor Green
    return $true
} else {
    Write-Host "❌ 以下端口仍被占用: $($stillOccupied -join ', ')" -ForegroundColor Red
    Write-Host "   请手动检查或使用: scripts\safe_port_cleanup.ps1" -ForegroundColor Yellow
    return $false
}
