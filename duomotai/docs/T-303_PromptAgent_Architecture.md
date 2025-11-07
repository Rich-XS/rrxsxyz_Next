# T-303 Prompt-Agent 架构设计文档

**版本**: v1.0
**日期**: 2025-10-12
**作者**: Claude Code
**优先级**: P0（阶段三核心任务）

---

## 1. 背景与问题

### 1.1 当前问题

**现状分析**（基于 `debateEngine.js` 代码审查）：

当前有 4 个核心提示词构建函数：
1. `buildLeaderPlanningPrompt()` - 领袖策划阶段（Lines 522-595）
2. `buildLeaderOpeningPrompt()` - 领袖开场（Lines 1389-1496）
3. `buildRoleSpeechPrompt()` - 专家发言（Lines 1505-1627）
4. `buildLeaderSummaryPrompt()` - 领袖总结（Lines 1632-1687）

**存在问题**：
1. ❌ **维护困难**：提示词硬编码在业务逻辑中，修改需要改多处代码
2. ❌ **无版本控制**：无法追踪提示词的演进历史和回滚
3. ❌ **无法A/B测试**：无法快速切换不同版本的提示词进行效果对比
4. ❌ **复用性差**：其他模块（如 summaryEngine）无法复用提示词逻辑
5. ❌ **成本优化难**：无法统一管理提示词的复杂度和长度，难以优化 Token 消耗
6. ❌ **测试困难**：提示词与业务逻辑耦合，单元测试困难

### 1.2 目标

**核心目标**：
- ✅ **模板化**：所有提示词抽象为可复用的模板
- ✅ **版本化**：支持多版本管理和快速切换
- ✅ **参数化**：通过参数动态填充，分离逻辑与内容
- ✅ **可测试**：易于单元测试和A/B测试
- ✅ **成本优化**：统一 Token 估算和自动裁剪机制

**次要目标**：
- 🔄 支持模板组合和继承
- 🔄 支持多语言（中文/英文）
- 🔄 提供可视化管理界面（未来）

---

## 2. 架构设计

### 2.1 核心组件

```
┌─────────────────────────────────────────────┐
│         PromptAgent (核心引擎)               │
│  ┌───────────────────────────────────────┐  │
│  │   Template Registry                   │  │
│  │   - 模板注册表                        │  │
│  │   - Map<templateId, Template[]>       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   Version Manager                     │  │
│  │   - 版本管理器                        │  │
│  │   - getLatest() / getVersion()        │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   Generator                           │  │
│  │   - 提示词生成器                      │  │
│  │   - generate(id, params, version)     │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   Optimizer                           │  │
│  │   - Token 估算                        │  │
│  │   - 自动裁剪                          │  │
│  │   - 缓存机制                          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                     ↓ ↑
┌─────────────────────────────────────────────┐
│         使用方（debateEngine.js）            │
│  const prompt = promptAgent.generate(       │
│    'leader_planning',                        │
│    { topic, background, roles, ... }         │
│  )                                           │
└─────────────────────────────────────────────┘
```

### 2.2 模板定义格式

```javascript
{
  // 基本信息
  id: 'leader_planning',
  name: '领袖策划阶段提示词',
  version: 'v1.0',

  // 参数定义
  requiredParams: ['topic', 'background', 'selectedRoles', 'rounds'],
  optionalParams: ['delegateInputs', 'userProfile'],

  // 模板函数（返回完整提示词）
  template: (params) => {
    const { topic, background, selectedRoles, rounds } = params;
    return `你现在是"多魔汰风暴辩论系统"中的核心角色【领袖(委托代理)】。

你的任务是：根据委托人提供的项目背景和辩论需求，立刻为接下来的 ${rounds} 轮风暴辩论制定一个详细且具有高度落地实效的初步作战规划方案。

**核心议题**：${topic}
**背景信息**：${background || '无'}
...
`;
  },

  // AI 调用参数
  maxTokens: 2000,
  temperature: 0.6,

  // 元数据
  metadata: {
    author: 'system',
    createdAt: '2025-10-12',
    updatedAt: '2025-10-12',
    description: '领袖制定辩论策略的提示词，包含角色介绍、任务要求、输出格式规范',
    changelog: '初始版本'
  }
}
```

### 2.3 核心类设计

