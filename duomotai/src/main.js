        // 全局状态
        const state = {
            selectedRoles: [],
            rounds: 5,
            topic: '',
            background: '',
            debateEngine: null,
            user: null,
            userProfile: null, // ✅ [Task #042] v5 用户画像实例
            speechCounter: {}, // ✅ [v9.2] 追踪每轮的专家发言序号（排除领袖的开场/转场/总结）
            textStreamingSpeed: 20, // 默认文字流速度 (ms/char), 20ms/char ≈ 50 char/s
        };

        // 调整文字速度
        function adjustTextRate(adjustment) {
            const display = document.getElementById('textRateDisplay');
            let currentRateMultiplier = parseFloat(display.textContent);

            // 速率乘数数组
            const rates = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0];
            let currentIndex = rates.indexOf(currentRateMultiplier);
            if (currentIndex === -1) { // 如果当前速率不在预设列表中，找到最接近的
                currentIndex = rates.reduce((prev, curr, i) =>
                    (Math.abs(curr - currentRateMultiplier) < Math.abs(rates[prev] - currentRateMultiplier) ? i : prev), 0);
            }

            // 更新索引
            currentIndex += adjustment;

            // 边界检查
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex >= rates.length) currentIndex = rates.length - 1;

            // 获取新的速率乘数
            const newRateMultiplier = rates[currentIndex];

            // 基础速率是 100ms/char (很慢)，乘数越大越快
            // 0.2x -> 500ms/char, 1x -> 100ms/char, 5x -> 20ms/char
            state.textStreamingSpeed = 100 / newRateMultiplier;

            display.textContent = `${newRateMultiplier.toFixed(1)}x`;
            console.log(`文字速度已调整: ${newRateMultiplier.toFixed(1)}x, 延迟: ${state.textStreamingSpeed}ms/char`);
        }


        // 初始化（使用init.js模块）
        let initManager = null; // 全局引用，供其他函数调用
        document.addEventListener('DOMContentLoaded', async () => {
            if (window.InitManager) {
                initManager = new InitManager();
                await initManager.init(state);
                console.log('✅ 初始化完成（init.js模块）');
            } else {
                console.error('❌ init.js 模块未加载');
            }
        });

        // 更新用户状态显示（代理到init.js）
        function updateUserStatus() {
            if (initManager) {
                initManager.updateUserStatus();
            }
        }

        // 提示登录
        function promptLogin() {
            if (window.UserAuth) {
                window.UserAuth.showLoginModal({
                    title: '欢迎来到多魔汰',
                    message: '登录后可保存风暴辩论进度和历史记录，随时继续未完成的风暴辩论',
                    onSuccess: (user) => {
                        updateUserStatus();
                        alert(`欢迎回来，${user.nickname}！`);
                    }
                });
            } else {
                alert('用户认证模块未加载');
            }
        }

        // 退出登录
        function logout() {
            if (confirm('确定退出登录吗？未保存的风暴辩论进度可能丢失。')) {
                if (window.UserAuth) {
                    window.UserAuth.logout();
                    updateUserStatus();
                }
            }
        }

        // 显示风暴辩论历史
        async function showDebateHistory() {
            try {
                if (!window.UserAuth) {
                    alert('用户认证模块未加载');
                    return;
                }

                const history = await window.UserAuth.getDebateHistory();

                if (history.length === 0) {
                    alert('您还没有风暴辩论历史记录');
                    return;
                }

                // TODO: 显示历史记录弹窗
                console.log('风暴辩论历史:', history);
                alert(`您有 ${history.length} 条风暴辩论记录`);

            } catch (error) {
                alert('获取风暴辩论历史失败：' + error.message);
            }
        }

        // ✅ 以下函数已迁移至 init.js 模块：
        // - fillDefaultContentFor5758()
        // - renderRoles()
        // - setupEventListeners()
        // - updateRoleCount()
        // 请通过 window.InitManager 实例调用相关功能

        // 启动风暴辩论
        async function startDebate() {
            state.topic = document.getElementById('topicInput').value.trim();
            state.background = document.getElementById('backgroundInput').value.trim();

            if (!state.topic || state.topic.length < 5) {
                alert('请输入至少5个字的问题！');
                return;
            }

            const minRoles = typeof REQUIRED_FLOW !== 'undefined' ? REQUIRED_FLOW.length : 8;
            if (state.selectedRoles.length < minRoles) {
                alert(`请至少选择${minRoles}个风暴辩论角色（必选角色）！`);
                return;
            }

            // 隐藏设置区域，显示风暴辩论区域
            document.getElementById('setupArea').style.display = 'none';
            document.getElementById('debateArea').style.display = 'block';

            // 显示加载状态
            document.getElementById('debateArea').innerHTML = `
                <div class="card loading">
                    <div class="spinner"></div>
                    <p><strong>🧠 领袖(委托代理)正在分析问题，制定风暴辩论策略...</strong></p>
                    <p style="margin-top: 10px; opacity: 0.7;">这可能需要 1-2 分钟，请稍候</p>
                </div>
            `;

            try {
                // 初始化辩论引擎
                if (typeof DebateEngine === 'undefined') {
                    throw new Error('辩论引擎未加载');
                }

                state.debateEngine = new DebateEngine({
                    apiEndpoint: 'http://localhost:3001/api/ai/debate',
                    maxRounds: state.rounds,
                    minRoles: minRoles
                });

                // ✅ [Task #043] 集成用户画像到辩论引擎
                if (state.userProfile) {
                    state.debateEngine.setUserProfile(state.userProfile);
                    console.log('✅ [Task #043] 用户画像已集成到辩论引擎:', state.userProfile.getProfileText());
                }

                // 监听事件
                state.debateEngine.on('phaseChange', handlePhaseChange);
                state.debateEngine.on('roleSpeak', handleRoleSpeak);
                state.debateEngine.on('delegatePrompt', handleDelegatePrompt);
                state.debateEngine.on('error', handleError);
                state.debateEngine.on('tokenUpdate', updateTokenDisplay);  // ✅ [Task #13] Token统计实时更新

                // 启动准备阶段
                await state.debateEngine.startPreparation({
                    topic: state.topic,
                    background: state.background,
                    selectedRoles: state.selectedRoles,
                    rounds: state.rounds
                });

            } catch (error) {
                console.error('辩论启动失败:', error);
                alert('抱歉，启动风暴辩论时出错：' + error.message);
                document.getElementById('setupArea').style.display = 'block';
                document.getElementById('debateArea').style.display = 'none';
            }
        }

        // 处理阶段变化
        function handlePhaseChange(data) {
            console.log('阶段变化:', data.phase);
            // 更新阶段指示器
            updatePhaseIndicator(data.phase);
        }

        // 更新阶段指示器
        function updatePhaseIndicator(currentPhase) {
            const phases = ['preparation', 'planning', 'confirmation', 'debate', 'delivery'];
            const phaseNames = {
                'preparation': '准备',
                'planning': '策划',
                'confirmation': '确认',
                'debate': '辩论',
                'delivery': '交付'
            };

            const indicator = phases.map(phase => {
                const index = phases.indexOf(phase);
                const currentIndex = phases.indexOf(currentPhase);
                const statusClass = index < currentIndex ? 'completed' : index === currentIndex ? 'active' : '';

                return `<div class="phase-step ${statusClass}">${phaseNames[phase]}</div>`;
            }).join('');

            // ✅ [Screenshot Fix] 将 phase indicator 插入到 header 内部，而不是 debateArea
            const header = document.querySelector('.header');
            let phaseIndicatorEl = document.getElementById('phaseIndicator');

            if (!phaseIndicatorEl) {
                phaseIndicatorEl = document.createElement('div');
                phaseIndicatorEl.id = 'phaseIndicator';
                phaseIndicatorEl.className = 'phase-indicator';
                header.appendChild(phaseIndicatorEl); // 添加到header底部
            }

            phaseIndicatorEl.innerHTML = indicator;
        }

        // 处理角色发言 - ✅ [Task #013] 支持流式增量显示
        function handleRoleSpeak(data) {
            const { round, role, content, type, phase, topic, speechId, isStreaming, isComplete } = data;
            const debateArea = document.getElementById('debateArea');

            // ✅ [FIX P0] 初始化 previousRounds，避免流式更新时未定义错误
            let previousRounds = [];
            if (round > 1) {
                // 收集前1轮的发言内容（最多收集前两轮）
                for (let i = Math.max(1, round - 2); i < round; i++) {
                    const prevRoundContainer = debateArea.querySelector(`[data-round="${i}"]`);
                    if (prevRoundContainer) {
                        const prevSpeeches = prevRoundContainer.querySelectorAll('.speech-item:not(.leader-introduction)');
                        prevSpeeches.forEach(speech => {
                            const contentEl = speech.querySelector('.speech-content');
                            if (contentEl) {
                                previousRounds.push({
                                    round: i,
                                    content: contentEl.innerHTML
                                });
                            }
                        });
                    }
                }
            }

            // 找到或创建本轮容器
            let roundContainer = debateArea.querySelector(`[data-round="${round}"]`);
            if (!roundContainer) {
                roundContainer = document.createElement('div');
                roundContainer.className = 'debate-round';
                roundContainer.dataset.round = round;
                // ✅ [P1-RoundHeader] 在圆角红框中显示角色名称
                const roleDisplayName = role.shortName || role.name || '发言人';
                const typeText = type === 'introduction' ? '开场' : (type === 'transition' ? '转场' : (type === 'summary' ? '总结' : '发言'));
                roundContainer.innerHTML = `
                    <div class="round-header">🎯 第 ${round} 轮风暴辩论 - ${roleDisplayName}${typeText}</div>
                    <div class="speeches-container"></div>
                `;
                debateArea.appendChild(roundContainer);
            }

            const speechesContainer = roundContainer.querySelector('.speeches-container');
            const layerClass = role.layer ? `layer-${role.layer}` : '';
            const typeLabel = type === 'summary' ? '【总结】' : '';

            // ✅ [Task #013] 流式模式：检查是否存在相同 speechId 的元素
            let speechEl = null;
            if (speechId) {
                speechEl = speechesContainer.querySelector(`[data-speech-id="${speechId}"]`);
            }

            // ✅ [Task #013] 如果是流式更新且元素已存在，仅更新内容
            if (isStreaming && speechEl) {
                const contentEl = speechEl.querySelector('.speech-content');
                if (contentEl) {
                    contentEl.innerHTML = formatExpertSpeech(content, topic, previousRounds);

                    // 添加/保持打字机指示器
                    let typingIndicator = speechEl.querySelector('.typing-indicator');
                    if (!typingIndicator) {
                        typingIndicator = document.createElement('span');
                        typingIndicator.className = 'typing-indicator';
                        typingIndicator.innerHTML = '<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #007AFF; margin-left: 8px; animation: pulse 1.5s infinite;"></span>';
                        contentEl.appendChild(typingIndicator);
                    }
                }

                // 自动滚动到最新内容（仅流式更新时）
                speechEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return; // 流式更新完成，不创建新元素
            }

            // ✅ [Task #013] 如果是完成状态，移除打字机指示器
            if (isComplete && speechEl) {
                const typingIndicator = speechEl.querySelector('.typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }

                // 更新最终内容
                const contentEl = speechEl.querySelector('.speech-content');
                if (contentEl) {
                    contentEl.innerHTML = formatExpertSpeech(content, topic, previousRounds);
                }
                // ✅ [FIX P0-04] 移除提前return，让语音输出逻辑继续执行
                // 之前的bug：return语句导致语音输出被跳过
                // 落下到后续逻辑，但skip创建新元素（已存在speechEl）
            }

            // ✅ [v9.2] 计算发言序号（排除领袖的开场/转场/总结）
            let speechNumber = '';
            const isLeaderSpecial = role.key === 'facilitator' && (type === 'introduction' || type === 'transition' || type === 'summary');

            if (!isLeaderSpecial) {
                // 初始化当前轮次的计数器
                if (!state.speechCounter[round]) {
                    state.speechCounter[round] = 0;
                }
                // 增加计数（仅在首次创建时）
                if (!speechEl) {
                    state.speechCounter[round]++;
                }
                speechNumber = `${round}.${state.speechCounter[round]}`;
            }

            // ✅ [v9.2] 根据 phase 设置背景色（Apple 风格）
            let backgroundColor = '#FFFFFF'; // 默认白色
            if (role.key === 'facilitator') {
                backgroundColor = '#FFFFFF'; // 领袖保持默认
            } else if (phase === 'round_robin') {
                backgroundColor = '#F5F5F7'; // 轮流发言：浅灰色
            } else if (phase === 'supplementary') {
                backgroundColor = '#FFFBEA'; // 补充发言：浅淡黄色
            } else if (phase === 'transition') {
                backgroundColor = '#F0F8FF'; // 转场：浅蓝色
            }

            // 创建新的发言元素（首次显示或非流式模式）
            if (!speechEl) {
                speechEl = document.createElement('div');
                speechEl.className = `speech-item ${layerClass}`;
                speechEl.style.backgroundColor = backgroundColor;
                speechEl.style.position = 'relative';

                // ✅ [Task #013] 添加 speechId 以便流式更新时查找
                if (speechId) {
                    speechEl.dataset.speechId = speechId;
                }

                // ✅ [T-304] 数据校验（仅对专家发言进行校验，跳过领袖和委托人）
                let validationBadges = '';
                if (state.debateEngine && state.debateEngine.dataValidator && role.key !== 'facilitator' && role.id !== 'delegate') {
                    try {
                        const validation = state.debateEngine.dataValidator.validate({ content: content });
                        if (validation && (validation.validated.length > 0 || validation.needsVerification.length > 0 || validation.warnings.length > 0)) {
                            validationBadges = state.debateEngine.dataValidator.generateBadges(validation);
                            console.log(`✅ [T-304] ${role.shortName} 发言数据校验完成 - 评分: ${validation.score}/100`);
                        }
                    } catch (validationError) {
                        console.warn('⚠️ [T-304] 数据校验失败:', validationError);
                    }
                }

                // 递进关系处理：确保每轮专家发言都能体现前一轮内容
                // 收集前几轮的发言内容以供递进逻辑使用
                let previousRounds = [];
                if (round > 1) {
                    // 收集前1轮的发言内容（最多收集前两轮）
                    for (let i = Math.max(1, round - 2); i < round; i++) {
                        const prevRoundContainer = debateArea.querySelector(`[data-round="${i}"]`);
                        if (prevRoundContainer) {
                            const prevSpeeches = prevRoundContainer.querySelectorAll('.speech-item:not(.leader-introduction)');
                            prevSpeeches.forEach(speech => {
                                const contentEl = speech.querySelector('.speech-content');
                                if (contentEl) {
                                    previousRounds.push({
                                        round: i,
                                        content: contentEl.innerHTML
                                    });
                                }
                            });
                        }
                    }
                }

                // 使用增强的递进逻辑处理内容
                let enhancedContent = content;
                if (role.layer === 'core' || role.layer === 'external' || role.layer === 'value') {
                    enhancedContent = enhanceProgressiveLogic(content, role, round, previousRounds, phase);
                }

                const processedContent = formatExpertSpeech(enhancedContent, topic);

                speechEl.innerHTML = `
                    <div class="speech-header">
                        <span class="speech-role-icon">${role.icon || '💬'}</span>
                        <span>${role.shortName || role.name} ${typeLabel}</span>
                    </div>
                    <div class="speech-content">${processedContent}</div>
                    ${validationBadges ? `<div class="data-validation-badges" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;">${validationBadges}</div>` : ''}
                    ${speechNumber ? `<div class="speech-number" style="position: absolute; top: 10px; right: 15px; font-size: 12px; color: #999; font-family: -apple-system, monospace; background: rgba(255,255,255,0.8); padding: 2px 8px; border-radius: 8px;">${speechNumber}</div>` : ''}
                `;

                speechesContainer.appendChild(speechEl);
            }

            // ✅ [Task #128] 领袖开场发言时显示导航条
            // ✅ [FIX P0-NavBar] 增强调试日志，追踪导航条显示逻辑
            if (role.key === 'facilitator' && type === 'introduction') {
                console.log('🔍 [FIX P0-NavBar] 检测到领袖开场发言，准备显示导航条', {
                    roleKey: role.key,
                    type: type,
                    round: round
                });

                const navLinks = document.querySelector('.nav-links');
                console.log('🔍 [FIX P0-NavBar] 导航条元素查询结果', {
                    exists: !!navLinks,
                    element: navLinks,
                    currentDisplay: navLinks ? navLinks.style.display : 'N/A',
                    computedDisplay: navLinks ? window.getComputedStyle(navLinks).display : 'N/A',
                    computedVisibility: navLinks ? window.getComputedStyle(navLinks).visibility : 'N/A',
                    computedZIndex: navLinks ? window.getComputedStyle(navLinks).zIndex : 'N/A',
                    offsetHeight: navLinks ? navLinks.offsetHeight : 0,
                    offsetWidth: navLinks ? navLinks.offsetWidth : 0
                });

                if (navLinks) {
                    navLinks.style.display = 'block';
                    console.log('✅ [Task #128] 导航条 display 已设置为 block');

                    // 再次检查设置后的状态
                    setTimeout(() => {
                        console.log('🔍 [FIX P0-NavBar] 设置后的导航条状态（延迟100ms）', {
                            currentDisplay: navLinks.style.display,
                            computedDisplay: window.getComputedStyle(navLinks).display,
                            offsetHeight: navLinks.offsetHeight,
                            offsetWidth: navLinks.offsetWidth,
                            boundingRect: navLinks.getBoundingClientRect()
                        });
                    }, 100);
                } else {
                    console.error('❌ [FIX P0-NavBar] 导航条元素未找到！DOM 中可能不存在 .nav-links');
                }
            }

            // 滚动到最新发言
            speechEl.scrollIntoView({ behavior: 'smooth', block: 'end' });

            // ✅ [#086] v8.2 语音输出集成：仅在发言完成时朗读（避免流式更新时重复朗读）
            // ✅ [FIX P0-02] 增强日志：追踪 isComplete 标志
            console.log(`🔊 [FIX P0-02] handleRoleSpeak 语音调用检查`, {
                isComplete,
                hasVoiceModule: !!window.VoiceModule,
                isVoiceEnabled: window.VoiceModule ? window.VoiceModule.isVoiceEnabled() : false,
                roleName: role.shortName || role.name,
                contentLength: content ? content.length : 0,
                contentPreview: content ? content.substring(0, 50) : ''
            });

            if (isComplete && window.VoiceModule && window.VoiceModule.isVoiceEnabled()) {
                console.log(`✅ [FIX P0-02] 条件满足，调用 speakText()`);

                // ✅ [FIX P0-08] 领袖开场发言（type === 'introduction'）使用高优先级，打断策划页语音
                const priority = (role.key === 'facilitator' && type === 'introduction') ? 'high' : 'normal';
                window.VoiceModule.speakText(content, role.shortName || role.name, priority);
            } else {
                console.warn(`⚠️ [FIX P0-02] 条件不满足，跳过语音`, {
                    isComplete,
                    hasVoiceModule: !!window.VoiceModule,
                    isVoiceEnabled: window.VoiceModule ? window.VoiceModule.isVoiceEnabled() : false
                });
            }
        }

        // 递进关系增强函数 - 处理专家发言内容的承接与逻辑递进
        function enhanceProgressiveLogic(content, role, round, previousRounds, phase) {
            // 在专家发言中增强递进性，确保后续发言基于前一轮观点
            if (role.layer === 'core' || role.layer === 'external' || role.layer === 'value') {
                // 对于专家发言，确保内容关注于递进关系
                let enhancedContent = content;

                // 添加基于前一轮的视角分析（如果有的话）
                if (previousRounds && previousRounds.length > 0) {
                    // 根据当前轮次和阶段构建递进性内容
                    const prevRoundSpeeches = previousRounds.slice(-2); // 取前两轮发言

                    if (prevRoundSpeeches.length > 0) {
                        // 构建承接内容
                        let precedingContent = '<p style="font-style: italic; margin-bottom: 16px; color: #007AFF;">基于前轮专家的发现与洞察：</p>';

                        // 添加前几轮发言的关键点摘要
                        prevRoundSpeeches.forEach(prevRound => {
                            // 简单提取前一轮发言的主要观点（这里可以进一步优化）
                            precedingContent += `<p style="margin: 8px 0; font-size: 0.95em; color: #666;">第${prevRound.round}轮关键视角：</p>`;
                            precedingContent += prevRound.content;
                        });

                        enhancedContent = precedingContent + enhancedContent;
                    }
                }

                return enhancedContent;
            }

            return content;
        }

        // 处理委托人提示
        function handleDelegatePrompt(data) {
            const { type, message, strategy, callback, canSkip = true, round, totalRounds, isLastRound = false, userNickname } = data;
            const debateArea = document.getElementById('debateArea');

            // ✅ [FIX BUG-009] 验证回调函数是否存在（某些类型如'thanks'不需要callback）
            const noCallbackTypes = ['thanks', 'feedback']; // 只展示不响应的类型
            if (!noCallbackTypes.includes(type) && (!callback || typeof callback !== 'function')) {
                console.error('❌ [BUG-009] handleDelegatePrompt 接收到无效的 callback！', {
                    type,
                    message,
                    callbackType: typeof callback,
                    callbackValue: callback
                });
                alert('系统错误：回调函数无效，请刷新页面重试');
                return;
            }

            console.log('✅ [BUG-009] handleDelegatePrompt 接收到有效的 callback', {
                type,
                callbackType: typeof callback,
                message: message.substring(0, 50) + '...'
            });

            // 清除加载状态（如果存在）
            const loadingEl = debateArea.querySelector('.loading');
            if (loadingEl) {
                loadingEl.remove();
            }

            const promptEl = document.createElement('div');
            promptEl.className = 'delegate-prompt';

            // ✅ [Task #129] 构建 HTML - 使用分层结构：可滚动内容 + 固定底部按钮
            // 第一层：消息标题（固定）
            let htmlContent = `<div style="font-weight: bold; margin-bottom: 10px;">💬 ${message}</div>`;

            // 第二层：可滚动内容容器（包含策略、报告、输入框）
            // ✅ [FIX P1-ScrollBug v2] 移除内联max-height/overflow-y，让内容自然流动并由页面滚动条管理
            htmlContent += `<div style="margin-bottom: 15px; padding-right: 8px;">`;

            // 如果有策划内容，先显示策划内容
            if (strategy) {
                // 提取策略内容（可能是对象或字符串）
                const strategyText = typeof strategy === 'object' ? (strategy.content || JSON.stringify(strategy)) : strategy;

                // ✅ [P1-Nickname] 为策划阶段添加个性化欢迎语
                let enhancedStrategy = strategyText;
                if (type === 'planning_confirmation' && userNickname && userNickname !== '尊敬的委托人') {
                    enhancedStrategy = `Hi, ${userNickname}，我是 Victoria，您的风暴辩论委托代理人，角色是"领袖"。\n\n${strategyText}`;
                }

                // 简单的 Markdown 转 HTML（苹果风格）
                const strategyHTML = markdownToHTML(enhancedStrategy);

                htmlContent += `
                    <div style="background: #FFFAF0; padding: 20px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #007AFF; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h4 style="margin: 0 0 15px 0; color: #007AFF; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 18px; font-weight: 600;">📋 领袖(委托代理)的风暴辩论策略</h4>
                        <div style="line-height: 1.8; color: #333; font-family: -apple-system, SF Pro Text, sans-serif; text-align: left;">${strategyHTML}</div>
                    </div>
                `;
            }

            // ✅ [Task #109] 如果有报告内容（thanks 类型），显示完整报告（支持 PDF 导出）
            if (data.report) {
                // 构建完整报告内容
                let reportContent = `
                    <div style="line-height: 1.8; color: #333; font-family: -apple-system, SF Pro Text, sans-serif;">
                        <h3 style="color: #667eea; margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">总结</h3>
                        <p>${data.report.summary || '报告生成中...'}</p>
                `;

                // 添加核心洞察（如果存在）
                if (data.report.keyInsights && data.report.keyInsights.length > 0) {
                    reportContent += `
                        <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">核心洞察</h3>
                        <ul style="list-style-position: inside; line-height: 1.8; color: #555;">
                            ${data.report.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                    `;
                }

                // 添加行动计划（如果存在）
                if (data.report.actionPlan && data.report.actionPlan.length > 0) {
                    reportContent += `
                        <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">行动计划</h3>
                        <ul style="list-style-position: inside; line-height: 1.8; color: #555;">
                            ${data.report.actionPlan.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    `;
                }

                // 添加迭代建议（如果存在）
                if (data.report.iterationSuggestions && data.report.iterationSuggestions.length > 0) {
                    reportContent += `
                        <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">迭代建议</h3>
                        <ul style="list-style-position: inside; line-height: 1.8; color: #555;">
                            ${data.report.iterationSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                        </ul>
                    `;
                }

                // ✅ [Task #135] 添加CTA后续服务部分
                reportContent += `
                    <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🎯 后续服务</h3>
                    <ul style="list-style-position: inside; line-height: 1.8; color: #555;">
                        <li>📊 <strong>深度报告</strong>：基于本次风暴辩论生成详细的数据分析报告，包含量化指标和行动建议</li>
                        <li>📚 <strong>小白教程</strong>：针对您的具体场景，提供从零开始的详细实施指南</li>
                        <li>🎯 <strong>跟踪服务</strong>：后续执行过程中的持续跟进和优化建议</li>
                    </ul>
                    <p style="margin-top: 15px; padding: 15px; background: #F5F5F7; border-radius: 12px; color: #666; font-size: 14px; line-height: 1.6;">
                        💡 如需以上深度服务，请联系我们获取更多信息。扫描下方二维码或点击"后续跟进"按钮了解详情。
                    </p>
                `;

                reportContent += `</div>`;

                htmlContent += `
                    <div class="report-section" style="background: white; padding: 30px; border-radius: 16px; margin: 15px 0; border: 2px solid #34C759; box-shadow: 0 4px 12px rgba(52,199,89,0.15);">
                        <h2 style="margin: 0 0 20px 0; color: #34C759; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 22px; font-weight: 600; text-align: center; border-bottom: 2px solid #34C759; padding-bottom: 15px;">📄 风暴辩论总结报告</h2>
                        ${reportContent}
                    </div>
                `;
            }

            // 输入框和按钮
            if (type !== 'thanks') {
                // ✅ [T-314] 输入框 + 语音按钮（放在可滚动容器内）
                htmlContent += `
                    <div style="position: relative; width: 100%;">
                        <textarea id="delegateInput" placeholder="如有补充意见，请输入...（可选）" style="width: 100%; min-height: 100px; padding: 12px 60px 12px 12px; border: 1px solid #ddd; border-radius: 12px; font-family: -apple-system, sans-serif; resize: vertical;"></textarea>
                        <button id="voiceInputBtn"
                            onmousedown="window.VoiceModule.startVoiceInput()"
                            onmouseup="window.VoiceModule.stopVoiceInput()"
                            onmouseleave="window.VoiceModule.stopVoiceInput()"
                            ontouchstart="window.VoiceModule.startVoiceInput()"
                            ontouchend="window.VoiceModule.stopVoiceInput()"
                            style="position: absolute; right: 12px; top: 12px; width: 40px; height: 40px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; border: none; border-radius: 10px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,122,255,0.3);"
                            title="按住说话，松开结束">
                            🎤
                        </button>
                    </div>
                `;
                // 关闭可滚动内容容器
                htmlContent += `</div>`;

                // ✅ [Screenshot Fix] 第三层：固定底部按钮容器（统一宽度布局 + 快捷键提示右侧对齐）
                htmlContent += `<div style="position: relative; margin-top: 0;">`;

                // 按钮容器（根据按钮数量动态分配宽度）
                htmlContent += `<div style="display: flex; width: 100%;">`;

                // ✅ [FIX T-319] 智能按钮逻辑：修复三按钮显示条件
                if (type === 'planning_confirmation') {
                    // ✅ [Task #120] 策划阶段：2个按钮，各占50%
                    htmlContent += `
                        <button onclick="submitDelegateInput()" style="width: 50%; padding: 12px 24px; background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">📝 提交补充并重新规划</button>
                        <button onclick="confirmAndStartDebate()" style="width: 50%; padding: 12px 24px; background: linear-gradient(135deg, #34C759 0%, #2E9E4D 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">✅ 确认，开始风暴辩论</button>
                    `;
                } else if (type === 'before_summary' || type === 'round_opening' || type === 'transition_comment') {
                    // ✅ [FIX T-319] 辩论阶段（包括每轮开场、中场转场、总结前）：3个按钮，各占33.3%
                    const continueText = isLastRound ? '✅ 确认完成' : '✅ 确认, 继续';
                    const continueColor = isLastRound ? 'linear-gradient(135deg, #34C759 0%, #2E9E4D 100%)' : 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)';
                    const continueFunction = isLastRound ? 'confirmAndDeliver()' : 'confirmContinue()';

                    htmlContent += `
                        <button onclick="pauseDebate()" style="width: 33.3%; padding: 12px 24px; background: linear-gradient(135deg, #FF3B30 0%, #D12A22 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">⏸️ 打断/暂停</button>
                        <button id="submitCommentBtn" onclick="submitDelegateCommentInDebate()" style="width: 33.3%; padding: 12px 24px; background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">📝 提交补充</button>
                        <button onclick="${continueFunction}" style="width: 33.4%; padding: 12px 24px; background: ${continueColor}; color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">${continueText}</button>
                    `;
                } else {
                    // 其他阶段：默认确认按钮（单按钮100%宽度）
                    htmlContent += `
                        <button onclick="confirmContinue()" style="width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 500; cursor: pointer; transition: transform 0.2s; font-size: 14px;">✅ 确认</button>
                    `;
                }

                htmlContent += `</div>`; // 关闭按钮容器

                // ✅ [Screenshot Fix] 快捷键提示放在右侧按钮下方，右半边居中对齐
                htmlContent += `
                    <div style="position: absolute; bottom: -28px; right: 0; width: 50%; display: flex; justify-content: center; align-items: center;">
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #999; font-family: -apple-system, sans-serif;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #007AFF;">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            快捷键：Ctrl + Enter
                        </span>
                    </div>
                `;

                htmlContent += `</div>`; // 关闭外层容器（relative positioned）

                // 添加padding-bottom为快捷键提示留出空间
                htmlContent += `<div style="height: 30px;"></div>`;
            } else {
                // 关闭可滚动内容容器
                htmlContent += `</div>`;

                // 'thanks' 类型：只显示导出按钮和完成按钮（固定在底部）
                htmlContent += `
                    <div class="export-buttons">
                        <button class="export-btn" onclick="exportReport('pdf')" style="border-color: #007AFF; color: #007AFF;">
                            <span style="margin-right: 5px;">📄</span> 导出 PDF 报告
                        </button>
                        <button class="export-btn" onclick="exportReport('json')" style="border-color: #34C759; color: #34C759;">
                            <span style="margin-right: 5px;">💾</span> 导出 JSON 数据
                        </button>
                    </div>
                    <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="finishDebateFromPrompt()" style="flex: 1; min-width: 160px; max-width: 220px; padding: 14px 24px; background: linear-gradient(135deg, #34C759 0%, #2E9E4D 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(52,199,89,0.3);">
                            ✅ 表示感谢，结束风暴
                        </button>
                        <button onclick="location.reload()" style="flex: 1; min-width: 160px; max-width: 220px; padding: 14px 24px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(0,122,255,0.3);">
                            🔄 再来一轮
                        </button>
                        <button onclick="alert('💡 如需深度报告、小白教程或跟踪服务，请查看报告中的「🎯 后续服务」部分或联系我们了解详情。')" style="flex: 1; min-width: 160px; max-width: 220px; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-family: -apple-system, sans-serif; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(102,126,234,0.3);">
                            🎯 后续跟进落实深入
                        </button>
                    </div>
                `;
            }

            promptEl.innerHTML = htmlContent;

            debateArea.appendChild(promptEl);
            promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // ✅ [UX Enhancement] 语音输出策划内容
            if (strategy && window.VoiceModule && window.VoiceModule.isVoiceEnabled()) {
                const strategyText = typeof strategy === 'object' ? (strategy.content || JSON.stringify(strategy)) : strategy;
                // 清理HTML标签和Markdown符号后朗读
                const cleanText = strategyText
                    .replace(/<[^>]+>/g, '')           // 移除HTML标签
                    .replace(/\*\*/g, '')               // 移除粗体符号
                    .replace(/#{1,6}\s+/g, '')          // 移除标题符号
                    .replace(/^[-*•]\s+/gm, '')         // 移除列表符号
                    .replace(/\s+/g, ' ')               // 合并多余空白
                    .trim();

                console.log('🔊 [Planning Stage] 朗读策划内容', { length: cleanText.length, preview: cleanText.substring(0, 50) });
                window.VoiceModule.speakText(cleanText, '领袖(委托代理)');
            }

            // ✅ [FIX T-318] 强化回调保护机制：防止回调覆盖导致丢失
            if (callback && typeof callback === 'function') {
                // 保存旧回调（如果存在）以防需要恢复
                const previousCallback = window.currentDelegateCallback;

                // 检查是否已存在callback（可能是前一个promptDelegate未完成）
                if (previousCallback && typeof previousCallback === 'function') {
                    console.warn('⚠️ [FIX T-318] 检测到已存在回调函数，保存为备份', {
                        previousType: window.currentDelegateCallbackType || 'unknown',
                        currentType: type,
                        timestamp: new Date().toISOString()
                    });

                    // 创建代理回调，确保不丢失原回调
                    const proxyCallback = function(input) {
                        try {
                            console.log('✅ [FIX T-318] 执行代理回调', { type, input: input?.substring(0, 50) });
                            const result = callback(input);
                            // 恢复之前的回调（如果需要）
                            window.currentDelegateCallback = null;
                            window.currentDelegateCallbackType = null;
                            return result;
                        } catch (error) {
                            console.error('❌ [FIX T-318] 代理回调执行失败:', error);
                            // 尝试恢复之前的回调
                            window.currentDelegateCallback = previousCallback;
                            throw error;
                        }
                    };

                    // 移除旧的delegate-prompt UI
                    const oldPrompts = debateArea.querySelectorAll('.delegate-prompt');
                    if (oldPrompts.length > 0) {
                        console.warn(`⚠️ [FIX T-318] 移除 ${oldPrompts.length} 个旧的 .delegate-prompt 元素`);
                        oldPrompts.forEach(oldPrompt => oldPrompt.remove());
                    }

                    // 使用代理回调
                    window.currentDelegateCallback = proxyCallback;
                    window.currentDelegateCallbackType = type;
                } else {
                    // 直接保存新的callback
                    window.currentDelegateCallback = callback;
                    window.currentDelegateCallbackType = type;
                }

                console.log('✅ [FIX T-318] 回调函数已成功保存', {
                    type,
                    callbackExists: !!window.currentDelegateCallback,
                    callbackType: window.currentDelegateCallbackType,
                    timestamp: new Date().toISOString()
                });
            } else if (noCallbackTypes.includes(type)) {
                // 不需要回调的类型，清空旧回调
                console.log('✅ [FIX T-318] 清空旧回调（当前类型不需要回调）', { type });
                window.currentDelegateCallback = null;
                window.currentDelegateCallbackType = null;
            } else {
                console.error('❌ [FIX T-318] 尝试保存无效的回调函数！', {
                    type,
                    callbackType: typeof callback
                });
            }
        }

        // Markdown 转 HTML（简化版，苹果风格）
        function markdownToHTML(markdown) {
            if (!markdown) return '';

            let html = markdown;

            // 第一步：处理粗体（** → <strong>，保留加粗效果）
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #007AFF; font-weight: 600;">$1</strong>');

            // 第二步：移除 Markdown 标题符号（### ## # ---），保留文字
            html = html.replace(/^#{1,6}\s+/gm, ''); // 移除 # 符号
            html = html.replace(/^---+$/gm, ''); // 移除分隔线

            // 第三步：移除列表符号，转为纯文本（- * 1. ）
            html = html.replace(/^\s*[-*•]\s+/gm, ''); // 移除无序列表符号
            html = html.replace(/^\s*\d+\.\s+/gm, ''); // 移除有序列表符号

            // 第四步：移除代码符号（` ）
            html = html.replace(/`([^`]+)`/g, '$1');

            // 第五步：段落处理（紧凑显示，移除多余空行）
            html = html
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line !== '---') // 移除空行和分隔线
                .map(para => {
                    if (para.startsWith('<')) return para; // 已经是 HTML
                    // 智能识别标题（通常较短且包含关键词）
                    if (para.length < 50 && (para.includes('轮') || para.includes('：') || para.includes('核心') || para.includes('阶段'))) {
                        return `<p style="margin: 12px 0 6px 0; line-height: 1.6; font-weight: 600; color: #333;">${para}</p>`;
                    }
                    return `<p style="margin: 6px 0; line-height: 1.6; color: #333;">${para}</p>`;
                })
                .join('');

            return html;
        }

        // ✅ [v9] 专家发言格式化（关键词加粗 + 分项列表分行 + 紧凑显示）
        function formatExpertSpeech(content, roundTopic, previousRounds = []) {
            if (!content) return '';

            let html = content;

            // 第一步：先调用 markdownToHTML 处理基本 Markdown 格式
            html = markdownToHTML(html);

            // 第二步：关键词加粗（✅ [T-323] 优化版 - 修复边界检测和防止重复加粗）
            const keywords = ['建议', '问题', '风险', '机会', '数据', '挑战', '优势', '劣势', '威胁', '方案', '策略', '目标', '关键', '核心', '重点', '注意', '结论', '分析', '评估', '优化', '实施', '执行', '结果', '效果', '可行性', '必要性', '重要性', '紧迫性'];
            keywords.forEach(keyword => {
                // ✅ [T-323] 使用负向后顾断言，避免匹配已在 <strong> 标签内的关键词
                // 匹配条件：关键词前不是 > 字符（避免匹配标签内的关键词），且后面有中文标点、空格或标签
                const regexWithBoundary = new RegExp(`(?<!>)([^<>]*?)(${keyword})(?=[，。；：！？、\\s<]|$)`, 'g');

                html = html.replace(regexWithBoundary, (match, prefix, kw) => {
                    // 检查 prefix 中是否包含未闭合的 <strong> 标签（防止嵌套）
                    const openTags = (prefix.match(/<strong[^>]*>/g) || []).length;
                    const closeTags = (prefix.match(/<\/strong>/g) || []).length;

                    if (openTags > closeTags) {
                        // 在未闭合的 strong 标签内，不再加粗
                        return match;
                    }

                    return `${prefix}<strong style="color: #007AFF; font-weight: 700;">${kw}</strong>`;
                });
            });

            // ✅ [Task #132] 本轮话题突显 - 将本轮主题关键短语加粗
            if (roundTopic) {
                const topicPhrases = roundTopic
                    .split(/[：、/]/)  // 按分隔符拆分主题短语
                    .map(p => p.trim())
                    .filter(p => p.length > 2);  // 过滤太短的片段

                topicPhrases.forEach(phrase => {
                    const regex = new RegExp(`(${phrase})`, 'g');
                    html = html.replace(regex, '<strong style="color: #007AFF; font-weight: 700;">$1</strong>');
                });
            }

            // 第三步：识别并格式化分项列表（升级版，更清晰的分行显示）
            // 处理 "1. xxx 2. xxx 3. xxx" 格式（仅匹配行首）
            html = html.replace(/(^|\n)\s*(\d+)\.\s*([^。！？\n]+)/gm, (match, prefix, num, text) => {
                return `${prefix}<div style="margin: 10px 0 10px 25px; line-height: 1.7; border-left: 3px solid #007AFF; padding-left: 12px;">
<span style="display: inline-block; width: 28px; font-weight: 700; color: #007AFF; font-size: 15px;">${num}.</span>
${text.trim()}
</div>`;
            });

            // 处理 "（1）xxx（2）xxx" 格式（仅匹配行首）
            html = html.replace(/(^|\n)\s*[（(](\d+)[）)]\s*([^（(）)\n]+)/gm, (match, prefix, num, text) => {
                return `${prefix}<div style="margin: 10px 0 10px 25px; line-height: 1.7; border-left: 3px solid #34C759; padding-left: 12px;">
<span style="display: inline-block; width: 28px; font-weight: 700; color: #34C759; font-size: 15px;">(${num})</span>
${text.trim()}
</div>`;
            });

            // 第四步：处理段落（Reader-Friendly 优化版 + ✅ [Task #130] 重点段落分行优化）
            const lines = html.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0); // 移除空行

            // ✅ [Task #130] 重点段落关键词（用于识别需要增强分行的段落）
            const emphasisKeywords = ['建议', '问题', '核心', '重点', '关键', '结论', '分析', '评估', '总结', '方案', '策略', '目标', '注意', '风险', '机会', '优势', '劣势'];

            // 合并为最终 HTML（已处理的列表项会保留 div，其他文本合并为段落）
            html = lines.map(line => {
                if (line.startsWith('<div')) {
                    return line; // 列表项，直接返回
                } else {
                    // ✅ [Task #130] 检测是否为重点段落（开头包含重点关键词或已加粗的关键词）
                    const isEmphasisParagraph = emphasisKeywords.some(keyword =>
                        line.startsWith(keyword) ||
                        (line.startsWith('<strong') && line.includes(`>${keyword}<`))
                    );

                    // ✅ [Task #130 FIX] 重点段落增加上下边距（24px/16px），形成明显的视觉分隔
                    if (isEmphasisParagraph) {
                        return `<p style="margin: 24px 0 16px 0; line-height: 1.7; color: #2C3E50; font-size: 15px; text-align: left; font-weight: 500;">${line}</p>`;
                    } else {
                        return `<p style="margin: 8px 0 8px 0; line-height: 1.7; color: #2C3E50; font-size: 15px; text-align: left;">${line}</p>`;
                    }
                }
            }).join('');

            return html;
        }

        // 提交委托人补充意见（策划阶段需要重新规划）
        async function submitDelegateInput() {
            const input = document.getElementById('delegateInput');
            const feedback = input.value.trim();

            if (!feedback) {
                alert('请输入您的补充意见，或点击"确认"按钮直接开始风暴辩论');
                return;
            }

            // 移除当前提示框
            document.querySelector('.delegate-prompt')?.remove();

            // 显示加载状态
            document.getElementById('debateArea').innerHTML += `
                <div class="card loading">
                    <div class="spinner"></div>
                    <p><strong>🧠 领袖(委托代理)正在根据您的意见重新规划策略...</strong></p>
                </div>
            `;

            try {
                // 调用 debateEngine 重新规划
                const adjustedStrategy = await state.debateEngine.adjustStrategy(feedback);

                // 移除加载状态
                document.querySelector('.loading')?.remove();

                // 再次显示策略让委托人确认（使用 handleDelegatePrompt 逻辑）
                handleDelegatePrompt({
                    type: 'planning_confirmation',
                    message: '领袖(委托代理)已根据您的意见调整策略，请查看：',
                    strategy: adjustedStrategy,
                    canSkip: false,
                    callback: (finalInput) => {
                        // 这次回调只是确认，进入风暴辩论
                        state.debateEngine.confirmAndStart(finalInput);
                    }
                });

            } catch (error) {
                console.error('重新规划失败:', error);
                alert('策略调整失败，请重试');
            }
        }

        // 确认策略，开始风暴辩论
        function confirmAndStartDebate() {
            console.log('🔵 [BUG-009] confirmAndStartDebate 被调用', {
                hasCallback: !!window.currentDelegateCallback,
                callbackType: typeof window.currentDelegateCallback,
                timestamp: new Date().toISOString()
            });

            // ✅ [FIX BUG-009] 增强回调验证和错误处理
            if (window.currentDelegateCallback && typeof window.currentDelegateCallback === 'function') {
                console.log('✅ [BUG-009] 正在执行回调函数，传递空字符串（表示直接确认）');

                try {
                    window.currentDelegateCallback(''); // 传空字符串表示直接确认
                    console.log('✅ [BUG-009] 回调函数执行成功');
                } catch (error) {
                    console.error('❌ [BUG-009] 回调函数执行失败：', error);
                    alert('系统错误：回调函数执行失败 - ' + error.message);
                    return; // ✅ [FIX BUG #2] 执行失败时不移除弹窗，让用户重试或刷新
                }

                window.currentDelegateCallback = null;
                console.log('✅ [BUG-009] 回调函数已清空，UI 已清理');
            } else {
                console.error('❌ [BUG-009] currentDelegateCallback 无效！', {
                    exists: !!window.currentDelegateCallback,
                    type: typeof window.currentDelegateCallback,
                    value: window.currentDelegateCallback
                });
                alert('系统错误：回调函数丢失或无效，请刷新页面重试\n\n技术详情：回调类型 = ' + typeof window.currentDelegateCallback);
                // ✅ [FIX BUG #2] 即使回调丢失也移除弹窗，避免UI卡死
            }

            // ✅ [FIX BUG #2] 移除弹窗（成功或失败后都移除）
            document.querySelector('.delegate-prompt')?.remove();
        }

        // 确认继续下一轮（辩论阶段）
        function confirmContinue() {
            const input = document.getElementById('delegateInput');
            const feedback = input ? input.value.trim() : '';

            if (window.currentDelegateCallback) {
                window.currentDelegateCallback(feedback); // 传递用户输入（可以为空）
                window.currentDelegateCallback = null;
            } else {
                // ✅ [FIX BUG #2] 回调丢失时显示明确错误
                console.error('❌ [BUG #2] currentDelegateCallback 丢失，无法继续风暴辩论');
                alert('系统错误：无法继续风暴辩论流程\n\n回调函数已丢失，请刷新页面重新开始');
            }

            // ✅ [FIX BUG #2] 无论回调是否存在，都移除弹窗（避免UI卡死）
            document.querySelector('.delegate-prompt')?.remove();
        }

        function confirmAndDeliver() {
            console.log('🟢 [R15] confirmAndDeliver 被调用，准备结束风暴辩论');
            const input = document.getElementById('delegateInput');
            const feedback = input ? input.value.trim() : '';

            if (window.currentDelegateCallback) {
                // 传递用户输入，引擎应识别到这是最后一轮的确认
                window.currentDelegateCallback(feedback);

                // 设置用户主动完成标志
                if (window.state && window.state.debateEngine) {
                    window.state.debateEngine.state.userCompleted = true;
                    console.log('✅ [R15] 设置 userCompleted = true');
                }

                window.currentDelegateCallback = null;

                // ✅ [FIX #138] 移除手动调用 startDelivery() 的逻辑
                // 根因：Line 1714 的 callback 调用已经触发 debateEngine 内部流程
                // debateEngine.startDebate() 会在 for 循环结束后自动调用 startDelivery()
                // 手动调用会导致重复，且可能触发"辩论引擎不可用"错误
                console.log('✅ [FIX #138] 已移除手动调用 startDelivery()，由引擎自动完成交付流程');

            } else {
                console.error('❌ [R15] confirmAndDeliver: currentDelegateCallback 无效！');
                alert('系统错误：最终确认回调丢失，请刷新页面重试');
            }

            // ✅ [FIX BUG #2] 移除弹窗
            document.querySelector('.delegate-prompt')?.remove();
        }

        // 打断/暂停风暴辩论
        function pauseDebate() {
            const confirmed = confirm('⏸️ 确认暂停风暴辩论？\n\n暂停后将结束当前风暴辩论，生成截止目前的总结报告。');

            if (confirmed) {
                if (window.currentDelegateCallback) {
                    window.currentDelegateCallback('[PAUSE]'); // 传递特殊标记
                    document.querySelector('.delegate-prompt')?.remove();
                    window.currentDelegateCallback = null;
                }

                // 通知引擎暂停（需要在 debateEngine 中处理 [PAUSE] 标记）
                if (state.debateEngine) {
                    alert('✅ 风暴辩论已暂停，正在生成总结报告...');
                    // debateEngine 会在收到 [PAUSE] 后跳转到交付阶段
                }
            }
        }

        // ✅ [FIX BUG-012] 风暴辩论阶段提交补充意见
        // ✅ [FIX #018] 从提示框结束风暴辩论并进入交付阶段（用于 thanks 类型的完成按钮）
        async function finishDebateFromPrompt() {
            try {
                console.log('🟢 finishDebateFromPrompt: 点击完成风暴辩论按钮');

                // ✅ [FIX #018] 先执行回调逻辑，再移除UI，确保逻辑完整执行
                if (window.currentDelegateCallback && typeof window.currentDelegateCallback === 'function') {
                    console.log('🟢 调用保存的 callback 进入反馈收集');
                    await window.currentDelegateCallback();
                    window.currentDelegateCallback = null;
                } else {
                    // 如果没有 callback，直接进入交付阶段（不是completed）
                    console.log('🟢 直接进入交付阶段');
                    if (window.state && window.state.debateEngine) {
                        window.state.debateEngine.emit('phaseChange', { phase: 'completed', state: window.state.debateEngine.state });
                    }
                }

                // ✅ [FIX #018] 逻辑执行完毕后再移除UI，防止按钮消失但逻辑未完成
                const promptElement = document.querySelector('.delegate-prompt');
                if (promptElement) {
                    promptElement.remove();
                }

                // ✅ [FIX #139] 显示最终完成页面，提供后续操作按钮
                const debateArea = document.getElementById('debateArea');
                const completionCard = document.createElement('div');
                completionCard.className = 'card';
                completionCard.style.marginTop = '30px';
                completionCard.style.textAlign = 'center';
                completionCard.innerHTML = `
                    <h2 style="color: #34C759; font-size: 2em; margin-bottom: 20px;">🎉 风暴辩论已完成</h2>
                    <p style="font-size: 1.2em; color: #666; margin-bottom: 40px;">感谢您使用多魔汰风暴辩论系统！</p>
                    <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="location.href='../index.html'" style="padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 1.1em; cursor: pointer; transition: transform 0.2s;">🏠 返回首页</button>
                        <button onclick="location.reload()" style="padding: 14px 32px; background: linear-gradient(135deg, #34C759 0%, #2E9E4D 100%); color: white; border: none; border-radius: 12px; font-size: 1.1em; cursor: pointer; transition: transform 0.2s;">🔄 再来一轮</button>
                        <button onclick="showDebateHistory()" style="padding: 14px 32px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; border: none; border-radius: 12px; font-size: 1.1em; cursor: pointer; transition: transform 0.2s;">📜 查看历史</button>
                    </div>
                `;
                debateArea.appendChild(completionCard);
                completionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } catch (err) {
                console.error('❌ finishDebateFromPrompt 发生错误：', err);
                alert('结束风暴辩论失败，请查看控制台获取更多信息');
            }
        }

        function submitDelegateCommentInDebate() {
            console.log('📝 [BUG-012] submitDelegateCommentInDebate 被调用');

            const input = document.getElementById('delegateInput');
            const feedback = input ? input.value.trim() : '';

            if (!feedback) {
                alert('请输入您的补充意见，或直接点击"确认"按钮继续');
                return;
            }

            console.log('📝 [BUG-012] 委托人提交补充意见:', feedback.substring(0, 50) + '...');

            // ✅ [UX优化] 先在界面上显示委托人的发言（模拟真实会议场景）
            const debateArea = document.getElementById('debateArea');
            const currentRoundContainer = debateArea.querySelector('[data-round]:last-child');

            if (currentRoundContainer) {
                const speechesContainer = currentRoundContainer.querySelector('.speeches-container');
                const delegateSpeechEl = document.createElement('div');
                delegateSpeechEl.className = 'speech-item';
                delegateSpeechEl.style.borderLeftColor = '#FFD700'; // 金色，突出显示
                delegateSpeechEl.style.backgroundColor = '#FFFAF0'; // 暖米白背景
                delegateSpeechEl.innerHTML = `
                    <div class="speech-header">
                        <span class="speech-role-icon">💬</span>
                        <span>委托人 【重要补充】</span>
                    </div>
                    <div class="speech-content">${feedback}</div>
                `;
                speechesContainer.appendChild(delegateSpeechEl);
                delegateSpeechEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

            // ✅ [关联 #091] 高权重记录：标记为重要补充信息
            if (window.currentDelegateCallback && typeof window.currentDelegateCallback === 'function') {
                try {
                    // 传递补充信息（带特殊标记表示高权重）
                    window.currentDelegateCallback(`[HIGH_PRIORITY] ${feedback}`);
                    console.log('✅ [BUG-012] 补充意见已提交，标记为高权重');

                    window.currentDelegateCallback = null;
                } catch (error) {
                    console.error('❌ [BUG-012] 提交补充意见失败:', error);
                    alert('提交失败：' + error.message);
                    return; // ✅ [FIX BUG #2] 失败时不移除弹窗，让用户重试
                }
            } else {
                console.error('❌ [BUG-012] currentDelegateCallback 无效！');
                alert('系统错误：回调函数丢失，请刷新页面重试');
            }

            // ✅ [FIX BUG #2] 成功或回调丢失后都移除弹窗
            document.querySelector('.delegate-prompt')?.remove();
        }

        // 跳过委托人输入（保留旧函数以兼容其他阶段）
        function skipDelegateInput() {
            confirmAndStartDebate();
        }

        // ✅ [模块化优化] 语音功能已迁移至 voice.js，通过 window.VoiceModule 调用

        // ✅ [FIX P0-02] 测试语音输出功能
        function testVoiceOutput() {
            console.log('🧪 [FIX P0-02] testVoiceOutput 被调用');

            // 自动开启语音（如果未开启）
            if (!window.VoiceModule.isVoiceEnabled()) {
                window.VoiceModule.toggleVoiceOutput();
                console.log('✅ [FIX P0-02] 自动开启语音');
            }

            // 测试文本
            const testText = '语音测试：多魔汰风暴辩论系统已就绪，专家们将为您提供专业建议。';

            console.log('🧪 [FIX P0-02] 准备朗读测试文本:', testText);

            // 调用语音模块
            if (window.VoiceModule && window.VoiceModule.speakText) {
                window.VoiceModule.speakText(testText, '系统');

                // 显示提示信息
                const btn = document.getElementById('testVoiceBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ 朗读中...';
                btn.style.background = 'linear-gradient(135deg, #34C759 0%, #2E9E4D 100%)';

                // 3秒后恢复按钮
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)';
                }, 3000);
            } else {
                alert('❌ 语音模块未加载，请刷新页面重试');
            }
        }

        // ✅ [Task #13] 更新Token统计显示
        function updateTokenDisplay(stats) {
            let tokenStatsEl = document.getElementById('tokenStats');

            // Create element if it doesn't exist
            if (!tokenStatsEl) {
                const debateArea = document.getElementById('debateArea');
                const tokenStatsHTML = `
                    <div id="tokenStats" class="token-stats">
                        <div class="token-stats-header">
                            <span>📊</span>
                            <span>Token 消耗统计</span>
                        </div>
                        <div class="token-stats-grid">
                            <div class="token-stat-item">
                                <div class="token-stat-label">总消耗</div>
                                <div class="token-stat-value" id="totalTokens">0</div>
                            </div>
                            <div class="token-stat-item">
                                <div class="token-stat-label">当前轮次</div>
                                <div class="token-stat-value" id="currentRoundTokens">0</div>
                            </div>
                            <div class="token-stat-item">
                                <div class="token-stat-label">平均/轮</div>
                                <div class="token-stat-value" id="avgTokensPerRound">0</div>
                            </div>
                        </div>
                    </div>
                `;
                debateArea.insertAdjacentHTML('afterbegin', tokenStatsHTML);
                tokenStatsEl = document.getElementById('tokenStats');
            }

            // Show the component
            tokenStatsEl.classList.add('visible');

            // Update values
            document.getElementById('totalTokens').textContent = stats.total.toLocaleString();
            document.getElementById('currentRoundTokens').textContent = stats.currentRound.toLocaleString();

            const avgPerRound = stats.byRound.length > 0
                ? Math.round(stats.total / stats.byRound.length)
                : 0;
            document.getElementById('avgTokensPerRound').textContent = avgPerRound.toLocaleString();

            console.log('✅ [Task #13] Token显示已更新', stats);
        }

        // 处理错误
        function handleError(data) {
            console.error('辩论错误:', data);
            alert(`风暴辩论过程出错：${data.error.message}`);
        }


        // ✅ [Task #3] 导出报告 - 使用独立的 export.js 模块
        function exportReport(format) {
            if (!state.debateEngine || !state.debateEngine.state.reportData) {
                alert('报告尚未生成，请等待风暴辩论完成。');
                return;
            }

            // 使用独立的 ExportManager 模块
            if (!window.exportManager) {
                console.error('❌ export.js 模块未加载');
                alert('导出功能未加载，请刷新页面重试');
                return;
            }

            try {
                if (format === 'json') {
                    window.exportManager.exportAsJSON({
                        reportData: state.debateEngine.state.reportData
                    });
                } else if (format === 'pdf') {
                    window.exportManager.exportAsPDF({
                        reportData: state.debateEngine.state.reportData,
                        targetSelector: '.report-section'
                    });
                }
            } catch (error) {
                console.error('❌ 导出失败:', error);
                alert(`导出失败：${error.message}`);
            }
        }

        // ❌ [Task #006 - Placeholder] 模拟雷达图数据展示（需要 Recharts）
        function showRadarChart(reportData) {
            // 由于本项目未使用 React/Recharts，此处仅展示一个占位符或简易 SVG/Canvas
            const debateArea = document.getElementById('debateArea');
            if (!debateArea) return;

            let chartPlaceholder = debateArea.querySelector('#radarChartPlaceholder');
            if (!chartPlaceholder) {
                chartPlaceholder = document.createElement('div');
                chartPlaceholder.id = 'radarChartPlaceholder';
                chartPlaceholder.className = 'report-section';
                debateArea.insertBefore(chartPlaceholder, debateArea.querySelector('.debate-round') || debateArea.firstChild);
            }

            chartPlaceholder.innerHTML = `
                <h2>📊 风暴辩论总结雷达图（可视化）</h2>
                <div style="border: 1px dashed #ccc; padding: 30px; text-align: center; border-radius: 10px; margin-top: 20px;">
                    <p style="font-size: 1.1em; color: #667eea;">⚠️ 可视化功能待集成 Recharts 库</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        当前展示：[假设生成雷达图] 核心洞察分布（待完整数据填充）
                    </p>
                    <!-- 简易 SVG 占位 -->
                    <svg width="300" height="300" viewBox="0 0 100 100" style="margin-top: 20px;">
                        <circle cx="50" cy="50" r="45" fill="rgba(0, 122, 255, 0.1)" stroke="#007AFF" stroke-width="1"/>
                        <circle cx="50" cy="50" r="25" fill="none" stroke="#007AFF" stroke-width="0.5"/>
                        <line x1="50" y1="5" x2="50" y2="95" stroke="#007AFF" stroke-width="0.5"/>
                        <line x1="85" y1="50" x2="15" y2="50" stroke="#007AFF" stroke-width="0.5"/>
                        <text x="50" y="10" text-anchor="middle" font-size="6" fill="#333">洞察</text>
                    </svg>
                </div>
            `;
            chartPlaceholder.style.display = 'block';
            // 滚动到图表位置
            chartPlaceholder.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
