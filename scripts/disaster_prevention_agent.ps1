# 灾难预防Agent - 文件系统监控
# 关联决策: D-102, D-106, D-104
# 执行频率: 每小时（通过Windows任务计划）

param(
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next"
$logFile = "$projectRoot\logs\disaster_prevention.log"

# 创建日志目录
if (-not (Test-Path "$projectRoot\logs")) {
    New-Item -ItemType Directory -Path "$projectRoot\logs" -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

# [1] NUL文件检查
Write-Log "=== 开始灾难预防检查 ===" "INFO"
$nulFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "nul" -ErrorAction SilentlyContinue
$nulCount = ($nulFiles | Measure-Object).Count

if ($nulCount -gt 10) {
    Write-Log "🔴 CRITICAL: 检测到 $nulCount 个NUL文件（阈值>10）" "ERROR"
    if ($AutoFix) {
        Write-Log "启动自动清理..." "INFO"
        & "$projectRoot\scripts\force_cleanup_nul.ps1"
    }
} elseif ($nulCount -gt 0) {
    Write-Log "🟡 WARNING: 检测到 $nulCount 个NUL文件" "WARN"
} else {
    Write-Log "✅ NUL文件检查通过（0个）" "INFO"
}

# [2] Claude配置大小检查
$claudePath = "C:\Users\Richard\.claude"
if (Test-Path $claudePath) {
    $size = (Get-ChildItem -Path $claudePath -Recurse -ErrorAction SilentlyContinue |
             Measure-Object -Property Length -Sum).Sum / 1MB

    if ($size -gt 800) {
        Write-Log "🔴 CRITICAL: Claude配置 $([math]::Round($size, 2)) MB (阈值>800MB)" "ERROR"
        if ($AutoFix) {
            Write-Log "启动自动清理..." "INFO"
            & "$projectRoot\scripts\safe_claude_cleanup.ps1"
        }
    } elseif ($size -gt 500) {
        Write-Log "🟡 WARNING: Claude配置 $([math]::Round($size, 2)) MB (建议清理)" "WARN"
    } else {
        Write-Log "✅ Claude配置检查通过 ($([math]::Round($size, 2)) MB)" "INFO"
    }
}

# [3] OneDrive同步文件数检查（如果OneDrive运行中）
$oneDrivePath = "D:\OneDrive_New\_AIGPT\_100W_New"
if (Test-Path $oneDrivePath) {
    $fileCount = (Get-ChildItem -Path $oneDrivePath -Recurse -File -ErrorAction SilentlyContinue |
                  Measure-Object).Count

    if ($fileCount -gt 300000) {
        Write-Log "🟡 WARNING: OneDrive同步文件数 $fileCount (阈值>300k)" "WARN"
        Write-Log "建议更新排除规则: .onedrive\.excludefiles" "WARN"
    } else {
        Write-Log "✅ OneDrive文件数检查通过 ($fileCount)" "INFO"
    }
}

Write-Log "=== 灾难预防检查完成 ===" "INFO"

# 返回状态码
if ($nulCount -gt 10 -or $size -gt 800) {
    exit 1  # CRITICAL
} elseif ($nulCount -gt 0 -or $size -gt 500 -or $fileCount -gt 300000) {
    exit 2  # WARNING
} else {
    exit 0  # OK
}
