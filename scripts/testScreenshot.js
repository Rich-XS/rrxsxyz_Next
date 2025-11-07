/**
 * 截图功能测试脚本
 *
 * 功能：测试 Puppeteer 是否正常工作
 * 使用：npm run screenshot:test
 */

const ImageGenerator = require('./imageGenerator');
const path = require('path');

async function testScreenshot() {
    console.log('🧪 测试 Puppeteer 截图功能...\n');

    const generator = new ImageGenerator({
        baseUrl: 'http://localhost:8080',
        screenshotDir: path.join(__dirname, '../test-screenshots'),
        viewport: { width: 1280, height: 720 }
    });

    try {
        await generator.init();

        console.log('✅ Puppeteer 浏览器启动成功\n');

        // 测试截图1: 百度首页（验证网络连接）
        console.log('📸 测试1: 截取百度首页...');
        await generator.captureFullPage(
            'https://www.baidu.com',
            'test-01-baidu.png',
            { waitTime: 2000 }
        );

        // 测试截图2: 本地首页
        console.log('📸 测试2: 截取本地首页...');
        await generator.captureFullPage(
            'http://localhost:8080/',
            'test-02-localhost.png',
            { waitTime: 2000 }
        );

        // 测试截图3: 多魔汰页面
        console.log('📸 测试3: 截取多魔汰页面...');
        await generator.captureFullPage(
            'http://localhost:8080/duomotai/',
            'test-03-duomotai.png',
            { waitTime: 2000 }
        );

        console.log('\n✅ 所有测试通过！');
        console.log(`📁 截图已保存到: ${generator.screenshotDir}\n`);

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('\n可能的原因:');
        console.error('1. 本地服务器未启动（请先运行: python -m http.server 8080）');
        console.error('2. Puppeteer 安装不完整（请重新运行: npm install puppeteer）');
        console.error('3. Chrome/Chromium 未安装或路径错误\n');
        process.exit(1);
    } finally {
        await generator.close();
    }
}

testScreenshot().catch(error => {
    console.error('❌ 程序异常:', error);
    process.exit(1);
});
