# Claude Code 图片生成能力实施文档

**创建时间**: 2025-10-17
**目标**: 让 Claude Code 具备自动生成效果图的能力

---

## 📦 已安装依赖

```bash
npm install puppeteer
# 已安装版本: puppeteer@24.25.0
```

---

## 🎯 核心能力

### 1. 图片生成器模块 (`imageGenerator.js`)

**功能**:
- ✅ 自动启动无头浏览器（Headless Chrome）
- ✅ 截取完整页面
- ✅ 截取指定元素
- ✅ 执行页面操作后截图
- ✅ 批量生成截图
- ✅ 自动生成 Markdown 报告

**API**:
```javascript
const ImageGenerator = require('./scripts/imageGenerator');

// 初始化
const generator = new ImageGenerator({
    baseUrl: 'http://localhost:8080',
    screenshotDir: './screenshots',
    viewport: { width: 1920, height: 1080 }
});

await generator.init();

// 截取完整页面
await generator.captureFullPage(url, filename, options);

// 截取指定元素
await generator.captureElement(url, selector, filename, options);

// 执行操作后截图
await generator.captureWithActions(url, actions, filename, options);

// 批量生成
const results = await generator.generateBatch(tasks);

// 生成报告
generator.generateMarkdownReport(results, reportPath);

await generator.close();
```

---

## 🚀 使用方法

### 方法1: 快速测试（验证功能）

```bash
# 1. 启动本地服务器（新终端）
python -m http.server 8080

# 2. 运行测试脚本
npm run screenshot:test
```

**预期结果**:
- ✅ 生成3张测试截图
- ✅ 保存到 `test-screenshots/` 目录
- ✅ 验证 Puppeteer 正常工作

---

### 方法2: 生成多魔汰完整截图（12张效果图）

```bash
# 1. 启动本地服务器（新终端）
python -m http.server 8080

# 2. 运行多魔汰截图生成
npm run screenshot:duomotai
```

**预期结果**:
- ✅ 生成12张多魔汰系统截图
- ✅ 保存到 `duomotai/screenshots/` 目录
- ✅ 自动生成 Markdown 报告: `SCREENSHOTS_REPORT.md`

**截图内容**:
1. `01-homepage-full.png` - 完整首页
2. `02-header-voice-controls.png` - 顶部Banner和语音控制
3. `03-setup-area.png` - 问题输入区域
4. `04-roles-grid.png` - 角色选择网格（16角色）
5. `05-rounds-selector.png` - 辩论轮次选择器
6. `06-filled-inputs.png` - 填写问题和背景后的页面
7. `07-roles-selected.png` - 选择多个角色后的状态
8. `08-text-rate-control-closeup.png` - 文字速度控制特写
9. `09-voice-controls-closeup.png` - 语音控制按钮组特写
10. `10-role-card-first-principles.png` - 角色卡片特写
11. `11-start-button.png` - 启动辩论按钮
12. `12-navigation-menu.png` - 底部导航菜单

---

### 方法3: 自定义截图任务

创建自己的截图脚本：

```javascript
const ImageGenerator = require('./scripts/imageGenerator');
const path = require('path');

async function myScreenshots() {
    const generator = new ImageGenerator({
        screenshotDir: path.join(__dirname, 'my-screenshots')
    });

    await generator.init();

    // 自定义截图任务
    const tasks = [
        {
            name: '我的页面',
            type: 'fullPage',
            url: 'http://localhost:8080/my-page.html',
            filename: 'my-page.png'
        },
        {
            name: '特定元素',
            type: 'element',
            url: 'http://localhost:8080/',
            selector: '#my-element',
            filename: 'my-element.png'
        },
        {
            name: '交互后截图',
            type: 'withActions',
            url: 'http://localhost:8080/',
            filename: 'after-interaction.png',
            actions: [
                async (page) => {
                    await page.click('#button');
                    await page.type('#input', 'Hello');
                }
            ]
        }
    ];

    const results = await generator.generateBatch(tasks);
    generator.generateMarkdownReport(results, './my-screenshots/REPORT.md');

    await generator.close();
}

myScreenshots();
```

---

## 📊 Claude Code 调用流程

### 当用户要求生成效果图时：

