/**
 * 多魔汰 Gemba 自动化测试脚本
 * 目标：发现"策划页内容短"和"开场错误提示"问题
 * 要求：达到 5/5 评分和 100% 完成度
 */

const puppeteer = require('puppeteer');

// 测试配置
const TEST_CONFIG = {
    baseUrl: 'http://localhost:8080/duomotai/',
    apiUrl: 'http://localhost:3001',
    testPhone: '13917895758',
    testCode: '888888',
    headless: false, // 设为 false 可以看到浏览器操作
    slowMo: 100 // 减慢操作速度，便于观察
};

// 测试结果收集
const testResults = {
    phase: '',
    score: 0,
    maxScore: 0,
    issues: [],
    successes: []
};

// 辅助函数：等待元素
async function waitForElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        testResults.issues.push({
            phase: testResults.phase,
            severity: 'P0',
            description: `元素未找到: ${selector}`,
            error: error.message
        });
        return false;
    }
}

// 辅助函数：截图
async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshots/gemba_${name}_${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 截图保存: ${filename}`);
    return filename;
}

// 辅助函数：检查控制台错误
function setupConsoleMonitor(page) {
    const consoleErrors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({
                text: msg.text(),
                location: msg.location()
            });
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push({
            text: error.message,
            stack: error.stack
        });
    });

    return consoleErrors;
}

// 测试阶段 1: 页面加载和初始化
async function testPhase1_PageLoad(page, consoleErrors) {
    testResults.phase = '阶段1: 页面加载';
    console.log('\n🔍 开始测试阶段1: 页面加载和初��化\n');

    try {
        // 访问页面
        console.log(`访问: ${TEST_CONFIG.baseUrl}`);
        const response = await page.goto(TEST_CONFIG.baseUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // 检查响应状态
        if (response.status() !== 200) {
            testResults.issues.push({
                phase: testResults.phase,
                severity: 'P0',
                description: `页面加载失败，HTTP状态码: ${response.status()}`
            });
        } else {
            testResults.successes.push('页面HTTP响应正常 (200)');
            testResults.score++;
        }
        testResults.maxScore++;

        // 等待页面标题加载
        await page.waitForSelector('h1', { timeout: 5000 });
        const title = await page.$eval('h1', el => el.textContent);
        console.log(`✅ 页面标题: ${title}`);
        testResults.successes.push(`页面标题加载成功: ${title}`);
        testResults.score++;
        testResults.maxScore++;

        // 检查是否有控制台错误（开场错误提示）
        await page.waitForTimeout(2000); // 等待JS执行

        if (consoleErrors.length > 0) {
            console.log('❌ 发现控制台错误（开场错误提示）:');
            consoleErrors.forEach((err, idx) => {
                console.log(`   ${idx + 1}. ${err.text}`);
                testResults.issues.push({
                    phase: testResults.phase,
                    severity: 'P0',
                    description: `开场控制台错误: ${err.text}`,
                    location: err.location || err.stack
                });
            });
        } else {
            console.log('✅ 无控制台错误');
            testResults.successes.push('开场无控制台错误');
            testResults.score++;
        }
        testResults.maxScore++;

        // 截图
        await takeScreenshot(page, 'phase1_page_load');

    } catch (error) {
        testResults.issues.push({
            phase: testResults.phase,
            severity: 'P0',
            description: '页面加载阶段失败',
            error: error.message
        });
    }
}

// 测试阶段 2: 准备阶段（输入决策问题）
async function testPhase2_Preparation(page) {
    testResults.phase = '阶段2: 准备阶段';
    console.log('\n🔍 开始测试阶段2: 准备阶段（输入决策问题）\n');

    try {
        // 等待准备区域加载
        const hasSetupArea = await waitForElement(page, '#setupArea');
        if (!hasSetupArea) {
            console.log('❌ 准备区域未找到');
            testResults.maxScore++;
            return false;
        }

        // 查找决策问题输入框
        const topicInput = await page.$('#topicInput');
        if (!topicInput) {
            testResults.issues.push({
                phase: testResults.phase,
                severity: 'P0',
                description: '决策问题输入框 #topicInput 未找到'
            });
            testResults.maxScore++;
            return false;
        }

        // 输入测试问题
        const testTopic = '我应该选择自建团队还是外包开发来完成这个AI项目？';
        await topicInput.type(testTopic, { delay: 30 });
        console.log(`✅ 输入决策问题: ${testTopic}`);
        testResults.successes.push(`成功输入决策问题: ${testTopic}`);
        testResults.score++;
        testResults.maxScore++;

        // 输入背景信息（可��）
        const backgroundInput = await page.$('#backgroundInput');
        if (backgroundInput) {
            await backgroundInput.type('目标用户：创业者；当前资源：200万预算；主要顾虑：质量控制', { delay: 30 });
            console.log('✅ 输入背景信息');
            testResults.score++;
        }
        testResults.maxScore++;

        // 截图
        await takeScreenshot(page, 'phase2_preparation');

        return true;

    } catch (error) {
        testResults.issues.push({
            phase: testResults.phase,
            severity: 'P0',
            description: '准备阶段失败',
            error: error.message
        });
        return false;
    }
}

// 测试阶段 3: 启动辩论并检查完整流程（30秒：策划5s + 第1轮15s + 第2轮10s）
async function testPhase3_Planning(page) {
    testResults.phase = '阶段3: 启动辩论';
    console.log('\n🔍 开始测试阶段3: 启动辩论并检查完整流程（30秒）\n');

    try {
        // 等待页面稳定
        await page.waitForTimeout(1000);

        // 检查角色选择状态
        const roleCount = await page.evaluate(() => {
            const countEl = document.querySelector('#roleCount strong');
            return countEl ? parseInt(countEl.textContent) : 0;
        });

        console.log(`📊 当前选中角色数: ${roleCount}`);

        if (roleCount < 8) {
            testResults.issues.push({
                phase: testResults.phase,
                severity: 'P1',
                description: `必选角色未自动选中，仅${roleCount}个（需要8个）`
            });
        } else {
            console.log('✅ 必选角色已自动选中');
            testResults.successes.push(`必选8角色已自动选中`);
            testResults.score++;
        }
        testResults.maxScore++;

        // 点击"启动多魔汰风暴辩论"按钮
        const startBtn = await page.$('#startDebateBtn');
        if (!startBtn) {
            testResults.issues.push({
                phase: testResults.phase,
                severity: 'P0',
                description: '启动按钮 #startDebateBtn 未找到'
            });
            testResults.maxScore++;
            return false;
        }

        await startBtn.click();
        console.log('✅ 点击"启动多魔汰风暴辩论"按钮');
        testResults.successes.push('成功点击启动按钮');
        testResults.score++;
        testResults.maxScore++;

        // ⭐ 阶段 3.1: 等待策划内容生成（5秒）
        console.log('\n⏳ 阶段3.1: 等待策划内容生成（5秒）...');
        await page.waitForTimeout(5000);
        await takeScreenshot(page, 'phase3_1_planning');

        // 查找策划内容（多种可能的选择器）
        const planningData = await page.evaluate(() => {
            const selectors = [
                '#debateArea',
                '.debate-content',
                '[data-phase="planning"]',
                '.planning-content',
                '.speech-content',
                '.card'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const text = element.innerText || element.textContent || '';
                    if (text.length > 50) {
                        return {
                            selector: selector,
                            text: text,
                            html: element.innerHTML.substring(0, 500),
                            length: text.length
                        };
                    }
                }
            }

            return null;
        });

        if (planningData) {
            console.log(`📏 策划内容长度: ${planningData.length} 字符`);
            console.log(`📝 策划内容预览:\n${planningData.text.substring(0, 300)}...`);

            if (planningData.length < 200) {
                testResults.issues.push({
                    phase: '阶段3.1: 策划内容',
                    severity: 'P0',
                    description: `❌ 策划页内容过短！仅 ${planningData.length} 字符（期望 > 1000）`,
                    content: planningData.text,
                    selector: planningData.selector
                });
                console.log('❌ 策划页内容过短！');
            } else if (planningData.length < 1000) {
                testResults.issues.push({
                    phase: '阶段3.1: 策划内容',
                    severity: 'P1',
                    description: `⚠️ 策划页内容较短: ${planningData.length} 字符（建议 > 1000）`,
                    content: planningData.text.substring(0, 200)
                });
                console.log('⚠️ 策划页内容较短');
                testResults.score += 0.5;
            } else {
                console.log('✅ 策划页内容充足');
                testResults.successes.push(`策划内容长度合格: ${planningData.length} 字符`);
                testResults.score++;
            }
        } else {
            testResults.issues.push({
                phase: '阶段3.1: 策划内容',
                severity: 'P0',
                description: '❌ 策划内容区域未找到'
            });
            console.log('❌ 策划内容区域未找到');
        }
        testResults.maxScore++;

        // ⭐ 阶段 3.2: 等待第1轮辩论开始（15秒）
        console.log('\n⏳ 阶段3.2: 等待第1轮辩论开始（15秒）...');
        await page.waitForTimeout(15000);
        await takeScreenshot(page, 'phase3_2_round1');

        // 检查第1轮辩论内容
        const round1Data = await page.evaluate(() => {
            const allContent = document.body.innerText || '';
            const round1Match = allContent.match(/第\s*1\s*轮/);

            // 查找错误提示
            const errorElements = document.querySelectorAll('.error, [class*="error"], .alert-danger');
            const errors = Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);

            // 查找第1轮相关的发言内容
            const speechElements = document.querySelectorAll('.speech-content, .card, [data-round="1"]');
            const speeches = Array.from(speechElements).map(el => ({
                text: el.innerText || el.textContent || '',
                length: (el.innerText || el.textContent || '').length
            })).filter(s => s.length > 50);

            return {
                hasRound1Text: !!round1Match,
                errors: errors,
                speechCount: speeches.length,
                totalLength: speeches.reduce((sum, s) => sum + s.length, 0)
            };
        });

        console.log(`📊 第1轮辩论状态: 发言${round1Data.speechCount}次, 总长度${round1Data.totalLength}字符`);

        if (round1Data.errors.length > 0) {
            testResults.issues.push({
                phase: '阶段3.2: 第1轮辩论',
                severity: 'P0',
                description: `❌ 第1轮辩论出现错误: ${round1Data.errors.join('; ')}`,
                errors: round1Data.errors
            });
            console.log(`❌ 第1轮辩论出现${round1Data.errors.length}个错误`);
        } else if (!round1Data.hasRound1Text) {
            testResults.issues.push({
                phase: '阶段3.2: 第1轮辩论',
                severity: 'P0',
                description: '❌ 第1轮辩论未启动（未找到"第1轮"文本）'
            });
            console.log('❌ 第1轮辩论未启动');
        } else if (round1Data.speechCount === 0) {
            testResults.issues.push({
                phase: '阶段3.2: 第1轮辩论',
                severity: 'P0',
                description: '❌ 第1轮辩论无专家发言'
            });
            console.log('❌ 第1轮辩论无专家发言');
        } else {
            console.log('✅ 第1轮辩论正常运行');
            testResults.successes.push(`第1轮辩论: ${round1Data.speechCount}次发言, ${round1Data.totalLength}字符`);
            testResults.score++;
        }
        testResults.maxScore++;

        // ⭐ 阶段 3.3: 等待第2轮辩论开始（10秒）
        console.log('\n⏳ 阶段3.3: 等待第2轮辩论开始（10秒）...');
        await page.waitForTimeout(10000);
        await takeScreenshot(page, 'phase3_3_round2_final');

        // 检查第2轮辩论内容
        const round2Data = await page.evaluate(() => {
            const allContent = document.body.innerText || '';
            const round2Match = allContent.match(/第\s*2\s*轮/);

            // 查找错误提示
            const errorElements = document.querySelectorAll('.error, [class*="error"], .alert-danger');
            const errors = Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);

            // 查找第2轮相关的发言内容
            const speechElements = document.querySelectorAll('.speech-content, .card, [data-round="2"]');
            const speeches = Array.from(speechElements).map(el => ({
                text: el.innerText || el.textContent || '',
                length: (el.innerText || el.textContent || '').length
            })).filter(s => s.length > 50);

            return {
                hasRound2Text: !!round2Match,
                errors: errors,
                speechCount: speeches.length,
                totalLength: speeches.reduce((sum, s) => sum + s.length, 0)
            };
        });

        console.log(`📊 第2轮辩论状态: 发言${round2Data.speechCount}次, 总长度${round2Data.totalLength}字符`);

        if (round2Data.errors.length > 0) {
            testResults.issues.push({
                phase: '阶段3.3: 第2轮辩论',
                severity: 'P0',
                description: `❌ 第2轮辩论出现错误: ${round2Data.errors.join('; ')}`,
                errors: round2Data.errors
            });
            console.log(`❌ 第2轮辩论出现${round2Data.errors.length}个错误`);
        } else if (!round2Data.hasRound2Text) {
            testResults.issues.push({
                phase: '阶段3.3: 第2轮辩论',
                severity: 'P1',
                description: '⚠️ 第2轮辩论未启动（未找到"第2轮"文本，可能还在第1轮）'
            });
            console.log('⚠️ 第2轮辩论未启动（可能还在第1轮）');
            testResults.score += 0.5;
        } else if (round2Data.speechCount === 0) {
            testResults.issues.push({
                phase: '阶段3.3: 第2轮辩论',
                severity: 'P1',
                description: '⚠️ 第2轮辩论无专家发言（可能刚开始）'
            });
            console.log('⚠️ 第2轮辩论无专家发言');
            testResults.score += 0.5;
        } else {
            console.log('✅ 第2轮辩论正常运行');
            testResults.successes.push(`第2轮辩论: ${round2Data.speechCount}次发言, ${round2Data.totalLength}字符`);
            testResults.score++;
        }
        testResults.maxScore++;

        console.log('\n✅ 30秒完整流程测试完成！');

        return true;

    } catch (error) {
        testResults.issues.push({
            phase: testResults.phase,
            severity: 'P0',
            description: '完整流程测试失败',
            error: error.message
        });
        return false;
    }
}

// 主测试流程
async function runGembaTest() {
    console.log('🚀 多魔汰 Gemba 自动化测试开始\n');
    console.log('目标: 发现"策划页内容短"和"开场错误提示"问题\n');
    console.log('='.repeat(60));

    let browser;
    try {
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // 设置控制台监控
        const consoleErrors = setupConsoleMonitor(page);

        // 执行测试阶段
        await testPhase1_PageLoad(page, consoleErrors);
        await testPhase2_Preparation(page);
        await testPhase3_Planning(page);

        // 生成报告
        generateReport();

        // 保持浏览器打开，便于查看
        if (!TEST_CONFIG.headless) {
            console.log('\n浏览器保持打开状态，按 Ctrl+C 退出...');
            await new Promise(() => {}); // 永久等待
        }

    } catch (error) {
        console.error('❌ 测试执行失败:', error);
    } finally {
        if (browser && TEST_CONFIG.headless) {
            await browser.close();
        }
    }
}

// 生成测试报告
function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Gemba 测试报告');
    console.log('='.repeat(60));

    const scorePercent = ((testResults.score / testResults.maxScore) * 100).toFixed(1);
    const rating = (testResults.score / testResults.maxScore) * 5;

    console.log(`\n📈 总体评分: ${rating.toFixed(1)}/5.0 (${scorePercent}%)`);
    console.log(`✅ 成功项: ${testResults.score}/${testResults.maxScore}`);
    console.log(`❌ 问题数: ${testResults.issues.length}`);

    console.log('\n✅ 成功的测试:');
    testResults.successes.forEach((success, idx) => {
        console.log(`   ${idx + 1}. ${success}`);
    });

    console.log('\n❌ 发现的问题:');
    const p0Issues = testResults.issues.filter(i => i.severity === 'P0');
    const p1Issues = testResults.issues.filter(i => i.severity === 'P1');

    console.log(`\n   【P0 问题 - ${p0Issues.length} 个】`);
    p0Issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. [${issue.phase}] ${issue.description}`);
        if (issue.content) {
            console.log(`      内容: ${issue.content.substring(0, 100)}...`);
        }
    });

    console.log(`\n   【P1 问题 - ${p1Issues.length} 个】`);
    p1Issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. [${issue.phase}] ${issue.description}`);
    });

    console.log('\n' + '='.repeat(60));

    if (rating >= 5.0) {
        console.log('🎉 测试通过！达到 5/5 标准');
    } else {
        console.log(`⚠️ 未达标！当前 ${rating.toFixed(1)}/5.0，需要修复 ${testResults.issues.length} 个问题`);
    }

    console.log('='.repeat(60));
}

// 运行测试
runGembaTest().catch(console.error);
