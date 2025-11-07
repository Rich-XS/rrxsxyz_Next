// 多魔汰系统 - 初始化模块
// 提取自 duomotai/index.html 初始化逻辑

// ========== 初始化管理器 ==========
class InitManager {
    constructor() {
        this.state = null;
    }

    // 主初始化函数
    async init(stateObject) {
        this.state = stateObject;

        const userPhone = localStorage.getItem('userPhone');
        if (userPhone) {
            await this.initializeUser(userPhone);
        } else {
            this.updateUserStatus();
        }

        this.renderRoles();
        this.setupEventListeners();
        this.fillDefaultContentFor5758();
        this.initializeVoiceSystem();
    }

    // 初始化用户信息
    async initializeUser(userPhone) {
        const userStatus = document.getElementById('userStatus');
        const phoneLastFour = userPhone.slice(-4);
        let displayName = `手机尾号: ${phoneLastFour}`;
        let lastTopic = '';
        let lastBackground = '';

        try {
            // 从后端API获取用户profile
            console.log(`🔍 [DEBUG] Fetching user profile for phone: ${userPhone}`);
            // 确保phone参数正确编码
            const cleanPhone = userPhone.trim();
            const apiUrl = `http://localhost:3001/api/user/profile?phone=${encodeURIComponent(cleanPhone)}`;
            console.log(`🔍 [DEBUG] API URL: ${apiUrl}`);
            const apiResponse = await fetch(apiUrl);
            console.log(`🔍 [DEBUG] API Response status: ${apiResponse.status}, ok: ${apiResponse.ok}`);

            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                console.log('🔍 [DEBUG] API Response data:', apiData);

                if (apiData.profile && apiData.profile.nickname) {
                    displayName = apiData.profile.nickname;
                    console.log(`✅ [DEBUG] Nickname found: ${displayName}`);
                } else {
                    console.warn('⚠️ [DEBUG] Profile or nickname missing in response:', {
                        hasProfile: !!apiData.profile,
                        hasNickname: apiData.profile?.nickname,
                        fullData: apiData
                    });
                }
            } else {
                console.warn(`⚠️ [DEBUG] API request failed with status: ${apiResponse.status}`);
            }
        } catch (error) {
            console.warn('⚠️ 后端API获取用户信息失败，使用默认值:', error);
        }

        // ✅ [D-66 FIX] 优先从 localStorage 读取历史输入
        lastTopic = localStorage.getItem(`duomotai_topic_${userPhone}`) || '';
        lastBackground = localStorage.getItem(`duomotai_background_${userPhone}`) || '';

        // 如果 localStorage 没有数据，再尝试从前端数据库读取
        if (!lastTopic && !lastBackground) {
            try {
                const localResponse = await fetch('./data/userDatabase.json');
                const localDatabase = await localResponse.json();
                const userRecord = localDatabase.users.find(user => user.phone === userPhone);
                if (userRecord) {
                    lastTopic = userRecord.lastTopic || '';
                    lastBackground = userRecord.lastBackground || '';
                    // 保存到 localStorage 以便下次直接使用
                    if (lastTopic) localStorage.setItem(`duomotai_topic_${userPhone}`, lastTopic);
                    if (lastBackground) localStorage.setItem(`duomotai_background_${userPhone}`, lastBackground);
                }
            } catch (error) {
                console.warn('⚠️ 前端数据库获取失败:', error);
            }
        }

        userStatus.innerHTML = `
            <span>👤 ${displayName}</span>
            <button onclick="logout()" style="margin-left: 10px; padding: 5px 15px; background: rgba(255,255,255,0.2); border: 1px solid white; border-radius: 5px; color: white; cursor: pointer;">
                退出
            </button>
        `;

        document.getElementById('topicInput').value = lastTopic;
        document.getElementById('backgroundInput').value = lastBackground;