```javascript
class PromptAgent {
  constructor() {
    this.templates = new Map();  // Map<templateId, Template[]>
    this.cache = new Map();      // Map<cacheKey, { prompt, tokens, timestamp }>
    this.cacheTTL = 3600000;     // 缓存1小时
  }

  /**
   * 注册模板
   * @param {Object} template - 模板对象
   */
  registerTemplate(template) {
    const { id, version } = template;

    if (!this.templates.has(id)) {
      this.templates.set(id, []);
    }

    const versions = this.templates.get(id);

    // 检查版本是否已存在
    const existingIndex = versions.findIndex(t => t.version === version);
    if (existingIndex >= 0) {
      versions[existingIndex] = template; // 覆盖
    } else {
      versions.push(template);
    }

    // 按版本号排序
    versions.sort((a, b) => this._compareVersions(a.version, b.version));
  }

  /**
   * 生成提示词
   * @param {string} templateId - 模板ID
   * @param {Object} params - 参数对象
   * @param {string} version - 版本号（默认'latest'）
   * @returns {Object} { prompt, tokens, metadata }
   */
  generate(templateId, params = {}, version = 'latest') {
    // 1. 获取模板
    const template = this.getTemplate(templateId, version);

    if (!template) {
      throw new Error(`Template not found: ${templateId}@${version}`);
    }

    // 2. 验证参数
    this._validateParams(params, template.requiredParams);

    // 3. 检查缓存
    const cacheKey = this._generateCacheKey(templateId, params, version);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`✅ [PromptAgent] 使用缓存: ${templateId}@${version}`);
      return cached;
    }

    // 4. 生成提示词
    const prompt = template.template(params);

    // 5. Token 估算
    const tokens = this.estimateTokens(prompt);

    // 6. 缓存结果
    const result = {
      prompt,
      tokens,
      metadata: {
        templateId,
        version: template.version,
        maxTokens: template.maxTokens,
        temperature: template.temperature
      }
    };

    this.cache.set(cacheKey, { ...result, timestamp: Date.now() });

    console.log(`✅ [PromptAgent] 生成提示词: ${templateId}@${version} (${tokens} tokens)`);

    return result;
  }

  /**
   * 获取模板
   * @param {string} templateId - 模板ID
   * @param {string} version - 版本号（'latest' 或具体版本）
   * @returns {Object|null} 模板对象
   */
  getTemplate(templateId, version = 'latest') {
    const versions = this.templates.get(templateId);

    if (!versions || versions.length === 0) {
      return null;
    }

    if (version === 'latest') {
      return versions[versions.length - 1]; // 返回最新版本
    }

    return versions.find(t => t.version === version) || null;
  }

  /**
   * 列出所有版本
   * @param {string} templateId - 模板ID
   * @returns {Array} 版本列表
   */
  listVersions(templateId) {
    const versions = this.templates.get(templateId);
    return versions ? versions.map(t => t.version) : [];
  }

  /**
   * Token 估算（中文约2字符=1token）
   * @param {string} prompt - 提示词
   * @returns {number} 估算的 Token 数
   */
  estimateTokens(prompt) {
    return Math.ceil(prompt.length / 2);
  }

  /**
   * 自动裁剪（保留核心内容）
   * @param {string} prompt - 原始提示词
   * @param {number} maxTokens - 最大 Token 数
   * @returns {string} 裁剪后的提示词
   */
  optimize(prompt, maxTokens) {
    const currentTokens = this.estimateTokens(prompt);

    if (currentTokens <= maxTokens) {
      return prompt;
    }

    const targetLength = maxTokens * 2; // Token 转字符数

    // 简单裁剪：保留前 80%，添加省略标记
    const trimmedLength = Math.floor(targetLength * 0.8);
    return prompt.substring(0, trimmedLength) + '\n...(内容已裁剪以优化成本)';
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ [PromptAgent] 缓存已清除');
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStats() {
    const templateCount = this.templates.size;
    const versionCount = Array.from(this.templates.values())
      .reduce((sum, versions) => sum + versions.length, 0);
    const cacheSize = this.cache.size;

    return {
      templateCount,
      versionCount,
      cacheSize,
      cacheTTL: this.cacheTTL
    };
  }

  // ========================================
  // 私有方法
  // ========================================

  /**
   * 验证参数
   */
  _validateParams(params, requiredParams) {
    const missing = requiredParams.filter(p => !(p in params));

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * 生成缓存键
   */
  _generateCacheKey(templateId, params, version) {
    const paramsStr = JSON.stringify(params);
    return `${templateId}@${version}:${paramsStr}`;
  }

  /**
   * 版本号比较（简单实现）
   */
  _compareVersions(v1, v2) {
    const parts1 = v1.replace('v', '').split('.').map(Number);
    const parts2 = v2.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 !== p2) {
        return p1 - p2;
      }
    }

    return 0;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptAgent;
}

if (typeof window !== 'undefined') {
  window.PromptAgent = PromptAgent;
}
```

