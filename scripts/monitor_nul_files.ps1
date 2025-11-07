# NUL File Monitor - 防止 NUL 文件灾难再次发生
# 创建时间: 2025-10-29
# 作用: 定时检查项目中的 nul 文件数量，超过阈值时报警

param(
    [int]$Threshold = 10,  # 阈值：超过10个nul文件时报警
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NUL File Monitor - D-102 Decision" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $ProjectRoot"
Write-Host "Threshold: $Threshold files"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# 查找所有 nul 文件
$nulFiles = Get-ChildItem -Path $ProjectRoot -Filter "nul" -Recurse -ErrorAction SilentlyContinue -File
$count = $nulFiles.Count

Write-Host "检测到 $count 个 nul 文件" -ForegroundColor $(if ($count -eq 0) { "Green" } elseif ($count -le $Threshold) { "Yellow" } else { "Red" })

if ($count -gt 0) {
    Write-Host ""
    Write-Host "文件位置:" -ForegroundColor Yellow
    $nulFiles | ForEach-Object {
        Write-Host "  - $($_.FullName)" -ForegroundColor Yellow
    }
}

Write-Host ""

# 判断是否超过阈值
if ($count -gt $Threshold) {
    Write-Host "🚨 警告: nul 文件数量超过阈值 ($count > $Threshold)" -ForegroundColor Red
    Write-Host "建议立即执行清理:" -ForegroundColor Red
    Write-Host "  1. 停止所有服务 (taskkill /F /IM node.exe)" -ForegroundColor Red
    Write-Host "  2. 清理 nul 文件 (Get-ChildItem -Filter 'nul' -Recurse | Remove-Item -Force)" -ForegroundColor Red
    Write-Host "  3. 检查批处理文件 (grep '> nul' *.bat)" -ForegroundColor Red
    Write-Host ""

    # 记录到日志
    $logFile = Join-Path $ProjectRoot "nul_monitor.log"
    $logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ALERT: $count nul files detected (threshold: $Threshold)"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host "已记录到日志: $logFile" -ForegroundColor Red

    exit 1
} elseif ($count -gt 0) {
    Write-Host "⚠️  提示: 发现 $count 个 nul 文件（未超过阈值）" -ForegroundColor Yellow
    Write-Host "继续监控中..." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "✅ 系统正常，无 nul 文件" -ForegroundColor Green
    exit 0
}
