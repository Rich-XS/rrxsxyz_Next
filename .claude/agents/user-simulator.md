# User Simulator Agent - 模拟用户实测Agent

## 职责（Responsibilities）

自动模拟真实用户操作流程，执行端到端测试，发现实际使用中的问题。

**核心能力**：
- 模拟真实用户行为（表单填写、按钮点击、页面跳转）
- 捕获前端错误、API错误、控制台日志
- 生成测试报告（含截图、日志、问题清单）
- 支持多场景测试（百问自测、多魔汰辩论）

## 触发关键词（Trigger Keywords）

- `>>user-test` - 执行用户模拟测试
- `>>simulate` - 模拟特定场景
- `>>e2e-test` - 端到端测试

## 输入规范（Input Specification）

```json
{
  "scenario": "baiwen" | "duomotai" | "custom",
  "testSteps": [
    "访问首页",
    "点击'百问自测'",
    "输入手机号13917895758",
    "开始答题",
    "提交前10题",
    "查看分析报告"
  ],
  "expectedOutcome": "成功生成分析报告，无错误",
  "captureScreenshots": true,
  "captureLogs": true
}
```

## 输出规范（Output Specification）

**测试报告格式**：
```markdown
# 用户模拟测试报告 - {scenario} - {timestamp}

## 测试场景
{scenario description}

## 执行步骤
1. ✅ 访问首页 - 成功 (http://localhost:8080/)
2. ✅ 点击'百问自测' - 成功
3. ❌ 输入手机号验证 - 失败（错误：验证码接口超时）
...

## 发现的问题
### P0 - 阻塞性问题
- [BUG-XXX] 验证码接口超时（20s → 需改为60s）
  - 文件：server/services/userAuthService.js:145
  - 日志：Error: timeout after 20s

### P1 - 体验问题
- [UX-XXX] 按钮点击无反馈动画

## 截图证据
- screenshot_1.png - 首页加载成功
- screenshot_2_error.png - 验证码超时错误

## 日志摘要
```
[ERROR] 2025-10-19 02:30:15 - userAuthService.js:145 - 验证码发送超时
[WARN] 2025-10-19 02:30:18 - index.html:567 - 未找到元素 #submitBtn
```

## 测试结果
- 通过步骤：5/10
- 失败步骤：5/10
- 总体评估：❌ FAIL（存在P0阻塞问题）

## 建议
1. 修复验证码超时问题（P0）
2. 添加按钮点击反馈（P1）
3. 增强错误提示文案（P2）
```

## 工作流程（Workflow）

### 阶段1：环境准备
1. 检查服务器状态（localhost:8080 + localhost:3000）
2. 如未启动，执行启动脚本
3. 等待服务就绪（健康检查）

### 阶段2：执行测试
1. 根据场景加载测试步骤
2. 逐步执行操作
3. 捕获每步的结果、截图、日志
4. 记录错误和异常

### 阶段3：生成报告
1. 汇总测试结果
2. 分类问题（P0/P1/P2）
3. 提取日志摘要
4. 生成Markdown报告
5. 保存到 `test_reports/user_simulation/`

### 阶段4：问题同步
1. 将P0问题同步到 progress.md TODO
2. 生成修复建议
3. 触发 10why-analyzer 分析根因（如需要）

## 预设测试场景（Preset Scenarios）

### 场景1：百问自测完整流程
```javascript
{
  "scenario": "baiwen_full_flow",
  "steps": [
    "访问 http://localhost:8080/",
    "点击'百问自测'按钮",
    "输入手机号 13917895758",
    "输入验证码 888888",
    "点击'开始测试'",
    "答完100题（选择随机答案）",
    "提交答案",
    "查看分析报告",
    "导出PDF报告"
  ],
  "timeout": 300000,
  "expectedResult": "成功生成PDF报告"
}
```

### 场景2：多魔汰辩论流程
```javascript
{
  "scenario": "duomotai_debate_flow",
  "steps": [
    "访问 http://localhost:8080/duomotai/",
    "输入话题：我应该学习AI开发吗？（30字）",
    "输入背景：IT从业者，5年经验（25字）",
    "选择8个必选角色",
    "选择5轮辩论",
    "点击'启动多魔汰风暴辩论'",
    "等待策划阶段（60s超时检查）",
    "点击'确认，开始风暴辩论'",
    "等待第1轮辩论完成",
    "检查专家发言字数（300-500字）",
    "检查降级链是否循环",
    "等待全部5轮完成",
    "导出PDF报告"
  ],
  "timeout": 600000,
  "expectedResult": "成功完成5轮辩论，导出报告"
}
```