---

## 3. 模板库设计

### 3.1 核心模板列表

| 模板ID | 名称 | 当前版本 | 用途 | maxTokens |
|--------|------|---------|------|-----------|
| `leader_planning` | 领袖策划提示词 | v1.0 | 策划阶段制定辩论策略 | 2000 |
| `leader_opening` | 领袖开场提示词 | v1.0 | 辩论开场介绍 | 2000（第1轮）/ 300（其他轮） |
| `role_speech` | 专家发言提示词 | v1.0 | 专家发言（轮流/补充） | 400 |
| `leader_summary` | 领袖总结提示词 | v1.0 | 单轮总结 | 700 |
| `leader_transition` | 领袖转场提示词 | v1.0 | Phase 1 → Phase 2 转场 | 300 |
| `report_summary` | 报告总结提示词 | v1.0 | 最终报告生成 | 1000 |

### 3.2 模板参数标准化

**通用参数**（所有模板）：
- `topic` - 主议题
- `background` - 项目背景
- `selectedRoles` - 选中的角色列表
- `rounds` - 辩论轮数

**角色相关参数**：
- `role` - 当前角色对象
- `roundNumber` - 当前轮次
- `roundData` - 本轮数据

**上下文参数**（可选）：
- `userProfile` - 用户画像
- `delegateInputs` - 委托人发言历史
- `relevantContext` - 对话信息数据库上下文

---

## 4. 集成方案

### 4.1 debateEngine.js 集成步骤

**Phase 1: 初始化 PromptAgent**

```javascript
class DebateEngine {
  constructor(config = {}) {
    // ... 现有代码

    // ✅ 初始化 PromptAgent
    this.promptAgent = typeof PromptAgent !== 'undefined' ? new PromptAgent() : null;

    if (this.promptAgent) {
      this._initializeTemplates(); // 注册所有模板
      console.log('✅ [T-303] PromptAgent 已初始化，模板库已加载');
    } else {
      console.warn('⚠️ [T-303] PromptAgent 未加载，使用原生提示词生成方式');
    }
  }

  _initializeTemplates() {
    // 注册 leader_planning 模板
    this.promptAgent.registerTemplate({
      id: 'leader_planning',
      name: '领袖策划阶段提示词',
      version: 'v1.0',
      requiredParams: ['topic', 'background', 'selectedRoles', 'rounds'],
      optionalParams: ['delegateInputs'],
      template: (params) => this._buildLeaderPlanningTemplate(params),
      maxTokens: 2000,
      temperature: 0.6,
      metadata: {
        author: 'system',
        createdAt: '2025-10-12',
        description: '领袖制定辩论策略的提示词'
      }
    });

    // 注册其他模板...
  }
}
```

**Phase 2: 替换现有提示词生成方法**

```javascript
// ❌ 旧方式（保留用于降级）
buildLeaderPlanningPrompt() {
  // ... 原有逻辑
}

// ✅ 新方式（使用 PromptAgent）
buildLeaderPlanningPrompt() {
  if (this.promptAgent) {
    const result = this.promptAgent.generate('leader_planning', {
      topic: this.state.topic,
      background: this.state.background,
      selectedRoles: this.state.selectedRoles,
      rounds: this.state.rounds
    });

    return result.prompt;
  }

  // 降级：使用原生方式
  return this._buildLeaderPlanningTemplate({
    topic: this.state.topic,
    background: this.state.background,
    selectedRoles: this.state.selectedRoles,
    rounds: this.state.rounds
  });
}

// 将原有逻辑抽取为模板函数
_buildLeaderPlanningTemplate(params) {
  const { topic, background, selectedRoles, rounds } = params;

  const rolesInfo = selectedRoles
    .map(id => {
      const role = this.roles.find(r => r.id === id);
      return role ? `${role.shortName}（${role.description}）` : '';
    })
    .filter(Boolean)
    .join('、');

  return `你现在是"多魔汰风暴辩论系统"中的核心角色【领袖(委托代理)】。

你的任务是：根据委托人提供的项目背景和辩论需求，立刻为接下来的 ${rounds} 轮风暴辩论制定一个详细且具有高度落地实效的初步作战规划方案。

**核心议题**：${topic}
**背景信息**：${background || '无'}
**参与角色阵容**：${rolesInfo}（共${selectedRoles.length}位专家）
...
`;
}
```

### 4.2 向后兼容策略

