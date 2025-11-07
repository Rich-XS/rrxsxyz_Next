# 多魔汰项目 - 学习与规划文档 v1.0
> 创建时间: 2025-11-04 05:00 GMT+8
> Night-Auth 深夜学习成果
> 基于: ideas.md 全面分析

## 📋 目录

1. [当前项目状态](#1-当前项目状态)
2. [未完成任务分类](#2-未完成任务分类)
3. [技术学习重点](#3-技术学习重点)
4. [实施优先级路线图](#4-实施优先级路线图)
5. [风险与挑战](#5-风险与挑战)
6. [资源准备清单](#6-资源准备清单)

---

## 1. 当前项目状态

### 1.1 已完成的里程碑 ✅

| 决策编号 | 内容 | 完成时间 | 影响范围 |
|---------|------|----------|----------|
| D-63 | 语音与文字流同步机制 | 2025-10-14 | 核心流程 |
| D-67 | 专家发言内容优化 | 2025-10-16 | 内容质量 |
| D-73 | 分步版本备份验证 | 2025-10-17 | 测试流程 |
| D-76 | 测试用户最少2专家 | 2025-10-25 | 测试配置 |
| D-84 | 字数减半功能 | 2025-10-26 | 性能优化 |
| V57.22 | 导航/语音/UI修复 | 2025-11-04 | 用户体验 |

### 1.2 当前版本状态

- **版本号**: V57.22
- **备份**: rrxsxyz_next_202511040323_V57.22_V5722_NightAuth.zip (4.83MB)
- **核心模块稳定性**:
  - ✅ 辩论引擎 (debateEngine.js)
  - ✅ 语音系统 (voice.js)
  - ✅ UI系统 (debate-ui.js)
  - ✅ 中场流程 (upward/downward/supplementary)

### 1.3 当前技术债务

| 问题类型 | 数量 | 优先级 | 预计工作量 |
|---------|------|--------|-----------|
| 专家发言内容错乱 | ~8个专家 | P0 | 2-3天 |
| 提示词优化不足 | 多处 | P0 | 1-2天 |
| UI细节优化 | ~10项 | P1 | 2-3天 |
| 测试覆盖不足 | 6大模块 | P1 | 3-4天 |
| 文档不统一 | 多个PRD | P2 | 1天 |

---

## 2. 未完成任务分类

### 2.1 P0 核心功能（必须完成）

#### 2.1.1 专家发言质量问题
```
问题描述：
- 专家发言内容高度重复
- 缺乏深度和递进性
- 角色特征不明显

根本原因：
- 提示词过于简短
- 上下文信息传递不足
- 角色定位不清晰

解决方案：
1. 优化提示词结构（参考 ideas.md L257-264）
2. 增强上下文管理（contextDatabase.js）
3. 强化角色差异化（roleConfig.js）

预计工作量：2-3天
依赖资源：AI服务稳定、测试环境
```

#### 2.1.2 中场流程完善
```
当前状态：✅ 基础流程已实现
待完善项：
- [ ] 承上启下分离明确
- [ ] 委托人补充响应机制
- [ ] 流程转换提示优化

参考位置：ideas.md L282-295 (领袖在不同环节的职责)
实现位置：debateEngine.js L1157-1342
```

#### 2.1.3 语音系统优化
```
已完成：
- ✅ 语音队列管理 (V57.21)
- ✅ 防止语音被切断
- ✅ 1.5秒自然停顿

待优化：
- [ ] 不同角色不同声音（男女声）
- [ ] 语音速度可调节（已有UI，待连接）
- [ ] 委托人确认立即切换语音

技术方案：
- Web Speech API支持多语音
- 根据角色gender属性选择voice
- 优先级语音打断机制
```

### 2.2 P1 重要优化（显著提升体验）

#### 2.2.1 UI/UX 优化清单

| 项目 | 当前状态 | 目标状态 | 优先级 | 工作量 |
|------|---------|---------|--------|--------|
| 顶部Banner布局 | 居中 | 左中右分区 | P1 | 2h |
| 用户信息位置 | 顶部中间 | 右上角竖列 | P1 | 1h |
| 语言切换器 | 顶部中间 | 右下角 | P2 | 1h |
| Banner悬浮隐藏 | 固定显示 | 3秒自动隐藏 | P2 | 3h |
| 底部按钮固定 | 对话后出现 | 始终固定底部 | P1 | 2h |
| 文字速度调节 | UI存在 | 连接逻辑 | P1 | 4h |
| 关键词加粗 | 部分生效 | 全部专家生效 | P1 | 2h |
| 角色名称显示 | 无 | 每条发言显示 | P1 | 2h |
| 虚拟头像 | 无 | 16个角色头像 | P2 | 6h |

#### 2.2.2 测试自动化

```
当前状态：
- Puppeteer已安装
- Chrome浏览器已配置
- gemba-agent.js可用

待实施：
1. Playwright迁移（D-98已规划）
   - 性能提升20-30%
   - 多浏览器支持
   - 更好的调试工具

2. 测试场景覆盖：
   - ✅ 字数限制测试
   - ✅ 语音同步测试
   - ⏳ 完整流程测试
   - ⏳ UI元素测试
   - ⏳ 性能基准测试

3. CI/CD集成（未来）
   - Git pre-commit hook
   - 自动运行核心测试
   - 失败阻止提交
```

### 2.3 P2 体验增强（可选）

```
- [ ] 数字人口型同步（阶段4）
- [ ] 深色模式支持
- [ ] 移动端优化
- [ ] 多语言支持（中英文切换）
- [ ] 导出报告功能（PDF/Word）
- [ ] 历史记录查看
- [ ] 收藏夹功能
```

---

## 3. 技术学习重点

### 3.1 Playwright 自动化测试

#### 学习目标
```javascript
// 1. 基础配置
import { test, expect } from '@playwright/test';

// 2. 核心场景测试
test('完整辩论流程', async ({ page }) => {
  // 登录
  await page.goto('http://localhost:8080/duomotai/');
  await page.fill('input[name="phone"]', '13917895758');

  // 策划
  await page.click('button:has-text("启动多魔汰风暴辩论")');
  await expect(page.locator('.planning-content')).toBeVisible();

  // 辩论
  await page.click('button:has-text("确认，开始风暴辩论")');
  await expect(page.locator('.speech-item')).toHaveCount(8, { timeout: 30000 });

  // 验证字数
  const speeches = await page.locator('.speech-item').all();
  for (const speech of speeches) {
    const text = await speech.textContent();
    expect(text.length).toBeLessThan(600); // 测试用户字数限制
  }
});

// 3. 性能测试
test('首屏加载性能', async ({ page }) => {
  const start = Date.now();
  await page.goto('http://localhost:8080/duomotai/');
  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(2000); // < 2秒
});
```

#### 学习资源
- Playwright官方文档: https://playwright.dev
- 项目现有代码: `scripts/gemba-agent-playwright.js`
- 配置文件: `playwright.config.js`

### 3.2 提示词工程优化

#### 当前问题分析
```
问题1: 专家发言缺乏深度
原因: 提示词过于简短，缺少上下文

改进方向:
- 增加角色背景信息
- 提供之前所有发言摘要
- 明确本轮讨论重点
- 要求具体案例和数据支持

问题2: 角色特征不明显
原因: 角色定位描述模糊

改进方向:
- 强化角色性格特点
- 指定发言风格和用词习惯
- 添加角色典型思考方式
```

#### 优化模板示例
```javascript
// 改进前
const prompt = `你是${role.name}，请发言。`;

// 改进后
const prompt = `
你是${role.name}（${role.nickname}），${role.gender === 'male' ? '男性' : '女性'}专家。

【角色定位】
${role.description}

【性格特点】
${role.personality}

【之前讨论摘要】
${previousSummary}

【本轮重点】
${currentFocus}

【发言要求】
1. 字数控制在${wordLimit}字
2. 必须体现你的角色特点
3. 基于之前讨论进行递进分析
4. 提供具体案例或数据支持
5. 使用关键词**加粗**重点

请开始你的专业发言：
`;
```

### 3.3 上下文管理优化

#### contextDatabase.js 增强方案
```javascript
class ContextDatabase {
  constructor() {
    this.speeches = [];
    this.summaries = {}; // 新增：各阶段摘要
    this.keyInsights = []; // 新增：关键洞察
    this.delegateInputs = []; // 新增：委托人补充
  }

  // 新增：生成阶段摘要
  generatePhaseSummary(roundNumber, phase) {
    const phaseSpeeches = this.speeches.filter(s =>
      s.round === roundNumber && s.phase === phase
    );

    return {
      expertCount: phaseSpeeches.length,
      keyPoints: this.extractKeyPoints(phaseSpeeches),
      consensus: this.findConsensus(phaseSpeeches),
      divergence: this.findDivergence(phaseSpeeches)
    };
  }

  // 新增：提取关键观点
  extractKeyPoints(speeches) {
    // 使用AI提取每个发言的核心观点
    // 返回结构化的关键点列表
  }
}
```

---

## 4. 实施优先级路线图

### 4.1 第一周（2025-11-04 ~ 11-10）

#### Day 1-2: P0问题修复
- [x] V57.22 Bug修复完成
- [ ] 专家发言提示词优化
- [ ] 测试验证内容质量

#### Day 3-4: P1 UI/UX优化
- [ ] Banner布局调整
- [ ] 底部按钮固定
- [ ] 文字速度调节连接
- [ ] 角色名称显示

#### Day 5-7: 测试与文档
- [ ] Playwright测试编写
- [ ] 完整流程测试
- [ ] PRD文档统一
- [ ] 测试报告生成

### 4.2 第二周（2025-11-11 ~ 11-17）

#### Day 1-3: 语音系统增强
- [ ] 男女声音选择
- [ ] 语音速度连接
- [ ] 优先级打断机制

#### Day 4-5: 性能优化
- [ ] Token使用优化
- [ ] 首屏加载优化
- [ ] 内存泄漏检测

#### Day 6-7: 最终验收准备
- [ ] 完整E2E测试
- [ ] 性能基准测试
- [ ] 用户验收测试

---

## 5. 风险与挑战

### 5.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| AI服务不稳定 | 中 | 高 | 多服务降级链 |
| 提示词优化效果不佳 | 中 | 高 | A/B测试验证 |
| 性能达不到目标 | 低 | 中 | 渐进式优化 |
| 测试覆盖不足 | 中 | 中 | 优先核心流程 |

### 5.2 资源约束

```
预算限制：$20/天，峰值$50/天
- AI调用成本占大头
- 需要优化Token使用
- 考虑缓存机制

时间压力：2025-10-18交付目标
- 已延期，需要重新评估
- 优先核心功能
- 可选功能降级处理

人力资源：单人开发
- 自动化测试减轻负担
- 充分利用AI辅助
- 清晰的任务优先级
```

### 5.3 质量保证挑战

```
内容质量：
- 专家发言深度不足
- 需要大量测试迭代
- 提示词工程耗时

用户体验：
- UI细节优化繁琐
- 需要真实用户反馈
- 响应式适配工作量大

测试覆盖：
- 场景组合复杂
- 自动化测试建设中
- 手动测试效率低
```

---

## 6. 资源准备清单

### 6.1 开发工具

```
✅ 已准备:
- VS Code / VSCodium
- Node.js 18+
- Python 3.7+
- Puppeteer + Chrome
- Git版本管理

⏳ 待准备:
- Playwright (npm install)
- Cursor编辑器（可选）
- 通义灵码（可选）
```

### 6.2 测试资源

```
✅ 已准备:
- 测试账号: 13917895758
- 本地服务器: 8080 + 3001
- 测试数据: server/data/

⏳ 待准备:
- 性能基准数据
- 多浏览器测试环境
- 移动设备测试
```

### 6.3 文档资源

```
✅ 已创建:
- PRD_MASTER_v2.0.md
- LEARNING_PLAN_v1.0.md (本文档)
- progress.md
- CLAUDE.md

⏳ 待更新:
- API文档
- 部署指南
- 用户手册
```

### 6.4 知识储备

```
需要深入学习:
1. Playwright测试框架
2. 提示词工程最佳实践
3. Web Speech API高级用法
4. 性能优化技巧
5. 响应式设计模式

参考资料:
- Playwright Docs: https://playwright.dev
- OpenAI Prompt Engineering: https://platform.openai.com/docs/guides/prompt-engineering
- MDN Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
```

---

## 7. 决策待确认清单

### 7.1 产品方向

```
Q1: 字数控制策略
- 当前：测试用户减半（200字）
- 问题：是否对所有用户开放调节？
- 建议：提供用户可选的字数模式（简洁/标准/详细）

Q2: 语音功能定位
- 当前：可选开关
- 问题：是否作为核心卖点？
- 建议：默认开启，强化体验优势

Q3: 角色数量限制
- 当前：必选8个，可选其他
- 问题：是否支持用户自定义数量？
- 建议：提供3档（精简4个/标准8个/完整16个）
```

### 7.2 技术选型

```
Q1: Playwright vs Puppeteer
- 决策：优先Playwright（性能提升20-30%）
- 状态：D-98已决策，待实施

Q2: AI服务选择
- 当前：Qwen主 → DeepSeek → OpenAI降级
- 问题：是否增加Gemini？
- 建议：保持现状，待成本分析

Q3: 前端框架
- 当前：单文件HTML + Vanilla JS
- 问题：是否迁移到React？
- 建议：V1.0保持现状，V2.0考虑重构
```

---

## 附录A: ideas.md 任务映射

### 已完成任务（标记 [x]）
- [x] #112 - Night-Auth协议
- [x] #113 - 成本优化意识
- [x] #114 - 产品功能细则
- [x] #D-63 - 语音与文字流同步
- [x] #D-67 - 专家发言优化
- [x] #D-73 - 分步版本备份

### 进行中任务（标记 [#XXX]）
- [#013] - 流式输出验证
- [#087] - 调研功能规划
- [#143] - 启动按钮文案
- [#144] - 文字速度调节
- [#145] - 风暴辩论流程
- [#146] - Design_Spec更新

### 待定任务（标记 [?]）
- [?] Auto-compact频率
- [?] Git同步时机
- [?] 自动化测试脚本
- [?] 深色模式
- [?] 虚拟头像

---

## 附录B: 关键代码位置索引

```
辩论引擎:
- debateEngine.js L1157-1342: 中场流程
- debateEngine.js L38: 字数控制配置
- debateEngine.js L933: 专家轮流发言
- debateEngine.js L1185: 专家补充发言

语音系统:
- voice.js L333-338: 专家间停顿
- voice.js L1-50: 语音队列管理

UI系统:
- index.html L12: 版本号显示
- index.html L143-147: Console版本日志
- debate-ui.js: UI渲染逻辑

配置文件:
- roleConfig.js: 16个角色定义
- contextDatabase.js: 上下文管理
```

---

**文档版本**: v1.0
**创建时间**: 2025-11-04 05:00 GMT+8
**Night-Auth 成果**: 系统化学习与规划
**状态**: 🎯 已完成，待用户审阅