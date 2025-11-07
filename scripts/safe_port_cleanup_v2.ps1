# ============================================
# 安全端口清理工具 v2.0 (Safe Port Cleanup Tool)
# D-68 + D-80 决策：跨项目端口保护 + 端口检查集成
# ============================================
#
# 规则：
# 1. 仅清理本项目端口段的进程
# 2. 发现其他项目进程时，警告但不清理
# 3. 通过工作目录和端口段识别进程所属项目
# 4. 支持仅检查模式（不清理）
#
# 使用方法：
#   1. 完整清理模式（默认）：
#      powershell -ExecutionPolicy Bypass -File safe_port_cleanup.ps1
#
#   2. 仅检查端口（不清理）：
#      powershell -ExecutionPolicy Bypass -File safe_port_cleanup.ps1 -CheckOnly
#
#   3. 指定项目：
#      powershell -ExecutionPolicy Bypass -File safe_port_cleanup.ps1 -ProjectName "rrxsxyz_next"
#
#   4. 检查特定端口：
#      powershell -ExecutionPolicy Bypass -File safe_port_cleanup.ps1 -CheckPorts 3001,8080
# ============================================

param(
    [string]$ProjectName = "rrxsxyz_next",
    [switch]$CheckOnly,
    [int[]]$CheckPorts = @()
)

# 项目端口段定义（D-65 决策）
$projectPortRanges = @{
    "rrxsxyz_next" = @{
        Name = "rrxsxyz_next (多魔汰)"
        Ports = @(3000..3999) + @(8000..8999)
        PathPattern = "rrxsxyz_next"
        DefaultPorts = @(3001, 8080)  # 新增：默认端口
    }
    "AnyRouter_Refresh" = @{
        Name = "AnyRouter_Refresh (ARB)"
        Ports = 6000..6999
        PathPattern = "AnyRouter_Refresh"
        DefaultPorts = @(6000)
    }
    "mx_kc_gl" = @{
        Name = "mx_kc_gl"
        Ports = 7000..7999
        PathPattern = "mx_kc_gl"
        DefaultPorts = @(7000)
    }
}

# ============================================
# 功能 1: 端口检查函数（D-80 新增）
# ============================================
function Check-PortStatus {
    param(
        [int[]]$Ports
    )

    Write-Host ""
    Write-Host "【端口状态检查】D-80" -ForegroundColor Cyan
    Write-Host ""

    $portStatus = @()

    foreach ($port in $Ports) {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

        if ($conn) {
            $pid = $conn.OwningProcess
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue

            if ($proc) {
                $processInfo = Get-WmiObject Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue
                $commandLine = $processInfo.CommandLine
                $memoryMB = [math]::Round($proc.WorkingSet64/1MB, 2)

                # 判断进程所属项目
                $belongsTo = "Unknown"
                foreach ($projName in $projectPortRanges.Keys) {
                    $pattern = $projectPortRanges[$projName].PathPattern
                    if ($commandLine -match $pattern) {
                        $belongsTo = $projName
                        break
                    }
                }

                # 通过端口段判断
                if ($belongsTo -eq "Unknown") {
                    foreach ($projName in $projectPortRanges.Keys) {
                        if ($projectPortRanges[$projName].Ports -contains $port) {
                            $belongsTo = $projName
                            break
                        }
                    }
                }

                $portStatus += @{
                    Port = $port
                    Status = "占用"
                    PID = $pid
                    ProcessName = $proc.ProcessName
                    Memory = $memoryMB
                    BelongsTo = $belongsTo
                    CommandLine = $commandLine
                }

                Write-Host "  端口 $port: " -NoNewline
                Write-Host "❌ 被占用" -ForegroundColor Red
                Write-Host "    进程: $($proc.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                Write-Host "    内存: $($memoryMB) MB" -ForegroundColor Gray
                if ($belongsTo -ne "Unknown") {
                    $projName = $projectPortRanges[$belongsTo].Name
                    Write-Host "    项目: $projName" -ForegroundColor Cyan
                }
                if ($commandLine -and $commandLine.Length -gt 0) {
                    $cmdShort = $commandLine.Substring(0, [Math]::Min(80, $commandLine.Length))
                    Write-Host "    命令: $cmdShort..." -ForegroundColor DarkGray
                }
            } else {
                Write-Host "  端口 $port: " -NoNewline
                Write-Host "❌ 被占用" -ForegroundColor Red
                Write-Host "    进程 PID: $pid (进程信息获取失败)" -ForegroundColor Yellow
            }
        } else {
            $portStatus += @{
                Port = $port
                Status = "空闲"
            }
            Write-Host "  端口 $port: " -NoNewline
            Write-Host "✅ 空闲" -ForegroundColor Green
        }
        Write-Host ""
    }

    return $portStatus
}

