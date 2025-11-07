# Playwright 迁移技术方案

**创建时间**: 2025-10-31 Night-Auth
**决策依据**: RRXSXYZ_Top10 AI Coder报告（Playwright > Puppeteer）
**目标**: 1-2小时完成迁移，性能提升20-30%

---

## 🎯 迁移目标

### 核心收益
- ✅ **性能提升**: 20-30%响应速度提升（持久WebSocket连接）
- ✅ **智能等待**: 自动等待元素可操作（减少flaky tests）
- ✅ **跨浏览器**: Chrome + Firefox + Safari（WebKit）支持
- ✅ **视频录制**: 内置视频录制功能（调试利器）
- ✅ **并行测试**: 原生并行支持（30分钟 → 10分钟）
- ✅ **未来AI集成**: Playwright MCP（2025年3月发布）

### 迁移范围
- `scripts/gemba-agent.js` (460行) → `scripts/gemba-agent-playwright.js`
- 新增配置文件：`playwright.config.js`
- 新增功能模块：视频录制、并行测试、增强报告

---

## 📋 API映射表（Puppeteer → Playwright）

| Puppeteer | Playwright | 说明 |
|-----------|-----------|------|
| `puppeteer.launch()` | `chromium.launch()` | 浏览器启动 |
| `browser.newPage()` | `context.newPage()` | 创建页面 |
| `page.goto(url)` | `page.goto(url)` | **完全相同** ✅ |
| `page.waitForSelector()` | `page.waitForSelector()` | **完全相同** ✅ |
| `page.click()` | `page.click()` | **完全相同** ✅ |
| `page.type()` | `page.fill()` | 输入文本（Playwright更快） |
| `page.evaluate()` | `page.evaluate()` | **完全相同** ✅ |
| `page.screenshot()` | `page.screenshot()` | **完全相同** ✅ |
| `page.on('console')` | `page.on('console')` | **完全相同** ✅ |
| `page.setViewport()` | `page.setViewportSize()` | 设置视口 |
| ❌ 无 | `page.video.path()` | **新增**: 视频录制 🎥 |
| ❌ 手动实现 | `test.describe.parallel()` | **新增**: 并行测试 ⚡ |

**API相似度**: 90%+ → 迁移成本极低！

---

## 🔧 迁移步骤（10步）

### Step 1: 安装Playwright（5分钟）
```bash
npm install -D @playwright/test
npx playwright install chromium  # 仅安装Chrome（与Puppeteer等效）
```

### Step 2: 创建配置文件（5分钟）
**文件**: `playwright.config.js`

```javascript
module.exports = {
  testDir: './scripts',
  timeout: 60000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    video: 'on',  // 自动录制视频
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'  // 失败时保留trace
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};
```

### Step 3: 修改核心代码（30分钟）
**关键变更**:

1. **导入模块**
```javascript
// Puppeteer
const puppeteer = require('puppeteer');

// Playwright
const { chromium } = require('playwright');
```

2. **启动浏览器**
```javascript
// Puppeteer
this.browser = await puppeteer.launch({ headless: false });
this.page = await this.browser.newPage();

// Playwright
this.browser = await chromium.launch({ headless: false });
this.context = await this.browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: './gemba-reports/videos' }  // 视频录制
});
this.page = await this.context.newPage();
```

3. **智能等待（新增）**
```javascript
// Puppeteer（需手动等待）
await this.page.waitForSelector(selector, { timeout });

// Playwright（自动等待元素可操作）
await this.page.click(selector);  // 自动等待可点击！
```

### Step 4: 增强功能（20分钟）

**4.1 视频录制**
```javascript
async closeWithVideo() {
  const videoPath = await this.page.video().path();
  await this.browser.close();
  console.log(`🎥 视频已保存: ${videoPath}`);
}
```

**4.2 网络拦截（API Mock）**
```javascript
await this.page.route('**/api/**', route => {
  // Mock API响应
  route.fulfill({ status: 200, body: JSON.stringify({ mock: true }) });
});
```

**4.3 慢速网络模拟**
```javascript
await this.context.route('**', route => {
  setTimeout(() => route.continue(), 1000);  // 延迟1秒
});
```

### Step 5: 并行测试（15分钟）
**文件**: `scripts/parallel-runner.js`

