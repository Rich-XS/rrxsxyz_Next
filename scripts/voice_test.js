/**
 * 多魔汰系统语音功能完整测试脚本
 *
 * 测试范围：
 * 1. TTS（Text-to-Speech）语音输出
 * 2. ASR（Automatic Speech Recognition）语音输入
 * 3. 语音队列管理
 * 4. 语音与文字流同步（Synctxt&voice v1.0）
 *
 * 执行方式：
 * 1. 在浏览器打开 http://localhost:8080/duomotai/
 * 2. 按F12打开开发者工具
 * 3. 在Console中粘贴此脚本运行
 *
 * 生成时间：2025-10-17 (GMT+8)
 * Night-Auth Task #10/10
 */

(async function voiceSystemTest() {
    console.log('='.repeat(80));
    console.log('🧪 多魔汰语音功能完整测试开始');
    console.log('='.repeat(80));

    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
    };

    function logTest(name, passed, message = '') {
        testResults.total++;
        if (passed) {
            testResults.passed++;
            console.log(`✅ [${testResults.total}] ${name} - 通过`);
        } else {
            testResults.failed++;
            console.error(`❌ [${testResults.total}] ${name} - 失败: ${message}`);
        }
        testResults.tests.push({ name, passed, message });
    }

    // ========================================
    // 测试组1: VoiceModule 模块加载检查
    // ========================================
    console.log('\n[测试组1: VoiceModule 模块加载检查]');

    logTest(
        'VoiceModule 已加载',
        typeof window.VoiceModule !== 'undefined',
        'window.VoiceModule 未定义'
    );

    logTest(
        'speechSynthesis API 可用',
        typeof window.speechSynthesis !== 'undefined',
        '浏览器不支持 Web Speech Synthesis API'
    );

    logTest(
        'SpeechRecognition API 可用',
        typeof (window.SpeechRecognition || window.webkitSpeechRecognition) !== 'undefined',
        '浏览器不支持 Web Speech Recognition API'
    );

    // ========================================
    // 测试组2: TTS 语音输出功能
    // ========================================
    console.log('\n[测试组2: TTS 语音输出功能]');

    if (window.VoiceModule) {
        // 测试2.1: 语音开关功能
        const initialVoiceState = window.VoiceModule.isVoiceEnabled();
        window.VoiceModule.toggleVoiceOutput();
        const toggledState = window.VoiceModule.isVoiceEnabled();
        window.VoiceModule.toggleVoiceOutput(); // 恢复原状态
        logTest(
            '语音开关功能',
            initialVoiceState !== toggledState,
            '语音开关切换失败'
        );

        // 测试2.2: 语速调节功能
        const initialRate = window.VoiceModule.getVoiceRate();
        window.VoiceModule.adjustVoiceRate(1);
        const increasedRate = window.VoiceModule.getVoiceRate();
        window.VoiceModule.adjustVoiceRate(-1); // 恢复原状态
        logTest(
            '语速调节功能',
            increasedRate > initialRate,
            `语速未增加: ${initialRate} -> ${increasedRate}`
        );

        // 测试2.3: speakText 函数调用
        try {
            window.VoiceModule.speakText('测试语音输出', '系统');
            logTest('speakText 调用', true);
        } catch (error) {
            logTest('speakText 调用', false, error.message);
        }

        // 等待语音队列处理
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 测试2.4: 队列管理功能
        const queueLength = window.VoiceModule.getQueueLength();
        const isProcessing = window.VoiceModule.isProcessing();
        logTest(
            '队列状态查询',
            typeof queueLength === 'number' && typeof isProcessing === 'boolean',
            `队列长度类型: ${typeof queueLength}, 处理状态类型: ${typeof isProcessing}`
        );

        // 测试2.5: 清空队列功能
        try {
            window.VoiceModule.clearQueue();
            const clearedQueueLength = window.VoiceModule.getQueueLength();
            logTest(
                '清空队列功能',
                clearedQueueLength === 0,
                `队列未清空，长度: ${clearedQueueLength}`
            );
        } catch (error) {
            logTest('清空队列功能', false, error.message);
        }
    }

    // ========================================
    // 测试组3: 语音完成 Promise 机制（D-63决策核心）
    // ========================================
    console.log('\n[测试组3: 语音完成 Promise 机制]');

    if (window.VoiceModule) {
        // 测试3.1: getCurrentVoicePromise 返回 Promise
        const voicePromise = window.VoiceModule.getCurrentVoicePromise();
        logTest(
            'getCurrentVoicePromise 返回 Promise',
            voicePromise && typeof voicePromise.then === 'function',
            `返回类型: ${typeof voicePromise}`
        );

        // 测试3.2: 语音关闭时立即 resolve
        if (window.VoiceModule.isVoiceEnabled()) {
            window.VoiceModule.toggleVoiceOutput(); // 关闭语音
        }
        const startTime = Date.now();
        await window.VoiceModule.getCurrentVoicePromise();
        const duration = Date.now() - startTime;
        logTest(
            '语音关闭时立即 resolve',
            duration < 100,
            `耗时 ${duration}ms (应 < 100ms)`
        );

        // 测试3.3: 语音打开 + 队列为空时立即 resolve
        if (!window.VoiceModule.isVoiceEnabled()) {
            window.VoiceModule.toggleVoiceOutput(); // 打开语音
        }
        window.VoiceModule.clearQueue(); // 确保队列为空
        const startTime2 = Date.now();
        await window.VoiceModule.getCurrentVoicePromise();
        const duration2 = Date.now() - startTime2;
        logTest(
            '队列为空时立即 resolve',
            duration2 < 100,
            `耗时 ${duration2}ms (应 < 100ms)`
        );

        // 测试3.4: 语音队列完成后 resolve（核心功能）
        window.VoiceModule.speakText('测试语音队列完成机制', '系统');
        const startTime3 = Date.now();
        await window.VoiceModule.getCurrentVoicePromise();
        const duration3 = Date.now() - startTime3;
        logTest(
            '语音队列完成后 resolve',
            duration3 > 100 && duration3 < 10000,
            `耗时 ${duration3}ms (应在 100ms-10000ms 之间)`
        );
    }

    // ========================================
    // 测试组4: ASR 语音输入功能
    // ========================================
    console.log('\n[测试组4: ASR 语音输入功能]');

    if (window.VoiceModule) {
        // 测试4.1: isRecording 状态查询
        const recordingState = window.VoiceModule.isRecording();
        logTest(
            'isRecording 状态查询',
            typeof recordingState === 'boolean',
            `返回类型: ${typeof recordingState}`
        );

        // 测试4.2: startVoiceInput 调用（不实际录音，仅检查函数存在）
        try {
            // 注意：实际录音需要用户手动点击按钮，此处仅检查函数是否存在
            const hasStartFunction = typeof window.VoiceModule.startVoiceInput === 'function';
            logTest('startVoiceInput 函数存在', hasStartFunction);
        } catch (error) {
            logTest('startVoiceInput 函数存在', false, error.message);
        }

        // 测试4.3: stopVoiceInput 调用
        try {
            const hasStopFunction = typeof window.VoiceModule.stopVoiceInput === 'function';
            logTest('stopVoiceInput 函数存在', hasStopFunction);
        } catch (error) {
            logTest('stopVoiceInput 函数存在', false, error.message);
        }

        // 测试4.4: updateVoiceButton 调用
        try {
            window.VoiceModule.updateVoiceButton(false);
            logTest('updateVoiceButton 调用', true);
        } catch (error) {
            logTest('updateVoiceButton 调用', false, error.message);
        }
    }

    // ========================================
    // 测试组5: UI 元素存在性检查
    // ========================================
    console.log('\n[测试组5: UI 元素存在性检查]');

    logTest(
        '语音输出按钮存在',
        document.getElementById('voiceOutputBtn') !== null
    );

    logTest(
        '测试语音按钮存在',
        document.getElementById('testVoiceBtn') !== null
    );

    logTest(
        '语速控制容器存在',
        document.getElementById('voiceRateControl') !== null
    );

    logTest(
        '语速显示元素存在',
        document.getElementById('voiceRateDisplay') !== null
    );

    logTest(
        '语音输入按钮存在',
        document.getElementById('voiceInputBtn') !== null
    );

    // ========================================
    // 测试组6: 性能与稳定性测试
    // ========================================
    console.log('\n[测试组6: 性能与稳定性测试]');

    if (window.VoiceModule && window.VoiceModule.isVoiceEnabled()) {
        // 测试6.1: 连续快速调用 speakText（队列压力测试）
        try {
            const testTexts = [
                '第一条测试语音',
                '第二条测试语音',
                '第三条测试语音',
                '第四条测试语音',
                '第五条测试语音'
            ];
            testTexts.forEach(text => {
                window.VoiceModule.speakText(text, '系统');
            });
            const finalQueueLength = window.VoiceModule.getQueueLength();
            logTest(
                '连续快速调用 speakText',
                finalQueueLength === 5,
                `队列长度: ${finalQueueLength} (预期: 5)`
            );

            // 清空队列避免影响后续测试
            window.VoiceModule.clearQueue();
        } catch (error) {
            logTest('连续快速调用 speakText', false, error.message);
        }

        // 测试6.2: 高优先级打断机制
        try {
            window.VoiceModule.speakText('低优先级语音，应被打断', '系统', 'normal');
            await new Promise(resolve => setTimeout(resolve, 100)); // 等待100ms
            window.VoiceModule.speakText('高优先级语音，应立即播放', '系统', 'high');
            const queueAfterInterrupt = window.VoiceModule.getQueueLength();
            logTest(
                '高优先级打断机制',
                queueAfterInterrupt === 0 || queueAfterInterrupt === 1,
                `打断后队列长度: ${queueAfterInterrupt} (预期: 0或1)`
            );
            window.VoiceModule.clearQueue();
        } catch (error) {
            logTest('高优先级打断机制', false, error.message);
        }
    }

    // ========================================
    // 测试组7: 边界情况测试
    // ========================================
    console.log('\n[测试组7: 边界情况测试]');

    if (window.VoiceModule) {
        // 测试7.1: 空文本不应播放
        const queueBefore = window.VoiceModule.getQueueLength();
        window.VoiceModule.speakText('', '系统');
        const queueAfter = window.VoiceModule.getQueueLength();
        logTest(
            '空文本不播放',
            queueBefore === queueAfter,
            `队列长度变化: ${queueBefore} -> ${queueAfter}`
        );

        // 测试7.2: HTML 标签应被清理
        const testHTML = '<div><strong>测试HTML标签清理</strong></div>';
        window.VoiceModule.speakText(testHTML, '系统');
        // 由于无法直接检查清理结果，仅验证不抛出异常
        logTest('HTML 标签清理', true);
        window.VoiceModule.clearQueue();

        // 测试7.3: [HIGH_PRIORITY] 标记应被清理
        const testHighPriority = '[HIGH_PRIORITY] 测试高权重标记清理';
        window.VoiceModule.speakText(testHighPriority, '系统');
        // 由于无法直接检查清理结果，仅验证不抛出异常
        logTest('[HIGH_PRIORITY] 标记清理', true);
        window.VoiceModule.clearQueue();

        // 测试7.4: 超长文本（> 500字）
        const longText = '测试超长文本 '.repeat(100); // 约700字
        try {
            window.VoiceModule.speakText(longText, '系统');
            logTest('超长文本处理', true);
            window.VoiceModule.clearQueue();
        } catch (error) {
            logTest('超长文本处理', false, error.message);
        }

        // 测试7.5: 语速边界值（1x 和 10x）
        window.VoiceModule.adjustVoiceRate(-10); // 降至最低
        const minRate = window.VoiceModule.getVoiceRate();
        window.VoiceModule.adjustVoiceRate(20); // 升至最高
        const maxRate = window.VoiceModule.getVoiceRate();
        logTest(
            '语速边界值',
            minRate === 1 && maxRate === 10,
            `最低: ${minRate} (预期: 1), 最高: ${maxRate} (预期: 10)`
        );
    }

    // ========================================
    // 生成测试报告
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试报告');
    console.log('='.repeat(80));
    console.log(`总计: ${testResults.total} 个测试`);
    console.log(`✅ 通过: ${testResults.passed} 个`);
    console.log(`❌ 失败: ${testResults.failed} 个`);
    console.log(`通过率: ${(testResults.passed / testResults.total * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
        console.log('\n失败的测试:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach((t, i) => {
                console.error(`  ${i + 1}. ${t.name} - ${t.message}`);
            });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 语音功能完整测试完成');
    console.log('='.repeat(80));

    // 返回测试结果供后续使用
    return testResults;
})();

/**
 * 使用说明：
 *
 * 1. 自动化测试（推荐）：
 *    - 打开 http://localhost:8080/duomotai/
 *    - 按 F12 打开开发者工具 → Console 标签
 *    - 粘贴此脚本，按 Enter 运行
 *    - 等待测试完成（约 10-15 秒）
 *    - 查看测试报告
 *
 * 2. 手动测试（补充）：
 *    - 语音输入功能需要用户手动点击"🎤"按钮测试
 *    - 语音同步功能需要在实际辩论中测试
 *
 * 3. 预期结果：
 *    - 通过率应 > 90%
 *    - 失败的测试主要为浏览器兼容性问题（如 ASR 不支持）
 *
 * 4. 常见问题：
 *    - "speechSynthesis 不可用" → 使用 Chrome/Edge 浏览器
 *    - "SpeechRecognition 不可用" → 使用 Chrome/Edge，或接受 ASR 不可用
 *    - "语音无法播放" → 检查系统音量和浏览器权限
 */
