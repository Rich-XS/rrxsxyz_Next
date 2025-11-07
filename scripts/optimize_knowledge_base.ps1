# Knowledge Base Optimization
# Phase 4: Optimize优化 - 基于执行结果优化知识库

param([string]$InputPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base\execution_results.json")

$kbPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base"

Write-Host "🔧 开始优化知识库..." -ForegroundColor Magenta

# 读取执行结果（如果存在）
if (Test-Path $InputPath) {
    $results = Get-Content $InputPath -Raw | ConvertFrom-Json
    $totalExecutions = $results.executions.Count
    $successRate = ($results.executions | Where-Object { $_.success }).Count / $totalExecutions * 100
    Write-Host "   执行记录: $totalExecutions 次 | 成功率: $([math]::Round($successRate, 2))%" -ForegroundColor Cyan
} else {
    Write-Host "   ℹ️  无执行结果，执行基础优化" -ForegroundColor Yellow
    $results = @{ executions = @() }
    $successRate = 100
}

# 优化1: 清理重复决策
$decisionsPath = "$kbPath\decisions\index.json"
$decisions = Get-Content $decisionsPath -Raw | ConvertFrom-Json

$allIds = @()
$duplicates = @()
foreach ($category in $decisions.categories.PSObject.Properties) {
    foreach ($decision in $category.Value.decisions) {
        if ($allIds -contains $decision.id) {
            $duplicates += $decision.id
        } else {
            $allIds += $decision.id
        }
    }
}

if ($duplicates.Count -gt 0) {
    Write-Host "   🔍 发现重复决策: $($duplicates -join ', ')" -ForegroundColor Yellow
    Write-Host "   建议手动检查并合并" -ForegroundColor Gray
}

# 优化2: 更新统计数据
$totalDecisions = 0
foreach ($category in $decisions.categories.PSObject.Properties) {
    $categoryCount = $category.Value.decisions.Count
    $totalDecisions += $categoryCount
    $category.Value.count = $categoryCount
}
$decisions.total_decisions = $totalDecisions
$decisions.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00"

# 保存更新
$decisions | ConvertTo-Json -Depth 10 | Out-File -FilePath $decisionsPath -Encoding UTF8

# 优化3: 模式准确率优化
$patternsPath = "$kbPath\patterns\index.json"
if (Test-Path $patternsPath) {
    $patterns = Get-Content $patternsPath -Raw | ConvertFrom-Json

    # 基于成功率调整模式优先级
    if ($successRate -lt 85) {
        Write-Host "   ⚠️  成功率低于85%，建议调整模式识别算法" -ForegroundColor Yellow
    }

    $patterns.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00"
    $patterns | ConvertTo-Json -Depth 10 | Out-File -FilePath $patternsPath -Encoding UTF8
}

# 优化4: 解决方案效果评估
$solutionsPath = "$kbPath\solutions\index.json"
if (Test-Path $solutionsPath) {
    $solutions = Get-Content $solutionsPath -Raw | ConvertFrom-Json

    # 标记高效解决方案
    foreach ($category in $solutions.categories.PSObject.Properties) {
        foreach ($solution in $category.Value.solutions) {
            # 基于执行结果标记
            $executionCount = ($results.executions | Where-Object { $_.solution_id -eq $solution.id }).Count
            if ($executionCount -gt 0) {
                $successCount = ($results.executions | Where-Object { $_.solution_id -eq $solution.id -and $_.success }).Count
                $solutionSuccessRate = $successCount / $executionCount * 100

                if ($solutionSuccessRate -gt 90) {
                    $solution | Add-Member -NotePropertyName "effectiveness" -NotePropertyValue "HIGH" -Force
                } elseif ($solutionSuccessRate -gt 70) {
                    $solution | Add-Member -NotePropertyName "effectiveness" -NotePropertyValue "MEDIUM" -Force
                } else {
                    $solution | Add-Member -NotePropertyName "effectiveness" -NotePropertyValue "LOW" -Force
                }
            }
        }
    }

    $solutions.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00"
    $solutions | ConvertTo-Json -Depth 10 | Out-File -FilePath $solutionsPath -Encoding UTF8
}

# 生成优化报告
$report = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    total_decisions = $totalDecisions
    duplicates_found = $duplicates.Count
    success_rate = $successRate
    optimizations = @(
        "统计数据已更新",
        "重复决策已识别（$($duplicates.Count)个）",
        "解决方案效果已评估"
    )
    recommendations = @()
}

if ($successRate -lt 85) {
    $report.recommendations += "成功率低于目标，建议检查retrieval_agent.ps1算法"
}
if ($duplicates.Count -gt 0) {
    $report.recommendations += "存在重复决策，建议手动合并"
}

$reportPath = "$kbPath\optimization_report.json"
$report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`n✅ 优化完成" -ForegroundColor Green
Write-Host "   总决策数: $totalDecisions" -ForegroundColor Cyan
Write-Host "   重复决策: $($duplicates.Count)" -ForegroundColor Yellow
Write-Host "   成功率: $([math]::Round($successRate, 2))%" -ForegroundColor Cyan
Write-Host "   报告: $reportPath" -ForegroundColor Gray

return $report