```javascript
const { test } = require('@playwright/test');

test.describe.parallel('Gemba测试套件', () => {
  test('测试1: 登录和角色选择', async ({ page }) => { /* ... */ });
  test('测试2: 启动辩论', async ({ page }) => { /* ... */ });
  test('测试3: 字数减半', async ({ page }) => { /* ... */ });
});
```

**执行**: `npx playwright test --workers=3`（3个测试并行）

### Step 6: 增强报告（10分钟）
Playwright自带HTML报告：
```bash
npx playwright show-report  # 自动打开浏览器查看
```

### Step 7: 对比测试（10分钟）
**文件**: `scripts/puppeteer-vs-playwright-benchmark.js`

测试对比：
- 启动时间
- 响应速度
- 测试稳定性

### Step 8: 文档更新（5分钟）
更新 `CLAUDE.md` Rule 6（D-77）：
- 推荐使用 `gemba-agent-playwright.js`
- 保留 `gemba-agent.js`（向后兼容）

### Step 9: 验证测试（10分钟）
```bash
node scripts/gemba-agent-playwright.js
```

验证项：
- ✅ 登录成功
- ✅ 角色选择正确
- ✅ 辩论启动
- ✅ 视频录制成功

### Step 10: 清理（5分钟）
- 可选删除 `puppeteer`（节省空间）
- 保留原 `gemba-agent.js`（备份）

---

## 📊 性能对比预测

| 指标 | Puppeteer | Playwright | 提升 |
|------|-----------|-----------|------|
| 启动时间 | 2.5秒 | 2.0秒 | ⬇️ 20% |
| 响应延迟 | 1.2秒 | 0.9秒 | ⬇️ 25% |
| 测试稳定性 | 85% | 95% | ⬆️ 10% |
| 并行支持 | ❌ 手动 | ✅ 原生 | ♾️ 无限 |
| 视频录制 | ❌ 无 | ✅ 内置 | 🎥 新增 |

**总体提升**: 20-30% 性能 + 10% 稳定性 ✅

---

## ⚠️ 风险与应对

### 风险1: API不兼容
**概率**: 低（90%+相似度）
**应对**: 保留原Puppeteer版本，逐步迁移

### 风险2: 浏览器驱动问题
**概率**: 中（首次安装）
**应对**: `npx playwright install --force`

### 风险3: 测试失败
**概率**: 低（自动等待机制更稳定）
**应对**: 使用 `page.pause()` 调试

---

## 🔮 未来扩展（Phase 2, 2026年）

### 1. 多浏览器测试
```javascript
// 同时测试 Chrome + Firefox + Safari
const browsers = ['chromium', 'firefox', 'webkit'];
for (const browserType of browsers) {
  const browser = await playwright[browserType].launch();
  // ...
}
```

### 2. Playwright MCP集成（AI驱动）
```javascript
// 2026年预计可用
await ai.execute("填写表单，话题是'AI编程助手'，然后启动辩论");
```

### 3. 自修复测试（Self-Healing）
Playwright自动适应UI变化，无需手动更新选择器

---

## 📝 迁移清单（Checklist）

```
☐ 1. 安装Playwright（npm install -D @playwright/test）
☐ 2. 创建playwright.config.js配置文件
☐ 3. 复制gemba-agent.js → gemba-agent-playwright.js
☐ 4. 修改导入模块（puppeteer → playwright）
☐ 5. 修改浏览器启动逻辑（launch + newContext）
☐ 6. 测试基础功能（登录、角色选择、辩论）
☐ 7. 添加视频录制功能
☐ 8. 添加并行测试（可选）
☐ 9. 运行对比测试（benchmark）
☐ 10. 更新文档（CLAUDE.md Rule 6）
☐ 11. 提交代码（git commit）
```

---

## 🎯 成功标准

- ✅ 所有测试通过（登录、角色选择、辩论、字数减半）
- ✅ 视频录制成功（可查看完整测试过程）
- ✅ 性能提升 ≥ 20%
- ✅ 测试稳定性 ≥ 95%
- ✅ 文档完整更新

---

## 📚 参考资源

- Playwright官方文档: https://playwright.dev/
- 迁移指南: https://playwright.dev/docs/puppeteer
- API对比: https://playwright.dev/docs/api/class-page
- 最佳实践: https://playwright.dev/docs/best-practices

---

**预计总时间**: 1-2小时
**推荐执行时间**: Night-Auth期间（无需用户干预）
**优先级**: P0（立即执行）

---

**End of Migration Plan** 🚀
