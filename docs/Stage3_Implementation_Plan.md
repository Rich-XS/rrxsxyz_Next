# 阶段三实施计划 - 后台优化高级智能版

**创建时间**: 2025-10-12 10:45 (GMT+8)
**预计完成**: 2025-11-30
**总工作量**: 21分 (≈21-25小时)

---

## 📊 现状分析

### 已完成模块（v9 版本）

**✅ ContextDatabase（基础版）**
- 位置: `duomotai/src/modules/debateEngine.js` Lines 14-217
- 已实现功能:
  - `addSpeech()` - 添加发言并自动提取关键词和数据引用
  - `extractKeyPoints()` - 简单规则提取关键观点（建议/问题/风险）
  - `extractDataReferences()` - 提取数据引用（百分比/数字/年份）
  - `getRelevantContext()` - 三层上下文检索（myHistory + othersKeyPoints + allRounds）
  - `getControversies()` - 争议焦点检测（基于关键词频次）
  - `getDebateTimeline()` - 完整辩论时间线（用于领袖决策）
  - LocalStorage 持久化

**现有数据结构**:
```javascript
{
  speeches: [
    {
      id: "speech_1_1_timestamp",
      roleId: 1,
      roleName: "第一性原理专家",
      round: 1,
      content: "...",
      type: "speech",
      keyPoints: [
        { text: "建议...", type: "建议" },
        { text: "问题...", type: "问题" }
      ],
      dataRefs: ["30%", "2025年"],
      timestamp: "2025-10-12T10:00:00.000Z"
    }
  ],
  keyPoints: Map {
    1 => [
      { round: 1, points: [...], content: "..." },
      { round: 2, points: [...], content: "..." }
    ]
  },
  controversies: [],
  relations: []
}
```

### 待实现模块

**❌ summaryEngine** - 0% 完成
**❌ promptAgent** - 0% 完成
**❌ dataValidator** - 0% 完成

---

## 🎯 任务优先级重排

基于现有实现，重新评估任务优先级：

### **P0 - 必须完成**

| 任务ID | 模块 | 工作量 | 理由 |
|--------|------|--------|------|
| **T-302** | summaryEngine | 6分 | 最关键！解决长对话 Token 超限问题 |
| **T-304** | dataValidator | 4分 | 提升 AI 输出质量，防止编造数据 |

### **P1 - 应该完成**

| 任务ID | 模块 | 工作量 | 理由 |
|--------|------|--------|------|
| **T-303** | Prompt-Agent 模板库 | 5分 | 提升可维护性，但非紧急 |
| **T-301** | ContextDatabase 重构 | 6分 | 已有基础版本，可延后或跳过 |

**推荐执行顺序**: T-302 → T-304 → T-303 → (可选) T-301

**调整理由**:
- ContextDatabase 已有可用版本，重构优先级降低
- summaryEngine 直接解决 Token 消耗问题（最高优先级）
- dataValidator 提升输出质量（防止编造数据）
- Prompt-Agent 优化可维护性（可后置）

---

## 📋 详细实施方案

### **T-302: summaryEngine** (6分，首要任务)

**问题**: 10轮辩论后，`contextDatabase.speeches` 包含 ~80-100 条发言，导致 Token 消耗 > 5000

**目标**: 智能摘要每轮讨论，控制 10轮辩论 Token < 5000

