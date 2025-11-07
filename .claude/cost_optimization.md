# Cost Optimization & Coding Efficiency

编码效率与成本优化机制

**预算目标**: 每天 $20，峰值不超过 $50/天

**核心原则**: 在保证编码效率和质量的基础上，尽可能节省成本

---

## 1. AI 模型选择与使用策略

**多模型降级链（server/services/aiService.js）**：
```
DeepSeek API（主） → Qwen API（备） → OpenAI API（后备） → JS Fallback（离线）
```

**成本对比**：
- **DeepSeek**: 免费额度（每月 1M tokens），超额后 ¥0.5/1M tokens
- **Qwen**: 免费额度（每月 100万 tokens），超额后 ¥0.8/1M tokens
- **OpenAI GPT-4**: $3/1M input tokens, $15/1M output tokens（成本最高）

**优化策略**：
1. **优先使用 DeepSeek**：利用免费额度，适用于多魔汰辩论系统
2. **Qwen 作为备选**：百问自测等轻量级任务使用 Qwen
3. **OpenAI 仅作为最后备份**：避免日常使用，防止超预算
4. **JS Fallback**：基于 roles.js 本地模板，完全免费（质量较低）

**成本监控机制**：
```javascript
// 建议在 server/services/aiService.js 中添加 token 计数器
class TokenTracker {
  constructor() {
    this.daily = { deepseek: 0, qwen: 0, openai: 0 };
    this.threshold = { daily: 20, peak: 50 }; // 美元
  }

  track(model, tokens) {
    this.daily[model] += tokens;
    const cost = this.calculateCost(model, tokens);

    if (cost > this.threshold.peak) {
      console.warn(`⚠️ 成本接近峰值: $${cost}`);
      // 发送邮件通知或切换到免费模型
    }
  }
}
```

---

## 2. 代码结构与逻辑优化

**优化原则**：
- **单一职责**：每个函数只做一件事，减少重复代码
- **懒加载**：前端组件按需加载，避免一次性加载所有模块
- **缓存策略**：
  - LocalStorage 缓存用户数据（百问自测答案）
  - SessionStorage 缓存临时状态（多魔汰辩论进度）
  - 后端 JSON 文件缓存（避免频繁数据库查询）

**示例 - 避免重复 AI 调用**：
```javascript
// ❌ 错误：每次都调用 AI
async function getSummary() {
  return await callAI('生成总结');
}

// ✅ 正确：缓存结果
const summaryCache = {};
async function getSummary(key) {
  if (summaryCache[key]) return summaryCache[key];
  const result = await callAI('生成总结');
  summaryCache[key] = result;
  return result;
}
```

**代码复用**：
- `userAuth.js`：百问自测和多魔汰共享同一认证模块
- `aiService.js`：统一 AI 调用接口，避免重复实现

---

## 3. 测试与调试方法

**测试策略**：
- **单元测试**：使用 Node.js 内置 `assert` 模块，无需额外依赖
- **集成测试**：使用 `curl` 测试 API 端点，免费且快速
- **前端测试**：浏览器 DevTools + 手动测试（测试账号 13917895758）

**调试优化**：
```javascript
// ✅ 使用环境变量控制日志级别
const DEBUG = process.env.NODE_ENV === 'development';

function log(message) {
  if (DEBUG) console.log(message); // 生产环境自动关闭，节省性能
}
```

**成本节省技巧**：
- **本地测试优先**：使用 Python HTTP Server（免费）而非云服务器
- **模拟 AI 响应**：开发时使用 Mock 数据，避免频繁调用 AI API
- **批量测试**：一次测试多个场景，减少启动开销

---

## 4. 代码管理与记录

**版本控制**：
- **Git 私有仓库**：免费（GitHub/GitLab），确保代码安全
- **备份策略**：
  - 本地备份：`scripts/TaskDone_BackUp_Exclude.ps1`（免费）
  - 云备份：OneDrive（每月 ¥7，1TB 存储）

