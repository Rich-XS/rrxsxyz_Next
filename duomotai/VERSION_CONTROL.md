# 多魔汰系统版本管理规则

## 版本号格式

**格式**: `VXX.Y` （例如：V55.1, V55.2）

- **XX**: 主版本号（重大功能更新或架构调整）
- **Y**: 次版本号（bug修复、小功能调整、优化）

---

## 版本号更新位置

每次修改必须更新以下**2个位置**：

### 1. 页面标题（用户可见）
**文件**: `duomotai/index.html`
**位置**: 第12行
**代码**:
```html
<h1>🎯 多魔汰风暴辩论系统 <span class="version-tag">V55.1</span></h1>
```

### 2. Console日志（开发者验证）
**文件**: `duomotai/index.html`
**位置**: 第143-147行
**代码**:
```javascript
// ✅ [VERSION CHECK] 版本验证标记 - 2025-10-26 [D-83决策]
console.log('%c🚀 多魔汰系统 V55.1 已加载！', 'color: #00ff00; font-size: 20px; font-weight: bold; background: #000; padding: 10px;');
console.log('%c包含修复: [D-83] 角色选择bug + V54流式策略回退', 'color: #ffff00; font-size: 14px;');
console.log('修复时间: 2025-10-26');
console.log('如果看到这条消息，说明V55.1版本文件已成功加载！');
```

---

## 版本号递增规则

### 次版本号递增（常规）
- Bug修复：V55.1 → V55.2
- 性能优化：V55.2 → V55.3
- 小功能调整：V55.3 → V55.4

### 主版本号递增（重大更新）
- 架构调整：V55.9 → V56.0
- 重大功能：V56.0 → V57.0
- 破坏性变更：V57.0 → V58.0

---

## 备份命名规则

**【强制】每次版本更新时，必须创建带版本号和关键词的备份**

### 命名格式
```bash
rrxsxyz_next_YYYYMMDD_HHMM_{版本号}_{更新关键词}.zip
```

### 备份命令
```bash
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\TaskDone_BackUp_Exclude.ps1" -TaskId "{版本号}" -Keyword "{关键词}" -Execute
```

### 示例
```bash
# V55.1 - 角色选择修复 + V54策略回退
rrxsxyz_next_20251026_1430_V55.1_RoleSelectionFix.zip

# V55.2 - 测试用户字数减半修复
rrxsxyz_next_20251026_0250_V55.2_TestUserWordLimit.zip
```

### 关键词命名建议
- **Bug修复**：描述问题类型（如 RoleSelectionFix, VoiceDelayFix）
- **功能新增**：描述功能（如 VoiceControl, UserProfile）
- **性能优化**：描述优化点（如 TokenOptimization, StreamingPerf）
- **策略调整**：描述策略（如 V54StreamStrategy, WordLimitDynamic）

使用驼峰命名法（CamelCase），便于识别和搜索。

---

## 版本历史记录

### V55.2 (2025-10-26)
**修复内容**：
1. [D-84] 修复测试用户字数减半未生效问题
   - 问题：测试用户专家发言仍显示完整字数（400字），未减半
   - 原因：debateEngine.js 使用硬编码 `maxTokens: 900`，未使用 `this.wordLimits` 配置
   - 修复：
     - debateEngine.js 第40-50行：新增 `expertSpeech` 字数配置（测试200字，普通400字）
     - debateEngine.js 第942行：修改为动态 `maxTokens: this.wordLimits.expertSpeech * 2`
     - debateEngine.js 第1274行：修改 Phase 2 补充发言为动态限制
     - debateEngine.js 第1851行：传递 `wordLimits` 参数到模板函数
     - promptTemplates.js 第361-367行：接收并计算动态字数范围（75%-100%）
     - promptTemplates.js 第419行：使用动态变量 `${minWords}-${maxWords}` 替代硬编码 "300-400字"

**修改文件**：
- `duomotai/src/modules/debateEngine.js` (第40-50行, 第942行, 第1274行, 第1851行)
- `duomotai/src/modules/promptTemplates.js` (第361-367行, 第419行)
- `duomotai/index.html` (第12行, 第143-147行)

**预期效果**：
- 测试用户（13917895758）：专家发言 150-200字（原400字的50%）
- 普通用户：专家发言 300-400字（保持不变）

---

### V55.1 (2025-10-26)
**修复内容**:
1. [D-83] 修复角色选择bug（promptTemplates.js）
   - 问题：测试用户选2个角色，系统使用8个
   - 原因：`safeRolesCount` 计算错误（未净化selectedRoles）
   - 修复：调整变量定义顺序，添加调试日志

2. [D-83] 回退V54流式策略（index.html）
   - 问题：实时chunk显示导致文字混乱（innerHTML+=性能问题）
   - 原因：频繁DOM操作和重新解析
   - 修复：仅显示打字机指示器，完成后一次性显示

**修改文件**:
- `duomotai/src/modules/promptTemplates.js` (第138-151行)
- `duomotai/index.html` (第12行, 第143-147行, 第422-449行)

---

## 检查清单

每次更新版本号时，确保：

- [ ] 更新 `index.html` 第12行（页面标题）
- [ ] 更新 `index.html` 第144行（console日志版本号）
- [ ] 更新 `index.html` 第145行（修复说明）
- [ ] 更新 `index.html` 第146行（修复时间）
- [ ] 在本文档记录版本历史（包括问题、原因、修复细节）
- [ ] **【强制】创建带版本号和关键词的备份** (使用 TaskDone_BackUp_Exclude.ps1)
- [ ] 更新本文档底部的 "Current Version" 和 "Next Version"

---

**Last Updated**: 2025-10-26
**Current Version**: V55.2
**Next Version**: V55.3
