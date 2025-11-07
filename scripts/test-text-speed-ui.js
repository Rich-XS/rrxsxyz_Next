/**
 * 文字速度UI测试脚本
 * 使用Playwright检查文字速度控制的显示和功能
 * V57.21 - 2025-11-04
 */

const { chromium } = require('playwright');

async function testTextSpeedUI() {
    console.log('🚀 启动文字速度UI测试...');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500 // 慢速执行，便于观察
    });

    const page = await browser.newPage();

    try {
        // 1. 打开页面
        console.log('📄 访问多魔汰系统...');
        await page.goto('http://localhost:8080/duomotai/');

        // 等待页面加载
        await page.waitForLoadState('networkidle');

        // 2. 检查版本号
        const version = await page.textContent('.version-tag');
        console.log(`✅ 系统版本: ${version}`);

        // 3. 检查文字速度控制是否存在
        console.log('\n🔍 检查文字速度控制UI...');

        const textRateControl = await page.locator('#textRateControl');
        const isVisible = await textRateControl.isVisible();
        console.log(`📊 文字速度控制可见性: ${isVisible ? '✅ 可见' : '❌ 不可见'}`);

        if (isVisible) {
            // 4. 检查文字速度显示
            const textRateDisplay = await page.locator('#textRateDisplay');
            const currentRate = await textRateDisplay.textContent();
            console.log(`📊 当前文字速度: ${currentRate}`);

            // 5. 检查按钮符号
            console.log('\n🔍 检查按钮符号编码...');

            // 减速按钮
            const minusButton = await page.locator('#textRateControl button:first-of-type');
            const minusText = await minusButton.textContent();
            console.log(`➖ 减速按钮文字: "${minusText}" (Unicode: ${minusText.charCodeAt(0)})`);

            // 检查是否是正确的减号
            if (minusText === '−' || minusText === '-') {
                console.log('✅ 减速按钮符号正确');
            } else {
                console.log(`❌ 减速按钮符号异常！期望 "−" 或 "-"，实际 "${minusText}"`);
            }

            // 加速按钮
            const plusButton = await page.locator('#textRateControl button:last-of-type');
            const plusText = await plusButton.textContent();
            console.log(`➕ 加速按钮文字: "${plusText}" (Unicode: ${plusText.charCodeAt(0)})`);

            // 检查是否是正确的加号
            if (plusText === '+') {
                console.log('✅ 加速按钮符号正确');
            } else {
                console.log(`❌ 加速按钮符号异常！期望 "+"，实际 "${plusText}"`);
            }

            // 6. 测试按钮功能
            console.log('\n🧪 测试按钮功能...');

            // 点击减速按钮
            await minusButton.click();
            await page.waitForTimeout(500);
            const rateAfterMinus = await textRateDisplay.textContent();
            console.log(`点击减速后: ${rateAfterMinus}`);

            // 点击加速按钮
            await plusButton.click();
            await page.waitForTimeout(500);
            const rateAfterPlus = await textRateDisplay.textContent();
            console.log(`点击加速后: ${rateAfterPlus}`);

            // 7. 检查样式
            console.log('\n🎨 检查样式问题...');

            // 检查文字速度显示的样式
            const displayStyle = await textRateDisplay.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    color: computed.color,
                    fontSize: computed.fontSize,
                    minWidth: computed.minWidth,
                    textAlign: computed.textAlign
                };
            });
            console.log('文字速度显示样式:', displayStyle);

            // 检查按钮样式
            const buttonStyle = await minusButton.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    width: computed.width,
                    height: computed.height,
                    borderRadius: computed.borderRadius,
                    fontSize: computed.fontSize
                };
            });
            console.log('按钮样式:', buttonStyle);

        } else {
            console.log('❌ 文字速度控制不可见，无法进行进一步测试');
        }

        // 8. 截图保存
        console.log('\n📸 保存截图...');
        await page.screenshot({
            path: 'test-results/text-speed-ui.png',
            fullPage: false
        });
        console.log('✅ 截图已保存到 test-results/text-speed-ui.png');

        // 9. 检查Console错误
        console.log('\n🔍 检查Console错误...');
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Console错误: ${msg.text()}`);
            }
        });

        await page.waitForTimeout(2000);

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await browser.close();
        console.log('\n✅ 测试完成');
    }
}

// 运行测试
testTextSpeedUI().catch(console.error);