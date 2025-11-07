# auto_archive.ps1
# 自动归档机制 - 当 progress.md TODO 区块 > 200 个任务时，自动归档已完成任务
# 创建时间: 2025-10-12
# 触发条件: progress.md TODO 区块任务数 > 200 或 ideas.md [x] 事项 > 100
# 功能: 自动归档到 progress.archive.md 和 ideas.archive.md

param(
    [switch]$Execute,           # 实际执行归档操作（默认为预览模式）
    [switch]$Force,             # 强制归档（忽略阈值检查）
    [string]$TargetFile = "",   # 指定归档目标文件（progress.md 或 ideas.md）
    [int]$Threshold = 200       # 任务数阈值（默认 200）
)

# 配置
$ProgressFile = "D:\_100W\rrxsxyz_next\progress.md"
$ProgressArchive = "D:\_100W\rrxsxyz_next\progress.archive.md"
$IdeasFile = "D:\_100W\rrxsxyz_next\ideas.md"
$IdeasArchive = "D:\_100W\rrxsxyz_next\ideas.archive.md"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

# 函数: 计算 TODO 任务数
function Count-TodoTasks {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        Write-Host "错误: 文件不存在 $FilePath" -ForegroundColor Red
        return 0
    }

    $Content = Get-Content $FilePath -Raw

    # 计算 progress.md 的 TODO 任务数（格式: - [ ] #ID [OPEN]）
    if ($FilePath -like "*progress.md") {
        $TodoMatches = [regex]::Matches($Content, '- \[ \] #\d+|\[ \] T-\d+')
        return $TodoMatches.Count
    }

    # 计算 ideas.md 的已完成事项数（格式: [x]#ID）
    if ($FilePath -like "*ideas.md") {
        $CompletedMatches = [regex]::Matches($Content, '\[x\]#\d+')
        return $CompletedMatches.Count
    }

    return 0
}

# 函数: 执行归档操作
function Invoke-Archive {
    param(
        [string]$SourceFile,
        [string]$ArchiveFile
    )

    Write-Host "⏳ 正在归档 $SourceFile ..." -ForegroundColor Cyan

    # 读取源文件内容
    if (!(Test-Path $SourceFile)) {
        Write-Host "错误: 源文件不存在 $SourceFile" -ForegroundColor Red
        return $false
    }

    $Content = Get-Content $SourceFile -Raw

    # 调用 progress-recorder agent 执行归档
    # 由于 PowerShell 无法直接调用 agent，这里记录归档请求到日志
    $LogFile = ".claude\audit.log"
    $LogEntry = "[$Timestamp] AUTO_ARCHIVE_REQUEST $SourceFile -> $ArchiveFile (Threshold: $Threshold)"
    Add-Content -Path $LogFile -Value $LogEntry

    Write-Host "✅ 归档请求已记录到 audit.log" -ForegroundColor Green
    Write-Host "📝 请调用 progress-recorder agent 执行归档:" -ForegroundColor Yellow
    Write-Host "   触发词: >>archive" -ForegroundColor Yellow

    return $true
}

# 主流程
Write-Host "🔍 自动归档检查开始..." -ForegroundColor Cyan
Write-Host "   时间: $Timestamp" -ForegroundColor Gray
Write-Host "   阈值: $Threshold 个任务" -ForegroundColor Gray
Write-Host ""

# 检查 progress.md
$ProgressTodoCount = Count-TodoTasks -FilePath $ProgressFile
Write-Host "📋 progress.md TODO 任务数: $ProgressTodoCount" -ForegroundColor White

if ($ProgressTodoCount -gt $Threshold -or $Force) {
    Write-Host "⚠️  超过阈值！建议归档 progress.md" -ForegroundColor Yellow

    if ($Execute) {
        Invoke-Archive -SourceFile $ProgressFile -ArchiveFile $ProgressArchive
    } else {
        Write-Host "💡 提示: 使用 -Execute 参数实际执行归档" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ progress.md 任务数正常，无需归档" -ForegroundColor Green
}

Write-Host ""

# 检查 ideas.md
$IdeasCompletedCount = Count-TodoTasks -FilePath $IdeasFile
Write-Host "📋 ideas.md 已完成事项数: $IdeasCompletedCount" -ForegroundColor White

if ($IdeasCompletedCount -gt 100 -or $Force) {
    Write-Host "⚠️  超过阈值！建议归档 ideas.md" -ForegroundColor Yellow

    if ($Execute) {
        Invoke-Archive -SourceFile $IdeasFile -ArchiveFile $IdeasArchive
    } else {
        Write-Host "💡 提示: 使用 -Execute 参数实际执行归档" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ ideas.md 已完成事项数正常，无需归档" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏁 自动归档检查完成" -ForegroundColor Cyan
