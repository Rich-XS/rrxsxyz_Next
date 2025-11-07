# Knowledge Extraction Automation
# Phase 1: Extract知识提取 - 从progress.md自动提取新决策

param(
    [Parameter(Mandatory=$false)]
    [int]$LastNLines = 30,

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base\extraction_queue.json"
)

$progressMd = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\progress.md"
$decisionsJson = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base\decisions\index.json"

Write-Host "📖 读取progress.md最新记录..." -ForegroundColor Cyan

# 读取最新N条记录
$allLines = Get-Content $progressMd
$totalLines = $allLines.Count
$startLine = [Math]::Max(0, $totalLines - $LastNLines)
$recentContent = $allLines[$startLine..($totalLines-1)] -join "`n"

Write-Host "   总行数: $totalLines | 分析最近: $LastNLines 行" -ForegroundColor Gray

# 提取决策模式
$decisionPattern = '\*\*\[D-(\d+)\]\s+(.+?)\*\*'
$extractedDecisions = @()

foreach ($line in $recentContent -split "`n") {
    if ($line -match $decisionPattern) {
        $id = "D-" + $Matches[1]
        $title = $Matches[2].Trim()

        # 检查是否已存在
        $existing = Get-Content $decisionsJson -Raw | ConvertFrom-Json
        $alreadyExists = $false

        foreach ($category in $existing.categories.PSObject.Properties) {
            if ($category.Value.decisions | Where-Object { $_.id -eq $id }) {
                $alreadyExists = $true
                break
            }
        }

        if (-not $alreadyExists) {
            Write-Host "   🆕 发现新决策: $id - $title" -ForegroundColor Green
            $extractedDecisions += @{
                id = $id
                title = $title
                date = (Get-Date -Format "yyyy-MM-dd")
                source_line = $line
                status = "待分类"
            }
        }
    }
}

# 提取模式（检查重复问题）
$problemPatterns = @{}
$problemPattern = '- \*\*问题\*\*: (.+)'
foreach ($line in $recentContent -split "`n") {
    if ($line -match $problemPattern) {
        $problem = $Matches[1].Trim()
        if ($problemPatterns.ContainsKey($problem)) {
            $problemPatterns[$problem]++
        } else {
            $problemPatterns[$problem] = 1
        }
    }
}

$newPatterns = $problemPatterns.GetEnumerator() | Where-Object { $_.Value -ge 3 } | ForEach-Object {
    @{
        problem = $_.Key
        occurrences = $_.Value
        confidence = "HIGH"
        recommended_action = "提升为新模式"
    }
}

# 保存到extraction_queue.json
$extractionQueue = @{
    timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    source = "progress.md (最近 $LastNLines 行)"
    new_decisions = $extractedDecisions
    new_patterns = $newPatterns
    total_extracted = $extractedDecisions.Count + $newPatterns.Count
}

$extractionQueue | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "`n✅ 提取完成" -ForegroundColor Green
Write-Host "   新决策: $($extractedDecisions.Count)" -ForegroundColor Cyan
Write-Host "   新模式: $($newPatterns.Count)" -ForegroundColor Cyan
Write-Host "   输出: $OutputPath" -ForegroundColor Gray

return $extractionQueue
