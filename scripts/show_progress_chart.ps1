# ========================================
# T-310 任务进程示意图生成器（正确格式版本）
# ========================================
# 功能：生成阶段化任务进度可视化图表（使用任务块格式）
# 使用：.\scripts\show_progress_chart.ps1
# 格式：|xxx| = 已完成, |===| = Sonnet-ONLY, |...| = 均可, |---| = Haiku优先
# ========================================

param(
    [switch]$Compact  # 紧凑模式（仅显示摘要）
)

# ========================================
# 辅助函数：计算任务宽度（基于工作量和模型效率）
# ========================================
function Get-TaskWidth {
    param(
        [double]$Hours,
        [string]$Model
    )

    $baseWidth = [Math]::Ceiling($Hours)

    switch ($Model) {
        "Haiku" {
            # Haiku 效率高，宽度缩短
            $width = [Math]::Max(2, [Math]::Ceiling($baseWidth / 1.5))
        }
        "Sonnet" {
            $width = $baseWidth
        }
        "Both" {
            # 均可，取中间值
            $width = [Math]::Ceiling($baseWidth * 0.8)
        }
    }

    return [Math]::Max(2, $width)
}

# ========================================
# 辅助函数：生成单个任务块
# ========================================
function Get-TaskBlock {
    param(
        [hashtable]$Task
    )

    $width = Get-TaskWidth -Hours $Task.Hours -Model $Task.Model

    if ($Task.Status -eq "Done") {
        $char = "x"
    }
    else {
        switch ($Task.Model) {
            "Sonnet" { $char = "=" }
            "Haiku" { $char = "-" }
            "Both" { $char = "." }
        }
    }

    return "|" + ($char * $width)
}

# ========================================
# 定义各阶段任务数据（硬编码，基于当前项目状态）
# ========================================

