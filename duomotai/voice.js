// 多魔汰系统 - 语音模块 (从index.html抽取)
// 抽取自 duomotai/index.html Lines 2193-2441 (249行)

// ✅ [#086] v8.2 语音输出功能 - Web Speech Synthesis API 集成
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let voiceEnabled = localStorage.getItem('voiceEnabled') === 'true';  // 默认关闭
let voiceLevel = parseInt(localStorage.getItem('voiceLevel')) || 5; // 默认档位5（范围1-10，对应1x-10x）
let voiceRate = voiceLevel; // ✅ [FIX P0-04] 直接使用档位作为语速（1-10）

// ✅ [FIX P0-07] 语音队列机制（解决语音与文字流不同步问题）
let voiceQueue = [];
let isProcessingQueue = false;

// ✅ [D-63] 语音完成 Promise 机制（支持语音与文字流完全同步）
let currentVoiceCompletionResolve = null;
let currentVoiceCompletionPromise = Promise.resolve(); // 初始为已完成状态

// ✅ [FIX P0-10] 语音性别区分（男女声）
let availableVoices = {
    male: [],
    female: [],
    all: []
};
let voicesLoaded = false;

// ✅ [FIX P0-04] 档位直接映射到语速（1x - 10x，步长1x）
// 档位5 = 5x（默认速度）
function levelToRate(level) {
  return level; // 1档 = 1x, 2档 = 2x, ..., 10档 = 10x
}

// ✅ [FIX P0-10] 加载并分类可用语音（男女声）
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    availableVoices.all = voices.filter(voice => voice.lang.startsWith('zh'));

    // 分类男女声（基于voice.name关键词）
    // ✅ [V57.1 FIX Issue#6] 改进男女声识别：使用多个关键词，并增加备选方案
    availableVoices.male = availableVoices.all.filter(voice =>
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('男') ||
        voice.name.toLowerCase().includes('boy') ||
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('junior') ||
        voice.name.includes('Huihui') ||  // Microsoft Huihui (male Chinese)
        voice.name.includes('Yaoyao') ||  // Microsoft Yaoyao (male Chinese)
        voice.name.includes('Kangkang') || // 某些系统中的男声
        voice.name.includes('Hexin')      // 某些系统中的男声
    );

    availableVoices.female = availableVoices.all.filter(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('女') ||
        voice.name.toLowerCase().includes('girl') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('lady') ||
        voice.name.includes('Xiaoxiao') ||  // Microsoft Xiaoxiao (female Chinese)
        voice.name.includes('Xiaoyi') ||    // Microsoft Xiaoyi (female Chinese)
        voice.name.includes('Ting-Ting') || // Apple Ting-Ting (female Chinese)
        voice.name.includes('Moyan')        // 某些系统中的女声
    );

    // ✅ [V57.1 FIX Issue#6] 如果男声列表为空，使用启发式方法分配（avoid fallback to all female）
    if (availableVoices.male.length === 0 && availableVoices.female.length < availableVoices.all.length) {
        // 未分类的声音（既不是男也不是女），分配一部分给男声
        const unclassified = availableVoices.all.filter(v =>
            !availableVoices.female.includes(v)
        );
        // 把前一半分配给男声
        availableVoices.male = unclassified.slice(0, Math.ceil(unclassified.length / 2));
    }

    voicesLoaded = true;
    console.log('✅ [FIX P0-10] 语音加载完成', {
        total: availableVoices.all.length,
        male: availableVoices.male.length,
        female: availableVoices.female.length,
        maleVoices: availableVoices.male.map(v => v.name),
        femaleVoices: availableVoices.female.map(v => v.name),
        allVoices: availableVoices.all.map(v => v.name)
    });
}

// ✅ [FIX P0-10] 从角色名称判断性别
// ✅ [V57-P0-2] 增强：添加缓存和详细日志
let genderCache = {};

