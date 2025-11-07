# T-302 summaryEngine 测试计划

**创建时间**: 2025-10-12
**目标**: 验证 Token 优化效果，确保 10轮辩论 Token < 5000

---

## 📋 测试目标

### 核心验收标准（来自 Stage3_Implementation_Plan.md）
- [ ] 10轮辩论 Token 消耗 < 5000
- [ ] 摘要字数控制在 120-180 字
- [ ] 数据引用保留率 > 90%
- [ ] 关键建议保留率 > 80%

---

## 🧪 测试用例设计

### **Test Case 1: 基础功能测试**

**测试步骤**:
1. 启动本地服务器（端口 8080）
2. 访问 http://localhost:8080/duomotai/
3. 使用测试账号 `13917895758` 登录（验证码 `888888`）
4. 输入测试议题（使用默认填充内容）
5. 选择 8 个必选角色 + 2 个可选角色（共 10 个角色）
6. 设置辩论轮数为 **3轮**（快速测试）
7. 启动辩论

**预期结果**:
```
✅ [T-302] summaryEngine 已初始化，Token 优化已启用
✅ [T-302] 第1轮摘要生成完成: { characterCount: 145, tokenEstimate: 73, keyInsights: 5, dataHighlights: 3 }
✅ [T-302] 第2轮摘要生成完成: { characterCount: 162, tokenEstimate: 81, keyInsights: 5, dataHighlights: 2 }
✅ [T-302] 第3轮摘要生成完成: { characterCount: 138, tokenEstimate: 69, keyInsights: 4, dataHighlights: 3 }
✅ [T-302] 摘要已保存到 ContextDatabase，累计Token估算: 223
```

**验证点**:
- 控制台显示摘要生成日志
- 每轮摘要字数在 120-180 字范围
- Token 估算 ≈ 字数 / 2
- LocalStorage 包含 `v9_debate_context` 键

---

### **Test Case 2: LocalStorage 持久化测试**

**测试步骤**:
1. 完成 Test Case 1（3轮辩论）
2. 打开浏览器 DevTools → Application → Local Storage → http://localhost:8080
3. 查找键 `v9_debate_context`
4. 检查 JSON 结构

**预期结果**:
```json
{
  "speeches": [...],
  "keyPoints": [...],
  "controversies": [],
  "relations": [],
  "roundSummaries": [
    {
      "round": 1,
      "topic": "初始定调：当前挑战与愿景校准",
      "keyInsights": ["建议1", "建议2", "建议3", "建议4", "建议5"],
      "dataHighlights": ["30%", "2025年", "100万"],
      "controversies": ["问题1（2人提及）"],
      "consensus": "",
      "text": "第1轮：初始定调...",
      "characterCount": 145,
      "tokenEstimate": 73
    },
    {
      "round": 2,
      "topic": "...",
      ...
    },
    {
      "round": 3,
      "topic": "...",
      ...
    }
  ],
  "savedAt": "2025-10-12T10:30:00.000Z"
}
```

**验证点**:
- `roundSummaries` 数组包含 3 个元素
- 每个摘要包含完整字段（round, topic, keyInsights, dataHighlights, etc.）
- `characterCount` 在 120-180 范围
- `tokenEstimate` ≈ characterCount / 2

---

### **Test Case 3: 长辩论 Token 优化测试**

**测试步骤**:
1. 使用测试账号登录
2. 输入复杂议题（包含大量背景信息）
3. 选择 10 个角色（8 必选 + 2 可选）
4. 设置辩论轮数为 **10轮**（全面测试）
5. 启动辩论并等待完成（预计 20-30 分钟）
6. 记录每轮摘要 Token 估算
7. 计算累计 Token 消耗

**预期结果**:
```
第1轮: ~150 tokens (摘要) vs ~800 tokens (原始对话)
第2轮: ~160 tokens (摘要) vs ~850 tokens (原始对话)
...
第10轮: ~145 tokens (摘要) vs ~820 tokens (原始对话)

累计摘要 Token: ~1500 tokens
累计原始 Token: ~8200 tokens
优化比例: 1500 / 8200 = 18.3%（节省 81.7%）
✅ 符合目标：< 5000 tokens
```

**验证点**:
- 10轮辩论累计 Token < 5000
- 平均每轮摘要 Token ≈ 150
- 摘要 Token 占原始 Token 的 15-20%

---

### **Test Case 4: 数据保留率测试**

**测试步骤**:
1. 完成 3轮辩论
2. 手动检查原始 `roundData.speeches` 中的数据引用
3. 对比摘要中的 `dataHighlights` 字段
4. 计算保留率

