# 备份脚本 - 版本 011 (优化到2MB)
# 任务编号：011
# 关键字：Opus500502Opted
# 优化目标：2MB以内（参考之前备份1.2-1.3MB）

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Project Backup - Opus500502Opted" -ForegroundColor Cyan
Write-Host "  (Optimized to ~2MB)" -ForegroundColor Cyan
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

Write-Host "[1/2] Collecting files (aggressive exclusion for 2MB target)..." -ForegroundColor Yellow

try {
    # 排除规则：完整版（目标2MB）
    $excludePatterns = @(
        # 【超大目录】必须排除
        '\\node_modules\\', '\\.venv\\', '\\.pnpm-store\\', '\\.git\\',
        # 【构建和缓存】
        '\\dist\\', '\\build\\', '\\out\\', '\\.cache\\', '\\coverage\\',
        # 【日志和数据】敏感信息
        '\\logs\\', '\\server\\data\\', '\\server\\UserInfo\\',
        # 【备份目录】所有Backup
        '\\Backup\\', '\\.claude\\backups\\', '\\.claude\\snapshots\\',
        '\\ZIP_BACKUP_OLD\\', '\\team\\viber_archive\\',
        # 【文档目录】历史文档
        '\\test_reports\\', '\\docs\\', '\\duomotai\\docs\\',
        # 【IDE和工具】
        '\\.idea\\', '\\.obsidian\\', '\\.vscode\\settings.json',
        # 【临时文件】
        '\\.temp\\', '\\temp\\', '\\tmp\\'
    )

    $excludeNames = @(
        # 目录名
        'nul', 'node_modules', '.venv', '.git', 'dist', 'build', 'out',
        'Backup', 'logs', 'coverage', 'test_reports', 'docs',
        '.idea', '.obsidian', '.cache', 'ZIP_BACKUP_OLD',
        # 系统文件
        'Thumbs.db', '.DS_Store', 'Desktop.ini', 'desktop.ini'
    )

    $excludeExtensions = @(
        '.log', '.tmp', '.temp', '.bak', '.old', '.swp', '.swo',
        '.db', '.sqlite', '.lock', '.pid'
    )

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

                 # 【关键修正】排除备份文件（更全面的正则）
                 if ($_.Name -match '_\d{8}_\d{6}\.html$' -or          # *_20250930_234301.html
                     $_.Name -match '_202\d{6,10}_' -or                 # *_20251013_* 或 *_202510131720_*
                     $_.Name -match '_backup_' -or                      # *_backup_*
                     $_.Name -match '_v\d+_202' -or                     # *_v4_20251002.html
                     $_.Name -match 'snapshot\.md$' -or                 # snapshot.md
                     $_.Name -match '^handover_' -or                    # handover_*.md
                     $_.Name -match '_archive\.md$') {                  # *_archive.md
                     $exclude = $true
                 }

                 # 排除特定文件（按名称精确匹配）
                 if ($_.Name -in @('ideas.md', 'nul', 'tsconfig.json')) {
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
            Write-Host "Files: $($items.Count)" -ForegroundColor Cyan
            Write-Host "Full Path: $destPath" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Excluded (Complete List):" -ForegroundColor Gray
            Write-Host "  Dirs: .git, node_modules, .venv, dist, Backup, logs" -ForegroundColor Gray
            Write-Host "        test_reports, docs, coverage, .idea, .obsidian" -ForegroundColor Gray
            Write-Host "  Files: *.log, *.bak, *_202XXXXX_*.html, snapshot.md" -ForegroundColor Gray
            Write-Host "         Data: server/data, server/UserInfo" -ForegroundColor Gray
            Write-Host ""

            # 警告：如果还是超过3MB
            if ($sizeInMB -gt 3) {
                Write-Host "⚠️  WARNING: Backup size is $sizeInMB MB (target: 2MB)" -ForegroundColor Yellow
                Write-Host "   Please review excluded patterns if size is too large." -ForegroundColor Yellow
                Write-Host ""
            }
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