function getGenderFromRoleName(roleName) {
    // 检查缓存
    if (genderCache[roleName]) {
        return genderCache[roleName];
    }

    let detectedGender = 'female';  // 默认女声
    let detectionMethod = '默认值';

    // ✅ [D-98 2025-10-29] 从角色配置中查找性别（使用独立的gender字段）
    if (typeof DEBATE_ROLES !== 'undefined' && DEBATE_ROLES) {
        const role = DEBATE_ROLES.find(r => r.shortName === roleName || r.name === roleName);
        if (role && role.gender) {
            detectedGender = role.gender;  // 直接使用gender字段（male/female）
            detectionMethod = 'gender字段';
        }
    }

    // 特殊角色处理
    if (roleName === '领袖(委托代理)' || roleName === '委托人') {
        detectedGender = 'female';  // Victoria女声
        detectionMethod = '特殊角色-委托人/领袖';
    }

    // 缓存结果
    genderCache[roleName] = detectedGender;

    // ✅ [V57-P0-2] 添加详细日志
    console.log(`✅ [V57-P0-2] 性别识别: "${roleName}" → ${detectedGender === 'male' ? '👨' : '👩'} (方法: ${detectionMethod})`);

    return detectedGender;
}

// ✅ [FIX P0-10] 选择合适的语音（根据性别）
// ✅ [V57-P0-2] 增强：添加详细选择日志和候选项展示
function selectVoice(gender) {
    if (!voicesLoaded) {
        loadVoices();
    }

    let voiceList = gender === 'male' ? availableVoices.male : availableVoices.female;

    // ✅ [V57-P0-2] 记录可用语音列表
    console.log(`📢 [V57-P0-2] ${gender === 'male' ? '男' : '女'}声语音池`, {
        count: voiceList.length,
        voices: voiceList.map(v => v.name).slice(0, 3)  // 显示前3个
    });

    // 如果没有对应性别的语音，使用全部语音
    if (voiceList.length === 0) {
        console.warn(`⚠️ [V57-P0-2] 未找到${gender === 'male' ? '男' : '女'}声，使用全部可用语音`);
        voiceList = availableVoices.all;
    }

    // 优先选择 Microsoft 或 Apple 的高质量语音
    const preferredVoice = voiceList.find(v =>
        v.name.includes('Microsoft') || v.name.includes('Apple')
    );

    const selectedVoice = preferredVoice || voiceList[0] || null;

    if (selectedVoice) {
        console.log(`✅ [V57-P0-2] 语音选择成功: "${selectedVoice.name}"`);
    } else {
        console.warn(`⚠️ [V57-P0-2] 未找到任何可用语音`);
    }

    return selectedVoice;
}

function initVoiceSynthesis() {
    if (!speechSynthesis) {
        console.warn('⚠️ [#086] 浏览器不支持语音合成');
        return false;
    }

    // ✅ [FIX P0-10] 初始化时加载语音
    loadVoices();

    // 监听语音列表变化（某些浏览器异步加载）
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    console.log('✅ [#086] 语音合成已初始化');
    return true;
}

