# 📋 D-78 V6 实现规划 - 3 个独立环节分离

**规划时间**: 2025-10-25 21:50 (GMT+8)
**目标版本**: V6（完善流程结构）
**优先级**: P1 - 高
**预计工作量**: 5-8 小时
**基础**: 已通过 V5.6 验证确认

---

## 🎯 三个 P1 任务详解

### 📌 任务 1: 轮开场独立配置

**当前状态**: 未单独配置，包含在轮流发言开场中

**需求规格**:
- **字数范围**: 100-300 字（标准用户）/ 50-150 字（测试用户）
- **环节位置**: 步骤 1（每轮开始）
- **内容要求**:
  - 宣布进入第 X 轮
  - 说明本轮主题（从策划方案中获取）
  - 说明本轮目标和产出期望
- **参数名**: `wordLimits.leaderRoundOpening`
- **maxTokens 建议**: 600（标准）/ 300（测试）

**实现位置**: debateEngine.js
- 新增 wordLimits 配置（L39 后）
- 新增 `generateRoundOpening()` 方法
- 在 `executeRound()` 中调用（L800+ 位置）

**验证标准**:
- [ ] 控制台输出轮开场文字
- [ ] 文字长度在 50-150 字范围（测试用户）
- [ ] 包含轮数、主题、目标信息

**工作量**: 1-2 小时

---

### 📌 任务 2: 上半轮小结独立配置

**当前状态**: 包含在中场转场中

**需求规格**:
- **字数范围**: 200-400 字（标准用户）/ 100-200 字（测试用户）
- **环节位置**: 步骤 5（轮流发言完成后，中场转场前）
- **内容要求**:
  - 总结上半轮的核心观点
  - 邀请委托人进行"中场补充"
  - 为中场补充预留空间
- **参数名**: `wordLimits.leaderHalfSummary`
- **maxTokens 建议**: 800（标准）/ 400（测试）

**实现位置**: debateEngine.js
- 新增 wordLimits 配置（L39 后）
- 新增 `generateHalfSummary()` 方法
- 在 `executeRound()` 的轮流发言完成后调用（L900+ 位置）

**与中场转场的区别**:
- **上半轮小结**: 领袖总结上半轮要点，为委托人补充预留
- **中场转场**: （已存在）领袖根据委托人补充，调整下半轮重点

**验证标准**:
- [ ] 控制台输出上半轮小结文字
- [ ] 文字长度在 100-200 字范围（测试用户）
- [ ] 包含核心观点总结 + 邀请信息

**工作量**: 2-3 小时

---

### 📌 任务 3: 预总结独立配置

**当前状态**: 包含在本轮总结中

**需求规格**:
- **字数范围**: 300-500 字（标准用户）/ 150-250 字（测试用户）
- **环节位置**: 步骤 9（补充发言完成后，最终总结前）
- **内容要求**:
  - 总结下半轮的关键洞察
  - 邀请委托人进行"本轮补充"
  - 为最终总结预留空间
- **参数名**: `wordLimits.leaderPreSummary`
- **maxTokens 建议**: 1000（标准）/ 500（测试）

**实现位置**: debateEngine.js
- 新增 wordLimits 配置（L39 后）
- 新增 `generatePreSummary()` 方法
- 在 `executeRound()` 的补充发言完成后调用（L1000+ 位置）

**与最终总结的区别**:
- **预总结**: 领袖总结下半轮洞察，为委托人补充预留
- **最终总结**: （已存在）综合全部讨论，提炼共识和行动点

**验证标准**:
- [ ] 控制台输出预总结文字
- [ ] 文字长度在 150-250 字范围（测试用户）
- [ ] 包含下半轮洞察 + 邀请信息

**工作量**: 2-3 小时

---

## 🔧 实现步骤清单

### 第 1 步: 更新 wordLimits 配置

**文件**: debateEngine.js L39-44

```javascript
// 现状 (D-77 修正后)
this.wordLimits = {
  leaderOpening: this.isTestUser ? 400 : 800,
  leaderOtherRounds: this.isTestUser ? 75 : 150,
  planning: this.isTestUser ? 350 : 700,
  transition: this.isTestUser ? 125 : 250,
  summary: this.isTestUser ? 300 : 600,
};

// 修改为 (D-78)
this.wordLimits = {
  leaderOpening: this.isTestUser ? 400 : 800,
  leaderOtherRounds: this.isTestUser ? 75 : 150,
  leaderRoundOpening: this.isTestUser ? 50 : 100,      // [D-78 新增]
  leaderHalfSummary: this.isTestUser ? 100 : 200,      // [D-78 新增]
  leaderPreSummary: this.isTestUser ? 150 : 300,       // [D-78 新增]
  planning: this.isTestUser ? 350 : 700,
  transition: this.isTestUser ? 125 : 250,
  summary: this.isTestUser ? 300 : 600,
};
```

