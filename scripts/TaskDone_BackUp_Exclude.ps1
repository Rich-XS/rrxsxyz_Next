#!/usr/bin/env pwsh
<#
  TaskDone_BackUp_Exclude.ps1
  参数化备份脚本：按规则排除目录和文件并生成符合命名规范的备份包。
  用法示例：
    PowerShell -NoProfile -ExecutionPolicy Bypass -File \
      "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "Task" -TaskId "088" -Execute

  参数：
    -Keyword (string)  关键字，默认 misc
    -TaskId  (string)  可选任务号，会插入到文件名
    -Execute (switch)  dry-run 时不会实际创建 zip；传入 -Execute 才会生成压缩包
#>

param(
    [string]$Keyword = "misc",
    [string]$TaskId = "",
    [switch]$Execute
)

try {
    $ProjectName = 'rrxsxyz_next'
    $ts = Get-Date -Format yyyyMMddHHmm
    # 使用脚本相对路径自动获取项目根目录
    $projectRoot = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
    $outDir = Join-Path $projectRoot 'backups'
    if (-not (Test-Path -Path $outDir)) { New-Item -Path $outDir -ItemType Directory -Force | Out-Null }

    # sanitize keyword
    $cleanKeyword = ($Keyword -replace '\s+','_') -replace '[^A-Za-z0-9_\-]', ''
    if ([string]::IsNullOrWhiteSpace($cleanKeyword)) { $cleanKeyword = 'misc' }
    $taskPart = if ($TaskId -and $TaskId.Trim() -ne '') { "_${TaskId}" } else { "" }

    $zipName = "{0}_{1}{2}_{3}.zip" -f $ProjectName, $ts, $taskPart, $cleanKeyword
    $dst = Join-Path $outDir $zipName

    Write-Output "Preparing backup: $dst"

    $workspace = Resolve-Path -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) '..')
    $workspace = $workspace.Path

    # Exclude directories and file patterns (relative segments)
    # 完整排除规则（恢复版本，参考 .gitignore 和 D-35、D-72 决策）
    $excludeDirs = @(
        # 依赖和虚拟环境
        'node_modules', 'server\node_modules', '.venv', '.pnpm-store',
        # Git 仓库
        '.git',
        # 构建输出
        'dist', 'build', 'out', '.cache', 'coverage',
        # 日志和数据
        'logs', 'server\data', 'server\UserInfo',
        # 备份目录
        'Backup', 'ZIP_BACKUP_OLD', '.claude\backups', '.claude\snapshots', 'backups',
        # 测试和文档
        'test_reports', 'chatlogs', 'temp',
        # 截图目录（D-72 决策，2025-10-17 | D-85 更新，2025-10-26）
        'duomotai\screenshots', 'test-screenshots', 'screenshots', 'gemba-reports',
        # IDE 配置
        '.idea', '.obsidian', '.vscode'
    )
    $excludeFilePatterns = @(
        '*.log', '*.tmp', '*.temp', '*.bak', '*.old', '*.swp', '*.swo',
        '*_backup_*', '*-lock.*', 'package-lock.json', 'pnpm-lock.yaml',
        'progress.archive_*.md', 'progress_*.md', 'snapshot*.md',
        # ZIP 文件排除（D-72 决策，2025-10-17 - 避免嵌套打包）
        '*.zip',
        # 临时图片文件排除（D-85 决策，2025-10-26 - 避免测试截图打包）
        'image-*.png', 'screenshot-*.png', 'test-*.png'
    )

    # Temp staging dir
    $temp = Join-Path $env:TEMP ("backup_{0}_{1}" -f $ProjectName, $ts)
    if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
    New-Item -ItemType Directory -Path $temp | Out-Null

    # Copy files to temp respecting exclude rules
    Get-ChildItem -Path $workspace -Recurse -File -Force -ErrorAction SilentlyContinue |
      ForEach-Object {
        $full = $_.FullName
        $rel = $full.Substring($workspace.Length).TrimStart('\','/')

        # Skip Windows reserved device name 'nul'
        if ($_.Name -eq 'nul') { return }

        # Skip if matches excluded dir segments
        $skip = $false
        foreach ($d in $excludeDirs) {
          if ($rel -match ('(^|\\)'+[regex]::Escape($d)+'(\\|$)')) { $skip = $true; break }
        }
        if ($skip) { return }

        # Skip file patterns
        foreach ($pat in $excludeFilePatterns) {
          if ($_.Name -like $pat) { $skip = $true; break }
        }
        if ($skip) { return }

        $target = Join-Path $temp $rel
        $tDir = Split-Path $target -Parent
        if (-not (Test-Path $tDir)) { New-Item -ItemType Directory -Path $tDir -Force | Out-Null }
        Copy-Item -Path $full -Destination $target -Force
      }

    if (-not $Execute) {
      $sumObj = Get-ChildItem -Path $temp -Recurse -File | Measure-Object -Property Length -Sum
      $sum = $sumObj.Sum
      if (-not $sum) { $sum = 0 }
      Write-Output "Dry-run mode: staging completed at $temp. To create zip, run script with -Execute"
      Write-Output "Staged files size (bytes): $sum"
      exit 0
    }

    if (Test-Path $dst) { Remove-Item $dst -Force }
    Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $dst -Force

    # cleanup
    Remove-Item $temp -Recurse -Force

    $size = (Get-Item $dst).Length
    Write-Output "Creating backup (excluding specified dirs/patterns): $dst"
    Write-Output ("BACKUP_DONE:{0}" -f $ts)
    Write-Output ("SIZE:{0}" -f $size)
    exit 0

} catch {
    Write-Error "Backup failed: $_"
    exit 1
}