function speakText(text, roleName = '', priority = 'normal') {
    // ✅ [FIX P0-02] 增强日志：记录所有调用
    console.log(`🔊 [FIX P0-02] speakText 被调用`, {
        voiceEnabled,
        hasText: !!text,
        textLength: text ? text.length : 0,
        hasSpeechSynthesis: !!speechSynthesis,
        roleName,
        priority,  // ✅ [FIX P0-08] 优先级
        queueLength: voiceQueue.length  // ✅ [FIX P0-07] 队列长度
    });

    if (!voiceEnabled || !text || !speechSynthesis) {
        console.warn(`⚠️ [FIX P0-02] speakText 提前返回`, {
            voiceEnabled,
            hasText: !!text,
            hasSpeechSynthesis: !!speechSynthesis
        });
        return;
    }

    // ✅ [FIX P0-08] 高优先级：立即打断当前播放并清空队列
    if (priority === 'high') {
        console.log('🚨 [FIX P0-08] 高优先级语音，立即打断并清空队列');
        if (currentUtterance) {
            speechSynthesis.cancel();
            currentUtterance = null;
        }
        voiceQueue = [];
        isProcessingQueue = false;

        // ✅ [FIX P1-#1] Memory Leak修复：resolve当前Promise避免内存泄漏
        if (currentVoiceCompletionResolve) {
            currentVoiceCompletionResolve();
            currentVoiceCompletionResolve = null;
            console.log('✅ [FIX P1-#1] 高优先级打断时已resolve Promise');
        }
    }

    // ✅ [FIX P0-02] 增强文本清理（移除 HTML 标签、[HIGH_PRIORITY] 标记和多余空白）
    // ✅ [D-92 NEW] 移除表情符号（✨、🚨、📊等）避免语音朗读 (V56.0)
    let cleanText = text
        .replace(/\[HIGH_PRIORITY\]\s*/g, '') // ✅ [FIX P0-02 Bug2] 移除高权重标记，避免读成"斜杠"
        .replace(/<[^>]+>/g, '') // 移除 HTML 标签
        .replace(/&nbsp;/g, ' ') // 移除 HTML 实体
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // ✅ [D-92] 移除所有表情符号（emoji范围）
        .replace(/[\u{2600}-\u{26FF}]/gu, '') // ✅ [D-92] 移除杂项符号和表情
        .replace(/\s+/g, ' ')    // 合并多余空白
        .trim();

    console.log(`🔊 [FIX P0-02] 清理后文本`, {
        length: cleanText.length,
        preview: cleanText.substring(0, 50)
    });

    if (!cleanText) {
        console.error(`❌ [FIX P0-02] 清理后文本为空！原始文本:`, text.substring(0, 100));
        return;
    }

    // ✅ [FIX P0-07] 将语音任务添加到队列
    voiceQueue.push({
        text: cleanText,
        roleName: roleName
    });

    console.log(`✅ [FIX P0-07] 语音已添加到队列（队列长度：${voiceQueue.length}）`);

    // ✅ [FIX P0-07] 如果队列处理器未运行，启动它
    if (!isProcessingQueue) {
        processVoiceQueue();
    }
}

// ✅ [FIX P0-07] 语音队列处理器
function processVoiceQueue() {
    // 如果队列为空或正在处理，直接返回
    if (voiceQueue.length === 0) {
        isProcessingQueue = false;
        console.log('✅ [FIX P0-07] 语音队列已清空');
        return;
    }

    // ✅ [FIX P0-09] 强制清除残留的语音播放（防止高优先级打断后的竞态条件）
    if (speechSynthesis.speaking && !isProcessingQueue) {
        console.log('⚠️ [FIX P0-09] 检测到残留语音播放，强制取消');
        speechSynthesis.cancel();
        currentUtterance = null;
    }

    // ✅ [V57.21 FIX] 修复专家语音被切断问题 - 等待当前语音完成
    // 如果已经在播放，等待当前播放完成
    if (isProcessingQueue && speechSynthesis.speaking) {
        console.log('⏳ [FIX P0-07] 正在播放语音，等待完成...');
        // 设置一个监听器等待当前语音结束
        setTimeout(() => {
            if (!speechSynthesis.speaking) {
                processVoiceQueue(); // 递归调用处理下一个
            }
        }, 100);
        return;
    }

    isProcessingQueue = true;

    // 取出队列第一项
    const voiceTask = voiceQueue.shift();
    console.log(`🎤 [FIX P0-07] 开始播放：${voiceTask.roleName}（剩余队列：${voiceQueue.length}）`);

    // ✅ [D-63] 创建新的语音完成 Promise
    currentVoiceCompletionPromise = new Promise(resolve => {
        currentVoiceCompletionResolve = resolve;
    });

    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(voiceTask.text);
    currentUtterance = utterance;

    // 设置语音参数
    utterance.lang = 'zh-CN'; // 中文
    utterance.rate = voiceRate; // 语速（0.1-10，默认 0.9）
    utterance.pitch = 1; // 音调（0-2，默认 1）
    utterance.volume = 1; // 音量（0-1，默认 1）

    // ✅ [FIX P0-10] 根据角色性别选择语音
    const gender = getGenderFromRoleName(voiceTask.roleName);
    const selectedVoice = selectVoice(gender);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`✅ [FIX P0-10] 选中${gender === 'male' ? '男' : '女'}声: ${selectedVoice.name} (角色: ${voiceTask.roleName})`);
    } else {
        console.warn(`⚠️ [FIX P0-10] 未找到合适的语音，使用浏览器默认`);
    }

    // 事件监听
    utterance.onstart = () => {
        console.log(`✅ [FIX P0-07] 开始朗读：${voiceTask.roleName} - ${voiceTask.text.substring(0, 30)}...`);
    };

    utterance.onend = () => {
        console.log(`✅ [FIX P0-07] 朗读完成：${voiceTask.roleName}（剩余队列：${voiceQueue.length}）`);
        currentUtterance = null;

        // ✅ [D-63] Resolve 语音完成 Promise
        if (currentVoiceCompletionResolve) {
            currentVoiceCompletionResolve();
            currentVoiceCompletionResolve = null;
        }

        // ✅ [FIX P0-07] 播放完成后，继续处理队列中的下一个
        if (voiceQueue.length > 0) {
            console.log(`🔄 [FIX P0-07] 继续播放下一个（队列长度：${voiceQueue.length}）`);

            // ✅ [V57.21] 添加专家之间的自然停顿（1.5秒）
            const nextSpeechDelay = 1500; // 专家对话间隔1.5秒
            console.log(`⏸️ [V57.21] 专家对话自然停顿 ${nextSpeechDelay}ms`);

            // 使用 setTimeout 避免调用栈过深，同时添加自然停顿
            setTimeout(() => processVoiceQueue(), nextSpeechDelay);
        } else {
            isProcessingQueue = false;
            console.log('✅ [FIX P0-07] 所有语音播放完成');
        }
    };

    utterance.onerror = (event) => {
        console.error(`❌ [FIX P0-07] 语音合成错误：${event.error}`, event);
        currentUtterance = null;

        // ✅ [D-63] 即使出错也 resolve，避免阻塞后续流程
        if (currentVoiceCompletionResolve) {
            currentVoiceCompletionResolve();
            currentVoiceCompletionResolve = null;
        }

        // ✅ [FIX P0-07] 出错后继续处理队列
        if (voiceQueue.length > 0) {
            setTimeout(() => processVoiceQueue(), 100);
        } else {
            isProcessingQueue = false;
        }
    };

    // 开始朗读
    speechSynthesis.speak(utterance);
}

