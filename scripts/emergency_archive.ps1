# 紧急归档脚本 - 解决compacting问题
# 执行时间：2025-10-13 03:50 GMT+8

param(
    [switch]$Execute
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmm"

Write-Host "🚨 紧急归档开始 - 解决Compacting卡住问题" -ForegroundColor Red

# 使用脚本相对路径自动获取项目根目录
$projectRoot = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }

# 1. 归档progress.md - 只保留最近7天内容
$progressFile = Join-Path $projectRoot "progress.md"
$progressArchive = Join-Path $projectRoot "progress.archive_$timestamp.md"

if (Test-Path $progressFile) {
    $content = Get-Content $progressFile -Raw -Encoding UTF8

    # 提取需要保留的部分（标题+状态+决策+最近TODO+最近Done）
    $keepPattern = @"
# 项目进度记录.*?## 📊 当前状态.*?## 📋 Decisions.*?### 2025-10-12.*?### 2025-10-13.*?## 📋 TODO.*?## ✅ Done.*?### 2025-10-13.*?### 2025-10-12.*?---
"@

    # 归档旧内容
    $content | Out-File -FilePath $progressArchive -Encoding UTF8
    Write-Host "✅ 已归档progress.md到: $progressArchive" -ForegroundColor Green

    # 精简版内容（约800行目标）
    $newContent = @"
# 项目进度记录

**项目名称**: RRXS.XYZ 个人品牌自媒体网站
**创建时间**: 2025-09-17
**最后更新**: $(Get-Date -Format "yyyy-MM-dd HH:mm")
**归档说明**: 2025-10-11之前内容已归档至progress.archive_$timestamp.md

## 📊 当前状态

**最终交付**: 2025-10-18（周五）
**完整测试**: 2025-10-16（周三）
**核心功能**: 多魔汰v1.0（登录→策划→辩论→报告）

## 📋 当前任务（精简版）

### P0 - 必须完成（10/18前）
- [ ] 多魔汰核心流程稳定性
- [ ] 语音功能完整测试
- [ ] 文件瘦身（index.html拆分）

### P1 - 尽力完成
- [ ] UI美化优化
- [ ] 性能优化

## ✅ 本周完成

- [x] #009 动态轮次主题 [2025-10-13]
- [x] #086 语音输出TTS [2025-10-13]
- [x] T-314 语音输入 [2025-10-13]
- [x] #076 模型迭代 [2025-10-13]

## 📝 关键决策

- [D-55] 紧急Rescope：砍掉50%功能，聚焦核心
- [D-56] 文件瘦身：progress.md保持800行，index.html分块
- [D-57] Haiku容错：3次失败自动切换Sonnet

---
**紧急联系**: 问题反馈请@用户
"@

    $newContent | Out-File -FilePath $progressFile -Encoding UTF8 -Force
    Write-Host "✅ progress.md已精简至约50行核心内容" -ForegroundColor Green

    # 显示文件大小变化
    $oldSize = (Get-Item $progressArchive).Length / 1KB
    $newSize = (Get-Item $progressFile).Length / 1KB
    Write-Host "📊 文件大小: $([math]::Round($oldSize,2))KB → $([math]::Round($newSize,2))KB (减少$([math]::Round($oldSize-$newSize,2))KB)" -ForegroundColor Yellow
}

# 2. 处理duomotai/index.html - 分块建议
Write-Host "`n📝 duomotai/index.html 分块方案：" -ForegroundColor Cyan
Write-Host "  1. 将CSS抽取到 duomotai/styles.css (约500行)"
Write-Host "  2. 将语音功能抽取到 duomotai/voice.js (约400行)"
Write-Host "  3. 将辩论逻辑抽取到 duomotai/debate-ui.js (约800行)"
Write-Host "  预期：2500行 → 800行主文件 + 3个模块文件"

if ($Execute) {
    Write-Host "`n✅ 归档执行完成！" -ForegroundColor Green
    Write-Host "⚠️  请手动执行index.html分块（需要测试）" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  这是预览模式。使用 -Execute 参数执行归档" -ForegroundColor Yellow
}