**核心算法**:
```javascript
summarizeRound(roundData) {
  // 目标: 120-180字摘要
  // 优先保留: 数据引用 > 关键建议 > 争议点
  // 合并重复观点并计数

  const summary = {
    round: roundData.round,
    topic: roundData.topic,
    keyInsights: [], // 关键洞察（最多5条）
    dataHighlights: [], // 数据亮点（最多3条）
    controversies: [], // 争议焦点（最多2条）
    consensus: "", // 共识结论（如有）
    characterCount: 0 // 字数统计
  };

  // Step 1: 提取所有数据引用
  const allDataRefs = roundData.speeches
    .flatMap(s => s.dataRefs)
    .filter((ref, index, self) => self.indexOf(ref) === index); // 去重

  // Step 2: 提取关键建议（排除重复）
  const allSuggestions = roundData.speeches
    .flatMap(s => s.keyPoints.filter(p => p.type === '建议'))
    .reduce((acc, point) => {
      const similar = acc.find(p => similarity(p.text, point.text) > 0.7);
      if (!similar) {
        acc.push(point);
      }
      return acc;
    }, []);

  // Step 3: 提取争议焦点（被多人提及的问题）
  const problemCounts = new Map();
  roundData.speeches.forEach(s => {
    s.keyPoints.filter(p => p.type === '问题').forEach(p => {
      const key = p.text.substring(0, 20);
      problemCounts.set(key, (problemCounts.get(key) || 0) + 1);
    });
  });

  const controversies = Array.from(problemCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  // Step 4: 生成摘要文本
  summary.dataHighlights = allDataRefs.slice(0, 3);
  summary.keyInsights = allSuggestions.slice(0, 5).map(s => s.text);
  summary.controversies = controversies.map(([text, count]) => `${text}（${count}人提及）`);

  // Step 5: 字数控制（优先级裁剪）
  let text = `第${summary.round}轮：${summary.topic}\n`;
  text += `核心洞察：${summary.keyInsights.join('；')}\n`;
  text += summary.dataHighlights.length > 0 ? `数据亮点：${summary.dataHighlights.join('、')}\n` : '';
  text += summary.controversies.length > 0 ? `争议焦点：${summary.controversies.join('；')}` : '';

  summary.text = text.length > 180 ? text.substring(0, 177) + '...' : text;
  summary.characterCount = summary.text.length;

  return summary;
}
```

**集成点**:
- `debateEngine.js` 每轮结束时调用 `summaryEngine.summarizeRound(roundData)`
- 摘要结果存入 `contextDatabase.roundSummaries[]`
- `getRelevantContext()` 优先返回摘要，仅必要时返回完整发言

**文件结构**:
```
duomotai/src/modules/
├── summaryEngine.js (新增)
│   ├── summarizeRound(roundData)
│   ├── extractKeyInsights(speeches)
│   ├── detectControversies(speeches)
│   ├── trimToLength(text, maxLength)
│   └── similarity(text1, text2) // 文本相似度计算
└── debateEngine.js (修改)
    └── runRound() {
          // ... 辩论流程 ...
          const summary = summaryEngine.summarizeRound(roundData);
          this.contextDatabase.addRoundSummary(summary);
        }
```

**验收标准**:
- [ ] 10轮辩论 Token 消耗 < 5000
- [ ] 摘要字数控制在 120-180 字
- [ ] 数据引用保留率 > 90%
- [ ] 关键建议保留率 > 80%

**预计工作量**: 6分 (≈6-7小时)
- 核心算法实现: 3分
- 文本相似度计算: 1分
- 集成到 debateEngine: 1分
- 测试验证: 1分

---

### **T-304: dataValidator** (4分，次要任务)

**问题**: AI 偶尔编造数据或引用不存在的来源

**目标**: 自动校验数据引用，标注"需要验证"的内容

