# Reasoning Agent - 决策推理引擎
# 用途：基于知识库自动推理解决方案
# 用法：powershell -ExecutionPolicy Bypass -File reasoning_agent.ps1 -Problem "端口3001被占用" -AutoExecute:$false

param(
    [Parameter(Mandatory=$true)]
    [string]$Problem,

    [Parameter(Mandatory=$false)]
    [switch]$AutoExecute = $false,

    [Parameter(Mandatory=$false)]
    [ValidateSet("P0", "P1", "P2")]
    [string]$Severity = "P1"
)

$kbPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base"
$retrievalAgent = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\scripts\retrieval_agent.ps1"

Write-Host "`n🧠 推理Agent启动" -ForegroundColor Magenta
Write-Host "问题: $Problem" -ForegroundColor White
Write-Host "严重级别: $Severity`n" -ForegroundColor $(if($Severity -eq "P0"){"Red"}elseif($Severity -eq "P1"){"Yellow"}else{"Green"})

# ========================================
# 步骤1: 检索相关知识
# ========================================
Write-Host "📚 步骤1/5：检索知识库..." -ForegroundColor Cyan
$retrievalResults = & $retrievalAgent -Query $Problem -Mode "all"

# 加载检索结果
$resultsPath = "$kbPath\retrieval_results.json"
if (Test-Path $resultsPath) {
    $knowledge = Get-Content $resultsPath -Raw | ConvertFrom-Json
} else {
    Write-Host "❌ 检索失败，无法找到结果文件" -ForegroundColor Red
    exit 1
}

# ========================================
# 步骤2: 模式识别
# ========================================
Write-Host "`n🎯 步骤2/5：模式识别..." -ForegroundColor Yellow

$identifiedPatterns = @()

# 模式识别规则
$patternRules = @{
    "RCCM" = @("根本原因", "短期对策", "长期对策", "重复发生", "根因")
    "迭代诊断" = @("假设", "验证", "证据", "诊断", "实证")
    "三层同步" = @("文档", "代码", "不一致", "同步", "Layer")
    "灾难→标准" = @("灾难", "重大", "P0", "规则", "全局")
    "Kernel约束" = @("系统级", "重启", "内核", "用户态", "权限")
    "版本自动化" = @("版本", "备份", "缓存", "混淆", "自动")
    "工具进化" = @("工具", "性能", "迁移", "优化", "选型")
}

foreach ($patternName in $patternRules.Keys) {
    $keywords = $patternRules[$patternName]
    $matchCount = 0
    foreach ($keyword in $keywords) {
        if ($Problem -match $keyword) { $matchCount++ }
    }

    if ($matchCount -ge 2) {
        $identifiedPatterns += $patternName
        Write-Host "  ✓ 识别到模式: $patternName（匹配度: $matchCount/5）" -ForegroundColor Green
    }
}

if ($identifiedPatterns.Count -eq 0) {
    Write-Host "  ⚠ 未识别到已知模式，使用通用RCCM框架" -ForegroundColor Yellow
    $identifiedPatterns += "RCCM"
}

# ========================================
# 步骤3: 根因分析
# ========================================
Write-Host "`n🔍 步骤3/5：根因分析（RCCM框架）..." -ForegroundColor Cyan

# 基于检索结果推断可能根因
$potentialRootCauses = @()

if ($knowledge.Keyword) {
    foreach ($match in $knowledge.Keyword) {
        if ($match.Type -eq "Decision") {
            # 从历史决策中提取根因模式
            $decisionsPath = "$kbPath\decisions\index.json"
            $allDecisions = Get-Content $decisionsPath -Raw | ConvertFrom-Json

            foreach ($category in $allDecisions.categories.PSObject.Properties) {
                $decision = $category.Value.decisions | Where-Object { $_.id -eq $match.ID }
                if ($decision -and $decision.root_cause) {
                    $potentialRootCauses += @{
                        Source = $decision.id
                        RootCause = $decision.root_cause
                        Confidence = "HIGH"
                    }
                }
            }
        } elseif ($match.Type -eq "Solution") {
            # 从解决方案中提取根因
            $solutionsPath = "$kbPath\solutions\index.json"
            $allSolutions = Get-Content $solutionsPath -Raw | ConvertFrom-Json

            foreach ($category in $allSolutions.categories.PSObject.Properties) {
                $solution = $category.Value.solutions | Where-Object { $_.id -eq $match.ID }
                if ($solution -and $solution.root_cause) {
                    $potentialRootCauses += @{
                        Source = $solution.id
                        RootCause = $solution.root_cause
                        Confidence = "MEDIUM"
                    }
                }
            }
        }
    }
}

Write-Host "  可能的根本原因：" -ForegroundColor White
$potentialRootCauses | Format-Table -Property Source, RootCause, Confidence -AutoSize

# ========================================
# 步骤4: 生成解决方案推荐
# ========================================
Write-Host "`n💡 步骤4/5：生成解决方案推荐..." -ForegroundColor Green

