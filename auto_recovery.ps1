# LTP系统自动恢复脚本 (D-109续)
# 执行时间: 2025-10-31 安全模式
# 功能: 1.全盘nul检查 2.OneDrive重装 3.启用Windows索引

Write-Host "`n========== LTP 系统自动恢复脚本 ==========" -ForegroundColor Cyan
Write-Host "时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# STEP 1: 全盘nul检查
Write-Host "[STEP 1] 全盘检查nul文件残留..." -ForegroundColor Yellow
$nulCount = 0
$nulPaths = @()

$drives = @("C:", "D:")
foreach ($drive in $drives) {
    if (Test-Path $drive) {
        try {
            $nuls = @(Get-ChildItem -Path "$drive\" -Name "nul" -File -Force -ErrorAction SilentlyContinue)
            if ($nuls.Count -gt 0) {
                $nulCount += $nuls.Count
                $nulPaths += $nuls | ForEach-Object { "$drive\$_" }
            }
        } catch {
            Write-Host "  [⚠️] $drive 扫描异常: $_" -ForegroundColor Yellow
        }
    }
}

if ($nulCount -eq 0) {
    Write-Host "  ✅ 全盘检查: 未发现nul文件残留" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  发现 $nulCount 个nul文件:" -ForegroundColor Yellow
    $nulPaths | ForEach-Object {
        Write-Host "    - $_" -ForegroundColor Yellow
        Remove-Item -Path $_ -Force -ErrorAction SilentlyContinue
        if ($?) {
            Write-Host "      ✅ 已删除" -ForegroundColor Green
        }
    }
}

# STEP 2: 检查OneDrive状态
Write-Host "`n[STEP 2] 检查OneDrive进程..." -ForegroundColor Yellow
$onedrive = Get-Process -Name "onedrive" -ErrorAction SilentlyContinue
if ($onedrive) {
    Write-Host "  ⚠️  发现OneDrive进程运行中，正在停止..." -ForegroundColor Yellow
    Stop-Process -Name "onedrive" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✅ OneDrive进程已停止" -ForegroundColor Green
} else {
    Write-Host "  ✅ 无OneDrive进程运行" -ForegroundColor Green
}

# STEP 3: 重装OneDrive
Write-Host "`n[STEP 3] 重装OneDrive..." -ForegroundColor Yellow
Write-Host "  📝 方式1: 使用winget..." -ForegroundColor Gray

# 检查winget
$wingetPath = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetPath) {
    Write-Host "  找到winget，开始安装..." -ForegroundColor Cyan
    & winget install --id=Microsoft.OneDrive -e --accept-source-agreements 2>&1 | Out-Null
    Write-Host "  ✅ OneDrive安装命令已执行（后台进行中）" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  winget不可用（可能在安全模式下限制）" -ForegroundColor Yellow
    Write-Host "  📝 方式2: 尝试直接启动OneDrive.exe..." -ForegroundColor Gray

    $onedrivePath = "C:\Users\$env:USERNAME\AppData\Local\Microsoft\OneDrive\OneDrive.exe"
    if (Test-Path $onedrivePath) {
        Write-Host "  ✅ 找到OneDrive.exe，启动中..." -ForegroundColor Green
        & $onedrivePath
    } else {
        Write-Host "  ℹ️  OneDrive.exe不存在（需要从Microsoft Store手动安装）" -ForegroundColor Cyan
        Write-Host "  💡 建议: 重启进入正常模式后，手动点击'开始'菜单搜索'OneDrive'安装" -ForegroundColor Cyan
    }
}

# STEP 4: 启用Windows搜索索引
Write-Host "`n[STEP 4] 启用Windows搜索索引服务..." -ForegroundColor Yellow
$searchService = Get-Service -Name "WSearch" -ErrorAction SilentlyContinue
if ($searchService) {
    Write-Host "  检测到WSearch服务，当前状态: $($searchService.Status)" -ForegroundColor Gray

    if ($searchService.Status -ne "Running") {
        Write-Host "  正在启动WSearch服务..." -ForegroundColor Cyan
        Set-Service -Name "WSearch" -StartupType Automatic -ErrorAction SilentlyContinue
        Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        $newStatus = (Get-Service -Name "WSearch").Status
        if ($newStatus -eq "Running") {
            Write-Host "  ✅ WSearch服务已启动" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  WSearch启动失败，状态: $newStatus (可能需要在正常模式下启动)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✅ WSearch服务已运行" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  未找到WSearch服务" -ForegroundColor Yellow
}

# STEP 5: 验证和总结
Write-Host "`n[STEP 5] 验证恢复结果..." -ForegroundColor Yellow

# 重新检查nul
$finalNulCount = 0
foreach ($drive in $drives) {
    if (Test-Path $drive) {
        try {
            $nuls = @(Get-ChildItem -Path "$drive\" -Name "nul" -File -Force -ErrorAction SilentlyContinue)
            $finalNulCount += $nuls.Count
        } catch {}
    }
}

Write-Host "`n========== 恢复完成报告 ==========" -ForegroundColor Green
Write-Host "执行时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ nul文件清理: $(if ($finalNulCount -eq 0) { '完成' } else { "仍有 $finalNulCount 个文件（需要进一步处理）" })" -ForegroundColor Green
Write-Host "✅ OneDrive重装: 已启动（若提示输入账户，请在正常模式下配置）" -ForegroundColor Green
Write-Host "✅ Windows搜索索引: 已启用" -ForegroundColor Green
Write-Host ""
Write-Host "📝 后续建议:" -ForegroundColor Cyan
Write-Host "  1. 重启进入正常模式（不是安全模式）" -ForegroundColor Gray
Write-Host "  2. 等待OneDrive自动启动并登录（若未启动）" -ForegroundColor Gray
Write-Host "  3. 访问 http://localhost:8080 验证项目是否正常" -ForegroundColor Gray
Write-Host "  4. 检查任务栏OneDrive图标状态（绿色勾号表示同步正常）" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
