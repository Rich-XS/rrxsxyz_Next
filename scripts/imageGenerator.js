/**
 * Claude Code 图片生成能力模块
 *
 * 功能：让 Claude Code 能够通过 Puppeteer 自动生成效果图
 * 创建时间：2025-10-17
 *
 * @module imageGenerator
 * @version v1.0
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 图片生成器类
 */
class ImageGenerator {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:8080';
        this.screenshotDir = options.screenshotDir || path.join(__dirname, 'screenshots');
        this.viewport = options.viewport || { width: 1920, height: 1080 };
        this.browser = null;
        this.page = null;

        // 创建截图目录
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
            console.log(`✅ 创建截图目录: ${this.screenshotDir}`);
        }
    }

    /**
     * 初始化浏览器
     */
    async init() {
        console.log('🚀 启动 Puppeteer 浏览器...');
        this.browser = await puppeteer.launch({
            headless: true, // 无头模式（后台运行）
            defaultViewport: this.viewport,
            protocolTimeout: 90000, // 增加协议超时到90秒，修复 Task 7 timeout
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        this.page = await this.browser.newPage();
        // 设置页面超时时间
        this.page.setDefaultTimeout(90000);
        this.page.setDefaultNavigationTimeout(90000);
        console.log('✅ 浏览器已启动（协议超时: 90秒）');
    }

    /**
     * 关闭浏览器
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔚 浏览器已关闭');
        }
    }

    /**
     * 截取完整页面
     */
    async captureFullPage(url, filename, options = {}) {
        const defaultOptions = {
            waitTime: 2000,
            fullPage: true,
            ...options
        };

        console.log(`📸 正在截图: ${filename}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, defaultOptions.waitTime));

        const screenshotPath = path.join(this.screenshotDir, filename);
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: defaultOptions.fullPage
        });

        console.log(`✅ 截图已保存: ${screenshotPath}`);
        return screenshotPath;
    }

    /**
     * 截取指定元素（增强版：验证元素存在性）
     */
    async captureElement(url, selector, filename, options = {}) {
        const defaultOptions = {
            waitTime: 2000, // 增加默认等待时间到2秒
            ...options
        };

        console.log(`📸 正在截图元素: ${selector} → ${filename}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });

        // 等待元素出现（最多等待10秒）
        try {
            await this.page.waitForSelector(selector, { timeout: 10000, visible: true });
        } catch (error) {
            throw new Error(`元素未找到或不可见: ${selector}`);
        }

        await new Promise(resolve => setTimeout(resolve, defaultOptions.waitTime));

        const element = await this.page.$(selector);
        if (!element) {
            throw new Error(`元素未找到: ${selector}`);
        }

        const screenshotPath = path.join(this.screenshotDir, filename);
        await element.screenshot({ path: screenshotPath });

        console.log(`✅ 元素截图已保存: ${screenshotPath}`);
        return screenshotPath;
    }

    /**
     * 执行页面操作并截图（增强版：支持元素截图）
     */
    async captureWithActions(url, actions, filename, options = {}) {
        const defaultOptions = {
            waitTime: 1000,
            fullPage: true,
            selector: null, // 新增：如果提供selector，则截取元素而非整页
            ...options
        };

        console.log(`📸 正在截图（含操作）: ${filename}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 执行用户定义的操作
        for (const action of actions) {
            await action(this.page);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await new Promise(resolve => setTimeout(resolve, defaultOptions.waitTime));

        const screenshotPath = path.join(this.screenshotDir, filename);

        // 如果指定了 selector，则截取元素；否则截取整页
        if (defaultOptions.selector) {
            const element = await this.page.$(defaultOptions.selector);
            if (!element) {
                throw new Error(`元素未找到: ${defaultOptions.selector}`);
            }
            await element.screenshot({ path: screenshotPath });
        } else {
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: defaultOptions.fullPage
            });
        }

        console.log(`✅ 截图已保存: ${screenshotPath}`);
        return screenshotPath;
    }

    /**
     * 批量生成截图（增强版：任务间重新加载页面，避免状态污染）
     */
    async generateBatch(tasks) {
        const results = [];

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            try {
                // 任务间重新加载页面（防止前序任务失败导致状态损坏）
                if (i > 0) {
                    console.log('🔄 重置页面状态...');
                    await this.page.goto('about:blank');
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                let result;

                if (task.type === 'fullPage') {
                    result = await this.captureFullPage(task.url, task.filename, task.options);
                } else if (task.type === 'element') {
                    result = await this.captureElement(task.url, task.selector, task.filename, task.options);
                } else if (task.type === 'withActions') {
                    result = await this.captureWithActions(task.url, task.actions, task.filename, task.options);
                }

                results.push({
                    task: task.name || task.filename,
                    status: 'success',
                    path: result
                });
            } catch (error) {
                console.error(`❌ 截图失败: ${task.filename}`, error.message);
                results.push({
                    task: task.name || task.filename,
                    status: 'error',
                    error: error.message
                });
                // 失败后重置页面，防止影响后续任务
                try {
                    await this.page.goto('about:blank');
                } catch (resetError) {
                    console.warn('⚠️ 页面重置失败，继续执行');
                }
            }
        }

        return results;
    }

    /**
     * 生成 Markdown 报告（包含所有截图）
     */
    generateMarkdownReport(results, reportPath) {
        let markdown = `# 截图报告\n\n`;
        markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        markdown += `---\n\n`;

        results.forEach((result, index) => {
            if (result.status === 'success') {
                const relativePath = path.relative(path.dirname(reportPath), result.path);
                markdown += `## ${index + 1}. ${result.task}\n\n`;
                markdown += `![${result.task}](${relativePath})\n\n`;
                markdown += `**路径**: \`${result.path}\`\n\n`;
                markdown += `---\n\n`;
            } else {
                markdown += `## ${index + 1}. ${result.task} ❌\n\n`;
                markdown += `**错误**: ${result.error}\n\n`;
                markdown += `---\n\n`;
            }
        });

        fs.writeFileSync(reportPath, markdown, 'utf-8');
        console.log(`✅ Markdown 报告已生成: ${reportPath}`);
        return reportPath;
    }
}

module.exports = ImageGenerator;
