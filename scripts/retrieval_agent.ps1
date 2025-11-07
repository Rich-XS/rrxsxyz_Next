# Knowledge Base Retrieval Agent
# 用途：从知识库检索决策/模式/解决方案
# 用法：powershell -ExecutionPolicy Bypass -File retrieval_agent.ps1 -Query "NUL文件" -Mode keyword

param(
    [Parameter(Mandatory=$true)]
    [string]$Query,

    [Parameter(Mandatory=$false)]
    [ValidateSet("keyword", "pattern", "similarity", "all")]
    [string]$Mode = "all",

    [Parameter(Mandatory=$false)]
    [int]$MaxResults = 5
)

$kbPath = "D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\docs\knowledge_base"
$results = @()

# ========================================
# 1. 关键词搜索（Keyword Search）
# ========================================
function Search-Keyword {
    param([string]$query)

    Write-Host "🔍 关键词搜索: $query" -ForegroundColor Cyan
    $matches = @()

    # 搜索决策库
    $decisionsPath = "$kbPath\decisions\index.json"
    if (Test-Path $decisionsPath) {
        $decisions = Get-Content $decisionsPath -Raw | ConvertFrom-Json
        foreach ($category in $decisions.categories.PSObject.Properties) {
            foreach ($decision in $category.Value.decisions) {
                $searchText = "$($decision.id) $($decision.title) $($decision.root_cause) $($decision.solution)"
                if ($searchText -match $query) {
                    $matches += @{
                        Type = "Decision"
                        ID = $decision.id
                        Title = $decision.title
                        Severity = $decision.severity
                        Category = $category.Name
                        Relevance = (Select-String -InputObject $searchText -Pattern $query -AllMatches).Matches.Count
                    }
                }
            }
        }
    }

    # 搜索解决方案库
    $solutionsPath = "$kbPath\solutions\index.json"
    if (Test-Path $solutionsPath) {
        $solutions = Get-Content $solutionsPath -Raw | ConvertFrom-Json
        foreach ($category in $solutions.categories.PSObject.Properties) {
            foreach ($solution in $category.Value.solutions) {
                $searchText = "$($solution.id) $($solution.problem) $($solution.root_cause) $($solution.solution)"
                if ($searchText -match $query) {
                    $matches += @{
                        Type = "Solution"
                        ID = $solution.id
                        Problem = $solution.problem
                        Category = $category.Name
                        Relevance = (Select-String -InputObject $searchText -Pattern $query -AllMatches).Matches.Count
                    }
                }
            }
        }
    }

    # 搜索约束库
    $constraintsPath = "$kbPath\constraints\index.json"
    if (Test-Path $constraintsPath) {
        $constraints = Get-Content $constraintsPath -Raw | ConvertFrom-Json
        foreach ($category in $constraints.categories.PSObject.Properties) {
            foreach ($constraint in $category.Value.constraints) {
                $searchText = "$($constraint.id) $($constraint.name) $($constraint.description)"
                if ($searchText -match $query) {
                    $matches += @{
                        Type = "Constraint"
                        ID = $constraint.id
                        Name = $constraint.name
                        Severity = $constraint.severity
                        Category = $category.Name
                        Relevance = (Select-String -InputObject $searchText -Pattern $query -AllMatches).Matches.Count
                    }
                }
            }
        }
    }

    return $matches | Sort-Object -Property Relevance -Descending | Select-Object -First $MaxResults
}

# ========================================
# 2. 模式匹配（Pattern Matching）
# ========================================
function Search-Pattern {
    param([string]$query)

    Write-Host "🎯 模式匹配: $query" -ForegroundColor Yellow
    $patternsPath = "$kbPath\patterns\index.json"
    $matches = @()

    if (Test-Path $patternsPath) {
        $patterns = Get-Content $patternsPath -Raw | ConvertFrom-Json

        # 模式关键词映射
        $patternKeywords = @{
            "PATTERN-1" = @("根因", "根本原因", "短期", "长期", "对策", "RCCM", "WHY")
            "PATTERN-2" = @("证据", "实证", "假设", "诊断", "迭代", "V1.0", "验证")
            "PATTERN-3" = @("三层", "同步", "文档", "代码", "Records", "Docs", "Code")
            "PATTERN-4" = @("Night-Auth", "自主", "无间断", "授权", "自动")
            "PATTERN-5" = @("灾难", "标准", "规则", "全局", "提升", "Rule")
            "PATTERN-6" = @("内核", "Kernel", "系统级", "重启", "用户态", "OS")
            "PATTERN-7" = @("版本", "备份", "自动化", "递增", "联动")
            "PATTERN-8" = @("工具", "迁移", "评估", "优化", "选型", "进化")
        }

        foreach ($pattern in $patterns.patterns) {
            $keywords = $patternKeywords[$pattern.id]
            $matchCount = 0
            foreach ($keyword in $keywords) {
                if ($query -match $keyword) { $matchCount++ }
            }

            if ($matchCount -gt 0) {
                $matches += @{
                    Type = "Pattern"
                    ID = $pattern.id
                    Name = $pattern.name
                    Description = $pattern.description
                    MatchScore = $matchCount
                    Cases = $pattern.cases.Count
                }
            }
        }
    }

    return $matches | Sort-Object -Property MatchScore -Descending | Select-Object -First $MaxResults
}

