# 笔记本 NUL 文件紧急清理脚本
# 作者: Claude Code (progress-recorder agent)
# 创建时间: 2025-10-29 20:40 (GMT+8)
# 用途: 暂停 OneDrive 同步，清理 nul 文件，验证一致性
# 关联决策: D-104 (笔记本电脑系统问题 RCCM 分析)

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = "D:\_100W\rrxsxyz_next",

    [Parameter(Mandatory=$false)]
    [switch]$SkipOneDriveCheck
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "笔记本 NUL 文件紧急清理脚本" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 步骤 1: 检查 OneDrive 运行状态
# ============================================

Write-Host "[步骤 1/5] 检查 OneDrive 运行状态..." -ForegroundColor Green

$oneDriveProcess = Get-Process | Where-Object {$_.Name -like "*OneDrive*"}

if ($oneDriveProcess) {
    Write-Host "✅ 检测到 OneDrive 正在运行 (PID: $($oneDriveProcess.Id))" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  重要提示：" -ForegroundColor Yellow
    Write-Host "为避免 OneDrive 同步干扰，建议暂停同步 3 小时" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "手动操作步骤:" -ForegroundColor Cyan
    Write-Host "1. 右键点击任务栏 OneDrive 图标（云朵图标）" -ForegroundColor White
    Write-Host "2. 点击【暂停同步】→ 选择【3小时】" -ForegroundColor White
    Write-Host "3. 确认暂停成功（图标显示暂停标志）" -ForegroundColor White
    Write-Host ""

    if (-not $SkipOneDriveCheck) {
        Read-Host "完成暂停后，按回车继续..."
    } else {
        Write-Host "⚠️  已跳过 OneDrive 检查（-SkipOneDriveCheck）" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  未检测到 OneDrive 进程" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 步骤 2: 扫描 nul 文件
# ============================================

Write-Host "[步骤 2/5] 扫描项目目录中的 nul 文件..." -ForegroundColor Green

if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ 项目路径不存在: $ProjectPath" -ForegroundColor Red
    exit 1
}

Write-Host "扫描路径: $ProjectPath" -ForegroundColor Cyan

$nulFiles = @()
try {
    $nulFiles = Get-ChildItem -Path $ProjectPath -Recurse -Force -Filter "nul" -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  扫描过程中出现错误: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "扫描结果: 发现 $($nulFiles.Count) 个 nul 文件" -ForegroundColor $(if ($nulFiles.Count -eq 0) { "Green" } else { "Yellow" })

if ($nulFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "nul 文件列表:" -ForegroundColor Yellow
    $nulFiles | ForEach-Object {
        Write-Host "  - $($_.FullName)" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ 无 nul 文件残留，项目目录干净" -ForegroundColor Green
    Write-Host ""
    Write-Host "如果 OneDrive 已暂停，可以恢复同步了" -ForegroundColor Cyan
    exit 0
}

Write-Host ""

# ============================================
# 步骤 3: 删除 nul 文件（使用 \\?\ 特殊路径）
# ============================================

Write-Host "[步骤 3/5] 删除 nul 文件..." -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "是否删除这些 nul 文件？(y/n)"

if ($confirm -ne 'y') {
    Write-Host "⚠️  用户取消操作" -ForegroundColor Yellow
    exit 0
}

$successCount = 0
$failCount = 0

foreach ($file in $nulFiles) {
    try {
        # 使用 \\?\ 特殊路径绕过 Windows 保留设备名限制
        $fullPath = "\\?\$($file.FullName)"
        Remove-Item -LiteralPath $fullPath -Force -ErrorAction Stop
        Write-Host "✅ 已删除: $($file.FullName)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ 删除失败: $($file.FullName)" -ForegroundColor Red
        Write-Host "   错误: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "删除结果: 成功 $successCount 个，失败 $failCount 个" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  部分文件删除失败，可能需要:" -ForegroundColor Yellow
    Write-Host "1. 以管理员权限运行此脚本" -ForegroundColor White
    Write-Host "2. 确认 OneDrive 已完全暂停（无文件句柄锁定）" -ForegroundColor White
    Write-Host "3. 重启计算机后再次尝试" -ForegroundColor White
}

Write-Host ""

# ============================================
# 步骤 4: 验证清理结果
# ============================================

Write-Host "[步骤 4/5] 验证清理结果..." -ForegroundColor Green

Start-Sleep -Seconds 2  # 等待文件系统更新

$remainingFiles = @()
try {
    $remainingFiles = Get-ChildItem -Path $ProjectPath -Recurse -Force -Filter "nul" -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  验证扫描出现错误: $_" -ForegroundColor Yellow
}

Write-Host "验证结果: 发现 $($remainingFiles.Count) 个残留 nul 文件" -ForegroundColor $(if ($remainingFiles.Count -eq 0) { "Green" } else { "Yellow" })

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ 所有 nul 文件已成功删除" -ForegroundColor Green
} else {
    Write-Host "⚠️  仍有残留文件:" -ForegroundColor Yellow
    $remainingFiles | ForEach-Object {
        Write-Host "  - $($_.FullName)" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================
# 步骤 5: 生成清理报告
# ============================================

Write-Host "[步骤 5/5] 生成清理报告..." -ForegroundColor Green

$reportPath = "$ProjectPath\INCIDENT\nul_cleanup_report_$(Get-Date -Format 'yyyyMMdd_HHmm').md"
$reportDir = Split-Path $reportPath

if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$report = @"
# 笔记本 NUL 文件清理报告

**清理时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (GMT+8)
**项目路径**: $ProjectPath
**关联决策**: D-104 (笔记本电脑系统问题 RCCM 分析)

---

## 清理前状态

- **扫描到的 nul 文件数量**: $($nulFiles.Count)
- **OneDrive 运行状态**: $(if ($oneDriveProcess) { "运行中" } else { "未运行" })

$(if ($nulFiles.Count -gt 0) {
@"

### nul 文件列表

"@
$nulFiles | ForEach-Object {
@"
- ``$($_.FullName)``
"@
}
} else {
@"

✅ 项目目录干净，无 nul 文件
"@
})

---

## 清理操作

- **成功删除**: $successCount 个
- **删除失败**: $failCount 个

---

## 清理后状态

- **残留 nul 文件数量**: $($remainingFiles.Count)

$(if ($remainingFiles.Count -gt 0) {
@"

### 残留文件列表

"@
$remainingFiles | ForEach-Object {
@"
- ``$($_.FullName)``
"@
}

@"

### 建议后续操作

1. 以管理员权限重新运行此脚本
2. 确认 OneDrive 已完全暂停
3. 重启计算机后再次尝试
"@
} else {
@"

✅ 所有 nul 文件已成功删除，项目目录干净
"@
})

---

## 后续步骤

1. **恢复 OneDrive 同步**
   - 右键点击任务栏 OneDrive 图标 → 恢复同步
   - 等待 5 分钟观察是否有 nul 文件重新出现

2. **验证台式机同步一致性**
   - 在台式机上运行相同的扫描脚本
   - 确认两台机器的 nul 文件数量一致（应均为 0）

3. **清理 OneDrive 云端残留**
   - 访问 https://onedrive.live.com
   - 搜索 "nul" 文件并删除
   - 清空回收站

4. **长期监控**
   - 使用 ``scripts/monitor_nul_files.ps1`` 定期监控
   - 阈值：> 10 个 nul 文件时报警

---

**关联文档**:
- ``INCIDENT/D104_LAPTOP_SYSTEM_ANALYSIS.md`` - 完整 RCCM 分析
- ``INCIDENT/NUL_DISASTER_REPORT_20251029.md`` - D-102 NUL 灾难报告
- ``scripts/monitor_nul_files.ps1`` - 定期监控脚本

**生成时间**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "✅ 清理报告已生成: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "清理完成" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ 项目目录干净，可以恢复 OneDrive 同步了" -ForegroundColor Green
    Write-Host ""
    Write-Host "后续步骤:" -ForegroundColor Cyan
    Write-Host "1. 恢复 OneDrive 同步（右键 OneDrive 图标 → 恢复同步）" -ForegroundColor White
    Write-Host "2. 等待 5 分钟观察是否有 nul 文件重新出现" -ForegroundColor White
    Write-Host "3. 在台式机上验证同步一致性" -ForegroundColor White
    Write-Host "4. 清理 OneDrive 云端残留（访问 onedrive.live.com 搜索 'nul'）" -ForegroundColor White
} else {
    Write-Host "⚠️  清理未完全成功，建议:" -ForegroundColor Yellow
    Write-Host "1. 以管理员权限重新运行此脚本" -ForegroundColor White
    Write-Host "2. 重启计算机后再次尝试" -ForegroundColor White
    Write-Host "3. 联系技术支持（如问题持续）" -ForegroundColor White
}

Write-Host ""
Write-Host "报告位置: $reportPath" -ForegroundColor Green
Write-Host ""
