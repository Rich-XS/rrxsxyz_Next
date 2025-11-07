# Quick Start After Reboot
# 重启后快速启动验证

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "重启后验证 - Phantom 文件检查" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify phantom files
Write-Host "[1/3] 验证 Phantom 文件..." -ForegroundColor Yellow
& "D:\_100W\rrxsxyz_next\scripts\verify_nul_files.ps1"

Write-Host ""
Write-Host ""

# 2. Check Windows Search status
Write-Host "[2/3] 检查 Windows Search 状态..." -ForegroundColor Yellow
$wsearch = Get-Service -Name "WSearch"
Write-Host "      Status: $($wsearch.Status) (预期: Stopped)" -ForegroundColor $(if($wsearch.Status -eq 'Stopped'){'Green'}else{'Red'})
Write-Host "      StartType: $($wsearch.StartType) (预期: Disabled)" -ForegroundColor $(if($wsearch.StartType -eq 'Disabled'){'Green'}else{'Yellow'})

Write-Host ""
Write-Host ""

# 3. Check Claude config size
Write-Host "[3/3] 检查 Claude 配置大小..." -ForegroundColor Yellow
& "D:\_100W\rrxsxyz_next\scripts\check_claude_size.ps1"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "检查完成！请查看结果。" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "详细操作指南: D:\_100W\rrxsxyz_next\scripts\REBOOT_CHECKLIST.md" -ForegroundColor Gray
Write-Host ""

# Keep window open
Read-Host "按 Enter 关闭窗口"