**核心功能**:
```javascript
class DataValidator {
  constructor() {
    // 已知可信来源白名单
    this.trustedSources = [
      '国家统计局', '世界银行', '麦肯锡', 'Gartner',
      'IDC', 'CB Insights', '艾瑞咨询', '易观分析'
    ];
  }

  /**
   * 校验发言中的数据引用
   */
  validate(speech) {
    const result = {
      validated: [],
      needsVerification: [],
      warnings: []
    };

    // 提取所有数据声明
    const dataClaims = this.extractDataClaims(speech.content);

    dataClaims.forEach(claim => {
      // 检查是否有来源标注
      const hasSource = this.hasSourceAttribution(claim);

      if (hasSource) {
        const source = this.extractSource(claim);
        if (this.trustedSources.includes(source)) {
          result.validated.push({ claim, source, confidence: 'high' });
        } else {
          result.validated.push({ claim, source, confidence: 'medium' });
        }
      } else {
        // 无来源标注，标记为需要验证
        result.needsVerification.push({
          claim,
          reason: '缺少来源标注',
          suggestion: `建议补充来源，如「根据${this.trustedSources[0]}数据...」`
        });
      }
    });

    // 检测明显不合理的数据
    const unreasonable = this.detectUnreasonableData(dataClaims);
    unreasonable.forEach(item => {
      result.warnings.push({
        claim: item,
        reason: '数据异常（数值过大/过小/不符合常识）',
        level: 'warning'
      });
    });

    return result;
  }

  /**
   * 提取数据声明（含百分比、数字、年份的句子）
   */
  extractDataClaims(content) {
    const sentences = content.match(/[^。！？]+[。！？]/g) || [];
    return sentences.filter(s =>
      /\d+[%万亿倍]/.test(s) || // 包含数字+单位
      /\d{4}年/.test(s) ||      // 包含年份
      /[增长|下降|提升]\d+/.test(s) // 包含变化趋势
    );
  }

  /**
   * 检查是否有来源标注
   */
  hasSourceAttribution(claim) {
    return /根据|来自|据|引用|显示|报告|研究|调查/.test(claim);
  }

  /**
   * 提取来源
   */
  extractSource(claim) {
    const match = claim.match(/(?:根据|来自|据|引用)([^，。]+?)(?:数据|报告|研究|调查)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 检测不合理数据（简单规则）
   */
  detectUnreasonableData(claims) {
    const unreasonable = [];

    claims.forEach(claim => {
      // 检测超过100%的百分比
      if (/\d{3,}%/.test(claim)) {
        unreasonable.push(claim);
      }

      // 检测明显过大的数字（超过1000万亿）
      if (/\d{4,}万亿/.test(claim)) {
        unreasonable.push(claim);
      }
    });

    return unreasonable;
  }
}
```

**集成点**:
- `debateEngine.js` 在 AI 返回内容后，调用 `dataValidator.validate(speech)`
- 如果有 `needsVerification` 或 `warnings`，在前端显示标注
- 保存验证结果到 `speech.validation` 字段

**前端显示**:
```html
<div class="speech-content">
  <p>根据麦肯锡研究，AI市场将在2025年增长30%。</p>
  <span class="data-badge validated">✓ 已验证来源</span>
</div>

<div class="speech-content">
  <p>预计增长150%。</p>
  <span class="data-badge warning">⚠️ 需要验证（缺少来源标注）</span>
</div>
```

**文件结构**:
```
duomotai/src/modules/
├── dataValidator.js (新增)
│   ├── validate(speech)
│   ├── extractDataClaims(content)
│   ├── hasSourceAttribution(claim)
│   ├── extractSource(claim)
│   └── detectUnreasonableData(claims)
└── debateEngine.js (修改)
    └── callAI() {
          const speech = await aiService.generateSpeech(...);
          const validation = dataValidator.validate(speech);
          speech.validation = validation;
          return speech;
        }
```

**验收标准**:
- [ ] 能够识别 > 90% 的数据声明
- [ ] 来源标注检测准确率 > 85%
- [ ] 不合理数据检测准确率 > 70%
- [ ] 前端正确显示验证标注

**预计工作量**: 4分 (≈4-5小时)
- 核心校验逻辑: 2分
- 来源提取算法: 1分
- 前端标注UI: 0.5分
- 集成测试: 0.5分

---

### **T-303: Prompt-Agent 模板库** (5分，可选任务)

**问题**: 提示词分散在代码中，难以维护和版本控制

**目标**: 统一管理提示词模板，支持版本控制和 A/B 测试

