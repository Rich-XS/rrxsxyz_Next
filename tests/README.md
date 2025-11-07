# Playwright 自动化测试指南

## 📋 目录

1. [快速开始](#快速开始)
2. [测试结构](#测试结构)
3. [运行测试](#运行测试)
4. [编写测试](#编写测试)
5. [最佳实践](#最佳实践)

---

## 快速开始

### 1. 安装依赖

```bash
# 安装Playwright
npm install

# 安装浏览器
npm run playwright:install
```

### 2. 启动服务器

**重要**: 运行测试前必须启动前后端服务器

```bash
# 方式1: 使用启动脚本
localhost_start.bat → 选择 [3] Full Stack

# 方式2: 手动启动
# Terminal 1: 前端 (8080)
python -m http.server 8080

# Terminal 2: 后端 (3001)
cd server && npm run dev
```

### 3. 运行测试

```bash
# 运行所有测试（headless模式）
npm run playwright:test

# UI模式（交互式调试）
npm run playwright:ui

# 查看测试报告
npm run playwright:report

# 调试模式（逐步执行）
npm run playwright:debug

# 有界面模式（查看浏览器）
npm run playwright:headed
```

---

## 测试结构

```
tests/
└── e2e/
    └── duomotai-basic.spec.ts   # 基础流程测试
        ├── 多魔汰基础流程
        │   ├── 应该显示首页并能进入系统
        │   ├── 测试用户应该能够登录
        │   ├── 应该显示16个角色卡片
        │   └── 应该能够启动策划阶段
        ├── 字数控制验证（测试用户）
        │   └── 测试用户专家发言应该符合字数限制
        └── UI元素验证
            ├── 导航条应该显示 (V57.20修复)
            ├── 文字速度调节应该显示正确的默认值 (V57.22修复)
            └── 按钮编码应该正确 (V57.22修复)
```

---

## 运行测试

### 基础命令

| 命令 | 描述 |
|------|------|
| `npm run playwright:test` | 运行所有测试（headless） |
| `npm run playwright:ui` | UI模式，交互式调试 |
| `npm run playwright:report` | 查看HTML测试报告 |
| `npm run playwright:debug` | 调试模式（逐步执行） |
| `npm run playwright:headed` | 有界面模式（显示浏览器） |

### 高级用法

```bash
# 运行特定测试文件
npx playwright test tests/e2e/duomotai-basic.spec.ts

# 运行特定测试用例（通过名称）
npx playwright test --grep "应该显示首页"

# 并行运行（加快速度）
npx playwright test --workers=4

# 生成代码（录制操作）
npx playwright codegen http://localhost:8080/duomotai/
```

---

## 编写测试

### 测试模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能模块名称', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('/duomotai/');
  });

  test('测试用例描述', async ({ page }) => {
    // 1. 操作页面
    await page.locator('selector').click();
    await page.locator('input').fill('text');

    // 2. 验证结果
    await expect(page.locator('result')).toBeVisible();
    await expect(page.locator('result')).toHaveText('期望文本');
  });
});
```

### 常用选择器

```typescript
// ID选择器
page.locator('#myId')

// Class选择器
page.locator('.myClass')

// 文本内容
page.locator('button:has-text("登录")')

// Placeholder
page.locator('input[placeholder*="手机号"]')

// 第N个元素
page.locator('.item').nth(0)
page.locator('.item').first()
page.locator('.item').last()

// 组合选择器
page.locator('.container >> button')
```

### 常用断言

```typescript
// 可见性
await expect(element).toBeVisible()
await expect(element).toBeHidden()

// 文本
await expect(element).toHaveText('期望文本')
await expect(element).toContainText('包含文本')

// 属性
await expect(element).toHaveAttribute('href', '/path')
await expect(element).toHaveClass('active')

// 数量
await expect(elements).toHaveCount(16)

// 值
await expect(input).toHaveValue('期望值')

// URL
await expect(page).toHaveURL(/.*duomotai.*/)
await expect(page).toHaveTitle(/多魔汰/)
```

---

## 最佳实践

### 1. 使用测试用户

```typescript
const TEST_USER_PHONE = '13917895758';
const TEST_VERIFICATION_CODE = '888888';

// 测试用户特权：
// - 验证码自动填充 888888
// - 字数减半（200字左右）
// - 最少2个专家
```

### 2. 合理使用等待

```typescript
// ✅ 推荐：等待元素
await expect(page.locator('.content')).toBeVisible({ timeout: 30000 });

// ⚠️ 避免：固定时间等待（不稳定）
await page.waitForTimeout(5000);
```

### 3. 页面对象模式

```typescript
// pages/duomotai.page.ts
export class DuomotaiPage {
  constructor(private page: Page) {}

  async login(phone: string) {
    await this.page.locator('input[placeholder*="手机号"]').fill(phone);
    await this.page.locator('button:has-text("登录")').click();
  }

  async startDebate(topic: string) {
    await this.page.locator('textarea[placeholder*="问题"]').fill(topic);
    await this.page.locator('button:has-text("启动")').click();
  }
}

// 测试中使用
test('登录流程', async ({ page }) => {
  const duomotai = new DuomotaiPage(page);
  await duomotai.login('13917895758');
});
```

### 4. 截图和跟踪

```typescript
test('关键流程测试', async ({ page }) => {
  // 操作前截图
  await page.screenshot({ path: 'screenshots/before.png' });

  // 执行操作
  await page.click('button');

  // 操作后截图
  await page.screenshot({ path: 'screenshots/after.png' });

  // 失败时自动截图（配置文件已启用）
});
```

### 5. 跳过需要服务器的测试

```typescript
test('需要服务器的测试', async ({ page }) => {
  // 如果服务器未运行，跳过测试
  test.skip(!process.env.RUN_FULL_TESTS, '需要服务器运行');

  // 测试逻辑...
});

// 运行完整测试：
// RUN_FULL_TESTS=1 npm run playwright:test
```

---

## 测试覆盖清单

### P0 核心功能

- [x] 首页显示
- [x] 测试用户登录
- [x] 16个角色卡片显示
- [x] 策划阶段启动
- [ ] 完整辩论流程
- [ ] 中场流程验证
- [ ] 字数控制验证

### P1 UI/UX

- [x] 导航条显示 (V57.20)
- [x] 文字速度默认值 (V57.22)
- [x] 按钮编码正确 (V57.22)
- [ ] Banner布局
- [ ] 语音播放
- [ ] 关键词加粗

### P2 性能

- [ ] 首屏加载时间 < 2秒
- [ ] AI响应时间 < 3秒
- [ ] 内存泄漏检测
- [ ] 并发用户测试

---

## 调试技巧

### 1. Playwright Inspector

```bash
# 启动调试器
npm run playwright:debug

# 或指定测试文件
npx playwright test --debug tests/e2e/duomotai-basic.spec.ts
```

### 2. Trace Viewer

```bash
# 测试失败时自动生成trace
# 查看trace
npx playwright show-trace test-results/traces/trace.zip
```

### 3. VS Code扩展

安装 "Playwright Test for VSCode" 扩展：
- 直接在编辑器中运行测试
- 逐步调试
- 查看测试结果

---

## 常见问题

### Q1: 测试超时怎么办？

```typescript
// 增加特定测试的超时时间
test('慢速测试', async ({ page }) => {
  test.setTimeout(120000); // 2分钟

  // 测试逻辑...
});
```

### Q2: 如何处理弹窗？

```typescript
// 方式1: 等待并处理
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.accept();
});

// 方式2: 验证弹窗文本
const dialog = await page.waitForEvent('dialog');
expect(dialog.message()).toContain('预期文本');
await dialog.accept();
```

### Q3: 如何测试语音功能？

```typescript
// 监听语音API调用
await page.evaluate(() => {
  window.speechSynthesis.speak = (utterance) => {
    console.log('语音内容:', utterance.text);
  };
});
```

---

## 参考资源

- [Playwright官方文档](https://playwright.dev)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [最佳实践](https://playwright.dev/docs/best-practices)
- [CI/CD集成](https://playwright.dev/docs/ci)

---

**文档版本**: v1.0
**创建时间**: 2025-11-04 05:10 GMT+8
**维护者**: Claude Code Agent
**状态**: ✅ Playwright环境已配置完成