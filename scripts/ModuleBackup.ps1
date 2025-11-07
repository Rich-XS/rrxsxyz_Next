# 增强版模块化备份脚本 - 支持模块标签和版本追踪
# Enhanced Module Backup Script with Version Tracking
# 创建时间: 2025-10-17 13:05

param(
    [Parameter(Mandatory=$false)]
    [string]$ModuleTag = "",

    [Parameter(Mandatory=$false)]
    [string]$Description = "",

    [Parameter(Mandatory=$false)]
    [switch]$SkipTest = $false
)

# 基础配置
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
# 使用脚本相对路径自动获取项目根目录
$projectPath = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
$backupRoot = Join-Path (Split-Path -Parent $projectPath) "_backups"

# 根据是否有模块标签决定备份名称
if ($ModuleTag) {
    $backupName = "rrxsxyz_next_${timestamp}_${ModuleTag}"
} else {
    $backupName = "rrxsxyz_next_${timestamp}"
}

$backupPath = Join-Path $backupRoot $backupName
$zipPath = "${backupPath}.zip"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor, $Text) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Host $Text
    $host.UI.RawUI.ForegroundColor = $fc
}

# 显示备份信息
Write-ColorOutput Cyan "========================================="
Write-ColorOutput Cyan "   模块化增量备份系统 v2.0"
Write-ColorOutput Cyan "========================================="
Write-Host ""

if ($ModuleTag) {
    Write-ColorOutput Green "📌 模块标签: $ModuleTag"
}
if ($Description) {
    Write-ColorOutput Green "📝 备份说明: $Description"
}

Write-ColorOutput Yellow "⏰ 时间戳: $timestamp"
Write-ColorOutput Yellow "📁 项目路径: $projectPath"
Write-ColorOutput Yellow "💾 备份名称: $backupName"
Write-Host ""

# 如果不跳过测试，先运行测试
if (-not $SkipTest) {
    Write-ColorOutput Cyan "🧪 运行测试验证..."
    Set-Location $projectPath
    $testResult = npm test 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ 测试通过！"
    } else {
        Write-ColorOutput Red "❌ 测试失败！是否继续备份？(y/n)"
        $continue = Read-Host
        if ($continue -ne 'y') {
            Write-ColorOutput Red "备份已取消"
            exit 1
        }
    }
}

# 排除列表（参考 TaskDone_BackUp_Exclude.ps1）
$excludeList = @(
    "node_modules",
    ".git",
    ".env",
    "*.log",
    "*.tmp",
    "test-screenshots",
    "screenshots",
    "duomotai\screenshots",
    "backups",
    "_backups",
    "*.zip",
    "*.7z",
    "*.rar",
    "dist",
    "build",
    ".cache",
    ".vscode",
    ".idea",
    "*.swp",
    "*.swo",
    "*~",
    "Thumbs.db",
    "desktop.ini",
    ".DS_Store"
)

# 构建排除参数
$excludeArgs = $excludeList | ForEach-Object { "-xr!$_" }

# 创建备份
Write-ColorOutput Cyan "📦 创建备份中..."
$7zPath = "C:\Program Files\7-Zip\7z.exe"

if (Test-Path $7zPath) {
    # 使用 7-Zip（更快更小）
    & $7zPath a -tzip $zipPath "$projectPath\*" $excludeArgs -mx=5 | Out-Null
} else {
    # 使用 PowerShell Compress-Archive（排除功能有限）
    Write-ColorOutput Yellow "⚠️ 7-Zip 未找到，使用 PowerShell 备份（可能包含额外文件）"

    # 创建临时目录
    $tempPath = Join-Path $env:TEMP "backup_temp_$timestamp"
    New-Item -ItemType Directory -Path $tempPath -Force | Out-Null

    # 复制文件（排除不需要的）
    $items = Get-ChildItem -Path $projectPath -Recurse | Where-Object {
        $relativePath = $_.FullName.Substring($projectPath.Length + 1)
        $excluded = $false

        foreach ($pattern in $excludeList) {
            if ($relativePath -like $pattern) {
                $excluded = $true
                break
            }
        }
        -not $excluded
    }

    foreach ($item in $items) {
        $destPath = Join-Path $tempPath $item.FullName.Substring($projectPath.Length + 1)
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        if (-not $item.PSIsContainer) {
            Copy-Item $item.FullName -Destination $destPath -Force
        }
    }

    Compress-Archive -Path "$tempPath\*" -DestinationPath $zipPath -CompressionLevel Optimal
    Remove-Item $tempPath -Recurse -Force
}

# 获取备份文件大小
$backupSize = (Get-Item $zipPath).Length / 1MB
$backupSizeMB = [math]::Round($backupSize, 2)

Write-ColorOutput Green "✅ 备份完成！"
Write-ColorOutput Green "📦 文件: $zipPath"
Write-ColorOutput Green "📊 大小: ${backupSizeMB} MB"

# 更新验证记录表
$logFile = Join-Path $projectPath "MODULE_VERIFICATION_LOG.md"
if (Test-Path $logFile -and $ModuleTag) {
    Write-ColorOutput Cyan "📝 更新验证记录表..."

    # 获取备份文件名（不含路径）
    $backupFileName = Split-Path $zipPath -Leaf

    # 创建更新记录
    $updateRecord = @"

## 备份记录 - $timestamp

- **模块标签**: $ModuleTag
- **备份文件**: $backupFileName
- **文件大小**: ${backupSizeMB} MB
- **描述**: $Description
- **测试状态**: $(if ($SkipTest) { "跳过" } else { "通过" })

"@

    Add-Content -Path $logFile -Value $updateRecord -Encoding UTF8
    Write-ColorOutput Green "✅ 验证记录已更新！"
}

# 显示最近的备份列表
Write-Host ""
Write-ColorOutput Cyan "📋 最近的模块备份："
$recentBackups = Get-ChildItem -Path $backupRoot -Filter "rrxsxyz_next_*_MODULE*.zip" |
    Sort-Object CreationTime -Descending |
    Select-Object -First 5

foreach ($backup in $recentBackups) {
    $sizeMB = [math]::Round($backup.Length / 1MB, 2)
    Write-Host "  - $($backup.Name) (${sizeMB} MB)"
}

# 生成快速恢复命令
Write-Host ""
Write-ColorOutput Cyan "🔄 快速恢复命令："
Write-ColorOutput Yellow "Expand-Archive -Path `"$zipPath`" -DestinationPath `"$projectPath`" -Force"

Write-Host ""
Write-ColorOutput Green "========================================="
Write-ColorOutput Green "         备份完成！版本已记录"
Write-ColorOutput Green "========================================="