function toggleVoiceOutput() {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem('voiceEnabled', voiceEnabled.toString());
    updateVoiceOutputButton();

    if (!voiceEnabled) {
        // ✅ [FIX P0-07] 关闭语音时，取消当前播放并清空队列
        if (currentUtterance) {
            speechSynthesis.cancel();
        }
        voiceQueue = [];
        isProcessingQueue = false;

        // ✅ [FIX P1-#3] 语音切换边缘情况修复：resolve当前Promise避免10秒超时
        if (currentVoiceCompletionResolve) {
            currentVoiceCompletionResolve();
            currentVoiceCompletionResolve = null;
            console.log('✅ [FIX P1-#3] 切换语音OFF时已resolve Promise');
        }

        console.log('🔊 [FIX P0-07] 语音已关闭，队列已清空');
    }

    console.log(`🔊 [#086] 语音输出已${voiceEnabled ? '开启' : '关闭'}`);
}

function updateVoiceOutputButton() {
    const btn = document.getElementById('voiceOutputBtn');
    if (btn) {
        if (voiceEnabled) {
            btn.style.background = 'linear-gradient(135deg, #34C759 0%, #2E9E4D 100%)';
            btn.innerHTML = '🔊';
            btn.title = '点击关闭语音朗读';
        } else {
            btn.style.background = 'linear-gradient(135deg, #999 0%, #666 100%)';
            btn.innerHTML = '🔇';
            btn.title = '点击开启语音朗读';
        }
    }

    // 更新语速控制显示状态
    const rateControl = document.getElementById('voiceRateControl');
    if (rateControl) {
        rateControl.style.display = voiceEnabled ? 'flex' : 'none';
    }
}

// 调整语速档位（范围 1-10）
function adjustVoiceRate(deltaLevel) {
    voiceLevel = Math.max(1, Math.min(10, voiceLevel + deltaLevel));
    voiceRate = levelToRate(voiceLevel);

    // 保存到 localStorage
    localStorage.setItem('voiceLevel', voiceLevel.toString());

    updateVoiceRateDisplay();
    console.log(`🔊 [#086] 语速调整为：档位${voiceLevel} (${voiceRate.toFixed(1)}x)`);
}

