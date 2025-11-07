/**
 * 多语言支持模块 (Internationalization - i18n)
 *
 * 功能: 为多魔汰系统提供多语言支持（中文、英文）
 * 创建时间: 2025-10-17 (Night-Auth FULL ON)
 * 阶段: Stage 5 - Multilingual Support
 *
 * @module i18n
 * @version v1.0
 *
 * 支持的语言:
 * - zh-CN: 简体中文（默认）
 * - en-US: 英语
 */

(function(window) {
    'use strict';

    /**
     * 语言包配置
     */
    const translations = {
        'zh-CN': {
            // 页面标题
            'page.title': '多魔汰风暴辩论系统',
            'page.slogan': '"十六个角色，一个真相" - AI专家级头脑风暴',
            'page.version': 'v3.0',

            // 准备阶段
            'setup.topic.label': '📝 输入你的问题或决策困境：',
            'setup.topic.placeholder': '例如：我应该从职场转型做自媒体吗？当前45岁，有10年行业经验，但对内容创作不确定...',
            'setup.background.label': '📚 背景信息（选填，帮助AI更好理解）：',
            'setup.background.placeholder': '例如：目标用户、当前资源、主要顾虑、时间/预算限制等...',
            'setup.roles.label': '👥 选择风暴辩论角色（必选8个 + 可选角色）：',
            'setup.roles.hint': '💡 提示：金边为必选8角色（已默认选中），可额外选择其他角色参与风暴辩论。',
            'setup.roles.count': '已选择 {count} 个角色',
            'setup.rounds.label': '🔄 风暴辩论轮次：',
            'setup.rounds.fast': '3轮（快速）',
            'setup.rounds.balanced': '5轮（平衡）',
            'setup.rounds.deep': '8轮（深入）',
            'setup.rounds.full': '10轮（全面）',
            'setup.start.button': '🚀 启动多魔汰风暴辩论',

            // 导航
            'nav.home': '← 返回首页',
            'nav.baiwen': '百问自测',
            'nav.projects': '项目展示',

            // 用户状态
            'user.login': '🔑 登录/注册',
            'user.logout': '退出',
            'user.history': '📜 历史记录',
            'user.loginHint': '登录后可保存辩论进度',

            // 语音控制
            'voice.toggle': '语音开关',
            'voice.test': '🧪 测试语音',
            'voice.speed': '语音速度调节',
            'text.speed': '文字速度调节',

            // 阶段指示器
            'phase.preparation': '准备',
            'phase.planning': '策划',
            'phase.confirmation': '确认',
            'phase.debate': '辩论',
            'phase.delivery': '交付',

            // 辩论过程
            'debate.round': '🎯 第 {round} 轮风暴辩论',
            'debate.loading': '🧠 领袖(委托代理)正在分析问题，制定风暴辩论策略...',
            'debate.loadingHint': '这可能需要 1-2 分钟，请稍候',

            // 委托人提示
            'delegate.planningMessage': '领袖(委托代理)已制定策略，请查看：',
            'delegate.submitButton': '📝 提交补充并重新规划',
            'delegate.confirmButton': '✅ 确认，开始风暴辩论',
            'delegate.pauseButton': '⏸️ 打断/暂停',
            'delegate.continueButton': '✅ 确认, 继续',
            'delegate.completeButton': '✅ 确认完成',
            'delegate.inputPlaceholder': '如有补充意见，请输入...（可选）',
            'delegate.shortcutHint': '快捷键：Ctrl + Enter',

            // 报告
            'report.title': '📄 风暴辩论总结报告',
            'report.summary': '总结',
            'report.keyInsights': '💡 核心洞察',
            'report.actionPlan': '🎯 行动计划',
            'report.iterationSuggestions': '🔄 迭代建议',
            'report.exportPDF': '📄 导出 PDF 报告',
            'report.exportJSON': '💾 导出 JSON 数据',
            'report.finishButton': '✅ 表示感谢，结束风暴',
            'report.restartButton': '🔄 再来一轮',
            'report.followUpButton': '🎯 后续跟进落实深入',

            // 错误提示
            'error.topicTooShort': '请输入至少5个字的问题！',
            'error.rolesNotEnough': '请至少选择{minRoles}个风暴辩论角色（必选角色）！',
            'error.systemError': '系统错误：{message}',

            // 成功提示
            'success.debateCompleted': '🎉 风暴辩论已完成',
            'success.thankYou': '感谢您使用多魔汰风暴辩论系统！',

            // Token统计
            'token.title': '📊 Token 消耗统计',
            'token.total': '总消耗',
            'token.currentRound': '当前轮次',
            'token.avgPerRound': '平均/轮'
        },

        'en-US': {
            // Page Title
            'page.title': 'Duomotai Debate System',
            'page.slogan': '"Sixteen Perspectives, One Truth" - AI Expert Brainstorming',
            'page.version': 'v3.0',

            // Setup Phase
            'setup.topic.label': '📝 Enter your question or decision dilemma:',
            'setup.topic.placeholder': 'e.g., Should I transition from corporate to content creation? Currently 45, 10 years of experience, uncertain about content...',
            'setup.background.label': '📚 Background Information (optional, helps AI understand better):',
            'setup.background.placeholder': 'e.g., Target audience, current resources, main concerns, time/budget constraints...',
            'setup.roles.label': '👥 Select Debate Roles (8 required + optional):',
            'setup.roles.hint': '💡 Tip: Gold-bordered roles are required (pre-selected), you can choose additional experts.',
            'setup.roles.count': '{count} roles selected',
            'setup.rounds.label': '🔄 Debate Rounds:',
            'setup.rounds.fast': '3 Rounds (Quick)',
            'setup.rounds.balanced': '5 Rounds (Balanced)',
            'setup.rounds.deep': '8 Rounds (Deep)',
            'setup.rounds.full': '10 Rounds (Comprehensive)',
            'setup.start.button': '🚀 Start Duomotai Debate',

            // Navigation
            'nav.home': '← Back to Home',
            'nav.baiwen': 'Baiwen Assessment',
            'nav.projects': 'Projects',

            // User Status
            'user.login': '🔑 Login/Register',
            'user.logout': 'Logout',
            'user.history': '📜 History',
            'user.loginHint': 'Login to save debate progress',

            // Voice Control
            'voice.toggle': 'Voice Toggle',
            'voice.test': '🧪 Test Voice',
            'voice.speed': 'Voice Speed Control',
            'text.speed': 'Text Speed Control',

            // Phase Indicator
            'phase.preparation': 'Preparation',
            'phase.planning': 'Planning',
            'phase.confirmation': 'Confirmation',
            'phase.debate': 'Debate',
            'phase.delivery': 'Delivery',

            // Debate Process
            'debate.round': '🎯 Debate Round {round}',
            'debate.loading': '🧠 Leader is analyzing the problem, formulating debate strategy...',
            'debate.loadingHint': 'This may take 1-2 minutes, please wait',

            // Delegate Prompts
            'delegate.planningMessage': 'Leader has formulated strategy, please review:',
            'delegate.submitButton': '📝 Submit Feedback & Re-plan',
            'delegate.confirmButton': '✅ Confirm, Start Debate',
            'delegate.pauseButton': '⏸️ Interrupt/Pause',
            'delegate.continueButton': '✅ Confirm, Continue',
            'delegate.completeButton': '✅ Confirm Complete',
            'delegate.inputPlaceholder': 'Enter additional comments (optional)...',
            'delegate.shortcutHint': 'Shortcut: Ctrl + Enter',

            // Report
            'report.title': '📄 Debate Summary Report',
            'report.summary': 'Summary',
            'report.keyInsights': '💡 Key Insights',
            'report.actionPlan': '🎯 Action Plan',
            'report.iterationSuggestions': '🔄 Iteration Suggestions',
            'report.exportPDF': '📄 Export PDF Report',
            'report.exportJSON': '💾 Export JSON Data',
            'report.finishButton': '✅ Thank & Finish',
            'report.restartButton': '🔄 Start Again',
            'report.followUpButton': '🎯 Follow-up Actions',

            // Error Messages
            'error.topicTooShort': 'Please enter at least 5 characters!',
            'error.rolesNotEnough': 'Please select at least {minRoles} debate roles (required roles)!',
            'error.systemError': 'System Error: {message}',

            // Success Messages
            'success.debateCompleted': '🎉 Debate Completed',
            'success.thankYou': 'Thank you for using Duomotai Debate System!',

            // Token Statistics
            'token.title': '📊 Token Usage Statistics',
            'token.total': 'Total',
            'token.currentRound': 'Current Round',
            'token.avgPerRound': 'Avg/Round'
        }
    };

    /**
     * i18n 管理器类
     */
    class I18nManager {
        constructor() {
            this.currentLanguage = 'zh-CN'; // 默认中文
            this.storageKey = 'duomotai_language';

            // 从 localStorage 读取用户语言偏好
            const savedLanguage = localStorage.getItem(this.storageKey);
            if (savedLanguage && translations[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }

            console.log(`✅ [i18n] 多语言支持初始化完成，当前语言: ${this.currentLanguage}`);
        }

        /**
         * 切换语言
         * @param {string} language - 语言代码（'zh-CN' 或 'en-US'）
         */
        setLanguage(language) {
            if (!translations[language]) {
                console.error(`❌ [i18n] 不支持的语言: ${language}`);
                return;
            }

            this.currentLanguage = language;
            localStorage.setItem(this.storageKey, language);

            console.log(`✅ [i18n] 语言已切换至: ${language}`);

            // 触发语言切换事件
            window.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
        }

        /**
         * 获取当前语言
         * @returns {string} 语言代码
         */
        getLanguage() {
            return this.currentLanguage;
        }

        /**
         * 获取翻译文本
         * @param {string} key - 翻译键
         * @param {object} params - 参数（用于占位符替换）
         * @returns {string} 翻译后的文本
         */
        t(key, params = {}) {
            const languagePack = translations[this.currentLanguage];

            if (!languagePack) {
                console.error(`❌ [i18n] 语言包不存在: ${this.currentLanguage}`);
                return key;
            }

            let text = languagePack[key];

            if (!text) {
                console.warn(`⚠️ [i18n] 翻译键不存在: ${key}`);
                return key;
            }

            // 替换占位符 {key} 为实际值
            Object.keys(params).forEach(paramKey => {
                text = text.replace(`{${paramKey}}`, params[paramKey]);
            });

            return text;
        }

        /**
         * 自动翻译页面中的 data-i18n 元素
         */
        translatePage() {
            const elements = document.querySelectorAll('[data-i18n]');

            elements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                const params = element.getAttribute('data-i18n-params');

                let translatedText = this.t(key);

                if (params) {
                    try {
                        const paramsObj = JSON.parse(params);
                        translatedText = this.t(key, paramsObj);
                    } catch (error) {
                        console.error('❌ [i18n] 参数解析失败:', error);
                    }
                }

                // 更新元素内容
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translatedText;
                } else {
                    element.textContent = translatedText;
                }
            });

            console.log(`✅ [i18n] 页面翻译完成: ${elements.length} 个元素`);
        }

        /**
         * 获取所有支持的语言列表
         * @returns {array} 语言列表
         */
        getSupportedLanguages() {
            return Object.keys(translations).map(code => ({
                code: code,
                name: code === 'zh-CN' ? '简体中文' : 'English'
            }));
        }
    }

    // 全局实例化并挂载到window
    window.I18n = new I18nManager();

    // 全局便捷函数
    window.t = function(key, params = {}) {
        return window.I18n.t(key, params);
    };

    console.log('✅ [i18n] 多语言支持模块已加载，全局对象: window.I18n, 便捷函数: window.t()');

})(window);

/**
 * 使用说明:
 *
 * 1. 在 HTML 中使用 data-i18n 属性:
 *    <h1 data-i18n="page.title"></h1>
 *    <label data-i18n="setup.topic.label"></label>
 *    <input data-i18n="setup.topic.placeholder" type="text">
 *
 * 2. 在 JavaScript 中使用:
 *    const title = window.t('page.title');
 *    const message = window.t('error.rolesNotEnough', { minRoles: 8 });
 *
 * 3. 切换语言:
 *    window.I18n.setLanguage('en-US');
 *    window.I18n.translatePage(); // 自动翻译页面
 *
 * 4. 监听语言切换事件:
 *    window.addEventListener('languageChange', (event) => {
 *        console.log('语言已切换至:', event.detail.language);
 *        window.I18n.translatePage();
 *    });
 */