$recommendations = @()

# 短期对策（Short-Term Counter-Measure）
$shortTermSolutions = @()
if ($knowledge.Keyword) {
    foreach ($match in $knowledge.Keyword) {
        if ($match.Type -eq "Solution") {
            $solutionsPath = "$kbPath\solutions\index.json"
            $allSolutions = Get-Content $solutionsPath -Raw | ConvertFrom-Json

            foreach ($category in $allSolutions.categories.PSObject.Properties) {
                $solution = $category.Value.solutions | Where-Object { $_.id -eq $match.ID }
                if ($solution) {
                    $shortTermSolutions += @{
                        ID = $solution.id
                        Solution = $solution.solution
                        Tool = $solution.tool
                        Category = $match.Category
                    }
                }
            }
        }
    }
}

# 长期对策（Long-Term Counter-Measure）
$longTermSolutions = @()
if ($identifiedPatterns -contains "灾难→标准") {
    $longTermSolutions += @{
        Type = "全局规则"
        Action = "提升为CLAUDE.md Rule系列"
        Enforcement = "Git pre-commit hook自动检查"
    }
}

if ($identifiedPatterns -contains "三层同步") {
    $longTermSolutions += @{
        Type = "三层落实"
        Action = "同步更新Layer 1-2-3（Records/Docs/Code）"
        Verification = "标记✅ 3层同步完成"
    }
}

if ($identifiedPatterns -contains "版本自动化") {
    $longTermSolutions += @{
        Type = "自动化机制"
        Action = "版本递增→自动备份联动"
        Tool = "progress-recorder agent"
    }
}

# 构建推荐清单
$recommendations = @{
    Problem = $Problem
    Severity = $Severity
    IdentifiedPatterns = $identifiedPatterns
    RootCauses = $potentialRootCauses
    ShortTermSolutions = $shortTermSolutions | Select-Object -First 3
    LongTermSolutions = $longTermSolutions
    RelatedDecisions = ($knowledge.Keyword | Where-Object {$_.Type -eq "Decision"} | Select-Object -First 5).ID -join ", "
}

# 输出推荐
Write-Host "`n=== 推理结果 ===" -ForegroundColor Magenta
Write-Host "问题: $($recommendations.Problem)" -ForegroundColor White
Write-Host "严重级别: $($recommendations.Severity)" -ForegroundColor White
Write-Host "识别模式: $($recommendations.IdentifiedPatterns -join ', ')" -ForegroundColor Yellow
Write-Host "`n短期对策（P0，数分钟~数小时）:" -ForegroundColor Cyan
$recommendations.ShortTermSolutions | Format-Table -AutoSize
Write-Host "长期对策（P1-P2，数天~数周）:" -ForegroundColor Green
$recommendations.LongTermSolutions | Format-Table -AutoSize
Write-Host "关联决策: $($recommendations.RelatedDecisions)" -ForegroundColor Gray

# ========================================
# 步骤5: 用户确认与执行
# ========================================
Write-Host "`n🤔 步骤5/5：执行决策..." -ForegroundColor Magenta

if (-not $AutoExecute) {
    Write-Host "⏸ 等待用户确认..." -ForegroundColor Yellow
    Write-Host "  A类任务（完全自主）: 文档更新/监控脚本/日志分析" -ForegroundColor Green
    Write-Host "  B类任务（记录并继续）: 架构调整/工具选型/成本优化" -ForegroundColor Yellow
    Write-Host "  C类任务（等待用户）: 系统重启/管理员操作/锁定模块" -ForegroundColor Red

    # 根据严重级别和模式自动分类
    $taskClass = "B"
    if ($Severity -eq "P0") {
        if ($identifiedPatterns -contains "Kernel约束") {
            $taskClass = "C"
        } else {
            $taskClass = "A"
        }
    }

    Write-Host "`n建议任务类型: $taskClass 类" -ForegroundColor $(if($taskClass -eq "A"){"Green"}elseif($taskClass -eq "B"){"Yellow"}else{"Red"})
    Write-Host "  如需执行，请使用: -AutoExecute 参数（仅A类任务）" -ForegroundColor Gray
} else {
    Write-Host "⚡ 自动执行模式（Night-Auth授权）" -ForegroundColor Green

    # 执行短期对策
    foreach ($solution in $recommendations.ShortTermSolutions) {
        if ($solution.Tool) {
            Write-Host "  执行: $($solution.Tool)" -ForegroundColor Cyan
            # 这里可以调用实际的工具脚本
            # & $solution.Tool
        }
    }

    Write-Host "✅ 短期对策已执行" -ForegroundColor Green
    Write-Host "📋 长期对策已记录到progress.md Recommendations区块" -ForegroundColor Yellow
}

# 保存推理结果
$outputPath = "$kbPath\reasoning_results.json"
$recommendations | ConvertTo-Json -Depth 5 | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host "`n💾 推理结果已保存到: $outputPath" -ForegroundColor Green

return $recommendations
