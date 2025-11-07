# file_size_monitor.ps1
# 文件大小监控脚本 - 定期检查核心文件行数，当超过阈值时提示归档或模块化
# 创建时间: 2025-10-12
# 触发条件: 核心文件行数超过预设阈值
# 功能: 监控并提示需要归档或模块化的文件

param(
    [switch]$Report,            # 生成监控报告
    [switch]$Alert,             # 仅显示超过阈值的文件
    [string]$TargetFile = ""    # 指定监控目标文件（留空则监控所有核心文件）
)

# 配置 - 核心文件及其阈值（行数）
$CoreFiles = @(
    @{Path="D:\_100W\rrxsxyz_next\progress.md"; Threshold=800; Type="记录文件"; Action="归档"},
    @{Path="D:\_100W\rrxsxyz_next\ideas.md"; Threshold=500; Type="需求文件"; Action="归档"},
    @{Path="D:\_100W\rrxsxyz_next\CLAUDE.md"; Threshold=400; Type="配置文件"; Action="模块化"},
    @{Path="D:\_100W\rrxsxyz_next\duomotai\duomotai_architecture_v11.1_executable.md"; Threshold=1000; Type="架构文档"; Action="模块化"},
    @{Path="D:\_100W\rrxsxyz_next\duomotai\index.html"; Threshold=2500; Type="前端代码"; Action="重构"},
    @{Path="D:\_100W\rrxsxyz_next\.claude\agents\progress-recorder.md"; Threshold=500; Type="Agent配置"; Action="模块化"}
)

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$Alerts = @()

# 函数: 计算文件行数
function Get-FileLineCount {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        return 0
    }

    $Lines = Get-Content $FilePath
    return $Lines.Count
}

# 函数: 计算文件大小（KB）
function Get-FileSizeKB {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        return 0
    }

    $Size = (Get-Item $FilePath).Length / 1KB
    return [math]::Round($Size, 2)
}

# 函数: 生成状态图标
function Get-StatusIcon {
    param(
        [int]$LineCount,
        [int]$Threshold
    )

    $Ratio = $LineCount / $Threshold

    if ($Ratio -ge 1.0) {
        return "🚨"  # 超过阈值
    } elseif ($Ratio -ge 0.8) {
        return "⚠️"  # 接近阈值（80%）
    } elseif ($Ratio -ge 0.6) {
        return "📊"  # 中等水平（60-80%）
    } else {
        return "✅"  # 正常水平
    }
}

# 主流程
Write-Host "🔍 文件大小监控开始..." -ForegroundColor Cyan
Write-Host "   时间: $Timestamp" -ForegroundColor Gray
Write-Host ""

# 表格头
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ("{0,-8} {1,-40} {2,-10} {3,-10} {4,-12} {5,-10}" -f "状态", "文件路径", "行数", "大小(KB)", "阈值", "建议") -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

foreach ($File in $CoreFiles) {
    # 如果指定了 TargetFile，则仅检查该文件
    if ($TargetFile -and $File.Path -notlike "*$TargetFile*") {
        continue
    }

    $LineCount = Get-FileLineCount -FilePath $File.Path
    $SizeKB = Get-FileSizeKB -FilePath $File.Path
    $Status = Get-StatusIcon -LineCount $LineCount -Threshold $File.Threshold
    $FileName = Split-Path $File.Path -Leaf

    # 计算百分比
    $Percentage = [math]::Round(($LineCount / $File.Threshold) * 100, 0)

    # 生成建议
    if ($LineCount -gt $File.Threshold) {
        $Suggestion = "$($File.Action) (超过 $Percentage%)"
        $Color = "Red"
        $Alerts += @{File=$FileName; Lines=$LineCount; Threshold=$File.Threshold; Action=$File.Action}
    } elseif ($LineCount -gt ($File.Threshold * 0.8)) {
        $Suggestion = "接近阈值 ($Percentage%)"
        $Color = "Yellow"
    } else {
        $Suggestion = "正常 ($Percentage%)"
        $Color = "Green"
    }

    # 仅在 Alert 模式下显示超过阈值的文件
    if ($Alert -and $LineCount -le $File.Threshold) {
        continue
    }

    # 输出表格行
    Write-Host ("{0,-8} {1,-40} {2,-10} {3,-10} {4,-12} {5,-10}" -f `
        $Status, $FileName, $LineCount, $SizeKB, $File.Threshold, $Suggestion) -ForegroundColor $Color
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# 生成报告
if ($Report -or $Alerts.Count -gt 0) {
    Write-Host "📊 监控总结:" -ForegroundColor Cyan
    Write-Host "   检查文件数: $($CoreFiles.Count)" -ForegroundColor White
    Write-Host "   警告数量: $($Alerts.Count)" -ForegroundColor Yellow

    if ($Alerts.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  需要处理的文件:" -ForegroundColor Yellow
        foreach ($Alert in $Alerts) {
            Write-Host "   - $($Alert.File): $($Alert.Lines) 行（阈值 $($Alert.Threshold)）→ 建议 $($Alert.Action)" -ForegroundColor Red
        }

        # 记录到审计日志
        $LogFile = ".claude\audit.log"
        $LogEntry = "[$Timestamp] FILE_SIZE_ALERT $($Alerts.Count) files exceed threshold"
        Add-Content -Path $LogFile -Value $LogEntry

        Write-Host ""
        Write-Host "📝 警告已记录到 .claude\audit.log" -ForegroundColor Gray
    } else {
        Write-Host "✅ 所有文件大小正常" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🏁 文件大小监控完成" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 使用方法:" -ForegroundColor Cyan
Write-Host "   -Report       : 生成完整监控报告" -ForegroundColor Gray
Write-Host "   -Alert        : 仅显示超过阈值的文件" -ForegroundColor Gray
Write-Host "   -TargetFile   : 指定监控目标文件（如 'progress.md'）" -ForegroundColor Gray