function updateVoiceRateDisplay() {
    const display = document.getElementById('voiceRateDisplay');
    if (display) {
        display.textContent = `${voiceRate.toFixed(1)}x`;
    }
}

// ✅ [T-314] 语音输入功能 - Web Speech API 集成
let voiceRecognition = null;
let isRecording = false;
let finalTranscript = ''; // ✅ [FIX P0-11] 累积语音识别结果

function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('⚠️ [T-314] 浏览器不支持语音识别');
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;  // ✅ [FIX P0-11] 连续识别
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        console.log('✅ [T-314] 语音识别已启动');
        isRecording = true;
        updateVoiceButton(true);
    };

    recognition.onresult = (event) => {
        // ✅ [FIX P0-11] 累积识别结果
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        const textarea = document.getElementById('delegateInput');
        if (textarea) {
            textarea.value = finalTranscript + interimTranscript;
            textarea.scrollTop = textarea.scrollHeight;
        }
    };

    recognition.onerror = (event) => {
        console.error('❌ [T-314] 语音识别错误:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            alert('语音识别失败：' + event.error);
        }
        stopVoiceInput();
    };

    recognition.onend = () => {
        console.log('✅ [T-314] 语音识别已停止');
        isRecording = false;
        updateVoiceButton(false);
    };

    return recognition;
}

// ✅ [FIX P0-11] 移除 toggleVoiceInput（不再使用切换模式）

function startVoiceInput() {
    console.log('✅ [FIX P0-11] startVoiceInput 被调用（按住说话）');

    if (!voiceRecognition) {
        voiceRecognition = initVoiceRecognition();
    }

    if (!voiceRecognition) {
        alert('您的浏览器不支持语音输入功能\n\n建议使用 Chrome、Edge 或 Safari 浏览器');
        return;
    }

    // 防止重复启动
    if (isRecording) {
        console.warn('⚠️ [FIX P0-11] 已在录音中，跳过重复启动');
        return;
    }

    try {
        // ✅ [FIX P0-11] 重置累积内容
        finalTranscript = '';
        voiceRecognition.start();
        console.log('✅ [FIX P0-11] 开始语音输入（按住说话模式）');
    } catch (error) {
        console.error('❌ [FIX P0-11] 启动语音输入失败:', error);
        // 如果是 "already started" 错误，忽略
        if (!error.message.includes('already started')) {
            alert('启动语音输入失败，请重试');
        }
    }
}

function stopVoiceInput() {
    console.log('✅ [FIX P0-11] stopVoiceInput 被调用（松开按钮）');

    if (voiceRecognition && isRecording) {
        try {
            voiceRecognition.stop();
            console.log('✅ [FIX P0-11] 停止语音输入（按住说话模式）');
        } catch (error) {
            console.error('❌ [FIX P0-11] 停止语音输入失败:', error);
        }
    }
    isRecording = false;
    updateVoiceButton(false);
}

function updateVoiceButton(recording) {
    const btn = document.getElementById('voiceInputBtn');
    if (btn) {
        if (recording) {
            btn.style.background = 'linear-gradient(135deg, #FF3B30 0%, #D12A22 100%)';
            btn.style.animation = 'pulse 1.5s infinite';
            btn.innerHTML = '⏹️';
            btn.title = '点击停止录音';
        } else {
            btn.style.background = 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)';
            btn.style.animation = 'none';
            btn.innerHTML = '🎤';
            btn.title = '点击开始语音输入';
        }
    }
}

