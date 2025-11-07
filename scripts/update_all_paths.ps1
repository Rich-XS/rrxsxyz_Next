# PowerShell脚本: 批量更新项目中的旧路径到新路径
# 用途: 从 D:\_100W 更新为 D:\OneDrive_New\_AIGPT\_100W_New
# 生成时间: 2025-10-31

$projectRoot = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next"
$oldPath = "D:\_100W"
$newPath = "D:\OneDrive_New\_AIGPT\_100W_New"

$backupPath = "D:\OneDrive_New\_AIGPT\_100W_New\PATH_UPDATE_BACKUP_20251031"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "路径更新脚本 - 批量替换旧路径" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "旧路径: $oldPath" -ForegroundColor Yellow
Write-Host "新路径: $newPath" -ForegroundColor Green
Write-Host "项目根: $projectRoot`n" -ForegroundColor Gray

# 创建备份目录
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "✅ 备份目录已创建: $backupPath`n" -ForegroundColor Green
}

# 定义需要处理的文件类型
$filePatterns = @("*.md", "*.ps1", "*.bat", "*.js", "*.json", "*.yml", "*.yaml", "*.txt", "*.conf")

$totalFiles = 0
$updatedFiles = 0
$errorFiles = 0

Write-Host "[开始扫描文件...]" -ForegroundColor Cyan
Write-Host ""

foreach ($pattern in $filePatterns) {
    $files = Get-ChildItem -Path $projectRoot -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        $totalFiles++

        try {
            # 读取文件内容
            $content = Get-Content -Path $file.FullName -Encoding UTF8 -ErrorAction Stop

            # 检查是否包含旧路径
            if ($content -match [regex]::Escape($oldPath)) {
                # 创建备份
                Copy-Item -Path $file.FullName -Destination "$backupPath\$($file.Name)_$(Get-Date -Format yyyyMMdd_HHmmss).bak" -ErrorAction SilentlyContinue

                # 替换旧路径为新路径 (支持反斜杠和正斜杠)
                $newContent = $content -replace [regex]::Escape($oldPath), $newPath

                # 写回文件
                Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -ErrorAction Stop

                $updatedFiles++
                Write-Host "✅ 已更新: $($file.FullName.Replace($projectRoot, '.'))" -ForegroundColor Green
            }
        } catch {
            $errorFiles++
            Write-Host "❌ 错误: $($file.FullName) - $($_)" -ForegroundColor Red
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "更新完成报告" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "扫描总文件数: $totalFiles" -ForegroundColor Gray
Write-Host "✅ 已更新文件: $updatedFiles" -ForegroundColor Green
Write-Host "❌ 出错文件: $errorFiles" -ForegroundColor $(if ($errorFiles -gt 0) { "Red" } else { "Green" })
Write-Host "📁 备份位置: $backupPath`n" -ForegroundColor Gray

# 验证：再次扫描确认没有旧路径残留
Write-Host "[验证: 检查是否还有残留的旧路径...]" -ForegroundColor Yellow
$remainingFiles = Get-ChildItem -Path $projectRoot -File -Recurse | Where-Object {
    $content = Get-Content -Path $_.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
    $content -match [regex]::Escape($oldPath)
}

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ 验证通过: 所有旧路径已完全替换!`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  警告: 仍有 $($remainingFiles.Count) 个文件包含旧路径:" -ForegroundColor Yellow
    $remainingFiles | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Yellow }
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "操作完成!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

# 完成