1. **降级机制**：如果 PromptAgent 未加载，自动使用原生方式
2. **逐步迁移**：先迁移核心模板，再迁移次要模板
3. **AB测试**：支持同时运行新旧版本，对比效果

---

## 5. 成本优化

### 5.1 Token 控制策略

**估算公式**：
- 中文：约 2 字符 = 1 token
- 英文：约 4 字符 = 1 token
- 混合：取平均 2.5 字符 = 1 token

**自动裁剪规则**：
1. 如果 `currentTokens > maxTokens`，触发裁剪
2. 保留核心内容（前 80%）
3. 添加省略标记
4. 记录裁剪日志（用于优化）

**缓存策略**：
- 相同参数的提示词缓存 1 小时
- 避免重复生成，节省计算资源

### 5.2 复杂度分级

| 级别 | Token 范围 | 适用场景 | 示例模板 |
|------|----------|---------|---------|
| Simple | < 500 | 简单指令、单轮总结 | `leader_transition` |
| Standard | 500-1000 | 专家发言、报告生成 | `role_speech`, `report_summary` |
| Complex | 1000-2000 | 策划、第一轮开场 | `leader_planning`, `leader_opening` |

---

## 6. 测试计划

### 6.1 单元测试

**测试文件**: `duomotai/test_promptAgent.js`

**测试用例**：
1. ✅ 模板注册和获取
2. ✅ 参数验证（缺失必填参数）
3. ✅ 提示词生成（正常场景）
4. ✅ 版本管理（latest / 指定版本）
5. ✅ Token 估算准确性
6. ✅ 缓存机制有效性
7. ✅ 自动裁剪功能

### 6.2 集成测试

**测试场景**：
1. ✅ debateEngine.js 调用 PromptAgent 生成提示词
2. ✅ 生成的提示词能正常调用 AI
3. ✅ AI 响应质量与原生方式一致
4. ✅ 降级机制正常工作（未加载 PromptAgent 时）

### 6.3 性能测试

**指标**：
- 提示词生成耗时（< 10ms）
- 缓存命中率（> 60%）
- Token 估算误差（< 10%）

---

## 7. 实施计划

### 7.1 阶段一：核心实现（2小时）

1. ✅ 创建 `promptAgent.js`（核心类）
2. ✅ 实现模板注册、生成、版本管理
3. ✅ 实现 Token 估算和缓存机制
4. ✅ 编写单元测试

### 7.2 阶段二：模板迁移（2小时）

1. ✅ 迁移 4 个核心模板到 PromptAgent
2. ✅ 在 debateEngine.js 中集成 PromptAgent
3. ✅ 保留降级机制
4. ✅ 编写集成测试

### 7.3 阶段三：验证优化（1小时）

1. ✅ 执行完整测试流程
2. ✅ 验证 Token 消耗优化效果
3. ✅ 性能基准测试
4. ✅ 版本备份

---

## 8. 交付清单

**代码文件**：
- ✅ `duomotai/src/modules/promptAgent.js`（核心引擎）
- ✅ `duomotai/test_promptAgent.js`（单元测试）
- ✅ `debateEngine.js`（集成 PromptAgent）

**文档**：
- ✅ `T-303_PromptAgent_Architecture.md`（本文档）
- ✅ `T-303_Template_Library.md`（模板库文档）

**测试报告**：
- ✅ 单元测试报告（100% 通过）
- ✅ 集成测试报告（AI 响应质量对比）
- ✅ 性能测试报告（Token 优化效果）

**备份**：
- ✅ `rrxsxyz_next_<timestamp>_T303_PromptAgent_Complete.zip`

---

## 9. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 模板生成的提示词质量下降 | 高 | 低 | AB测试对比，保留降级机制 |
| Token 估算不准确 | 中 | 中 | 基于实际调用数据校准公式 |
| 缓存导致内存占用过高 | 低 | 低 | 设置 TTL 和最大缓存数 |
| 集成后 debateEngine.js 复杂度增加 | 中 | 中 | 抽取模板函数，保持代码清晰 |

---

## 10. 未来扩展

**Phase 4（阶段四）**：
- 🔄 可视化模板编辑器
- 🔄 多语言支持（中文/英文切换）
- 🔄 模板继承和组合（复用公共部分）
- 🔄 实时 A/B 测试平台
- 🔄 基于 AI 的自动优化（根据效果自动调整提示词）

---

**文档状态**: ✅ 架构设计完成
**下一步**: 开始实施（创建 `promptAgent.js`）
**预计完成时间**: 2025-10-12 16:30

---

_Last Updated: 2025-10-12 11:45 (GMT+8)_
