# 智能备份与回退脚本
# Smart Backup and Rollback System for RRXSXYZ_Next

param(
    [string]$Action = "list",  # list, backup, rollback, compare
    [string]$File = "",        # 目标文件
    [string]$Feature = "",     # 功能标签
    [string]$Version = ""      # 版本号
)

# 使用脚本相对路径自动获取项目根目录
$BaseDir = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
$BackupDir = "$BaseDir\.backups"
$BaselineFile = "$BaseDir\TEST_BASELINE.md"

# 确保备份目录存在
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

function Create-Backup {
    param($FilePath, $Feature)

    if (!(Test-Path $FilePath)) {
        Write-Host "❌ 文件不存在: $FilePath" -ForegroundColor Red
        return
    }

    $timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
    $fileName = Split-Path -Leaf $FilePath
    $backupName = "$fileName.$timestamp.$Feature.backup"
    $backupPath = "$BackupDir\$backupName"

    Copy-Item $FilePath -Destination $backupPath -Force
    Write-Host "✅ 备份创建成功: $backupName" -ForegroundColor Green

    # 更新TEST_BASELINE.md
    $baselineEntry = "| v$timestamp | $(Get-Date -Format 'yyyy-MM-dd HH:mm') | $fileName | $Feature | ⏸️ 待测 | $backupName | 自动备份 |"
    Add-Content -Path $BaselineFile -Value $baselineEntry

    return $backupPath
}

function List-Backups {
    param($FilterFile = "*")

    Write-Host "`n📦 可用备份列表:" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan

    Get-ChildItem "$BackupDir\*.backup" | Where-Object { $_.Name -like "*$FilterFile*" } |
        Sort-Object LastWriteTime -Descending |
        ForEach-Object {
            $parts = $_.BaseName -split '\.'
            Write-Host "  📄 $($_.Name)" -ForegroundColor Yellow
            Write-Host "     时间: $($_.LastWriteTime)" -ForegroundColor Gray
            Write-Host "     大小: $([math]::Round($_.Length/1KB, 2)) KB" -ForegroundColor Gray
            Write-Host ""
        }
}

function Rollback-File {
    param($BackupFile, $TargetFile)

    $backupPath = "$BackupDir\$BackupFile"

    if (!(Test-Path $backupPath)) {
        Write-Host "❌ 备份文件不存在: $BackupFile" -ForegroundColor Red
        return
    }

    # 先创建当前版本的备份
    $currentBackup = Create-Backup -FilePath $TargetFile -Feature "before_rollback"

    # 执行回退
    Copy-Item $backupPath -Destination $TargetFile -Force
    Write-Host "✅ 已回退到: $BackupFile" -ForegroundColor Green
    Write-Host "📌 当前版本已备份为: $(Split-Path -Leaf $currentBackup)" -ForegroundColor Yellow
}

function Compare-Versions {
    param($File1, $File2)

    $path1 = if ($File1 -like "*.backup") { "$BackupDir\$File1" } else { "$BaseDir\$File1" }
    $path2 = if ($File2 -like "*.backup") { "$BackupDir\$File2" } else { "$BaseDir\$File2" }

    if (!(Test-Path $path1) -or !(Test-Path $path2)) {
        Write-Host "❌ 文件不存在" -ForegroundColor Red
        return
    }

    Write-Host "`n🔍 比较差异:" -ForegroundColor Cyan
    Compare-Object (Get-Content $path1) (Get-Content $path2) |
        ForEach-Object {
            if ($_.SideIndicator -eq "<=") {
                Write-Host "- $($_.InputObject)" -ForegroundColor Red
            } else {
                Write-Host "+ $($_.InputObject)" -ForegroundColor Green
            }
        }
}

# 主逻辑
switch ($Action.ToLower()) {
    "backup" {
        if ($File -and $Feature) {
            Create-Backup -FilePath "$BaseDir\$File" -Feature $Feature
        } else {
            Write-Host "用法: .\backup.ps1 -Action backup -File 'duomotai\init.js' -Feature 'login_fix'" -ForegroundColor Yellow
        }
    }

    "list" {
        List-Backups -FilterFile $File
    }

    "rollback" {
        if ($Version -and $File) {
            Rollback-File -BackupFile $Version -TargetFile "$BaseDir\$File"
        } else {
            Write-Host "用法: .\backup.ps1 -Action rollback -Version 'init.js.20251017_143800.login_fix.backup' -File 'duomotai\init.js'" -ForegroundColor Yellow
        }
    }

    "compare" {
        if ($File -and $Version) {
            Compare-Versions -File1 $File -File2 $Version
        } else {
            Write-Host "用法: .\backup.ps1 -Action compare -File 'duomotai\init.js' -Version 'init.js.20251017_143800.backup'" -ForegroundColor Yellow
        }
    }

    default {
        Write-Host "📚 智能备份系统使用说明:" -ForegroundColor Cyan
        Write-Host "========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "命令示例:" -ForegroundColor Yellow
        Write-Host "  .\backup.ps1 -Action list                                              # 列出所有备份"
        Write-Host "  .\backup.ps1 -Action list -File 'init.js'                             # 列出特定文件的备份"
        Write-Host "  .\backup.ps1 -Action backup -File 'duomotai\init.js' -Feature 'fix'   # 创建备份"
        Write-Host "  .\backup.ps1 -Action rollback -Version 'xxx.backup' -File 'xxx.js'    # 回退版本"
        Write-Host "  .\backup.ps1 -Action compare -File 'init.js' -Version 'xxx.backup'    # 比较版本"
        Write-Host ""
    }
}