$stage1_tasks = @(
    @{ Name = "#018"; Hours = 0.5; Model = "Both"; Status = "Done" }
    @{ Name = "#008"; Hours = 2; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#059"; Hours = 1; Model = "Both"; Status = "Done" }
    @{ Name = "#014"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#083-S1"; Hours = 8; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#035"; Hours = 2; Model = "Haiku"; Status = "Done" }
    @{ Name = "#084"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#057"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#111"; Hours = 0.5; Model = "Haiku"; Status = "Done" }
    @{ Name = "#064"; Hours = 2; Model = "Both"; Status = "Done" }
    @{ Name = "#066"; Hours = 0.5; Model = "Haiku"; Status = "Done" }
    @{ Name = "#067"; Hours = 1; Model = "Both"; Status = "Done" }
    @{ Name = "#112"; Hours = 2; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#083"; Hours = 3; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#104"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#065"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#109"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#110"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#114"; Hours = 2; Model = "Both"; Status = "Done" }
    @{ Name = "#115-124"; Hours = 4; Model = "Both"; Status = "Done" }
    @{ Name = "#116-122"; Hours = 3; Model = "Haiku"; Status = "Done" }
    @{ Name = "#002"; Hours = 2; Model = "Both"; Status = "Done" }
)

$stage2_tasks = @(
    @{ Name = "#013"; Hours = 6; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#042-045"; Hours = 4; Model = "Sonnet"; Status = "Done" }
    @{ Name = "#128"; Hours = 2; Model = "Both"; Status = "Done" }
    @{ Name = "#127"; Hours = 1; Model = "Haiku"; Status = "Done" }
    @{ Name = "#126"; Hours = 2; Model = "Both"; Status = "Pending" }
    @{ Name = "#125"; Hours = 8; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#130"; Hours = 2; Model = "Haiku"; Status = "Pending" }
    @{ Name = "T-305"; Hours = 8; Model = "Both"; Status = "Pending" }
    @{ Name = "T-308"; Hours = 4; Model = "Both"; Status = "Pending" }
    @{ Name = "T-309"; Hours = 6; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "T-312"; Hours = 3; Model = "Haiku"; Status = "Pending" }
    @{ Name = "T-314"; Hours = 10; Model = "Sonnet"; Status = "Pending" }
)

$stage3_tasks = @(
    @{ Name = "T-302"; Hours = 5; Model = "Sonnet"; Status = "Done" }
    @{ Name = "T-304"; Hours = 4; Model = "Sonnet"; Status = "Done" }
    @{ Name = "T-303"; Hours = 6; Model = "Sonnet"; Status = "Done" }
    @{ Name = "T-311"; Hours = 2; Model = "Haiku"; Status = "Pending" }
    @{ Name = "T-313"; Hours = 2; Model = "Haiku"; Status = "Pending" }
    @{ Name = "T-306"; Hours = 8; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "T-307"; Hours = 4; Model = "Both"; Status = "Pending" }
    @{ Name = "T-310"; Hours = 3; Model = "Both"; Status = "Pending" }
    @{ Name = "#087"; Hours = 12; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#137"; Hours = 10; Model = "Sonnet"; Status = "Pending" }
)

$stage4_tasks = @(
    @{ Name = "#007"; Hours = 8; Model = "Both"; Status = "Pending" }
    @{ Name = "#009"; Hours = 6; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#010"; Hours = 8; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#076"; Hours = 12; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#086"; Hours = 15; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#095"; Hours = 10; Model = "Sonnet"; Status = "Pending" }
    @{ Name = "#024"; Hours = 20; Model = "Both"; Status = "Pending" }
    @{ Name = "#025-026"; Hours = 30; Model = "Both"; Status = "Pending" }
)

# ========================================
# 辅助函数：生成阶段进度行
# ========================================
function Get-StageProgress {
    param(
        [string]$StageName,
        [array]$Tasks
    )

    # 生成任务块
    $taskBlocks = ($Tasks | ForEach-Object { Get-TaskBlock -Task $_ }) -join ""
    $taskBlocks += "|"  # 最后一个任务的结束符

    # 计算统计
    $completed = ($Tasks | Where-Object { $_.Status -eq "Done" }).Count
    $total = $Tasks.Count
    $completionRate = if ($total -gt 0) { [Math]::Round($completed / $total * 100, 1) } else { 0 }

    $completedHours = ($Tasks | Where-Object { $_.Status -eq "Done" } | Measure-Object -Property Hours -Sum).Sum
    $totalHours = ($Tasks | Measure-Object -Property Hours -Sum).Sum

    # 对齐填充（确保任务块部分固定宽度）
    $maxBlockLength = 50
    $currentLength = $taskBlocks.Length
    $padding = " " * [Math]::Max(0, $maxBlockLength - $currentLength)

    # 构建输出行
    $stats = "(任务#: $completed/$total $([Math]::Round($completionRate, 0))%; 工作量H: $completedHours/$totalHours $([Math]::Round($completedHours/$totalHours*100, 0))%)"

    return @{
        StageName = $StageName
        TaskBlocks = $taskBlocks
        Padding = $padding
        Stats = $stats
        Completed = $completed
        Total = $total
        CompletedHours = $completedHours
        TotalHours = $totalHours
    }
}

# ========================================
# 主输出
# ========================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            📊 多魔汰项目任务进程示意图 (T-310)                      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 生成各阶段进度
$stage1 = Get-StageProgress -StageName "阶段一" -Tasks $stage1_tasks
$stage2 = Get-StageProgress -StageName "阶段二" -Tasks $stage2_tasks
$stage3 = Get-StageProgress -StageName "阶段三" -Tasks $stage3_tasks
$stage4 = Get-StageProgress -StageName "阶段四" -Tasks $stage4_tasks

# 输出各阶段（带颜色）
$stages = @($stage1, $stage2, $stage3, $stage4)

foreach ($stage in $stages) {
    $color = if ($stage.Completed -eq $stage.Total) { "Green" }
             elseif ($stage.Completed -gt 0) { "Yellow" }
             else { "White" }

    Write-Host "$($stage.StageName): " -NoNewline
    Write-Host "$($stage.TaskBlocks)$($stage.Padding)" -NoNewline -ForegroundColor $color
    Write-Host " $($stage.Stats)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# 总体统计
$totalCompleted = ($stages | Measure-Object -Property Completed -Sum).Sum
$totalTasks = ($stages | Measure-Object -Property Total -Sum).Sum
$totalCompletedHours = ($stages | Measure-Object -Property CompletedHours -Sum).Sum
$totalHours = ($stages | Measure-Object -Property TotalHours -Sum).Sum

$overallRate = [Math]::Round($totalCompleted / $totalTasks * 100, 1)
$overallHoursRate = [Math]::Round($totalCompletedHours / $totalHours * 100, 1)

Write-Host ""
Write-Host "📈 总体进度: 任务 $totalCompleted/$totalTasks ($overallRate%) | 工作量 $totalCompletedHours/$totalHours 小时 ($overallHoursRate%)" -ForegroundColor Cyan
Write-Host "⏱️  预估剩余工作量: $($totalHours - $totalCompletedHours) 小时" -ForegroundColor Cyan
Write-Host ""

# 符号说明
if (-not $Compact) {
    Write-Host "符号说明:" -ForegroundColor Yellow
    Write-Host "  x = 已完成任务" -ForegroundColor Gray
    Write-Host "  = = Sonnet-ONLY 任务" -ForegroundColor Gray
    Write-Host "  . = Sonnet-Haiku 均可任务" -ForegroundColor Gray
    Write-Host "  - = Haiku 优先任务" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