# ============================================
# 主程序开始
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
if ($CheckOnly) {
    Write-Host "  安全端口检查工具 (D-80) - 仅检查模式" -ForegroundColor Cyan
} else {
    Write-Host "  安全端口清理工具 (D-68 + D-80)" -ForegroundColor Cyan
}
Write-Host "  当前项目: $($projectPortRanges[$ProjectName].Name)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前项目配置
$currentProject = $projectPortRanges[$ProjectName]
if (-not $currentProject) {
    Write-Host "错误: 未知项目 '$ProjectName'" -ForegroundColor Red
    exit 1
}

# ============================================
# 模式 1: 仅检查端口（-CheckOnly 或 -CheckPorts）
# ============================================
if ($CheckOnly -or $CheckPorts.Count -gt 0) {
    if ($CheckPorts.Count -eq 0) {
        # 如果未指定端口，检查项目默认端口
        $CheckPorts = $currentProject.DefaultPorts
    }

    $portStatus = Check-PortStatus -Ports $CheckPorts

    # 汇总结果
    $busyPorts = $portStatus | Where-Object { $_.Status -eq "占用" }
    $freePorts = $portStatus | Where-Object { $_.Status -eq "空闲" }

    Write-Host "【检查汇总】" -ForegroundColor Cyan
    Write-Host "  空闲端口: $($freePorts.Count) 个" -ForegroundColor Green
    Write-Host "  占用端口: $($busyPorts.Count) 个" -ForegroundColor Red
    Write-Host ""

    if ($busyPorts.Count -gt 0) {
        Write-Host "【建议操作】" -ForegroundColor Yellow
        Write-Host "  1. 如需清理本项目进程，重新运行脚本（不使用 -CheckOnly）" -ForegroundColor Yellow
        Write-Host "  2. 如需清理其他项目进程，请在对应项目中运行清理脚本" -ForegroundColor Yellow
        Write-Host "  3. 如需强制清理（不推荐），手动使用: taskkill /PID [PID] /F" -ForegroundColor Yellow
    } else {
        Write-Host "✅ 所有检查端口均空闲，可以启动服务！" -ForegroundColor Green
    }

    exit 0
}

# ============================================
# 模式 2: 完整清理模式（默认）
# ============================================

Write-Host "【本项目端口段】" -ForegroundColor Yellow
$portRangeStr = if ($currentProject.Ports.Count -gt 100) {
    "$($currentProject.Ports[0])-$($currentProject.Ports[-1])"
} else {
    $currentProject.Ports -join ", "
}
Write-Host "  $portRangeStr" -ForegroundColor Yellow
Write-Host "  默认端口: $($currentProject.DefaultPorts -join ', ')" -ForegroundColor Yellow
Write-Host ""

# 先检查默认端口状态
Write-Host "【快速端口检查】" -ForegroundColor Cyan
$quickCheck = Check-PortStatus -Ports $currentProject.DefaultPorts

