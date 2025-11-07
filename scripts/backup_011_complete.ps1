# 备份脚本 - 版本 011 (完整排除规则)
# 任务编号：011
# 关键字：Opus500502Opted

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Project Backup - Opus500502Opted" -ForegroundColor Cyan
Write-Host "  (Complete Exclusion Rules)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMddHHmm"
$taskNumber = "011"
$keyword = "Opus500502Opted"
$backupName = "rrxsxyz_next_${timestamp}_${taskNumber}_${keyword}.zip"
$sourcePath = "D:\_100W\rrxsxyz_next"
$destFolder = "D:\_100W"
$destPath = Join-Path $destFolder $backupName

Write-Host "[INFO] Source: $sourcePath" -ForegroundColor Gray
Write-Host "[INFO] Destination: $destPath" -ForegroundColor Gray
Write-Host ""

# 确保目标目录存在
if (!(Test-Path $destFolder)) {
    New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    Write-Host "[INFO] Created destination folder: $destFolder" -ForegroundColor Yellow
}

Write-Host "[1/2] Collecting files (excluding: .git, node_modules, logs, data...)..." -ForegroundColor Yellow

try {
    # 排除规则：参考 .gitignore
    $excludePatterns = @(
        # 依赖和虚拟环境
        '\\node_modules\\', '\\.venv\\', '\\.pnpm-store\\',
        # Git仓库（最大）
        '\\.git\\',
        # 构建输出
        '\\dist\\', '\\build\\', '\\out\\', '\\.cache\\', '\\coverage\\',
        # 日志和数据
        '\\logs\\', '\\server\\data\\', '\\server\\UserInfo\\',
        # 备份目录
        '\\Backup\\', '\\.claude\\backups\\', '\\.claude\\snapshots\\',
        # IDE配置
        '\\.idea\\', '\\.obsidian\\',
        # 临时文件
        '\\.temp\\', '\\temp\\', '\\tmp\\'
    )

    $excludeNames = @(
        'nul', 'node_modules', '.venv', '.git', 'dist', 'build', 'out',
        'Backup', 'logs', 'coverage', '.idea', '.obsidian', '.cache',
        'Thumbs.db', '.DS_Store', 'Desktop.ini'
    )

    $excludeExtensions = @('.log', '.tmp', '.temp', '.bak', '.old', '.swp', '.swo')

    Write-Host "  Scanning files..." -ForegroundColor Gray

    $items = Get-ChildItem -Path $sourcePath -Recurse -ErrorAction SilentlyContinue |
             Where-Object {
                 $exclude = $false

                 # 排除路径模式
                 foreach ($pattern in $excludePatterns) {
                     if ($_.FullName -match $pattern) {
                         $exclude = $true
                         break
                     }
                 }

                 # 排除特定名称
                 if ($excludeNames -contains $_.Name) {
                     $exclude = $true
                 }

                 # 排除特定扩展名
                 if ($excludeExtensions -contains $_.Extension) {
                     $exclude = $true
                 }

                 # 排除备份文件模式 (*_202XXXXXXXXX_*, *_backup_*, *_vX_202*)
                 if ($_.Name -match '_202\d{10}_' -or
                     $_.Name -match '_backup_' -or
                     $_.Name -match '_v\d+_202') {
                     $exclude = $true
                 }

                 -not $exclude
             } |
             Select-Object -ExpandProperty FullName

    if ($items.Count -gt 0) {
        Write-Host "  Found $($items.Count) files/folders" -ForegroundColor Green

        Write-Host ""
        Write-Host "[2/2] Creating archive..." -ForegroundColor Yellow

        # 如果目标文件已存在，先删除
        if (Test-Path $destPath) {
            Remove-Item $destPath -Force
            Write-Host "  Removed existing archive" -ForegroundColor Yellow
        }

        # 创建压缩包
        Compress-Archive -Path $items -DestinationPath $destPath -CompressionLevel Optimal -Force

        # 验证文件是否生成
        if (Test-Path $destPath) {
            $backupInfo = Get-Item $destPath
            $sizeInMB = [math]::Round($backupInfo.Length / 1MB, 2)

            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  Backup Complete!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Filename: $backupName" -ForegroundColor White
            Write-Host "Size: $sizeInMB MB" -ForegroundColor Cyan
            Write-Host "Full Path: $destPath" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Excluded:" -ForegroundColor Gray
            Write-Host "  - .git, node_modules, .venv, dist, build" -ForegroundColor Gray
            Write-Host "  - logs, server/data, Backup, coverage" -ForegroundColor Gray
            Write-Host "  - .idea, .obsidian, .cache" -ForegroundColor Gray
            Write-Host "  - *.log, *.tmp, *.bak, backup files" -ForegroundColor Gray
            Write-Host ""
        } else {
            throw "Archive file was not created: $destPath"
        }
    } else {
        throw "No files found for backup (all excluded?)"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Backup Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Location: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