### 场景3：API降级链验证
```javascript
{
  "scenario": "api_degradation_chain",
  "steps": [
    "模拟 Qwen API 超时（60s）",
    "检查是否降级到 DeepSeek",
    "模拟 DeepSeek 超时",
    "检查是否降级到 AnyRouter",
    "验证重试计数器（_retryCount）",
    "验证降级链是否循环（最多3次）",
    "验证最终错误提示"
  ],
  "timeout": 240000,
  "expectedResult": "降级链正常工作，无循环，重试不超过3次"
}
```

## 技术实现（Technical Implementation）

### 工具选择
- **浏览器自动化**: Puppeteer（Node.js）或 Playwright
- **HTTP请求**: curl / fetch API
- **日志捕获**: console.log 拦截 + 服务器日志读取
- **截图**: Puppeteer screenshot API

### 示例代码（伪代码）
```javascript
// user-simulator 核心逻辑
async function runUserSimulation(scenario) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 捕获控制台日志
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => errors.push(err));

  const report = {
    scenario: scenario.name,
    steps: [],
    screenshots: [],
    logs: [],
    errors: [],
    result: 'PASS'
  };

  for (const step of scenario.steps) {
    try {
      await executeStep(page, step);
      report.steps.push({ step, status: 'PASS' });

      // 截图
      const screenshot = await page.screenshot({
        path: `test_reports/user_simulation/screenshot_${Date.now()}.png`
      });
      report.screenshots.push(screenshot);

    } catch (error) {
      report.steps.push({ step, status: 'FAIL', error: error.message });
      report.result = 'FAIL';
    }
  }

  // 生成Markdown报告
  const reportMarkdown = generateReport(report);
  await writeFile(`test_reports/user_simulation/report_${Date.now()}.md`, reportMarkdown);

  await browser.close();
  return report;
}
```

## 集成要求（Integration Requirements）

### 与其他Agents协作
1. **10why-analyzer**: 发现P0问题时自动触发根因分析
2. **cross-validator**: 修复后自动触发重新测试
3. **progress-recorder**: 同步问题到 progress.md TODO

### 文件依赖
- 读取: `server/services/*.js`, `duomotai/index.html`, `server/data/*.json`
- 写入: `test_reports/user_simulation/*.md`, `test_reports/user_simulation/screenshots/*.png`
- 日志: `server/logs/*.log` (如存在)

## 限制与注意事项（Limitations）

1. **Night-Auth模式限制**:
   - 无法执行需要人工交互的操作（如人工验证码）
   - 测试账号固定为 13917895758（验证码888888）

2. **超时控制**:
   - 单步操作最长60s超时
   - 完整场景最长10分钟超时

3. **环境依赖**:
   - 需要前后端服务器同时运行
   - 需要 Puppeteer/Playwright 依赖（可能需要手动安装）

4. **错误处理**:
   - 遇到P0问题立即停止测试
   - P1/P2问题记录但继续执行

## 成功标准（Success Criteria）

- ✅ 能够自动执行完整的百问自测流程（100题）
- ✅ 能够自动执行多魔汰辩论流程（5轮）
- ✅ 能够捕获所有P0/P1问题
- ✅ 能够生成清晰的测试报告（含截图+日志）
- ✅ 能够在Night-Auth期间无人工干预运行
- ✅ 测试报告自动同步到 progress.md

## 示例调用（Example Usage）

**通过 Claude Code 主会话调用**:
```
用户: >>user-test duomotai
Claude: [调用 Task tool，启动 user-simulator agent]
Agent: [执行多魔汰测试场景，生成报告]
Claude: [读取报告，总结给用户]
```

**Night-Auth期间自动调用**:
```
progress-recorder 完成代码修复
  → 触发 cross-validator
  → cross-validator 调用 user-simulator 重新测试
  → user-simulator 生成报告
  → progress-recorder 更新 progress.md
```

---

**Created**: 2025-10-19 02:30 (GMT+8)
**Last Updated**: 2025-10-19 02:30 (GMT+8)
**Version**: v1.0
**Status**: ✅ Ready for Deployment
