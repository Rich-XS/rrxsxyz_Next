# 多魔汰系统模块化文档

**文档版本**: v1.0
**创建时间**: 2025-10-17 (GMT+8)
**适用系统**: 多魔汰风暴辩论系统 v3.0
**维护状态**: Night-Auth FULL ON 自主工作产出

---

## 📚 文档目录

- [1. 系统架构概览](#1-系统架构概览)
- [2. 核心模块详解](#2-核心模块详解)
  - [2.1 配置模块](#21-配置模块-configrolesjs)
  - [2.2 辩论引擎](#22-辩论引擎-debateenginejs)
  - [2.3 AI调用器](#23-ai调用器-aicallerjs)
  - [2.4 用户认证](#24-用户认证-userauthjs)
  - [2.5 用户画像](#25-用户画像-userprofilejs)
  - [2.6 上下文数据库](#26-上下文数据库-contextdatabasejs)
  - [2.7 报告生成器](#27-报告生成器-reportgeneratorjs)
  - [2.8 提示词代理](#28-提示词代理-promptagentjs)
  - [2.9 提示词模板](#29-提示词模板-prompttemplatesjs)
  - [2.10 摘要引擎](#210-摘要引擎-summaryenginejs)
  - [2.11 数据校验器](#211-数据校验器-datavalidatorjs)
  - [2.12 委托人处理器](#212-委托人处理器-delegatehandlerjs)
  - [2.13 语音模块](#213-语音模块-voicejs)
- [3. 模块依赖关系](#3-模块依赖关系)
- [4. 数据流与事件系统](#4-数据流与事件系统)
- [5. 扩展开发指南](#5-扩展开发指南)

---

## 1. 系统架构概览

### 1.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (UI Layer)                     │
│                  index.html + styles.css                 │
│          (事件监听、UI更新、用户交互)                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   业务逻辑层 (Business Logic)             │
│  ┌───────────────────────────────────────────────────┐  │
│  │   debateEngine.js (核心引擎)                      │  │
│  │   - 5阶段流程控制 (准备/策划/确认/辩论/交付)       │  │
│  │   - 事件发射与监听                                │  │
│  └───────────────────────────────────────────────────┘  │
│       ↓            ↓            ↓            ↓           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  AI调用  │ │委托人交互│ │  报告   │ │  数据   │       │
│  │ aiCaller│ │ delegate │ │ report  │ │ context │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  数据访问层 (Data Access)                │
│  - LocalStorage (前端数据持久化)                         │
│  - Backend API (http://localhost:3000/api/*)            │
│  - AI服务 (Qwen/DeepSeek/OpenAI)                        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块分类

**核心引擎模块**:
- `debateEngine.js` - 主控引擎，5阶段流程管理

**数据管理模块**:
- `contextDatabase.js` - 对话历史、上下文存储
- `userProfile.js` - 用户画像与行为分析
- `userAuth.js` - 用户认证与会话管理

**AI交互模块**:
- `aiCaller.js` - 统一AI服务调用接口
- `promptAgent.js` - 提示词版本管理
- `promptTemplates.js` - 提示词模板库
- `summaryEngine.js` - Token优化摘要生成

**质量保障模块**:
- `dataValidator.js` - 数据校验与质量评估

**业务逻辑模块**:
- `delegateHandler.js` - 委托人交互逻辑
- `reportGenerator.js` - 最终报告生成
- `voice.js` - 语音输入输出（TTS/ASR）

**配置模块**:
- `roles.js` - 角色定义与系统提示词

---

## 2. 核心模块详解

### 2.1 配置模块 (config/roles.js)

**职责**: 定义16个辩论角色的配置、系统提示词、层级关系

**导出变量**:
```javascript
// 主要角色数组（16个角色 + 1个领袖）
const DEBATE_ROLES = [...]

// 领袖角色（特殊角色）
const FACILITATOR_ROLE = {...}

// 必选流线（8个必选角色的发言顺序）
const REQUIRED_FLOW = [1, 2, 3, 7, 13, 14, 8, 16]
```

**角色数据结构**:
```javascript
{
  id: 1,                        // 角色ID（唯一标识）
  name: '第一性原则专家',        // 完整名称
  shortName: '第一性原则',       // 简称（UI显示）
  icon: '🧪',                   // emoji图标
  intro: '挑战假设，回归本质',  // 简介（30字内）
  description: '从根本假设出发，挑战既有框架，回归问题本质。善于质疑"常识"，揭示隐藏前提，推动底层思考。',
  systemPrompt: '你是"第一性原则专家"...',  // AI系统提示词（详细角色设定）
  color: '#007AFF',             // UI主题色
  layer: 1,                     // 层级（1=核心分析层, 2=外部威胁层, 3=价值行动层）
  required: true,               // 是否为必选角色
  order: 1                      // 必选流线中的顺序
}
```

**使用示例**:
```javascript
// 获取角色信息
const role = DEBATE_ROLES.find(r => r.id === 1);
console.log(role.shortName); // '第一性原则'

// 获取必选角色列表
const requiredRoles = DEBATE_ROLES.filter(r => r.required);

// 按流线顺序获取角色
const orderedRoles = REQUIRED_FLOW.map(id => DEBATE_ROLES.find(r => r.id === id));
```

**关键设计**:
- **三层架构**: Layer 1（核心分析）→ Layer 2（外部威胁）→ Layer 3（价值行动）
- **必选流线**: 确保辩论覆盖关键视角（第一性原则→时间穿越→上帝视角→杠精→买单客户→竞争友商→落地执行→领袖）
- **可选角色**: 用户可额外选择8个可选角色参与辩论

---

### 2.2 辩论引擎 (modules/debateEngine.js)

**职责**: 核心控制器，管理5阶段辩论流程，协调所有子模块

**类定义**: `class DebateEngine`

**初始化配置**:
```javascript
const engine = new DebateEngine({
  apiEndpoint: 'http://localhost:3000/api/ai/debate',
  model: 'qwen',          // 默认AI模型
  maxRounds: 10,          // 最大轮次
  defaultRounds: 5,       // 默认轮次
  minRoles: 9             // 最少角色数（8必选+1领袖）
});
```

**核心方法**:

#### 阶段1: 准备阶段 (Preparation)
```javascript
await engine.startPreparation({
  topic: '我应该创业吗？',
  background: '45岁，10年行业经验...',
  selectedRoles: [1, 2, 3, 7, 8, 13, 14, 16],  // 角色ID数组
  rounds: 5
});
```
- **职责**: 验证输入、初始化状态、自动进入策划阶段
- **输出**: 无（自动触发策划阶段）

#### 阶段2: 策划阶段 (Planning)
```javascript
await engine.startPlanning();
```
- **职责**: 调用领袖AI生成辩论策略，解析轮次主题，等待委托人确认
- **AI调用**: `buildLeaderPlanningPrompt()` → 800字策略
- **输出**: 触发 `delegatePrompt` 事件，显示策略确认弹窗

#### 阶段3: 确认阶段 (Confirmation)
```javascript
await engine.confirmAndStart(delegateInput);
```
- **职责**: 保存委托人补充，开始辩论
- **输入**: 委托人补充意见（可为空字符串）
- **输出**: 触发 `phaseChange` 事件，进入辩论阶段

#### 阶段4: 辩论阶段 (Debate)
```javascript
await engine.startDebate();
```
- **职责**: 执行多轮辩论，每轮包含：
  1. 领袖开场（介绍本轮主题）
  2. Phase 1 - 全员发言（每个专家发言1次）
  3. 领袖转场（承上启下）
  4. Phase 2 - 动态补充（AI决策邀请专家，最多再发言1次）
  5. 领袖总结
- **AI决策**: `decideNextSpeaker()` - 根据对话进展智能邀请下一位发言
- **委托人交互**: 每轮提供3次介入机会（开场/中场转场/总结前）

#### 阶段5: 交付阶段 (Delivery)
```javascript
await engine.startDelivery();
```
- **职责**: 生成最终报告，收集反馈
- **报告结构**:
  ```javascript
  {
    metadata: {  // 元数据
      topic, background, roles, rounds, startTime, endTime
    },
    summary: '...',              // 总结（500字）
    keyInsights: [...],          // 核心洞察（3-5条）
    actionPlan: [...],           // 行动计划（3-5条）
    iterationSuggestions: [...], // 迭代建议（2-3条）
    fullTranscript: [...]        // 完整对话记录
  }
  ```

**事件系统**:
```javascript
// 注册事件监听器
engine.on('phaseChange', (data) => {
  console.log('阶段变化:', data.phase);
});

engine.on('roleSpeak', (data) => {
  // data: { round, role, content, type, phase, topic, isComplete }
  updateUI(data);
});

engine.on('delegatePrompt', (data) => {
  // data: { type, message, strategy, canSkip, callback }
  showPromptModal(data);
});

engine.on('error', (data) => {
  console.error('辩论错误:', data);
});

engine.on('tokenUpdate', (stats) => {
  // stats: { total, currentRound, byRound, byRole }
  updateTokenDisplay(stats);
});
```

**状态管理** (`engine.state`):
```javascript
{
  phase: 'debate',              // 当前阶段
  topic: '...',                 // 主议题
  background: '...',            // 背景信息
  selectedRoles: [...],         // 选中角色ID
  rounds: 5,                    // 轮次数
  currentRound: 2,              // 当前轮次
  debateHistory: [...],         // 完整历史
  delegateInputs: [...],        // 委托人发言
  roundTopics: [...],           // 各轮主题（解析自策划）
  reportData: {...},            // 最终报告
  userCompleted: false,         // 用户主动完成标志
  tokenStats: {...}             // Token统计
}
```

**核心算法**:

1. **轮次主题解析** (`parseRoundTopics`):
   ```javascript
   // 从策划内容提取结构化主题
   // 输入: "第1轮 / 初始定调 / 明确痛点和目标"
   // 输出: { round: 1, topic: '初始定调', goal: '明确痛点和目标' }
   ```

2. **AI动态发言顺序** (`decideNextSpeaker`):
   - 分析对话进展、争议焦点、委托人反馈
   - 智能邀请下一位发言专家
   - 支持二次邀请（Phase 2）
   - 返回 `null` 表示本轮讨论充分

3. **流式输出支持** (v3.0):
   ```javascript
   const speech = await this.callAI({
     role: role,
     prompt: '...',
     streaming: true,  // 启用流式
     onChunk: (chunk) => {
       accumulatedContent += chunk;
       this.emit('roleSpeak', {
         content: accumulatedContent,
         isStreaming: true,
         isComplete: false
       });
     }
   });
   ```

**性能优化**:
- Token统计：实时追踪每轮、每角色的Token消耗
- 摘要引擎：自动生成本轮摘要，减少上下文传递
- 缓存机制：提示词模板缓存（PromptAgent）

---

### 2.3 AI调用器 (modules/aiCaller.js)

**职责**: 统一封装AI服务调用，支持多模型降级、Token计量、流式输出

**类定义**: `class AICaller`

**初始化配置**:
```javascript
const caller = new AICaller({
  apiEndpoint: 'http://localhost:3000/api/ai/debate',
  model: 'qwen',          // 主模型
  fallbackModel: 'deepseek',  // 降级模型
  timeout: 30000          // 超时时间（毫秒）
});
```

**核心方法**:

#### `call(options)` - 统一调用接口
```javascript
const response = await caller.call({
  role: role,              // 角色对象（包含systemPrompt）
  prompt: '...',           // 用户提示词
  temperature: 0.6,        // 温度（0-1）
  maxTokens: 800,          // 最大token数
  streaming: false,        // 是否流式输出
  onChunk: (chunk) => {}   // 流式回调函数
});

// 返回值结构
{
  content: '...',          // AI生成内容
  model: 'qwen',           // 实际使用的模型
  tokens: 450,             // 消耗的token数
  latency: 2300            // 响应延迟（毫秒）
}
```

**模型降级链**:
```
Qwen (主) → DeepSeek → OpenAI (最后备选)
```
- 自动重试：主模型失败自动切换
- 错误日志：记录失败原因和模型切换

**Token计量回调**:
```javascript
caller.setTokenUpdateCallback((tokens, roleId) => {
  console.log(`角色${roleId}消耗${tokens} tokens`);
  // 自动触发 debateEngine.updateTokenStats()
});
```

**流式输出**:
```javascript
await caller.call({
  prompt: '...',
  streaming: true,
  onChunk: (chunk) => {
    // 每次接收到数据块时调用
    updateUI(chunk);
  }
});
```

**错误处理**:
```javascript
try {
  const response = await caller.call({...});
} catch (error) {
  if (error.code === 'TIMEOUT') {
    // 超时处理
  } else if (error.code === 'API_ERROR') {
    // API错误处理
  }
}
```

**性能监控**:
- 记录每次调用的延迟
- 统计各模型的成功率
- 提供 `getStats()` 方法获取统计数据

---

### 2.4 用户认证 (modules/userAuth.js)

**职责**: 用户登录、会话管理、历史记录查询

**全局对象**: `window.UserAuth`

**核心方法**:

#### `showLoginModal(options)` - 显示登录弹窗
```javascript
window.UserAuth.showLoginModal({
  title: '欢迎来到多魔汰',
  message: '登录后可保存辩论进度',
  onSuccess: (user) => {
    console.log('登录成功:', user);
    // user: { phone, nickname, token, profile }
  },
  onCancel: () => {
    console.log('用户取消登录');
  }
});
```

#### `sendVerifyCode(phone)` - 发送验证码
```javascript
const result = await window.UserAuth.sendVerifyCode('13917895758');
if (result.success) {
  console.log('验证码已发送');
}
```

#### `verifyCode(phone, code)` - 验证登录
```javascript
const user = await window.UserAuth.verifyCode('13917895758', '888888');
// 返回: { phone, nickname, token, profile }
```

#### `logout()` - 退出登录
```javascript
window.UserAuth.logout();
```

#### `getDebateHistory()` - 获取辩论历史
```javascript
const history = await window.UserAuth.getDebateHistory();
// 返回: [{ id, topic, date, summary, score }]
```

**本地存储**:
```javascript
// LocalStorage键格式
localStorage.setItem('user_13917895758', JSON.stringify(user));
localStorage.setItem('debate_history_13917895758', JSON.stringify(history));
```

**测试账号**:
- 手机号: `13917895758`
- 固定验证码: `888888`

---

### 2.5 用户画像 (modules/userProfile.js)

**职责**: 用户行为分析、画像数据管理、个性化推荐

**类定义**: `class UserProfile`

**初始化**:
```javascript
const profile = new UserProfile('13917895758');
await profile.load();  // 从LocalStorage加载
```

**核心方法**:

#### `getProfileText()` - 获取画像摘要文本
```javascript
const profileText = profile.getProfileText();
// 输出: "用户画像：提问次数5次，平均满意度8.2分，关注领域：创业/职场转型"
```

#### `recordDebate(debateData)` - 记录辩论
```javascript
profile.recordDebate({
  topic: '我应该创业吗？',
  rounds: 5,
  duration: 1800,  // 秒
  score: 8.5,      // 满意度评分
  tags: ['创业', '职场']
});
```

#### `getRecommendedRoles()` - 推荐角色
```javascript
const roles = profile.getRecommendedRoles();
// 基于历史行为推荐角色
```

**数据结构**:
```javascript
{
  phone: '13917895758',
  nickname: 'Rich',
  questionCount: 5,              // 提问次数
  avgScore: 8.2,                 // 平均满意度
  lastVisit: '2025-10-17T12:00',
  preferredTopics: ['创业', '职场'],
  debateHistory: [...],
  stats: {
    totalRounds: 25,
    totalDuration: 9000,
    favoriteRoles: [1, 2, 7]
  }
}
```

---

### 2.6 上下文数据库 (modules/contextDatabase.js)

**职责**: 存储对话历史、提取关键上下文、支持AI决策

**类定义**: `class ContextDatabase`

**核心方法**:

#### `addSpeech(speech)` - 添加发言
```javascript
contextDB.addSpeech({
  roleId: 1,
  roleName: '第一性原则',
  content: '...',
  round: 2,
  timestamp: '2025-10-17T12:00:00.000Z'
});
```

#### `getRelevantContext(roleId, roundNumber)` - 获取相关上下文
```javascript
const context = contextDB.getRelevantContext(1, 2);
// 返回: { myHistory, othersKeyPoints, allRounds }
```

#### `getDebateTimeline()` - 获取时间线
```javascript
const timeline = contextDB.getDebateTimeline();
// 返回: [{ round, speaker, keyPoints, hasData }]
```

#### `getControversies()` - 获取争议焦点
```javascript
const controversies = contextDB.getControversies();
// 返回: [{ topic, count, relatedSpeeches }]
```

**持久化**:
```javascript
// 保存到LocalStorage
contextDB.saveToLocalStorage();

// 从LocalStorage加载
contextDB.loadFromLocalStorage();
```

**数据结构**:
```javascript
{
  speeches: [              // 所有发言
    { roleId, roleName, content, round, timestamp }
  ],
  keyPoints: [],           // 提取的关键要点
  controversies: [],       // 争议焦点
  roundSummaries: []       // 每轮摘要
}
```

---

### 2.7 报告生成器 (modules/reportGenerator.js)

**职责**: 生成最终辩论报告，支持PDF/JSON导出

**类定义**: `class ReportGenerator`

**核心方法**:

#### `generateReport(state, aiCaller, facilitatorRole)` - 生成报告
```javascript
const report = await generator.generateReport(
  engine.state,        // 辩论状态
  aiCaller,            // AI调用器
  facilitatorRole      // 领袖角色
);
```

**报告结构**:
```javascript
{
  metadata: {
    topic: '我应该创业吗？',
    background: '...',
    roles: 8,
    rounds: 5,
    startTime: '2025-10-17T12:00',
    endTime: '2025-10-17T13:30',
    delegateInputsCount: 3
  },
  summary: '本次辩论围绕...',      // AI生成总结（500字）
  keyInsights: [                    // 核心洞察（3-5条）
    '1. 第一性原则专家指出...',
    '2. 时间穿越者认为...'
  ],
  actionPlan: [                     // 行动计划（3-5条）
    '1. 短期（1-3个月）：...',
    '2. 中期（3-6个月）：...'
  ],
  iterationSuggestions: [           // 迭代建议（2-3条）
    '1. 如果选择创业，建议...',
    '2. 如果保持职场，建议...'
  ],
  fullTranscript: [...]             // 完整对话记录
}
```

#### `exportAsJSON(state)` - 导出JSON
```javascript
generator.exportAsJSON(engine.state);
// 下载文件: debate_report_YYYYMMDD_HHMMSS.json
```

#### `exportAsPDF(state)` - 导出PDF
```javascript
generator.exportAsPDF(engine.state);
// 下载文件: debate_report_YYYYMMDD_HHMMSS.pdf
```

**AI提示词**:
```javascript
// 使用高级提示词模板生成报告
// 输入: 完整辩论历史 + 委托人输入
// 输出: 结构化报告（总结、洞察、行动计划、迭代建议）
```

---

### 2.8 提示词代理 (modules/promptAgent.js)

**职责**: 提示词版本管理、模板注册、生成追踪

**类定义**: `class PromptAgent`

**核心方法**:

#### `registerTemplate(template)` - 注册模板
```javascript
promptAgent.registerTemplate({
  id: 'leader_planning',           // 模板ID（唯一）
  name: '领袖策划阶段提示词',
  version: 'v1.0',
  requiredParams: ['topic', 'background', 'roles', 'rounds'],
  optionalParams: ['delegateInputs'],
  template: (params) => {          // 模板函数
    return `请为议题"${params.topic}"制定${params.rounds}轮辩论策略...`;
  },
  maxTokens: 2000,
  temperature: 0.6,
  metadata: {
    author: 'system',
    createdAt: '2025-10-12',
    description: '领袖制定辩论策略的提示词',
    changelog: '初始版本'
  }
});
```

#### `generate(templateId, params)` - 生成提示词
```javascript
const result = promptAgent.generate('leader_planning', {
  topic: '我应该创业吗？',
  background: '45岁，10年经验',
  roles: [...],
  rounds: 5
});

// 返回值
{
  prompt: '...',           // 生成的提示词
  tokens: 1500,            // 估算token数
  templateId: 'leader_planning',
  version: 'v1.0',
  timestamp: '2025-10-17T12:00'
}
```

#### `listTemplates()` - 列出所有模板
```javascript
const templates = promptAgent.listTemplates();
// 返回: [{ id, name, version, metadata }]
```

**已注册模板**:
1. `leader_planning` - 领袖策划阶段
2. `leader_opening` - 领袖开场提示词
3. `role_speech` - 专家发言提示词
4. `leader_summary` - 领袖总结提示词

**版本管理**:
- 支持模板版本更新（v1.0 → v1.1）
- 自动记录变更日志
- 提供 `getTemplate(id, version)` 获取特定版本

---

### 2.9 提示词模板 (modules/promptTemplates.js)

**职责**: 提供4个核心提示词模板的具体实现

**导出函数**:

#### `buildLeaderPlanningTemplate(params)` - 领袖策划模板
```javascript
const prompt = PromptTemplates.buildLeaderPlanningTemplate({
  topic: '我应该创业吗？',
  background: '45岁，10年经验',
  selectedRoles: [1, 2, 3, 7, 8, 13, 14, 16],
  rounds: 5,
  rolesInfo: '第一性原则、时间穿越者、...'
});
```
- **输出长度**: 800字
- **结构**: 开场客套 + 核心策略 + 分轮规划 + 结束客套
- **格式**: 纯文本（无Markdown）

#### `buildLeaderOpeningTemplate(params)` - 领袖开场模板
```javascript
const prompt = PromptTemplates.buildLeaderOpeningTemplate({
  roundNumber: 1,
  rounds: 5,
  topic: '我应该创业吗？',
  background: '...',
  leaderStrategy: '...',
  rolesInfo: '...',
  previousRounds: '...',
  highPriorityInputs: '...'
});
```
- **第一轮**: 900字（详细介绍）
- **其他轮**: 150字（承上启下）
- **Token需求**: 第一轮2000，其他轮300

#### `buildRoleSpeechTemplate(params)` - 专家发言模板
```javascript
const prompt = PromptTemplates.buildRoleSpeechTemplate({
  role: role,
  roundNumber: 2,
  rounds: 5,
  topic: '...',
  roundTopic: '...',
  currentRoundSpeeches: '...',
  isSupplementary: false,  // Phase 1: 轮流发言
  userProfileText: '...',
  delegateHistory: '...',
  highPriorityInputs: '...',
  relevantContext: {...}
});
```
- **Phase 1（轮流发言）**: 基于本轮上下文发言
- **Phase 2（补充发言）**: 递进要求，回应争议焦点
- **输出长度**: 500字
- **Token需求**: 800

#### `buildLeaderSummaryTemplate(params)` - 领袖总结模板
```javascript
const prompt = PromptTemplates.buildLeaderSummaryTemplate({
  roundNumber: 2,
  roundTopic: '...',
  speeches: '...',
  currentRoundInputs: '...',
  previousHighPriorityInputs: '...'
});
```
- **输出长度**: 300字
- **Token需求**: 700
- **结构**: 核心共识 + 关键争议 + 下一步重点

**模板特点**:
- 严格字数控制（优化Token消耗）
- 禁止编造数据（温度0.6）
- 呼应委托人高权重输入
- 支持用户画像融合

---

### 2.10 摘要引擎 (modules/summaryEngine.js)

**职责**: 生成本轮摘要，优化Token消耗，支持长对话

**类定义**: `class SummaryEngine`

**核心方法**:

#### `summarizeRound(roundData)` - 生成本轮摘要
```javascript
const summary = summaryEngine.summarizeRound({
  round: 2,
  topic: '商业模式验证',
  speeches: [...]
});

// 返回值
{
  round: 2,
  topic: '商业模式验证',
  keyInsights: [         // 核心洞察（3-5条）
    '第一性原则：从底层需求出发',
    '买单客户：支付意愿是关键'
  ],
  dataHighlights: [      // 数据亮点（引用具体数字）
    '杠精专家引用：市场规模10亿',
    '落地执行者提到：3个月试运营'
  ],
  characterCount: 450,   // 摘要字符数
  tokenEstimate: 300,    // 估算Token数
  originalTokens: 1500,  // 原始对话Token数
  compressionRatio: 0.2  // 压缩比（20%）
}
```

#### `getTokenStats()` - 获取Token统计
```javascript
const stats = summaryEngine.getTokenStats();
// 返回: { totalTokens, totalOriginalTokens, avgCompressionRatio }
```

**算法逻辑**:
1. 提取每个发言的关键句（去除冗余）
2. 识别数据支撑（数字、案例、引用）
3. 合并相似观点
4. 生成结构化摘要（洞察+数据）

**压缩效果**:
- 原始对话: 1500 tokens
- 生成摘要: 300 tokens
- 压缩比: 80%（节省Token）

---

### 2.11 数据校验器 (modules/dataValidator.js)

**职责**: 验证专家发言质量，评估数据支撑，生成质量徽章

**类定义**: `class DataValidator`

**核心方法**:

#### `validate(speech)` - 校验单条发言
```javascript
const validation = dataValidator.validate({
  content: '根据市场调研，目标用户规模约10万人...'
});

// 返回值
{
  valid: true,
  score: 85,             // 质量评分（0-100）
  validated: [           // 已验证的数据点
    { type: 'statistic', value: '10万人', confidence: 'high' }
  ],
  needsVerification: [], // 需要验证的声明
  warnings: [],          // 警告（如：缺乏数据支撑）
  errors: []             // 错误（如：逻辑矛盾）
}
```

#### `validateAll(debateHistory)` - 批量验证
```javascript
const { valid, report } = dataValidator.validateAll([
  { round: 1, speeches: [...] },
  { round: 2, speeches: [...] }
]);
```

#### `assessDataQuality(debateHistory)` - 评估整体质量
```javascript
const assessment = dataValidator.assessDataQuality(debateHistory);

// 返回值
{
  score: 88,             // 总体评分
  breakdown: {
    dataSupport: 90,     // 数据支撑度
    logicalConsistency: 85, // 逻辑一致性
    actionability: 90    // 可执行性
  },
  strengths: ['数据丰富', '逻辑清晰'],
  weaknesses: ['部分建议缺少案例']
}
```

#### `generateBadges(validation)` - 生成徽章HTML
```javascript
const badges = dataValidator.generateBadges(validation);
// 返回: '<span class="badge">✅ 数据验证</span>...'
```

**校验规则**:
1. **数据支撑**: 识别数字、案例、引用
2. **逻辑一致性**: 检测矛盾观点
3. **可执行性**: 评估行动建议的具体性
4. **空洞声明**: 标记缺乏依据的断言

**徽章类型**:
- ✅ 数据验证 (绿色)
- ⚠️ 需验证 (黄色)
- ❌ 缺乏支撑 (灰色)

---

### 2.12 委托人处理器 (modules/delegateHandler.js)

**职责**: 管理委托人交互逻辑，支持主题调整、发言汇总

**类定义**: `class DelegateHandler`

**核心方法**:

#### `prompt(options)` - 触发委托人提示
```javascript
const response = await delegateHandler.prompt({
  type: 'before_summary',  // 提示类型
  round: 2,
  message: '第2轮即将总结，您有补充吗？',
  canSkip: true,
  timeout: 30000           // 30秒超时
});
```

**提示类型**:
- `planning_confirmation` - 策划确认（策划阶段）
- `round_opening` - 每轮开场发言机会
- `transition_comment` - 中场转场点评
- `before_summary` - 总结前补充
- `thanks` - 最终感谢（无需回调）

#### `getDelegateInputsSummary()` - 汇总委托人发言
```javascript
const summary = delegateHandler.getDelegateInputsSummary();
// 返回: "委托人在第1轮提到：...；第3轮强调：..."
```

#### `adjustRoundTopics(feedback, currentRound, roundTopics, aiCaller, facilitatorRole)` - 动态调整主题
```javascript
const adjustedTopics = await delegateHandler.adjustRoundTopics(
  '我更关心成本控制',  // 委托人反馈
  2,                     // 当前轮次
  roundTopics,           // 原主题数组
  aiCaller,
  facilitatorRole
);
```

#### `detectTopicAdjustmentNeeded(feedback)` - 检测是否需要调整
```javascript
const needed = delegateHandler.detectTopicAdjustmentNeeded(
  '我觉得应该换个角度讨论'
);
// 返回: true/false
```

**数据结构** (`delegateInputs`):
```javascript
{
  phase: 'debate',
  round: 2,
  type: 'before_summary',
  input: '...',
  priority: 'high',      // 'high' | 'normal'
  timestamp: '2025-10-17T12:00'
}
```

**高权重标记**:
- 用户在输入框提交补充时，标记为 `[HIGH_PRIORITY]`
- 高权重输入优先呼应，贯穿后续轮次

---

### 2.13 语音模块 (voice.js)

**职责**: 语音输入（ASR）、语音输出（TTS）、队列管理

**全局对象**: `window.VoiceModule`

**核心方法**:

#### `toggleVoiceOutput()` - 切换语音输出
```javascript
window.VoiceModule.toggleVoiceOutput();
// 状态: 🔇 (关闭) ⇄ 🔊 (开启)
```

#### `speakText(text, speaker, priority)` - 语音朗读
```javascript
window.VoiceModule.speakText(
  '第一性原则专家认为...',
  '第一性原则',
  'normal'  // 'normal' | 'high'
);
```
- **队列机制**: 按顺序播放，避免重叠
- **优先级**: 高优先级可打断当前播放（如领袖开场）

#### `adjustVoiceRate(delta)` - 调整语速
```javascript
window.VoiceModule.adjustVoiceRate(1);  // 加速1档
window.VoiceModule.adjustVoiceRate(-1); // 减速1档
```
- **档位**: 1x, 2x, 3x, 4x, 5x, 6x, 8x, 10x
- **默认**: 5x（快速朗读）

#### `startVoiceInput()` - 开始语音输入
```javascript
// 按住说话
window.VoiceModule.startVoiceInput();
```

#### `stopVoiceInput()` - 停止语音输入
```javascript
// 松开结束
window.VoiceModule.stopVoiceInput();
```

#### `getCurrentVoicePromise()` - 获取当前语音Promise
```javascript
const promise = window.VoiceModule.getCurrentVoicePromise();
await promise;  // 等待语音播放完成
```
- **用途**: 确保语音完成后再继续下一发言（D-63决策）
- **超时**: 10秒保护

**队列管理**:
```javascript
{
  queue: [               // 待播放队列
    { text, speaker, priority }
  ],
  currentSpeech: {...},  // 当前播放
  isProcessing: false,   // 处理状态
  voices: [...],         // 可用语音列表
  rate: 5.0              // 当前语速
}
```

**浏览器兼容性**:
- 支持 Chrome/Edge（Web Speech API）
- Firefox 部分支持
- Safari 基础支持

---

## 3. 模块依赖关系

### 3.1 依赖图（简化版）

```
debateEngine.js (核心引擎)
    ├─ aiCaller.js (AI调用)
    ├─ delegateHandler.js (委托人交互)
    │   └─ aiCaller.js
    ├─ reportGenerator.js (报告生成)
    │   └─ aiCaller.js
    ├─ contextDatabase.js (上下文存储)
    ├─ summaryEngine.js (摘要生成)
    ├─ dataValidator.js (数据校验)
    ├─ promptAgent.js (提示词代理)
    │   └─ promptTemplates.js
    ├─ userProfile.js (用户画像)
    └─ roles.js (角色配置)

userAuth.js (用户认证) ← 独立模块，与引擎松耦合

voice.js (语音模块) ← 独立模块，通过事件与UI交互
```

### 3.2 加载顺序（index.html）

```html
<!-- 1. 第三方库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- 2. 独立模块 -->
<script src="src/modules/userAuth.js"></script>
<script src="src/modules/userProfile.js"></script>
<script src="src/config/roles.js"></script>

<!-- 3. 引擎依赖模块（顺序重要） -->
<script src="src/modules/contextDatabase.js"></script>
<script src="src/modules/aiCaller.js"></script>
<script src="src/modules/reportGenerator.js"></script>
<script src="src/modules/promptAgent.js"></script>
<script src="src/modules/promptTemplates.js"></script>
<script src="src/modules/summaryEngine.js"></script>
<script src="src/modules/dataValidator.js"></script>
<script src="src/modules/delegateHandler.js"></script>

<!-- 4. 核心引擎 -->
<script src="src/modules/debateEngine.js"></script>

<!-- 5. UI模块 -->
<script src="export.js"></script>
<script src="voice.js"></script>
<script src="debate-ui.js"></script>
<script src="init.js"></script>
```

### 3.3 关键依赖说明

**强依赖**（必须引入，否则核心功能不可用）:
- `roles.js` → `debateEngine.js`
- `aiCaller.js` → `debateEngine.js`

**可选依赖**（未引入时自动降级）:
- `contextDatabase.js` - 未加载时使用简化上下文
- `promptAgent.js` - 未加载时使用直接模板
- `summaryEngine.js` - 未加载时跳过摘要优化
- `dataValidator.js` - 未加载时跳过数据校验

---

## 4. 数据流与事件系统

### 4.1 数据流向（辩论阶段）

```
用户输入（UI）
    ↓
debateEngine.startPreparation()
    ↓
debateEngine.startPlanning()
    ├─ aiCaller.call() → AI服务
    └─ emit('delegatePrompt') → UI弹窗
          ↓ (用户确认)
debateEngine.confirmAndStart()
    ↓
debateEngine.startDebate()
    ├─ runRound(1)
    │   ├─ callAI() → 领袖开场
    │   ├─ promptDelegate() → 委托人开场
    │   ├─ Phase 1: 全员发言
    │   │   ├─ callAI() → 专家1发言
    │   │   │   └─ emit('roleSpeak') → UI更新
    │   │   ├─ waitForVoiceOrDelay() → 等待语音
    │   │   └─ ... (重复)
    │   ├─ callAI() → 领袖转场
    │   ├─ promptDelegate() → 委托人点评
    │   ├─ Phase 2: 动态补充
    │   │   ├─ decideNextSpeaker() → AI决策下一位
    │   │   ├─ callAI() → 专家补充
    │   │   └─ ... (循环直到COMPLETE)
    │   ├─ promptDelegate() → 总结前补充
    │   └─ callAI() → 领袖总结
    ├─ runRound(2)
    └─ ... (重复)
        ↓
debateEngine.startDelivery()
    ├─ generateReport() → 生成报告
    └─ emit('delegatePrompt', type='thanks') → 感谢弹窗
```

### 4.2 事件流（Event Flow）

**发射方**: `debateEngine.emit(event, data)`

**监听方**: UI层通过 `engine.on(event, callback)` 注册

**核心事件列表**:

| 事件名 | 触发时机 | 数据结构 | UI响应 |
|--------|---------|---------|--------|
| `phaseChange` | 阶段切换 | `{ phase, state }` | 更新阶段指示器 |
| `roundStart` | 新轮次开始 | `{ round }` | 显示轮次标题 |
| `roleSpeak` | 角色发言 | `{ round, role, content, type, phase, topic, isComplete }` | 创建/更新发言卡片 |
| `delegatePrompt` | 委托人提示 | `{ type, message, strategy, canSkip, callback }` | 显示模态弹窗 |
| `tokenUpdate` | Token统计更新 | `{ total, currentRound, byRound, byRole }` | 更新Token显示 |
| `error` | 错误发生 | `{ phase, round, error }` | 显示错误提示 |
| `topicsAdjusted` | 主题动态调整 | `{ round, adjustedTopics }` | 可选：显示主题变更提示 |

### 4.3 回调机制（Callback Pattern）

**委托人交互回调**:
```javascript
// debateEngine.js 发射事件
this.emit('delegatePrompt', {
  type: 'planning_confirmation',
  message: '请查看策略并补充：',
  strategy: leaderStrategy,
  callback: (delegateInput) => {
    // 用户点击确认后调用
    this.confirmAndStart(delegateInput);
  }
});

// UI层（index.html）处理
function handleDelegatePrompt(data) {
  // 保存回调到全局
  window.currentDelegateCallback = data.callback;

  // 显示弹窗
  showPromptModal(data);
}

// 用户点击确认按钮
function confirmAndStartDebate() {
  const input = document.getElementById('delegateInput').value;
  window.currentDelegateCallback(input);  // 调用回调
  window.currentDelegateCallback = null;  // 清空
}
```

---

## 5. 扩展开发指南

### 5.1 添加新角色

**步骤1**: 编辑 `src/config/roles.js`

```javascript
// 在 DEBATE_ROLES 数组末尾添加
{
  id: 17,                          // 新ID（递增）
  name: '市场分析专家',
  shortName: '市场分析',
  icon: '📊',
  intro: '数据驱动，洞察市场趋势',
  description: '基于市场数据和行业报告，分析市场规模、竞争格局、增长趋势...',
  systemPrompt: `你是"市场分析专家"，角色定位：...`,
  color: '#FF9500',               // 橙色
  layer: 2,                       // 外部威胁与机遇层
  required: false,                // 非必选
  order: null                     // 不在流线中
}
```

**步骤2**: 更新 `styles.css`（如需自定义样式）

```css
.speech-item.layer-2 {
  border-left-color: #FF3B30;
}
```

**步骤3**: 测试
- 启动系统，选择新角色
- 验证发言是否符合角色定位

### 5.2 修改提示词模板

**步骤1**: 编辑 `src/modules/promptTemplates.js`

```javascript
// 找到对应模板函数，如 buildRoleSpeechTemplate
buildRoleSpeechTemplate(params) {
  const { role, roundNumber, topic, ... } = params;

  // 修改提示词内容
  return `你是"${role.shortName}"，角色定位：${role.description}

  **新增要求**：
  - 每次发言必须包含至少1个具体数据
  - 避免使用"我认为"等主观表述

  ...原有内容...
  `;
}
```

**步骤2**: 更新 `promptAgent` 注册（可选）

```javascript
// 在 debateEngine.js _initializePromptTemplates() 中更新 metadata
this.promptAgent.registerTemplate({
  id: 'role_speech',
  version: 'v1.1',  // 版本升级
  metadata: {
    changelog: 'v1.1: 新增数据要求'
  }
});
```

**步骤3**: 测试
- 发起辩论，观察专家发言是否遵守新要求
- 使用 `dataValidator` 验证数据支撑度

### 5.3 添加新的委托人交互点

**步骤1**: 在 `debateEngine.js` 辩论流程中插入

```javascript
// 在 runRound() 方法中添加
const delegateCheckpoint = await this.promptDelegate({
  type: 'mid_round_checkpoint',  // 新类型
  round: roundNumber,
  message: `本轮进行到一半，您有什么即时反馈吗？`,
  canSkip: true,
  timeout: 15000
});

if (delegateCheckpoint?.trim()) {
  // 处理委托人输入
  this.state.delegateInputs.push({...});
}
```

**步骤2**: 更新 `delegateHandler.js`（如需特殊处理）

```javascript
prompt(options) {
  const { type, round, message, canSkip, timeout } = options;

  if (type === 'mid_round_checkpoint') {
    // 特殊处理逻辑
    return this._handleCheckpoint(round, message);
  }

  // 默认处理
  ...
}
```

**步骤3**: 更新UI弹窗（`index.html` handleDelegatePrompt）

```javascript
if (type === 'mid_round_checkpoint') {
  // 显示精简版弹窗（更短超时）
  htmlContent += `...`;
}
```

### 5.4 集成新的AI模型

**步骤1**: 编辑 `src/modules/aiCaller.js`

```javascript
async call(options) {
  const { model = 'qwen' } = options;

  if (model === 'new-model') {
    // 新模型调用逻辑
    return await this._callNewModel(options);
  }

  // 原有逻辑
  ...
}

async _callNewModel(options) {
  const response = await fetch('https://new-model-api.com/chat', {
    method: 'POST',
    headers: {...},
    body: JSON.stringify({
      messages: [{
        role: 'system',
        content: options.role.systemPrompt
      }, {
        role: 'user',
        content: options.prompt
      }],
      max_tokens: options.maxTokens
    })
  });

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: 'new-model',
    tokens: data.usage.total_tokens
  };
}
```

**步骤2**: 更新降级链（可选）

```javascript
// 在 call() 方法中
try {
  return await this._callPrimaryModel(options);
} catch (error) {
  console.warn('主模型失败，切换到新模型');
  return await this._callNewModel(options);
}
```

**步骤3**: 配置环境变量（`.env`）

```
NEW_MODEL_API_KEY=your_api_key
NEW_MODEL_ENDPOINT=https://new-model-api.com/chat
```

### 5.5 添加新的数据校验规则

**步骤1**: 编辑 `src/modules/dataValidator.js`

```javascript
validate(speech) {
  const { content } = speech;

  // 新规则: 检测案例引用
  const caseStudyPattern = /案例：|例如：|比如说：/g;
  const caseStudies = content.match(caseStudyPattern) || [];

  if (caseStudies.length > 0) {
    validation.validated.push({
      type: 'case_study',
      value: caseStudies.join(', '),
      confidence: 'high'
    });
    validation.score += 5;  // 增加评分
  }

  // 原有规则
  ...
}
```

**步骤2**: 更新徽章生成

```javascript
generateBadges(validation) {
  const badges = [];

  validation.validated.forEach(v => {
    if (v.type === 'case_study') {
      badges.push(`<span class="badge badge-case">📖 案例支撑</span>`);
    }
    ...
  });

  return badges.join(' ');
}
```

**步骤3**: 添加CSS样式（`styles.css`）

```css
.badge-case {
  background: #5856D6;
  color: white;
}
```

---

## 6. 常见问题（FAQ）

### 6.1 模块加载顺序错误

**问题**: `TypeError: ContextDatabase is not defined`

**原因**: `debateEngine.js` 在 `contextDatabase.js` 之前加载

**解决**: 检查 `index.html` 中脚本加载顺序，确保依赖模块先加载

```html
<!-- 正确顺序 -->
<script src="src/modules/contextDatabase.js"></script>  <!-- 先加载 -->
<script src="src/modules/debateEngine.js"></script>     <!-- 后加载 -->
```

### 6.2 回调函数丢失

**问题**: 点击"确认"按钮无反应，控制台报错 `currentDelegateCallback is null`

**原因**: 回调函数被覆盖或未正确保存

**解决**: 使用 `window.currentDelegateCallbackType` 记录类型，避免覆盖

```javascript
// 保存回调时
window.currentDelegateCallback = callback;
window.currentDelegateCallbackType = type;  // 记录类型

// 检查回调时
if (!window.currentDelegateCallback) {
  console.error('回调丢失，类型:', window.currentDelegateCallbackType);
}
```

### 6.3 语音切断问题

**问题**: 专家发言语音被下一个专家打断

**原因**: `getCurrentVoicePromise()` 返回当前播放Promise，未等待队列清空

**解决**: 使用轮询机制（v3.0已修复）

```javascript
getCurrentVoicePromise() {
  return new Promise((resolve) => {
    const checkQueue = () => {
      if (this.queue.length === 0 &&
          !this.isProcessing &&
          !window.speechSynthesis.speaking) {
        resolve();  // 队列完全清空
      } else {
        setTimeout(checkQueue, 100);  // 100ms后再检查
      }
    };
    checkQueue();
  });
}
```

### 6.4 Token统计不准确

**问题**: Token显示为0或明显偏低

**原因**: `aiCaller` 未设置Token更新回调

**解决**: 在 `debateEngine.js` 初始化时设置

```javascript
if (this.aiCaller) {
  this.aiCaller.setTokenUpdateCallback((tokens, roleId) => {
    this.updateTokenStats(tokens, roleId, this.state.currentRound);
  });
}
```

---

## 7. 附录

### 7.1 完整模块列表

| 模块文件 | 行数 | 主要类/函数 | 状态 |
|---------|-----|-----------|------|
| `roles.js` | ~800 | DEBATE_ROLES, FACILITATOR_ROLE | ✅ 稳定 |
| `debateEngine.js` | 1873 | DebateEngine | ✅ 稳定 |
| `aiCaller.js` | ~350 | AICaller | ✅ 稳定 |
| `userAuth.js` | ~450 | window.UserAuth | ✅ 稳定 |
| `userProfile.js` | ~300 | UserProfile | ✅ 稳定 |
| `contextDatabase.js` | ~550 | ContextDatabase | ✅ 稳定 |
| `reportGenerator.js` | ~400 | ReportGenerator | ✅ 稳定 |
| `promptAgent.js` | ~250 | PromptAgent | ✅ 稳定 |
| `promptTemplates.js` | ~600 | PromptTemplates | ✅ 稳定 |
| `summaryEngine.js` | ~350 | SummaryEngine | ✅ 稳定 |
| `dataValidator.js` | ~500 | DataValidator | ✅ 稳定 |
| `delegateHandler.js` | ~450 | DelegateHandler | ✅ 稳定 |
| `voice.js` | 556 | window.VoiceModule | ✅ 稳定（D-70修复） |

**总计**: ~7,000行核心代码

### 7.2 关键技术决策

**D-63 (2025-10-14)**: 语音与文字流同步机制
- Option A（语音关闭）: 固定延迟500ms
- Option B（语音打开）: 等待语音Promise完成（10秒超时）

**D-70 (2025-10-17)**: 语音切断修复
- getCurrentVoicePromise() 改为轮询检查队列完全清空
- 100ms轮询间隔，10秒超时保护

**T-302**: Token优化摘要引擎
- 每轮生成摘要，压缩比80%
- 节省长对话中的Token消耗

**T-303**: 提示词模板库与版本管理
- 支持模板版本化（v1.0, v1.1）
- 自动记录变更日志

**T-304**: 数据校验与质量评估
- 实时校验专家发言数据支撑
- 生成质量徽章（✅ 数据验证）

**v9**: 真实动态对话系统（AI驱动）
- Phase 1: 全员发言（轮流）
- Phase 2: 动态补充（AI决策）
- 支持二次邀请（最多发言2次）

### 7.3 性能指标

**目标SLA**:
- API响应时间: P50 < 2s, P95 < 5s, P99 < 10s
- 页面加载: FCP < 1.5s, TTI < 3s
- 支持并发: 10用户
- 内存占用: 后端 < 500MB, 前端 < 100MB

**实际性能**（2025-10-17测试）:
- Qwen API平均响应: 2.3s
- Lighthouse Performance Score: 88.6/100
- Token优化: 压缩比80%（T-302）
- 代码质量: 88.9/100（0个P0问题）

---

**文档维护者**: Claude Code (Night-Auth FULL ON)
**最后更新**: 2025-10-17 05:30 (GMT+8)
**文档版本**: v1.0
**适用系统版本**: 多魔汰 v3.0
**下一步**: 创建测试用例（P2任务）
