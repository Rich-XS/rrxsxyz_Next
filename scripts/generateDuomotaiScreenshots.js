/**
 * 多魔汰系统完整截图任务
 *
 * 功能：生成多魔汰系统的所有效果图
 * 使用：node scripts/generateDuomotaiScreenshots.js
 */

const ImageGenerator = require('./imageGenerator');
const path = require('path');

/**
 * 定义所有截图任务
 */
const screenshotTasks = [
    // 任务1: 首页完整截图
    {
        name: '多魔汰首页（完整页面）',
        type: 'fullPage',
        url: 'http://localhost:8080/duomotai/',
        filename: '01-homepage-full.png',
        options: { waitTime: 2000 }
    },

    // 任务2: 顶部Banner + 语音控制
    {
        name: '顶部Banner和语音控制',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '.header',
        filename: '02-header-voice-controls.png',
        options: { waitTime: 1000 }
    },

    // 任务3: 问题输入区域
    {
        name: '问题输入区域',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '#setupArea',
        filename: '03-setup-area.png',
        options: { waitTime: 1000 }
    },

    // 任务4: 角色选择网格
    {
        name: '角色选择网格（16角色）',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '#rolesGrid',
        filename: '04-roles-grid.png',
        options: { waitTime: 1000 }
    },

    // 任务5: 轮次选择器
    {
        name: '辩论轮次选择器',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '.rounds-selector',
        filename: '05-rounds-selector.png',
        options: { waitTime: 500 }
    },

    // 任务6: 填写输入框后的页面
    {
        name: '填写问题和背景后的页面',
        type: 'withActions',
        url: 'http://localhost:8080/duomotai/',
        filename: '06-filled-inputs.png',
        actions: [
            async (page) => {
                await page.type('#topicInput', '我应该如何从职场转型做自媒体？当前45岁，有近30年行业经验。');
            },
            async (page) => {
                await page.type('#backgroundInput', '目标用户：40岁以上中年人群，面临转型需求。预算：初期半年3000-5000元。');
            }
        ],
        options: { waitTime: 1000, fullPage: true }
    },

    // 任务7: 选择角色后的状态（进一步优化：减少点击次数，使用 evaluate 注入样式）
    {
        name: '选择多个角色后的状态',
        type: 'withActions',
        url: 'http://localhost:8080/duomotai/',
        filename: '07-roles-selected.png',
        actions: [
            async (page) => {
                // 等待角色卡片加载
                await page.waitForSelector('.role-card', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 使用 evaluate 直接修改样式，模拟选中状态（避免点击超时）
                await page.evaluate(() => {
                    const roleCards = document.querySelectorAll('.role-card');
                    for (let i = 0; i < Math.min(4, roleCards.length); i++) {
                        roleCards[i].classList.add('selected');
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 500));
            }
        ],
        options: { waitTime: 1000, fullPage: true }
    },

    // 任务8: 文字速度控制特写
    {
        name: '文字速度控制（特写）',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '#textRateControl',
        filename: '08-text-rate-control-closeup.png',
        options: { waitTime: 500 }
    },

    // 任务9: 语音控制特写
    {
        name: '语音控制按钮组（特写）',
        type: 'element',
        url: 'http://localhost:8080/duomotai/',
        selector: '#voiceControls',
        filename: '09-voice-controls-closeup.png',
        options: { waitTime: 500 }
    },

    // 任务10: 单个角色卡片特写（第一性原则专家）
    {
        name: '角色卡片特写 - 第一性原则专家',
        type: 'withActions',
        url: 'http://localhost:8080/duomotai/',
        selector: '.role-card[data-role-id="1"]',
        filename: '10-role-card-first-principles.png',
        actions: [
            async (page) => {
                // Hover效果
                await page.hover('.role-card[data-role-id="1"]');
            }
        ],
        options: { waitTime: 500 }
    },

    // 任务11: 启动按钮特写
    {
        name: '启动辩论按钮',
        type: 'withActions',
        url: 'http://localhost:8080/duomotai/',
        filename: '11-start-button.png',
        actions: [
            async (page) => {
                await page.type('#topicInput', '测试问题');
                await page.evaluate(() => {
                    const startBtn = document.getElementById('startDebateBtn');
                    startBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            }
        ],
        options: { waitTime: 1000, fullPage: false }
    },

    // 任务12: 导航菜单（修复：手动显示导航条）
    {
        name: '底部导航菜单',
        type: 'withActions',
        url: 'http://localhost:8080/duomotai/',
        filename: '12-navigation-menu.png',
        actions: [
            async (page) => {
                // 手动显示导航条（通过添加 visible class）
                await page.evaluate(() => {
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks) {
                        navLinks.classList.add('visible');
                        navLinks.style.display = 'flex'; // 强制显示
                    }
                });
                // 等待动画完成
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        ],
        options: { waitTime: 500, fullPage: false, selector: '.nav-links' }
    }
];

/**
 * 主函数：生成所有截图
 */
async function generateAllScreenshots() {
    const generator = new ImageGenerator({
        baseUrl: 'http://localhost:8080',
        screenshotDir: path.join(__dirname, '../duomotai/screenshots'),
        viewport: { width: 1920, height: 1080 }
    });

    console.log('='.repeat(60));
    console.log('🎯 多魔汰系统截图生成任务');
    console.log('='.repeat(60));
    console.log(`📁 截图保存目录: ${generator.screenshotDir}`);
    console.log(`📋 任务数量: ${screenshotTasks.length}`);
    console.log('='.repeat(60));
    console.log('');

    try {
        // 初始化浏览器
        await generator.init();

        // 批量生成截图
        console.log('🚀 开始批量生成截图...\n');
        const results = await generator.generateBatch(screenshotTasks);

        // 统计结果
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log('');
        console.log('='.repeat(60));
        console.log('📊 截图生成完成');
        console.log('='.repeat(60));
        console.log(`✅ 成功: ${successCount}/${screenshotTasks.length}`);
        console.log(`❌ 失败: ${errorCount}/${screenshotTasks.length}`);
        console.log('='.repeat(60));
        console.log('');

        // 生成 Markdown 报告
        const reportPath = path.join(generator.screenshotDir, 'SCREENSHOTS_REPORT.md');
        generator.generateMarkdownReport(results, reportPath);

        console.log('📄 Markdown 报告已生成');
        console.log(`   路径: ${reportPath}`);
        console.log('');

        // 显示所有成功的截图路径
        console.log('📁 截图文件列表:');
        results.forEach((result, index) => {
            if (result.status === 'success') {
                console.log(`   ${index + 1}. ${result.task}`);
                console.log(`      → ${result.path}`);
            }
        });

        console.log('');
        console.log('='.repeat(60));
        console.log('✅ 所有任务完成！');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ 截图生成失败:', error);
        process.exit(1);
    } finally {
        // 关闭浏览器
        await generator.close();
    }
}

// 执行主函数
generateAllScreenshots().catch(error => {
    console.error('❌ 程序异常退出:', error);
    process.exit(1);
});