        // 用户画像集成
        if (window.UserProfile) {
            this.state.userProfile = new UserProfile({
                apiEndpoint: 'http://localhost:3001/api/user/profile'
            });

            const needsSurvey = await this.state.userProfile.init(userPhone);

            // ✅ [Fix] 老用户信息自动填充 - 如果画像完整，自动填充并跳过弹窗
            if (!needsSurvey) {
                console.log('✅ [Task #042] 用户画像已完整，跳过调研模态框');
                console.log('✅ [老用户] 信息完整:', this.state.userProfile.getProfile());

                // 自动填充个人信息（如果模态框存在的话）
                const profile = this.state.userProfile.getProfile();
                if (profile) {
                    // 填充表单字段（如果存在）
                    const ageGroupSelect = document.querySelector('[name="ageGroup"]');
                    const genderRadios = document.querySelectorAll('[name="gender"]');
                    const nicknameInput = document.querySelector('[name="nickname"]');
                    const emailInput = document.querySelector('[name="email"]');

                    if (ageGroupSelect) ageGroupSelect.value = profile.ageGroup || '';
                    if (genderRadios.length) {
                        const targetRadio = Array.from(genderRadios).find(r => r.value === profile.gender);
                        if (targetRadio) targetRadio.checked = true;
                    }
                    if (nicknameInput) nicknameInput.value = profile.nickname || '';
                    if (emailInput) emailInput.value = profile.email || '';

                    // 隐藏或移除模态框（如果已显示）
                    const existingModal = document.getElementById('profileSurveyModal');
                    if (existingModal) {
                        existingModal.remove();
                        console.log('✅ [老用户] 移除不必要的信息填写弹窗');
                    }
                }
            } else {
                console.log('✅ [Task #042] 用户画像不完整，显示调研模态框');
                try {
                    await this.state.userProfile.showSurveyModal(userPhone);
                    console.log('✅ [Task #042] 用户画像调研完成:', this.state.userProfile.getProfile());
                } catch (error) {
                    console.error('❌ [Task #042] 用户画像调研失败:', error);
                }
            }
        } else {
            console.warn('⚠️ [Task #042] UserProfile 模块未加载');
        }
    }

    // 更新用户状态显示
    updateUserStatus() {
        const userStatus = document.getElementById('userStatus');

        if (window.UserAuth && window.UserAuth.isLoggedIn()) {
            this.state.user = window.UserAuth.currentUser;
            userStatus.innerHTML = `
                <span>👤 ${this.state.user.nickname}</span>
                ${this.state.user.isTestMode ? '<span style="background: #f39c12; padding: 2px 8px; border-radius: 5px; margin-left: 10px; font-size: 0.85em;">测试模式</span>' : ''}
                <button onclick="showDebateHistory()" style="margin-left: 15px; padding: 5px 15px; background: rgba(255,255,255,0.2); border: 1px solid white; border-radius: 5px; color: white; cursor: pointer;">
                    📜 历史记录
                </button>
                <button onclick="logout()" style="margin-left: 10px; padding: 5px 15px; background: rgba(255,255,255,0.2); border: 1px solid white; border-radius: 5px; color: white; cursor: pointer;">
                    退出
                </button>
            `;
        } else {
            userStatus.innerHTML = `
                <button onclick="promptLogin()" style="padding: 8px 20px; background: rgba(255,255,255,0.9); border: none; border-radius: 8px; color: #667eea; cursor: pointer; font-weight: bold;">
                    🔑 登录/注册
                </button>
                <span style="margin-left: 10px; font-size: 0.85em;">登录后可保存辩论进度</span>
            `;
        }
    }

    // 渲染角色卡片
    renderRoles() {
        console.log('🔍 [DEBUG] renderRoles() 被调用了');
        const userPhone = localStorage.getItem('userPhone');
        const isTestUser = userPhone === '13917895758';
        console.log(`🔍 [DEBUG] userPhone=${userPhone}, isTestUser=${isTestUser}`);

        // ✅ [V55.5 FIX] 清空之前的选择，避免重复
        this.state.selectedRoles = [];
        console.log('✅ [V55.5] 清空 selectedRoles 数组，重新初始化');

        // ✅ [FIX] 根据用户类型动态更新UI文本
        const rolesLabel = document.getElementById('rolesLabel');
        const rolesHint = document.getElementById('rolesHint');

        if (isTestUser) {
            // 测试用户：显示"最少2个"
            if (rolesLabel) {
                rolesLabel.textContent = '👥 选择风暴辩论角色（测试模式：最少2个）：';
            }
            if (rolesHint) {
                rolesHint.textContent = '💡 测试模式：已默认选中"第一性原则"和"行业专家"2个角色，可自由添加/取消角色（最少保留2个）。字数减半，加速测试。';
            }
            console.log('✅ [FIX] 已更新UI文本为测试模式（最少2个，可自由增减）');
        } else {
            // 普通用户：显示"最少8个"
            if (rolesLabel) {
                rolesLabel.textContent = '👥 选择风暴辩论角色（最少8个核心角色）：';
            }
            if (rolesHint) {
                rolesHint.textContent = '💡 提示：已默认选中8个核心必选角色（第一性原则/行业专家/上帝视角/时间穿越/杠精专家/买单客户/竞争友商/落地执行者），可自由添加其他角色参与风暴辩论。';
            }
        }

        if (typeof DEBATE_ROLES === 'undefined') {
            console.error('角色配置未加载');
            return;
        }

        const grid = document.getElementById('rolesGrid');
        const groupNames = {
            'core': '核心分析层',
            'external': '外部威胁与机遇层',
            'value': '价值与行动层',
            'system': '系统'
        };

        grid.innerHTML = DEBATE_ROLES.map(role => {
            const requiredClass = role.required ? 'required' : '';
            const groupClass = `group-${role.group}`;
            const badges = [];

            if (role.required) {
                badges.push('<span class="role-badge required">必选</span>');
            }
            badges.push(`<span class="role-badge ${groupClass}">${groupNames[role.group]}</span>`);

            return `
                <div class="role-card ${groupClass} ${requiredClass}" data-role-id="${role.id}" title="${role.intro || role.description}">
                    <div class="role-icon">${role.icon}</div>
                    <div class="role-name">${role.shortName || role.name}</div>
                    ${role.nickname ? `<div class="role-nickname" style="font-size: 0.75em; color: #999; margin-top: 2px; margin-bottom: 6px;">${role.nickname}</div>` : ''}
                    <div class="role-intro">${role.intro || role.description}</div>
                    <div class="role-badges">${badges.join('')}</div>
                </div>
            `;
        }).join('');

        // 默认选中必选角色并更新状态 - 使用已声明的 userPhone 和 isTestUser
        if (isTestUser) {
            // ✅ [D-76 FIX] 测试用户：默认选中8个必选角色中的前2个（第一性原则ID1 + 行业专家ID2）
            console.log('✅ [D-76] 测试用户检测到，默认选择第一性原则(ID1) + 行业专家(ID2)');
            [1, 2].forEach(roleId => {
                if (!this.state.selectedRoles.includes(roleId)) {
                    this.state.selectedRoles.push(roleId);
                }
                const card = document.querySelector(`[data-role-id="${roleId}"]`);
                if (card) card.classList.add('selected');
            });
        } else {
            // ✅ [D-76 FIX] 普通用户：默认选中所有8个必选角色（ID: 1,2,3,4,5,6,8,15）
            console.log('✅ [D-76] 普通用户，默认选择8个必选角色');
            const requiredRoleIds = [1, 2, 3, 4, 5, 6, 8, 15]; // ✅ 明确的8个必选ID
            requiredRoleIds.forEach(roleId => {
                if (!this.state.selectedRoles.includes(roleId)) {
                    this.state.selectedRoles.push(roleId);
                }
                const card = document.querySelector(`[data-role-id="${roleId}"]`);
                if (card) card.classList.add('selected');
            });
        }

        // ✅ [FIX P0-12] 移除自动补足逻辑
        // 原因：用户应该有权选择少于8个角色（尤其是测试用户）
        // 改为在 startDebate() 时进行最小值检查，允许用户自由选择
        // const MIN_ROLES = isTestUser ? 2 : 8;
        // if (this.state.selectedRoles.length < MIN_ROLES) {
        //     ... 自动补足代码已删除 ...
        // }

        this.updateRoleCount();
    }

    // 设置事件监听器
    setupEventListeners() {
        // ✅ [D-66 测试优化] 检测是否为测试用户
        const userPhone = localStorage.getItem('userPhone');
        const isTestUser = userPhone === '13917895758';
        const testUserRequiredRoles = [1, 2];  // 第一性原则 + 行业专家

        // 角色选择
        document.getElementById('rolesGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.role-card');
            if (!card) return;

            const roleId = parseInt(card.dataset.roleId);
            const role = DEBATE_ROLES.find(r => r.id === roleId);

            if (!role) return;

            const index = this.state.selectedRoles.indexOf(roleId);

            if (index > -1) {
                // 取消选择
                // ✅ [D-66] 测试用户不能取消"第一性原则"和"行业专家"
                if (isTestUser && testUserRequiredRoles.includes(roleId)) {
                    alert('测试模式下，"第一性原则"和"行业专家"不能取消选择');
                    return;
                }

                // ✅ [D-66 FIX] 测试用户：除了必选的2个角色，其他都可以取消
                if (isTestUser) {
                    this.state.selectedRoles.splice(index, 1);
                    card.classList.remove('selected');
                } else {
                    // 普通用户：必选角色不能取消
                    if (!role.required) {
                        this.state.selectedRoles.splice(index, 1);
                        card.classList.remove('selected');
                    } else {
                        alert('必选角色不能取消选择');
                    }
                }
            } else {
                // 添加选择
                this.state.selectedRoles.push(roleId);
                card.classList.add('selected');
            }

            this.updateRoleCount();
        });

        // 轮次选择
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.round-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.rounds = parseInt(btn.dataset.rounds);
            });
        });

        // 启动辩论
        document.getElementById('startDebateBtn').addEventListener('click', () => window.startDebate());

        // 键盘快捷键监听 (Ctrl+Enter)
        document.addEventListener('keydown', (e) => {
            const delegatePromptEl = document.querySelector('.delegate-prompt');
            if (delegatePromptEl && (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();

                // 优先尝试点击主要确认按钮
                let actionButton = delegatePromptEl.querySelector('button[onclick*="confirmAndStartDebate"], button[onclick*="confirmAndDeliver"], button[onclick*="confirmContinue"]');

                if (actionButton && !actionButton.disabled) {
                    console.log(`✅ [Shortcut] Ctrl+Enter triggered: ${actionButton.innerText.trim()}`);
                    actionButton.click();
                } else if (actionButton && actionButton.disabled) {
                    console.log(`⚠️ [Shortcut] Primary button disabled, ignoring Ctrl+Enter.`);
                } else {
                    const confirmContinueButton = delegatePromptEl.querySelector('button[onclick*="submitDelegateInput"]:not([disabled])');
                    if (confirmContinueButton) {
                        console.log(`✅ [Shortcut] Ctrl+Enter triggered: 确认, 继续`);
                        confirmContinueButton.click();
                    } else {
                        const anyConfirmButton = delegatePromptEl.querySelector('button:not([disabled]):not(.hidden)');
                        if (anyConfirmButton) {
                            console.log(`✅ [Shortcut] Ctrl+Enter triggered: ${anyConfirmButton.innerText.trim()}`);
                            anyConfirmButton.click();
                        } else {
                            console.log('⚠️ [Shortcut] Ctrl+Enter pressed, but no actionable button found in delegate prompt.');
                        }
                    }
                }
            }

            // Check for start button shortcut
            const startBtn = document.getElementById('startDebateBtn');
            if (startBtn && !delegatePromptEl && (e.ctrlKey && e.key === 'Enter') && !startBtn.disabled) {
                console.log(`✅ [Shortcut] Ctrl+Enter triggered: Executing startDebate()`);
                startBtn.click();
            }
        });

        // 提示用户支持快捷键
        const startBtnContainer = document.getElementById('startDebateBtn').parentElement;
        if (startBtnContainer && !startBtnContainer.querySelector('.shortcut-note')) {
            const note = document.createElement('div');
            note.className = 'shortcut-note';
            note.innerHTML = '<span style="font-size: 0.7em; color: rgba(255,255,255,0.7); margin-top: 10px; display: block;">快捷键：Ctrl + Enter 启动/确认</span>';
            startBtnContainer.appendChild(note);
        }

        // ✅ [D-66 FIX] 自动保存用户输入到 localStorage（复用上面已声明的 userPhone）
        if (userPhone) {
            const topicInput = document.getElementById('topicInput');
            const backgroundInput = document.getElementById('backgroundInput');

            // 防抖保存（避免频繁写入）
            let saveTimer = null;
            const autoSave = () => {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    const topic = topicInput.value.trim();
                    const background = backgroundInput.value.trim();
                    if (topic) localStorage.setItem(`duomotai_topic_${userPhone}`, topic);
                    if (background) localStorage.setItem(`duomotai_background_${userPhone}`, background);
                    console.log('✅ [Auto-Save] 已保存用户输入到 localStorage');
                }, 1000); // 1秒后保存
            };

            topicInput.addEventListener('input', autoSave);
            backgroundInput.addEventListener('input', autoSave);
        }
    }

    // 更新角色计数
    updateRoleCount() {
        // ✅ [D-76 FIX] 根据测试用户动态设置最小角色数（测试用户2个，普通用户8个）
        const userPhone = localStorage.getItem('userPhone');
        const isTestUser = userPhone === '13917895758';
        const minRoles = isTestUser ? 2 : 8; // ✅ 动态最小值（不是REQUIRED_FLOW.length=9）

        // ✅ [V55.5 DEBUG] 添加调试日志
        console.log('🔍 [V55.5] updateRoleCount 调试:', {
            selectedRoles: this.state.selectedRoles,
            length: this.state.selectedRoles.length,
            isTestUser,
            minRoles
        });

        const countText = this.state.selectedRoles.length < minRoles
            ? `（最少需要${minRoles}个${isTestUser ? '角色' : '核心角色'}）`
            : this.state.selectedRoles.length === minRoles
                ? '（已满足最低要求）'
                : '✓';

        document.getElementById('roleCount').innerHTML =
            `已选择 <strong>${this.state.selectedRoles.length}</strong> 个角色 ${countText}`;

        document.getElementById('startDebateBtn').disabled = this.state.selectedRoles.length < minRoles;
    }

    // 测试用户自动填充
    fillDefaultContentFor5758() {
        let userPhone = '';

        if (window.UserAuth && window.UserAuth.isLoggedIn()) {
            userPhone = window.UserAuth.currentUser.phone;
        } else {
            const lastUser = localStorage.getItem('last_login_phone');
            if (lastUser) userPhone = lastUser;
        }

        if (userPhone !== '13917895758') {
            return;
        }

        console.log('✅ [Task #118] 检测到测试用户 5758，启用自动填充 + Tab 键快捷填充');

        const topicInput = document.getElementById('topicInput');
        const backgroundInput = document.getElementById('backgroundInput');

        const defaultTopic = `我应该如何从职场转型做自媒体吗?当前45岁，有近30年B2C, B2B 家电及电气零部件行业经验大部分在全球500强外企, 总监/副总裁, 主要在营销方面, 我是systematic 和 strategic thinker, 对商业数据分析，金融期货期权和AI有兴趣(我和我兄弟前两年就AI量化用在期权期货上做过一些尝试), 对内容创作方面不确定, 想利用我的个人优势和兴趣爱好, 推进个人打造自媒体- 前100日跑通达到千粉, 进行IP及变现流程打通(小红书/抖音/视频号/公众号到知乎/知识星球及微信群的流量公域>私域, 结合网站'百问'定位自测和'多魔汰'专家风暴辩论咨询解决系统, 加上课程及群陪跑等变现), 重点是要结合AI, 能够实现变现和最终的被动收入(我的项目是: 百问到百万)..`;

        const defaultBackground = `目标用户 是 40岁以上中年(男性为主?), 面临中年转型(国际关系, 社会及科技格局, 家庭-自身年龄及孩子进入青春期, 高中或大学面临进入社会).. 有升级转型需求.; 我目前时间还算好, 有个苗喜智能洗车项目在和/帮同学一起做, 平均每天3~5个小时吧;   预算方面, 初期半年3000~5000? `;

        if (!topicInput.value.trim()) {
            topicInput.value = defaultTopic;
            topicInput.setAttribute('data-default-value', defaultTopic);
        }

        if (!backgroundInput.value.trim()) {
            backgroundInput.value = defaultBackground;
            backgroundInput.setAttribute('data-default-value', defaultBackground);
        }

        // Tab 键快捷填充
        [topicInput, backgroundInput].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && !e.shiftKey && !input.value.trim()) {
                    const defaultValue = input.getAttribute('data-default-value');
                    if (defaultValue) {
                        e.preventDefault();
                        input.value = defaultValue;
                        console.log(`✅ [Task #118] Tab 键填充：${input.id}`);
                        setTimeout(() => {
                            if (input === topicInput) {
                                backgroundInput.focus();
                            } else {
                                document.getElementById('rolesGrid')?.focus();
                            }
                        }, 50);
                    }
                }
            });
        });
    }

    // 初始化语音系统
    initializeVoiceSystem() {
        if (window.VoiceModule) {
            window.VoiceModule.initVoiceSynthesis();
            window.VoiceModule.updateVoiceOutputButton();
            window.VoiceModule.updateVoiceRateDisplay();
            console.log('✅ [#086] 页面加载完成，语音系统已初始化（voice.js模块）');
        } else {
            console.warn('⚠️ voice.js 模块未加载');
        }

        // ✅ [Night-Auth 2025-10-17] 初始化高级动画系统
        if (window.AnimationIntegration) {
            window.AnimationIntegration.init();
            console.log('✅ [Stage 4] 高级动画系统已初始化');
        } else {
            console.warn('⚠️ AnimationIntegration 模块未加载');
        }
    }
}

// 导出给主文件使用
window.InitManager = InitManager;