# 获取所有LISTENING状态的TCP连接
Write-Host "【正在扫描所有端口和进程】" -ForegroundColor Cyan
$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -lt 10000}

# 创建端口到PID的映射
$portToPid = @{}
foreach ($conn in $connections) {
    $port = $conn.LocalPort
    $pid = $conn.OwningProcess
    if (-not $portToPid.ContainsKey($pid)) {
        $portToPid[$pid] = @()
    }
    $portToPid[$pid] += $port
}

# 获取所有Node进程和Python进程
$allNodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
$allPythonProcs = Get-Process -Name python -ErrorAction SilentlyContinue
$allProcs = $allNodeProcs + $allPythonProcs

if ($allProcs.Count -eq 0) {
    Write-Host "  未发现 Node.exe 或 Python.exe 进程" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ 环境干净，可以启动服务！" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "【进程分析】(Node.exe + Python.exe)" -ForegroundColor Cyan

$ownProcesses = @()      # 本项目的进程
$otherProcesses = @()    # 其他项目的进程
$unknownProcesses = @()  # 无法识别的进程

foreach ($proc in $allProcs) {
    $pid = $proc.Id
    $memoryMB = [math]::Round($proc.WorkingSet64/1MB, 2)

    # 尝试获取进程的工作目录
    $processInfo = Get-WmiObject Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue
    $commandLine = $processInfo.CommandLine
    $workingDir = $processInfo.ExecutablePath

    # 判断进程所属项目
    $belongsTo = "Unknown"
    foreach ($projName in $projectPortRanges.Keys) {
        $pattern = $projectPortRanges[$projName].PathPattern
        if ($commandLine -match $pattern -or $workingDir -match $pattern) {
            $belongsTo = $projName
            break
        }
    }

    # 如果通过路径无法识别，尝试通过端口判断
    if ($belongsTo -eq "Unknown" -and $portToPid.ContainsKey($pid)) {
        $ports = $portToPid[$pid]
        foreach ($port in $ports) {
            foreach ($projName in $projectPortRanges.Keys) {
                if ($projectPortRanges[$projName].Ports -contains $port) {
                    $belongsTo = $projName
                    break
                }
            }
            if ($belongsTo -ne "Unknown") { break }
        }
    }

    $processObj = @{
        PID = $pid
        ProcessName = $proc.ProcessName
        Memory = $memoryMB
        Ports = if ($portToPid.ContainsKey($pid)) { $portToPid[$pid] } else { @() }
        BelongsTo = $belongsTo
        CommandLine = $commandLine
    }

    if ($belongsTo -eq $ProjectName) {
        $ownProcesses += $processObj
    } elseif ($belongsTo -ne "Unknown") {
        $otherProcesses += $processObj
    } else {
        $unknownProcesses += $processObj
    }
}

# 显示本项目的进程
if ($ownProcesses.Count -gt 0) {
    Write-Host ""
    Write-Host "【本项目进程 - 将清理】" -ForegroundColor Red
    foreach ($p in $ownProcesses) {
        $portsStr = if ($p.Ports.Count -gt 0) { "端口 $($p.Ports -join ', ')" } else { "无监听端口" }
        Write-Host "  [$($p.ProcessName)] PID $($p.PID) ($portsStr) - 内存 $($p.Memory)MB" -ForegroundColor Red
    }
}

# 显示其他项目的进程（警告不清理）
if ($otherProcesses.Count -gt 0) {
    Write-Host ""
    Write-Host "【其他项目进程 - 仅警告，不清理】D-68保护" -ForegroundColor Yellow
    foreach ($p in $otherProcesses) {
        $portsStr = if ($p.Ports.Count -gt 0) { "端口 $($p.Ports -join ', ')" } else { "无监听端口" }
        $projName = $projectPortRanges[$p.BelongsTo].Name
        Write-Host "  [$($p.ProcessName)] PID $($p.PID) [$projName] ($portsStr) - 内存 $($p.Memory)MB" -ForegroundColor Yellow
    }
}

# 显示无法识别的进程
if ($unknownProcesses.Count -gt 0) {
    Write-Host ""
    Write-Host "【无法识别的进程 - 不清理】" -ForegroundColor Magenta
    foreach ($p in $unknownProcesses) {
        $portsStr = if ($p.Ports.Count -gt 0) { "端口 $($p.Ports -join ', ')" } else { "无监听端口" }
        Write-Host "  [$($p.ProcessName)] PID $($p.PID) ($portsStr) - 内存 $($p.Memory)MB" -ForegroundColor Magenta
        if ($p.CommandLine) {
            Write-Host "     命令: $($p.CommandLine.Substring(0, [Math]::Min(100, $p.CommandLine.Length)))..." -ForegroundColor DarkGray
        }
    }
}

# 汇总
Write-Host ""
Write-Host "【清理计划】" -ForegroundColor Cyan
Write-Host "  本项目进程: $($ownProcesses.Count) 个 (将清理)" -ForegroundColor Red
Write-Host "  其他项目进程: $($otherProcesses.Count) 个 (D-68保护)" -ForegroundColor Green
Write-Host "  无法识别进程: $($unknownProcesses.Count) 个 (保护)" -ForegroundColor Yellow

if ($ownProcesses.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ 无需清理本项目进程" -ForegroundColor Green
    if ($otherProcesses.Count -gt 0 -or $unknownProcesses.Count -gt 0) {
        Write-Host "✅ 发现其他项目/未知进程正在运行，已自动保护（D-68规则）" -ForegroundColor Yellow
    }
    exit 0
}

# 确认清理
Write-Host ""
Write-Host "即将清理 $($ownProcesses.Count) 个本项目进程" -ForegroundColor Yellow
Write-Host "按 [Y] 确认清理, 按其他键取消..." -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "❌ 已取消清理" -ForegroundColor Yellow
    exit 0
}