**预期结果**:
```
第1轮原始数据: ["30%", "2025年", "100万", "50%", "艾瑞咨询2024年报告"]
摘要保留数据: ["30%", "2025年", "100万"] (前3个)
保留率: 3/5 = 60%（✅ 符合优先级规则：最多保留3个）

第2轮原始数据: ["45%", "2024年Q4"]
摘要保留数据: ["45%", "2024年Q4"]
保留率: 2/2 = 100%
```

**验证点**:
- 数据引用按优先级保留（最多3个）
- 高价值数据（百分比、年份、具体数字）优先保留
- 保留的数据准确无误（无截断/修改）

---

### **Test Case 5: 关键洞察保留率测试**

**测试步骤**:
1. 完成 3轮辩论
2. 手动检查原始发言中的"建议"类关键点
3. 对比摘要中的 `keyInsights` 字段
4. 计算保留率和去重效果

**预期结果**:
```
第1轮原始建议: 8条（可能有重复）
去重后建议: 6条
摘要保留建议: 5条（最多5条）
保留率: 5/6 = 83.3%（✅ > 80%）

第2轮原始建议: 10条
去重后建议: 7条
摘要保留建议: 5条
保留率: 5/7 = 71.4%（⚠️ < 80%，但符合"最多5条"规则）
```

**验证点**:
- 关键建议去重正确（相似度 > 0.7 的合并）
- 保留最高价值的前 5 条建议
- 建议文本完整（无截断）

---

### **Test Case 6: 文本相似度算法测试**

**测试步骤**:
1. 在浏览器控制台手动测试 `textSimilarity()` 函数:
```javascript
const engine = new SummaryEngine();

// 测试1: 完全相同
const s1 = engine.textSimilarity("建议优先考虑短期收益", "建议优先考虑短期收益");
console.log("完全相同:", s1); // 预期: 1.0

// 测试2: 高度相似
const s2 = engine.textSimilarity("建议优先考虑短期收益", "建议应优先考虑短期收益");
console.log("高度相似:", s2); // 预期: > 0.7

// 测试3: 中度相似
const s3 = engine.textSimilarity("建议优先考虑短期收益", "建议关注长期价值");
console.log("中度相似:", s3); // 预期: 0.3-0.6

// 测试4: 完全不同
const s4 = engine.textSimilarity("建议优先考虑短期收益", "数据显示增长30%");
console.log("完全不同:", s4); // 预期: < 0.3
```

**预期结果**:
- 相似度算法正确识别重复建议
- 0.7 阈值合理（能去重但不会误删）

---

## 🔍 调试要点

### 控制台日志检查清单
```
✅ [T-302] summaryEngine 已初始化，Token 优化已启用
✅ [T-302] 第X轮摘要生成完成: { characterCount: ..., tokenEstimate: ..., keyInsights: ..., dataHighlights: ... }
✅ [T-302] 摘要已保存到 ContextDatabase，累计Token估算: XXX
```

### 错误场景预警
```
⚠️ [T-302] summaryEngine 未加载，Token 优化未启用（需引入 summaryEngine.js）
⚠️ [T-302] 第X轮摘要生成失败: <error>
```

### LocalStorage 检查命令
```javascript
// 在浏览器控制台执行
const context = JSON.parse(localStorage.getItem('v9_debate_context'));
console.log('摘要数量:', context.roundSummaries.length);
console.log('累计Token估算:', context.roundSummaries.reduce((sum, s) => sum + s.tokenEstimate, 0));
console.log('摘要详情:', context.roundSummaries);
```

---

## 📊 测试报告模板

### 测试结果记录表

| 测试用例 | 状态 | Token 消耗 | 字数范围 | 数据保留率 | 建议保留率 | 备注 |
|---------|------|-----------|---------|-----------|-----------|------|
| TC1: 3轮基础测试 | ⏳ | - | - | - | - | - |
| TC2: LocalStorage | ⏳ | - | - | - | - | - |
| TC3: 10轮长辩论 | ⏳ | - | - | - | - | - |
| TC4: 数据保留率 | ⏳ | - | - | - | - | - |
| TC5: 建议保留率 | ⏳ | - | - | - | - | - |
| TC6: 相似度算法 | ⏳ | - | - | - | - | - |

### 总结
- ✅ **核心功能**: [待测试]
- ✅ **Token 优化**: [待测试]
- ✅ **数据保留**: [待测试]
- ✅ **LocalStorage**: [待测试]

---

## 🚀 执行建议

1. **快速验证**（15分钟）:
   - 运行 TC1（3轮辩论）
   - 检查控制台日志
   - 验证 LocalStorage

2. **完整测试**（45分钟）:
   - 运行 TC3（10轮辩论）
   - 手动验证数据/建议保留率
   - 生成测试报告

3. **算法验证**（10分钟）:
   - 控制台测试相似度算法
   - 调整阈值（如需要）

---

**测试负责人**: Claude Code
**创建时间**: 2025-10-12
**预计测试时间**: 1小时
**优先级**: P0（阻塞阶段三后续任务）
