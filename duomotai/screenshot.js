/**
 * 多魔汰系统自动截图脚本
 * 使用 Puppeteer 自动打开页面并截图
 *
 * 安装依赖:
 * npm install puppeteer
 *
 * 运行:
 * node screenshot.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshots() {
    console.log('🚀 启动浏览器...');

    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });

    const page = await browser.newPage();

    // 创建截图保存目录
    const screenshotDir = path.join(__dirname, 'screenshots');
    const fs = require('fs');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    try {
        // 1. 首页截图
        console.log('📸 截图1: 首页');
        await page.goto('http://localhost:8080/duomotai/');
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(screenshotDir, '01-homepage.png'),
            fullPage: true
        });

        // 2. 填写输入框
        console.log('📸 截图2: 填写问题');
        await page.type('#topicInput', '我应该如何从职场转型做自媒体？');
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(screenshotDir, '02-topic-input.png'),
            fullPage: true
        });

        // 3. 选择角色
        console.log('📸 截图3: 选择角色');
        await page.evaluate(() => {
            const roleCards = document.querySelectorAll('.role-card');
            roleCards[0]?.click();
            roleCards[1]?.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(screenshotDir, '03-role-selection.png'),
            fullPage: true
        });

        // 4. 语音控制区域特写
        console.log('📸 截图4: 语音控制');
        const voiceControls = await page.$('#voiceControls');
        if (voiceControls) {
            await voiceControls.screenshot({
                path: path.join(screenshotDir, '04-voice-controls.png')
            });
        }

        // 5. 文字速度控制特写
        console.log('📸 截图5: 文字速度控制');
        const textRateControl = await page.$('#textRateControl');
        if (textRateControl) {
            await textRateControl.screenshot({
                path: path.join(screenshotDir, '05-text-rate-control.png')
            });
        }

        // 6. 角色卡片特写（展示动画效果）
        console.log('📸 截图6: 角色卡片');
        const rolesGrid = await page.$('#rolesGrid');
        if (rolesGrid) {
            await rolesGrid.screenshot({
                path: path.join(screenshotDir, '06-roles-grid.png')
            });
        }

        console.log('✅ 所有截图已保存到:', screenshotDir);
        console.log('📁 截图文件列表:');
        const files = fs.readdirSync(screenshotDir);
        files.forEach(file => console.log(`   - ${file}`));

    } catch (error) {
        console.error('❌ 截图失败:', error);
    } finally {
        await browser.close();
        console.log('🔚 浏览器已关闭');
    }
}

// 执行截图
takeScreenshots().catch(console.error);