# 执行清理
Write-Host ""
Write-Host "【开始清理】" -ForegroundColor Cyan
$successCount = 0
$failCount = 0

foreach ($p in $ownProcesses) {
    try {
        Stop-Process -Id $p.PID -Force -ErrorAction Stop
        Write-Host "  ✅ 已清理 [$($p.ProcessName)] PID $($p.PID)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "  ❌ 清理失败 [$($p.ProcessName)] PID $($p.PID) - $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

# 验证结果
Write-Host ""
Write-Host "【清理结果】" -ForegroundColor Cyan
Write-Host "  成功: $successCount 个" -ForegroundColor Green
Write-Host "  失败: $failCount 个" -ForegroundColor Red

Start-Sleep -Seconds 1

$remainingOwn = @()
foreach ($p in $ownProcesses) {
    $stillExists = Get-Process -Id $p.PID -ErrorAction SilentlyContinue
    if ($stillExists) {
        $remainingOwn += $p.PID
    }
}

if ($remainingOwn.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  警告 - 以下进程清理失败，仍在运行" -ForegroundColor Yellow
    foreach ($pid in $remainingOwn) {
        Write-Host "  PID $pid" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "✅ 本项目进程清理完成" -ForegroundColor Green
}

# 显示保护的进程仍在运行
if ($otherProcesses.Count -gt 0) {
    Write-Host ""
    Write-Host "✅ 其他项目进程已保护，仍在运行（D-68规则）" -ForegroundColor Green
    foreach ($p in $otherProcesses) {
        $projName = $projectPortRanges[$p.BelongsTo].Name
        Write-Host "  PID $($p.PID) [$projName]" -ForegroundColor Green
    }
}

# 最终端口检查
Write-Host ""
Write-Host "【最终端口检查】" -ForegroundColor Cyan
$finalCheck = Check-PortStatus -Ports $currentProject.DefaultPorts

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  清理完成 - D-68 跨项目保护已生效" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