// 导出给主文件使用
window.VoiceModule = {
    // 语音输出
    initVoiceSynthesis,
    speakText,
    toggleVoiceOutput,
    adjustVoiceRate,
    updateVoiceOutputButton,
    updateVoiceRateDisplay,

    // 语音输入（✅ [FIX P0-11] 移除 toggleVoiceInput，改为 Push-to-Talk 模式）
    initVoiceRecognition,
    startVoiceInput,  // ✅ [FIX P0-11] 按下按钮时调用
    stopVoiceInput,   // ✅ [FIX P0-11] 松开按钮时调用
    updateVoiceButton,

    // 状态获取
    isVoiceEnabled: () => voiceEnabled,
    getVoiceRate: () => voiceRate,
    isRecording: () => isRecording,

    // ✅ [FIX P0-07] 队列状态获取
    getQueueLength: () => voiceQueue.length,
    isProcessing: () => isProcessingQueue,
    clearQueue: () => {
        voiceQueue = [];
        if (currentUtterance) {
            speechSynthesis.cancel();
        }
        isProcessingQueue = false;
        console.log('✅ [FIX P0-07] 语音队列已手动清空');
    },

    // ✅ [D-63] ✅ [FIX P0-Voice] 获取当前语音完成 Promise（用于语音与文字流同步）
    getCurrentVoicePromise: () => {
        // 如果语音关闭，返回立即完成的 Promise
        if (!voiceEnabled) {
            return Promise.resolve();
        }
        // 如果队列为空且没有正在播放，返回立即完成的 Promise
        if (voiceQueue.length === 0 && !isProcessingQueue) {
            return Promise.resolve();
        }

        // ✅ [FIX P0-Voice] 修复语音切断问题：等待整个队列完成，而非仅当前语音
        // 原Bug：仅返回 currentVoiceCompletionPromise（仅当前播放的语音）
        // 导致：下一个专家发言时，上一个专家语音未播完但Promise已resolve，新语音被切断
        // 修复：创建新Promise，等待队列完全清空 + 当前播放完成
        return new Promise(resolve => {
            const checkQueueComplete = () => {
                // 队列为空 + 没有正在播放 = 全部完成
                if (voiceQueue.length === 0 && !isProcessingQueue && !speechSynthesis.speaking) {
                    console.log('✅ [FIX P0-Voice] 语音队列完全清空，resolve Promise');
                    resolve();
                } else {
                    // 每100ms检查一次队列状态
                    console.log(`⏳ [FIX P0-Voice] 等待队列完成（队列长度：${voiceQueue.length}，正在处理：${isProcessingQueue}，正在播放：${speechSynthesis.speaking}）`);
                    setTimeout(checkQueueComplete, 100);
                }
            };
            checkQueueComplete();
        });
    }
};

// ✅ [V57-P0-2] 性别识别测试函数 - 验证所有角色的性别正确识别
function testGenderDetection() {
    console.log('\n🧪 ===== [V57-P0-2] 性别识别测试开始 =====');

    if (typeof DEBATE_ROLES === 'undefined' || !DEBATE_ROLES) {
        console.warn('⚠️ DEBATE_ROLES未定义，无法测试');
        return;
    }

    let maleCount = 0;
    let femaleCount = 0;
    let results = [];

    DEBATE_ROLES.forEach((role, index) => {
        const roleName = role.shortName || role.name;
        const gender = getGenderFromRoleName(roleName);
        const genderLabel = gender === 'male' ? '👨 男' : '👩 女';
        const nicknameInfo = role.nickname ? `(${role.nickname})` : '';

        if (gender === 'male') {
            maleCount++;
        } else {
            femaleCount++;
        }

        results.push({
            roleName,
            nicknameInfo,
            gender: genderLabel,
            index: index + 1
        });

        console.log(`  ${index + 1}. ${roleName} ${nicknameInfo} → ${genderLabel}`);
    });

    console.log(`\n📊 统计: ${maleCount}位👨 + ${femaleCount}位👩 = ${DEBATE_ROLES.length}个角色`);
    console.log(`✅ [V57-P0-2] 性别识别测试完成\n`);

    return {
        total: DEBATE_ROLES.length,
        maleCount,
        femaleCount,
        results
    };
}

// ✅ [V57-P0-2] 语音初始化和测试
window.addEventListener('DOMContentLoaded', () => {
    // 初始化语音合成
    initVoiceSynthesis();

    // 延迟执行性别识别测试（确保DEBATE_ROLES已加载）
    setTimeout(() => {
        testGenderDetection();
    }, 500);
});