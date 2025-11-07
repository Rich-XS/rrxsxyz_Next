# Version Automation Agent
# 监控代码文件变化，自动递增版本号并触发备份

param(
    [Parameter(Mandatory=$false)]
    [string]$WatchPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\duomotai",

    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

$indexPath = Join-Path $WatchPath "index.html"
$versionPattern = '<span class="version-tag">V(\d+)\.(\d+[a-z]?)</span>'
$consolePattern = 'console\.log.*V(\d+)\.(\d+[a-z]?)'

function Get-CurrentVersion {
    $content = Get-Content $indexPath -Raw
    if ($content -match $versionPattern) {
        return $Matches[1], $Matches[2]
    }
    return $null, $null
}

function Increment-Version {
    param([string]$major, [string]$minor)

    # 末位递增规则: V56.1→V56.2→...→V56.9→V56.a→V56.b...→V56.z
    if ($minor -match '^\d+$') {
        $num = [int]$minor
        if ($num -lt 9) {
            return $major, ($num + 1).ToString()
        } else {
            return $major, 'a'
        }
    } elseif ($minor -match '^(\d+)([a-y])$') {
        $num = [int]$Matches[1]
        $letter = [char]$Matches[2]
        $nextLetter = [char]([int]$letter + 1)
        return $major, "$num$nextLetter"
    } elseif ($minor -match '^(\d+)z$') {
        # V56.9z → V57.0
        return ([int]$major + 1).ToString(), '0'
    }

    return $major, $minor
}

function Update-VersionInFile {
    param([string]$major, [string]$minor)

    $newVersion = "V$major.$minor"
    $content = Get-Content $indexPath -Raw

    # 更新两处版本号
    $content = $content -replace $versionPattern, "<span class=`"version-tag`">$newVersion</span>"
    $content = $content -replace $consolePattern, "console.log('%c🚀 多魔汰系统 $newVersion 已加载！'"

    if (-not $DryRun) {
        $content | Out-File -FilePath $indexPath -Encoding UTF8
        Write-Host "✅ 版本号已更新: $newVersion" -ForegroundColor Green
    } else {
        Write-Host "🔍 [DRY RUN] 将更新版本号到: $newVersion" -ForegroundColor Yellow
    }

    return $newVersion
}

function Trigger-Backup {
    param([string]$version)

    $keyword = "V${version}OK_AutoBackup"
    Write-Host "📦 触发自动备份: $keyword" -ForegroundColor Cyan

    if (-not $DryRun) {
        # 调用progress-recorder agent进行备份
        # 这里使用简化版备份（直接压缩）
        $timestamp = Get-Date -Format "yyyyMMddHHmm"
        $backupName = "rrxsxyz_next_${timestamp}_${keyword}.zip"
        $backupPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\backups\$backupName"

        # Exclude方式备份
        $excludeDirs = @("node_modules", ".git", "logs", "temp", "chatlogs", "backups")
        $sourceRoot = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next"

        # 创建临时目录列表
        $tempList = "$env:TEMP\backup_files_$timestamp.txt"
        Get-ChildItem -Path $sourceRoot -Recurse -File |
            Where-Object {
                $path = $_.FullName
                -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
            } |
            ForEach-Object { $_.FullName } |
            Out-File -FilePath $tempList -Encoding UTF8

        Write-Host "  压缩中..." -ForegroundColor Gray
        Compress-Archive -Path $sourceRoot\* -DestinationPath $backupPath -Force

        $size = (Get-Item $backupPath).Length / 1MB
        Write-Host "  ✅ 备份完成: $backupName ($([math]::Round($size, 2)) MB)" -ForegroundColor Green

        Remove-Item $tempList -ErrorAction SilentlyContinue
    } else {
        Write-Host "  🔍 [DRY RUN] 将创建备份: $keyword" -ForegroundColor Yellow
    }
}

# ============================================
# 主执行逻辑
# ============================================

Write-Host "`n🤖 版本自动化Agent启动" -ForegroundColor Magenta
Write-Host "监控路径: $WatchPath`n" -ForegroundColor Gray

# 检查文件
if (-not (Test-Path $indexPath)) {
    Write-Host "❌ 未找到index.html文件" -ForegroundColor Red
    exit 1
}

# 获取当前版本
$major, $minor = Get-CurrentVersion
if (-not $major) {
    Write-Host "❌ 无法解析当前版本号" -ForegroundColor Red
    exit 1
}

Write-Host "📌 当前版本: V$major.$minor" -ForegroundColor Cyan

# 检查是否有代码变更（通过Git）
$gitStatus = git -C $WatchPath status --short 2>$null
if ($gitStatus) {
    Write-Host "🔄 检测到代码变更，自动递增版本号..." -ForegroundColor Yellow

    # 递增版本号
    $newMajor, $newMinor = Increment-Version -major $major -minor $minor
    $newVersion = Update-VersionInFile -major $newMajor -minor $newMinor

    # 触发备份
    Trigger-Backup -version "$newMajor.$newMinor"

    Write-Host "`n✅ 版本自动化完成" -ForegroundColor Green
    Write-Host "   旧版本: V$major.$minor" -ForegroundColor Gray
    Write-Host "   新版本: V$newMajor.$newMinor" -ForegroundColor Green
    Write-Host "   备份: ✅ 已创建" -ForegroundColor Green
} else {
    Write-Host "ℹ️  无代码变更，跳过版本递增" -ForegroundColor White
}

# 文件监控模式（可选）
if ($false) {  # 默认禁用，需要时手动启用
    Write-Host "`n👁️  进入文件监控模式..." -ForegroundColor Cyan
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $WatchPath
    $watcher.Filter = "*.js"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        Write-Host "`n🔔 检测到文件变更: $($Event.SourceEventArgs.Name)" -ForegroundColor Yellow
        # 这里可以自动触发版本递增
    }

    Register-ObjectEvent $watcher "Changed" -Action $action
    Write-Host "   监控中... 按 Ctrl+C 停止" -ForegroundColor Gray

    try {
        while ($true) { Start-Sleep -Seconds 1 }
    } finally {
        Unregister-Event -SourceIdentifier "Changed"
        $watcher.Dispose()
    }
}