---

### 第 2 步: 创建三个独立生成方法

**在 debateEngine.js 中添加**:

```javascript
// 方法 1: 生成轮开场
async generateRoundOpening(roundNumber, roundTheme) {
  // 调用 AI 生成 100-300 字的轮开场
  // 返回文本，发送 UI 更新事件
}

// 方法 2: 生成上半轮小结
async generateHalfSummary(roundNumber, upperHalfSpeeches) {
  // 调用 AI 总结上半轮，生成 200-400 字
  // 返回文本，发送 UI 更新事件
}

// 方法 3: 生成预总结
async generatePreSummary(roundNumber, lowerHalfSpeeches) {
  // 调用 AI 总结下半轮，生成 300-500 字
  // 返回文本，发送 UI 更新事件
}
```

---

### 第 3 步: 集成到 executeRound() 流程

**修改 executeRound() 方法流程**:

```javascript
async executeRound(roundNumber) {
  // 现有步骤 1: 轮开场
  // [NEW] 新增: generateRoundOpening()  // 100-300字

  // 现有步骤 2-4: 委托人补充、上半轮开场、轮流发言

  // [NEW] 新增: generateHalfSummary()   // 200-400字
  // 现有: 委托人中场补充、中场转场

  // 现有步骤 8: 下半轮补充发言

  // [NEW] 新增: generatePreSummary()    // 300-500字
  // 现有: 委托人本轮补充、本轮总结
}
```

---

### 第 4 步: 更新 UI 事件系统

**需要发送的事件**:
```javascript
this.emit('leaderRoundOpeningGenerated', { text, roundNumber });
this.emit('leaderHalfSummaryGenerated', { text, roundNumber });
this.emit('leaderPreSummaryGenerated', { text, roundNumber });
```

---

### 第 5 步: 验证和测试

```bash
# 1. 修改代码
# 2. 运行 Gemba-Agent 测试
node scripts/gemba-agent.js

# 3. 验证检查清单
# - [ ] 轮开场: 50-150字（测试用户）
# - [ ] 上半轮小结: 100-200字（测试用户）
# - [ ] 预总结: 150-250字（测试用户）
# - [ ] 3 个新环节都有语音输出
# - [ ] 所有内容递进正确
```

---

## 📊 工作分配建议

**建议分三个 PR 提交**（便于审查）:

1. **PR-D78-1**: 轮开场配置 (1-2 小时)
   - wordLimits 新增
   - generateRoundOpening() 实现
   - Gemba 验证

2. **PR-D78-2**: 上半轮小结配置 (2-3 小时)
   - wordLimits 新增
   - generateHalfSummary() 实现
   - 集成到 executeRound()
   - Gemba 验证

3. **PR-D78-3**: 预总结配置 (2-3 小时)
   - wordLimits 新增
   - generatePreSummary() 实现
   - 集成到 executeRound()
   - 完整 3 轮 Gemba 验证

---

## 🎯 成功标准

### 代码质量
- [ ] 所有新方法遵循现有代码风格
- [ ] 错误处理完善
- [ ] 提示词质量高（参考 role_speech@v1.0）
- [ ] 无新增 console.error

### 功能完整性
- [ ] 3 个新环节都能正确生成
- [ ] 字数限制生效（含测试用户减半）
- [ ] UI 事件正确发送
- [ ] 流程连贯（无卡顿、无空白）

### 测试覆盖
- [ ] Gemba-Agent 4/4 通过
- [ ] 完整 3 轮流程验证
- [ ] 语音贯穿全程
- [ ] 内容递进正确

### 文档更新
- [ ] PRD 更新，标记 V6 完成
- [ ] progress.md 更新 D-78 决策
- [ ] 代码注释添加 [D-78]

---

## 📝 预计时间表

| 里程碑 | 时间 | 工作 |
|--------|------|------|
| D-78-1 完成 | +1-2h | 轮开场配置 |
| D-78-2 完成 | +3-5h | 上半轮小结 + 整合 |
| D-78-3 完成 | +5-8h | 预总结 + 完整验证 |
| **V6 Release** | **+5-8h** | **全部完成，Gemba 4/4** |

---

## 🚀 启动条件

✅ **已就绪**:
- 基础架构已验证 (V5.6 ✅)
- D-77 P0 修正已验证 (Gemba 4/4 ✅)
- 备份版本已创建 (54&55to56 ✅)
- 用户确认已获取 (6 项 ✅)

**准备启动 D-78 P1 任务**。

---

**规划完成**: 2025-10-25 21:50 (GMT+8)
**下一步**: 等待用户确认启动 D-78
**状态**: 🟢 系统就绪，计划完善