**核心功能**:
```javascript
class PromptAgent {
  constructor() {
    this.templates = new Map(); // templateId -> template versions
    this.activeVersions = new Map(); // templateId -> active version
  }

  /**
   * 注册提示词模板
   */
  register(templateId, version, template) {
    if (!this.templates.has(templateId)) {
      this.templates.set(templateId, []);
    }

    this.templates.get(templateId).push({
      version,
      template,
      createdAt: new Date().toISOString(),
      metadata: {
        author: 'system',
        description: '',
        testResults: []
      }
    });

    // 默认激活最新版本
    this.activeVersions.set(templateId, version);
  }

  /**
   * 生成提示词
   */
  generate(templateId, params) {
    const version = this.activeVersions.get(templateId);
    const templateVersions = this.templates.get(templateId);

    if (!templateVersions) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const templateObj = templateVersions.find(t => t.version === version);
    if (!templateObj) {
      throw new Error(`Version not found: ${templateId}@${version}`);
    }

    // 替换模板参数
    let prompt = templateObj.template;
    Object.entries(params).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return prompt;
  }

  /**
   * 切换活跃版本（用于 A/B 测试）
   */
  setActiveVersion(templateId, version) {
    const templateVersions = this.templates.get(templateId);
    if (!templateVersions || !templateVersions.find(t => t.version === version)) {
      throw new Error(`Invalid version: ${templateId}@${version}`);
    }

    this.activeVersions.set(templateId, version);
    console.log(`✅ Template ${templateId} active version set to ${version}`);
  }

  /**
   * 导出所有模板（用于备份/版本控制）
   */
  exportTemplates() {
    return {
      templates: Array.from(this.templates.entries()),
      activeVersions: Array.from(this.activeVersions.entries()),
      exportedAt: new Date().toISOString()
    };
  }
}
```

**模板定义示例**:
```javascript
// src/config/promptTemplates.js
export const PROMPT_TEMPLATES = {
  ROLE_SPEECH: {
    id: 'role_speech',
    versions: [
      {
        version: 'v1.0',
        template: `你是{{roleName}}，当前是第{{round}}/{{totalRounds}}轮辩论。

**主议题**: {{topic}}
**本轮焦点**: {{roundTopic}}

{{context}}

{{requirements}}`,
        metadata: {
          author: 'v8-deep-optimization',
          description: '基础角色发言模板',
          createdAt: '2025-10-03'
        }
      },
      {
        version: 'v1.1',
        template: `你是{{roleName}}，当前是第{{round}}/{{totalRounds}}轮辩论。

**主议题**: {{topic}}
**本轮焦点**: {{roundTopic}}
**用户画像**: {{userProfile}}

{{context}}

{{requirements}}

**数据化要求**: 必须引用至少1-2个数据/案例，避免空泛建议。`,
        metadata: {
          author: 'v9-data-enhancement',
          description: '增强数据化要求的角色发言模板',
          createdAt: '2025-10-10'
        }
      }
    ]
  },

  LEADER_SUMMARY: {
    id: 'leader_summary',
    versions: [
      {
        version: 'v1.0',
        template: `你是领袖(委托代理)，需要总结第{{round}}轮辩论。

**本轮议题**: {{roundTopic}}

**发言摘要**:
{{speeches}}

**总结要求**:
1. 核心洞察（3-5条）
2. 数据亮点（如有）
3. 争议焦点（如有）
4. 行动建议（2-3条）

控制在300字内。`,
        metadata: {
          author: 'v8-deep-optimization',
          description: '领袖总结模板',
          createdAt: '2025-10-03'
        }
      }
    ]
  }
};
```

**集成点**:
```javascript
// debateEngine.js
import { PromptAgent } from './modules/promptAgent.js';
import { PROMPT_TEMPLATES } from './config/promptTemplates.js';

class DebateEngine {
  constructor(config) {
    // ...
    this.promptAgent = new PromptAgent();

    // 注册所有模板
    Object.values(PROMPT_TEMPLATES).forEach(template => {
      template.versions.forEach(v => {
        this.promptAgent.register(template.id, v.version, v.template);
      });
    });
  }

  buildRoleSpeechPrompt(role, roundNumber, roundData, isSupplementary) {
    // 使用模板生成提示词
    return this.promptAgent.generate('role_speech', {
      roleName: role.shortName,
      round: roundNumber,
      totalRounds: this.state.rounds,
      topic: this.state.topic,
      roundTopic: roundData.topic,
      userProfile: this.userProfile?.getProfileText() || '',
      context: this.buildContextText(role, roundNumber),
      requirements: role.systemPrompt
    });
  }
}
```

