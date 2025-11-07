# Claude配置每周清理Agent
# 关联决策: D-104
# 执行频率: 每周一00:00（或配置>500MB时）
# 归档方式: 类似progress.archive，使用claude.archive

param(
    [switch]$Force = $false
)

$claudePath = "C:\Users\Richard\.claude"
$archivePath = "C:\Users\Richard\.claude.archive"
$backupPath = "C:\Temp\claude_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 检查配置大小
$size = (Get-ChildItem -Path $claudePath -Recurse -ErrorAction SilentlyContinue |
         Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "📊 当前Claude配置大小: $([math]::Round($size, 2)) MB"

# 阈值判断
if ($size -lt 500 -and -not $Force) {
    Write-Host "✅ 配置正常，无需清理（阈值500MB）"
    exit 0
}

Write-Host "🧹 开始每周清理..."

# 1. 创建归档目录
if (-not (Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
}

# 2. 归档旧数据（保留最近7天）
$cutoffDate = (Get-Date).AddDays(-7)
$itemsToArchive = @("projects", "file-history", "debug")

foreach ($item in $itemsToArchive) {
    $itemPath = Join-Path $claudePath $item
    if (Test-Path $itemPath) {
        $oldItems = Get-ChildItem -Path $itemPath -Recurse -File |
                    Where-Object { $_.LastWriteTime -lt $cutoffDate }

        if ($oldItems) {
            $archiveItemPath = Join-Path $archivePath $item
            if (-not (Test-Path $archiveItemPath)) {
                New-Item -ItemType Directory -Path $archiveItemPath -Force | Out-Null
            }

            foreach ($file in $oldItems) {
                $relativePath = $file.FullName.Substring($itemPath.Length + 1)
                $destPath = Join-Path $archiveItemPath $relativePath
                $destDir = Split-Path $destPath -Parent

                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }

                Move-Item -Path $file.FullName -Destination $destPath -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 3. 验证清理效果
$newSize = (Get-ChildItem -Path $claudePath -Recurse -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum / 1MB
$saved = $size - $newSize
$archivedSize = (Get-ChildItem -Path $archivePath -Recurse -ErrorAction SilentlyContinue |
                 Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host ""
Write-Host "✅ 清理完成!"
Write-Host "   配置大小: $([math]::Round($size, 2)) MB → $([math]::Round($newSize, 2)) MB"
Write-Host "   释放空间: $([math]::Round($saved, 2)) MB ($([math]::Round($saved/$size*100, 1))%)"
Write-Host "   归档大小: $([math]::Round($archivedSize, 2)) MB"
Write-Host "   归档位置: $archivePath"

# 4. 记录到progress.md
$progressPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\progress.md"
if (Test-Path $progressPath) {
    $record = @"

### 📊 配置管理记录（$(Get-Date -Format 'yyyy-MM-dd HH:mm')）
- **清理前**: $([math]::Round($size, 2)) MB
- **清理后**: $([math]::Round($newSize, 2)) MB
- **释放空间**: $([math]::Round($saved, 2)) MB ($([math]::Round($saved/$size*100, 1))%优化)
- **归档位置**: $archivePath (可恢复)
"@
    Add-Content -Path $progressPath -Value $record
}

exit 0