# ========================================
# 3. 相似度搜索（Similarity Search）
# ========================================
function Search-Similarity {
    param([string]$query)

    Write-Host "🔗 相似案例搜索: $query" -ForegroundColor Green
    $decisionsPath = "$kbPath\decisions\index.json"
    $matches = @()

    if (Test-Path $decisionsPath) {
        $decisions = Get-Content $decisionsPath -Raw | ConvertFrom-Json

        # 提取查询关键词
        $queryWords = $query -split '\s+' | Where-Object { $_.Length -gt 1 }

        foreach ($category in $decisions.categories.PSObject.Properties) {
            foreach ($decision in $category.Value.decisions) {
                $decisionText = "$($decision.title) $($decision.root_cause) $($decision.solution)"
                $decisionWords = $decisionText -split '\s+' | Where-Object { $_.Length -gt 1 }

                # 计算Jaccard相似度
                $intersection = ($queryWords | Where-Object { $decisionWords -contains $_ }).Count
                $union = ($queryWords + $decisionWords | Select-Object -Unique).Count
                $similarity = if ($union -gt 0) { $intersection / $union } else { 0 }

                if ($similarity -gt 0.1) {
                    $matches += @{
                        Type = "Similar Decision"
                        ID = $decision.id
                        Title = $decision.title
                        Severity = $decision.severity
                        Similarity = [math]::Round($similarity * 100, 2)
                        RelatedDecisions = $decision.lessons -join ", "
                    }
                }
            }
        }
    }

    return $matches | Sort-Object -Property Similarity -Descending | Select-Object -First $MaxResults
}

# ========================================
# 主执行逻辑
# ========================================
Write-Host "`n📚 知识库检索Agent启动" -ForegroundColor Magenta
Write-Host "查询: $Query | 模式: $Mode | 最大结果数: $MaxResults`n" -ForegroundColor Gray

switch ($Mode) {
    "keyword" { $results = Search-Keyword -query $Query }
    "pattern" { $results = Search-Pattern -query $Query }
    "similarity" { $results = Search-Similarity -query $Query }
    "all" {
        Write-Host "=== 执行全模式搜索 ===`n" -ForegroundColor White
        $keywordResults = Search-Keyword -query $Query
        $patternResults = Search-Pattern -query $Query
        $similarityResults = Search-Similarity -query $Query

        Write-Host "`n📊 检索结果汇总:" -ForegroundColor Cyan
        Write-Host "- 关键词匹配: $($keywordResults.Count) 条" -ForegroundColor White
        Write-Host "- 模式匹配: $($patternResults.Count) 条" -ForegroundColor White
        Write-Host "- 相似案例: $($similarityResults.Count) 条`n" -ForegroundColor White

        $results = @{
            Keyword = $keywordResults
            Pattern = $patternResults
            Similarity = $similarityResults
        }
    }
}

# 输出结果
if ($Mode -eq "all") {
    Write-Host "=== 关键词搜索结果 ===" -ForegroundColor Cyan
    $results.Keyword | Format-Table -AutoSize

    Write-Host "`n=== 模式匹配结果 ===" -ForegroundColor Yellow
    $results.Pattern | Format-Table -AutoSize

    Write-Host "`n=== 相似案例结果 ===" -ForegroundColor Green
    $results.Similarity | Format-Table -AutoSize
} else {
    $results | Format-Table -AutoSize
}

# 返回JSON格式（供Agent调用）
$jsonOutput = $results | ConvertTo-Json -Depth 5
$outputPath = "$kbPath\retrieval_results.json"
$jsonOutput | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host "`n✅ 结果已保存到: $outputPath" -ForegroundColor Green

return $results