**文件结构**:
```
duomotai/
├── src/
│   ├── config/
│   │   └── promptTemplates.js (新增)
│   └── modules/
│       ├── promptAgent.js (新增)
│       └── debateEngine.js (修改)
└── docs/
    └── Prompt_Versioning_Guide.md (新增，模板管理文档)
```

**验收标准**:
- [ ] 所有提示词模板化，集中管理
- [ ] 支持版本切换，无需修改代码
- [ ] 导出/备份功能正常
- [ ] 文档完整，易于维护

**预计工作量**: 5分 (≈5-6小时)
- PromptAgent 类实现: 2分
- 模板定义迁移: 2分
- 集成到 debateEngine: 0.5分
- 文档编写: 0.5分

---

### **T-301: ContextDatabase 重构** (6分，低优先级)

**现状**: 已在 debateEngine.js 中实现（Lines 14-217）

**潜在优化**:
1. 独立文件化 (`src/modules/contextDatabase.js`)
2. 更智能的关键词提取（使用 TF-IDF 或简单 NLP）
3. 更好的争议检测（基于语义而非关键词频次）
4. 发言关联关系分析（谁回应了谁）

**建议**:
- 阶段三可暂时跳过此任务
- 现有实现已基本满足需求
- 如有余力，可在完成 T-302/T-304/T-303 后再优化

**如需实施，预计工作量**: 6分 (≈6-7小时)

---

## 📅 实施时间线

**推荐执行顺序**: T-302 → T-304 → T-303 → (可选) T-301

| 阶段 | 任务 | 工作量 | 预计时间 | 里程碑 |
|------|------|--------|---------|--------|
| **第1周** | T-302 summaryEngine | 6分 | 2025-10-13 ~ 10-19 | Token 优化完成，10轮辩论 < 5000 tokens |
| **第2周** | T-304 dataValidator | 4分 | 2025-10-20 ~ 10-26 | 数据校验上线，输出质量提升 |
| **第3周** | T-303 Prompt-Agent | 5分 | 2025-10-27 ~ 11-02 | 提示词模板化，可维护性提升 |
| **第4周** | 测试与优化 | - | 2025-11-03 ~ 11-09 | 完整流程测试，性能调优 |
| **机动** | (可选) T-301 重构 | 6分 | 2025-11-10 ~ 11-30 | ContextDatabase 独立化 |

**阶段三验收标准** (architecture Lines 215-220):
- [ ] 10轮长对话无性能问题
- [ ] Token 消耗 < 5000/10轮
- [ ] 上下文裁剪正常工作
- [ ] 响应时间 P95 < 5秒
- [ ] 错误率 < 1% (100次调用 < 1次失败)

---

## 🎯 Next Steps (立即执行)

### **Step 1: 创建 summaryEngine.js 骨架** (今天)
```bash
# 创建文件结构
touch duomotai/src/modules/summaryEngine.js
```

### **Step 2: 实现核心算法** (本周)
1. `summarizeRound(roundData)` - 摘要生成主函数
2. `extractKeyInsights(speeches)` - 关键洞察提取
3. `detectControversies(speeches)` - 争议检测
4. `trimToLength(text, maxLength)` - 字数控制

### **Step 3: 集成到 debateEngine** (本周)
1. 修改 `runRound()` 在每轮结束时调用摘要
2. 修改 `getRelevantContext()` 优先返回摘要
3. 测试验证 Token 消耗是否降低

### **Step 4: 执行备份 + 记录进度** (里程碑)
```bash
# 备份关键词: Stage3_SummaryEngine_MVP
>>zip Stage3_SummaryEngine_MVP

# 记录进度
>>record
```

---

**Last Updated**: 2025-10-12 10:45 (GMT+8)
**Document Version**: v1.0
**Generated by**: Claude Code (Sonnet 4.5)
