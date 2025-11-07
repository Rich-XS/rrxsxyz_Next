# 批量修复硬编码路径工具
# 将所有 PowerShell 脚本中的硬编码路径 D:\_100W\rrxsxyz_next 替换为动态路径

param(
    [switch]$DryRun = $false  # 测试模式，不实际修改文件
)

$scriptsDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptsDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  硬编码路径批量修复工具" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "项目根目录: $projectRoot" -ForegroundColor Yellow
Write-Host "脚本目录: $scriptsDir" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  运行模式: 测试（不会修改文件）" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  运行模式: 生产（将修改文件）" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "确认继续? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit
    }
}

Write-Host ""
Write-Host "开始扫描..." -ForegroundColor Cyan

# 需要修复的文件列表
$filesToFix = @(
    "ModuleBackup.ps1",
    "TaskDone_BackUp_Exclude.ps1",
    "emergency_archive.ps1",
    "check_file_sizes.ps1",
    "analyze_large_files_utf8.ps1",
    "analyze_large_files.ps1",
    "backup_011_optimized.ps1",
    "backup_011_complete.ps1",
    "backup_and_clean.ps1",
    "file_size_monitor_utf8.ps1",
    "auto_archive_utf8.ps1",
    "file_size_monitor.ps1",
    "auto_archive.ps1",
    "inspect_image_cache.ps1",
    "backup_Nginx_exclude_logs.ps1",
    "backup_Nginx.ps1"
)

$fixedCount = 0
$skippedCount = 0

foreach ($file in $filesToFix) {
    $filePath = Join-Path $scriptsDir $file

    if (-not (Test-Path $filePath)) {
        Write-Host "  ⏭️  跳过: $file (文件不存在)" -ForegroundColor Gray
        $skippedCount++
        continue
    }

    # 读取文件内容
    $content = Get-Content $filePath -Raw -Encoding UTF8

    # 检查是否包含硬编码路径
    if ($content -notmatch 'D:\\_100W\\rrxsxyz_next' -and $content -notmatch "D:\\\_100W\\rrxsxyz_next") {
        Write-Host "  ✅ 跳过: $file (已无硬编码路径)" -ForegroundColor Green
        $skippedCount++
        continue
    }

    # 替换硬编码路径
    $newContent = $content

    # 替换常见模式
    $newContent = $newContent -replace 'D:\\_100W\\rrxsxyz_next', '$(if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot })'
    $newContent = $newContent -replace "D:\\\_100W\\rrxsxyz_next", '$(if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot })'
    $newContent = $newContent -replace 'D:\\_100W', '$(Split-Path -Parent $(if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }))'
    $newContent = $newContent -replace "D:\\\_100W", '$(Split-Path -Parent $(if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }))'

    if ($DryRun) {
        Write-Host "  🔍 检测到: $file (测试模式，未修改)" -ForegroundColor Yellow
    } else {
        # 创建备份
        $backupPath = "$filePath.bak"
        Copy-Item $filePath $backupPath -Force

        # 写入新内容
        Set-Content $filePath -Value $newContent -Encoding UTF8 -NoNewline

        Write-Host "  ✅ 已修复: $file (备份: $file.bak)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  修复完成" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "统计:" -ForegroundColor White
Write-Host "  已修复: $fixedCount 个文件" -ForegroundColor Green
Write-Host "  已跳过: $skippedCount 个文件" -ForegroundColor Yellow
Write-Host ""

if (-not $DryRun -and $fixedCount -gt 0) {
    Write-Host "💡 提示: 已创建 .bak 备份文件，如需回滚可使用:" -ForegroundColor Cyan
    Write-Host "   Get-ChildItem *.bak | ForEach-Object { Copy-Item $_ $($_.BaseName) -Force; Remove-Item $_ }" -ForegroundColor Gray
}