```javascript
// Claude Code 执行流程：

// 1. 确保本地服务器运行
Bash: python -m http.server 8080

// 2. 运行截图脚本
Bash: npm run screenshot:duomotai

// 3. 读取生成的截图报告
Read: duomotai/screenshots/SCREENSHOTS_REPORT.md

// 4. 向用户展示结果
"✅ 已生成12张效果图，保存到 duomotai/screenshots/ 目录
📄 Markdown 报告已生成，包含所有截图预览"
```

---

## 🔧 故障排除

### 问题1: Puppeteer 启动失败

**错误信息**: `Error: Failed to launch the browser process`

**解决方案**:
```bash
# 重新安装 Puppeteer（包含 Chromium）
npm uninstall puppeteer
npm install puppeteer

# 或手动下载 Chromium
npx puppeteer browsers install chrome
```

---

### 问题2: 本地服务器未启动

**错误信息**: `net::ERR_CONNECTION_REFUSED`

**解决方案**:
```bash
# 启动本地服务器
python -m http.server 8080

# 或使用 Node.js http-server
npm install -g http-server
http-server -p 8080
```

---

### 问题3: 中文显示乱码

**错误信息**: 截图中中文显示为方框

**解决方案**:
```javascript
// 在 imageGenerator.js 中添加字体配置
await this.browser.newPage({
    args: [
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning'
    ]
});
```

或安装系统字体：
```bash
# Windows: 已自带中文字体
# Linux: sudo apt-get install fonts-wqy-zenhei
```

---

## 📝 高级用法

### 1. 生成动态交互截图

```javascript
{
    name: '动态交互演示',
    type: 'withActions',
    url: 'http://localhost:8080/duomotai/',
    filename: 'dynamic-interaction.png',
    actions: [
        async (page) => {
            // 填写输入框
            await page.type('#topicInput', '测试问题');

            // 点击角色卡片
            await page.click('.role-card[data-role-id="1"]');

            // 等待动画完成
            await page.waitForTimeout(500);

            // 滚动到指定位置
            await page.evaluate(() => {
                window.scrollTo(0, 500);
            });
        }
    ]
}
```

---

### 2. 批量生成多分辨率截图

```javascript
const viewports = [
    { width: 1920, height: 1080, label: 'desktop' },
    { width: 768, height: 1024, label: 'tablet' },
    { width: 375, height: 667, label: 'mobile' }
];

for (const viewport of viewports) {
    const generator = new ImageGenerator({ viewport });
    await generator.init();
    await generator.captureFullPage(
        url,
        `homepage-${viewport.label}.png`
    );
    await generator.close();
}
```

---

### 3. 生成GIF动画（需要额外依赖）

```bash
# 安装 GIF 生成工具
npm install puppeteer-screen-recorder
```

```javascript
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const recorder = new PuppeteerScreenRecorder(page);
await recorder.start('./animation.gif');

// 执行操作...

await recorder.stop();
```

---

## 🎯 未来扩展

### 短期计划（P1）
1. ✅ 支持完整页面截图
2. ✅ 支持元素截图
3. ✅ 支持交互操作后截图
4. ✅ 自动生成 Markdown 报告
5. ⏳ 支持视频录制（GIF/MP4）
6. ⏳ 支持多分辨率批量生成
7. ⏳ 支持自动比对（截图对比功能）

### 长期计划（P2）
1. ⏳ 集成到 Claude Code 工作流（自动化）
2. ⏳ 支持截图标注（箭头、文字、高亮）
3. ⏳ 支持 PDF 导出（包含截图的完整文档）
4. ⏳ 支持云端存储（自动上传到图床）
5. ⏳ 支持 AI 分析截图（检测UI问题）

---

## ✅ 总结

### 现在 Claude Code 已具备：

1. ✅ **自动生成效果图** - 通过 Puppeteer 自动截图
2. ✅ **批量生成** - 一次性生成多张截图
3. ✅ **交互操作** - 模拟用户操作后截图
4. ✅ **自动化报告** - 生成 Markdown 报告
5. ✅ **灵活配置** - 支持自定义分辨率、等待时间等

### 使用流程：

```bash
# 1. 启动服务器
python -m http.server 8080

# 2. 生成截图
npm run screenshot:duomotai

# 3. 查看结果
# 打开: duomotai/screenshots/SCREENSHOTS_REPORT.md
```

---

**创建时间**: 2025-10-17
**文档版本**: v1.0
**维护者**: Claude Code (Night-Auth Mode)