**文档管理**：
- **progress.md**：项目记忆管理，通过 progress-recorder agent 自动更新
- **CLAUDE.md**：项目配置和规则，增量融合更新
- **chatlogs/**：重要对话记录，成本为 0

**成本优化记录**：
```markdown
# progress.md Notes 区示例
- [2025-10-10 12:30] **成本优化记录**:
  - Token 消耗: DeepSeek 5000 tokens ($0.075)
  - 总成本: $0.50/天
  - 优化措施: 启用缓存机制，减少重复 AI 调用
```

---

## 5. 成本监控与报警机制（待实现 - P2）

**每日成本报告**（建议实现）：
```javascript
// server/services/costTracker.js
class CostTracker {
  async generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      models: {
        deepseek: { tokens: 5000, cost: 0.075 },
        qwen: { tokens: 2000, cost: 0.016 },
        openai: { tokens: 0, cost: 0 }
      },
      total: 0.091,
      budget: 20,
      remaining: 19.909
    };

    // 发送邮件报告（使用现有 emailService.js）
    if (report.total > report.budget * 0.8) {
      await sendCostAlert(report);
    }
  }
}
```

**报警阈值**：
- **80% 预算**（$16/天）：发送邮件提醒
- **100% 预算**（$20/天）：自动切换到免费模型
- **峰值接近**（$45/天）：停止所有 AI 调用，仅使用 Fallback

---

## 6. 长期成本优化路线图

**阶段一（当前）- 基础监控**：
- ✅ 多模型降级链（已实现）
- ✅ 优先使用 DeepSeek 免费额度
- ⚠️ 缺少实时成本监控（待实现）

**阶段二（1 周内）- 自动化监控**：
- [ ] 实现 TokenTracker 类（server/services/costTracker.js）
- [ ] 每日成本报告邮件
- [ ] 自动切换到免费模型

**阶段三（1 个月内）- 智能优化**：
- [ ] AI 响应缓存机制（Redis 或本地文件）
- [ ] 智能模型选择（根据任务复杂度选择最优模型）
- [ ] 批量处理优化（一次调用处理多个请求）

**预期成本节省**：
- **当前**: 预计 $0.5-$2/天（主要使用免费额度）
- **优化后**: < $0.3/天（启用缓存 + 智能选择）
- **峰值情况**: $5-$10/天（大量用户同时使用）

---

**总结**：通过多模型降级、缓存策略、本地测试优先、版本控制优化等措施，确保在 $20/天预算内高效开发，峰值不超过 $50/天。

---

## 7. Claude Code Token 节省策略（2025-10-11 D-46）

**核心原则**：实时控制 > 事后统计

### 7.1 文件读取优化（最大 Token 消耗来源）

**优化方法**：
1. ✅ 优先使用精确工具（Grep > Read）
2. ✅ 分批读取大文件（offset + limit）
3. ✅ 避免重复读取（同一文件只读一次）
4. ✅ 使用 Grep 替代 Read（查找特定内容）

**示例**：
- ❌ 错误：`Read progress.md`（585行 ≈ 1500 tokens）
- ✅ 正确：`Grep "^\[#125\]" progress.md`（< 10 tokens）
- 节省：1490 tokens（99.3%）

### 7.2 工具选择优化

**工具 Token 成本对比**：
- Grep: 极低（< 10）
- Glob: 极低（< 5）
- Bash (简单): 低（10-50）
- Read (部分): 中（50-500）
- Read (全文): 高（500-5000）
- Task (agent): 极高（2000-10000）

**决策树**：
```
需要查找内容？→ 使用 Grep
需要文件路径？→ 使用 Glob
需要完整内容？→ 使用 Read（仅第一次）
需要多步骤任务？→ 使用 Agent（限制使用）
```

### 7.3 响应简洁化（减少 Output Tokens）

**注意**：Output tokens 成本是 Input tokens 的 5 倍（$15 vs $3 per 1M）

**优化方法**：
1. ✅ 避免重复说明（直接执行）
2. ✅ 批量操作合并响应
3. ✅ 使用列表替代段落

**示例**：
- ❌ 冗长段落（200 tokens）：首先，我需要更新 progress.md 文件。更新完成后...
- ✅ 简洁列表（80 tokens）：执行步骤：1. 更新 progress.md 2. 同步 ideas.md
- 节省：120 tokens（60%）

### 7.4 会话管理（定期清理上下文）

**触发时机**：
- Token > 150,000（75%）→ `>>chatlog`
- Token > 180,000（90%）→ 考虑重启
- 完成 P0/P1 任务 → `>>chatlog`
- 会话 > 2 小时 → `>>chatlog`

### 7.5 模块化设计（已实施 ✅）

**CLAUDE.md 模块化成果**：
- 原始：1246 行 ≈ 2500 tokens/message
- 优化后：282 行 ≈ 750 tokens/message
- 节省：70%（1750 tokens/message）

### 7.6 智能问题解决

**原则**：
- ✅ 先思考后行动（避免试错）
- ✅ 使用记忆优先（利用对话历史）
- ✅ 精确定位问题（Grep + Glob 组合）

### ✅ 立即执行的 10 条规则

1. 优先 Grep，避免 Read（除非必须）
2. 同一文件只读一次（利用记忆）
3. 批量操作合并响应（减少输出）
4. 使用列表替代段落（简洁表达）
5. 避免重复说明（直接执行）
6. 限制 Agent 使用（仅复杂任务）
7. Token > 150k 触发 >>chatlog（提前保存）
8. 先思考后行动（避免试错）
9. 使用 Glob 查找文件（不用 ls/find）
10. 会话 > 2 小时重启（清理上下文）

**预期效果**：
- 短期（立即）：节省 50-70% tokens
- 中期（1 周）：节省 70-80% tokens
- 长期（持续）：节省 80-90% tokens

**成本对比**：
- Claude Code (Sonnet 4.5): $3 input / $15 output per 1M tokens（主要成本，占 90%+）
- 多魔汰 AI (DeepSeek): ¥0.5/1M tokens（次要成本，占 < 10%）

**优先级**：优化 Claude Code Token 使用 >> 多魔汰 AI Token 使用

### 7.7 高级 Token 控制策略（2025-10-13 T-309 增强）

**核心目标**：在 D-46 基础上进一步强化实时控制和有效节省（非统计报告功能）

#### 7.7.1 批量并行工具调用优化

**原则**：减少来回对话次数，一次性完成多个独立操作

**优化方法**：
1. ✅ **并行读取**：需要多个文件内容时，在单次响应中并行调用多个 Read/Grep
2. ✅ **批量编辑**：相关文件修改在同一响应中完成，避免分多次对话
3. ✅ **合并验证**：完成任务后，在一次响应中完成 sync + backup + verification

**示例**：
```
❌ 低效模式（3次对话，≈ 6000 tokens）：
  响应1: Read progress.md
  响应2: Read ideas.md
  响应3: Edit both files

✅ 高效模式（1次对话，≈ 2200 tokens）：
  响应1: Read progress.md + Read ideas.md + Edit both files
  节省: 3800 tokens（63%）
```

**触发条件**：
- 任务涉及 2+ 个文件修改 → 并行处理
- 需要读取 3+ 个文件 → 单次并行读取
- Sync + Backup 流程 → 合并到一次响应

#### 7.7.2 预警提醒机制（三级预警）

**Level 1: 提示阶段（50% = 100K tokens）**
- 触发条件：Token 使用 > 100,000
- 动作：在下次任务开始时主动提示用户 Token 使用情况
- 输出格式：`📊 Token 使用: 100K/200K (50%)，建议适时 >>chatlog`

**Level 2: 警告阶段（75% = 150K tokens）**
- 触发条件：Token 使用 > 150,000
- 动作：强烈建议执行 `>>chatlog`，明确提示接近限制
- 输出格式：`⚠️ Token 使用: 150K/200K (75%)，强烈建议执行 >>chatlog`

**Level 3: 紧急阶段（90% = 180K tokens）**
- 触发条件：Token 使用 > 180,000
- 动作：自动执行 `>>chatlog`（Night-Auth 模式），或提示用户立即重启
- 输出格式：`🚨 Token 使用: 180K/200K (90%)，即将触发 auto-compact，建议立即重启`

#### 7.7.3 Night-Auth 极简输出模式

**触发条件**：当 Night-Auth 模式激活时，自动启用极简输出

**优化规则**：
1. ✅ **去除过程说明**：直接执行，不解释步骤（除非出错）
2. ✅ **精简确认信息**：用 emoji + 简短关键词替代完整句子
3. ✅ **批量任务压缩**：多个相似任务合并为一行状态
4. ✅ **避免重复提示**：相同操作不重复说明

**示例**：
```
❌ 标准模式（150 tokens）：
  现在开始执行 T-308 备份。备份脚本已准备好，参数包括...
  备份完成！文件路径为 D:\_100W\...，文件大小为 1.23 MB。
  接下来将开始 T-309 任务的实现...

✅ 极简模式（40 tokens）：
  ✅ T-308 备份完成 (1.23 MB)
  🔄 T-309 实现中...

  节省: 110 tokens（73%）
```

**适用场景**：
- Night-Auth 完全自主工作期间
- 批量任务执行（P2/P3 优先级）
- 重复性操作（sync/backup/verification）

#### 7.7.4 问题模式识别和快速响应

**核心思想**：建立常见问题→标准方案映射，减少探索性 token 消耗

**已识别模式**：
1. **文件同步问题** → 标准流程：Grep 查找 ID → Edit 标记完成 → 验证
2. **备份执行问题** → 标准方案：检查脚本路径 → 执行 PowerShell → 解析回执
3. **TODO 清理问题** → 标准方案：Grep 查找 [x] → Edit 移除 → 归档到 Done
4. **Token 超限问题** → 标准方案：立即 >>chatlog → 重启会话 → 继续任务

**实施方式**：
- 遇到已识别模式 → 直接套用标准方案（无需探索）
- 新问题 → 执行 RCCM 分析后，记录为新模式

**预期收益**：
- 减少试错次数（避免 2-3 轮对话探索）
- 节省 1000-3000 tokens/问题
- 提升问题解决速度 50-70%

#### 7.7.5 增强效果总结

**基于 D-46 的进一步优化**：
- D-46 基线：50-70%（短期）→ 70-80%（中期）→ 80-90%（长期）
- T-309 增强：+10-15% 额外节省（通过批量并行 + 极简模式 + 模式识别）

**最终预期效果**：
- **短期（T-309 实施后）**: 60-80% token 节省
- **中期（1 周后）**: 75-85% token 节省
- **长期（持续优化）**: 85-95% token 节省

**成本影响**（按 $20/天预算）：
- 当前消耗：约 $6-8/天（D-46 实施后）
- T-309 优化后：约 $4-6/天（再节省 30-40%）
- 预算余量：$14-16/天（可用于更多开发任务）

---

**Last Updated**: 2025-10-13 02:30 (GMT+8) - T-309 Token 高级控制策略增强
