// 多魔汰系统 - 辩论UI模块 (从index.html抽取)
// 抽取自 duomotai/index.html 辩论相关UI功能 (约800-1000行)

// ========== 辩论UI管理器 ==========
class DebateUIManager {
    constructor() {
        this.currentPhase = 'idle';
        this.messageQueue = [];
        this.isProcessing = false;
        this.animationSpeed = 300;
    }

    // 初始化辩论UI
    initDebateUI() {
        this.setupEventListeners();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 委托人输入事件
        document.addEventListener('delegatePrompt', this.handleDelegatePrompt.bind(this));

        // 角色发言事件
        document.addEventListener('roleSpeak', this.handleRoleSpeak.bind(this));

        // 辩论状态变更
        document.addEventListener('debateStateChange', this.handleStateChange.bind(this));
    }

    // 处理委托人提示
    handleDelegatePrompt(event) {
        const { type, message, options } = event.detail;
        this.showDelegateModal(type, message, options);
    }

    // 显示委托人模态框
    showDelegateModal(type, message, options) {
        const modal = document.createElement('div');
        modal.className = 'delegate-prompt-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <h3>${this.getModalTitle(type)}</h3>
                <p>${message}</p>
                ${type === 'input' ? '<textarea id="delegateInput"></textarea>' : ''}
                <div class="modal-buttons">
                    ${this.renderModalButtons(type, options)}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 动画显示
        requestAnimationFrame(() => {
            modal.classList.add('modal-show');
        });
    }

    // 获取模态框标题
    getModalTitle(type) {
        const titles = {
            'planning_confirmation': '策划确认',
            'round_opening': '轮次开场',
            'transition': '中场转场',
            'before_transition': '中场补充',  // ✅ [V57-P0-1] 新增
            'before_summary': '总结前确认',
            'thanks': '辩论完成'
        };
        return titles[type] || '委托人决策';
    }

    // 渲染模态框按钮
    renderModalButtons(type, options) {
        if (type === 'thanks') {
            return `
                <button class="btn-secondary" onclick="DebateUI.showThanks()">
                    表示感谢，结束风暴
                </button>
                <button class="btn-primary" onclick="location.reload()">
                    再来一轮
                </button>
                <button class="btn-tertiary" onclick="DebateUI.showCTA()">
                    后续跟进落实深入
                </button>
            `;
        }

        // 标准三按钮布局
        return `
            <button class="btn-pause" onclick="DebateUI.pauseDebate()">
                ⏸️ 打断/暂停
            </button>
            <button class="btn-submit" onclick="DebateUI.submitComment()">
                📝 提交补充
            </button>
            <button class="btn-confirm" onclick="DebateUI.confirmContinue()">
                ✅ ${this.getConfirmButtonText(type)}
            </button>
        `;
    }

    // 获取确认按钮文本
    getConfirmButtonText(type) {
        const texts = {
            'planning_confirmation': '确认，开始风暴辩论',
            'round_opening': '确认，继续',
            'transition': '确认，进入下半场',
            'before_transition': '确认，启下讨论',  // ✅ [V57-P0-1] 新增
            'before_summary': '确认，生成总结',
            'default': '确认，继续'
        };
        return texts[type] || texts['default'];
    }

    // 处理角色发言
    handleRoleSpeak(event) {
        const { role, content, isComplete, isStreaming, round } = event.detail;

        // 创建或更新发言卡片
        let card = document.querySelector(`#speech-${role}-${round}`);
        if (!card) {
            card = this.createSpeechCard(role, round);
        }

        const contentDiv = card.querySelector('.speech-content');

        // ✅ V55.4: 使用 textContent 流式追加（避免 innerHTML DOM 重构）
        if (isStreaming) {
            // 初始化流式显示
            if (!contentDiv.dataset.streamStarted) {
                contentDiv.textContent = '';  // 清空初始内容
                contentDiv.dataset.streamStarted = 'true';
                contentDiv.dataset.lastLength = '0';
            }

            // 计算并追加增量内容
            const lastLength = parseInt(contentDiv.dataset.lastLength || '0');
            const newContent = content.substring(lastLength);

            if (newContent) {
                // 纯文本追加，避免 DOM 重构
                contentDiv.textContent += newContent;
                contentDiv.dataset.lastLength = content.length;

                // 平滑滚动到最新内容
                card.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }

        // 完成时的动画和格式化
        if (isComplete) {
            card.classList.add('speech-complete');
            this.triggerVoiceOutput(content, role);

            // ✅ V55.4: 完成后可选择性进行格式化（如需要）
            // 注意：如果需要 Markdown 格式，可以在这里一次性处理
            // this.applyFinalFormatting(contentDiv, content, role);
        }
    }

    // 创建发言卡片
    createSpeechCard(role, round) {
        const card = document.createElement('div');
        card.id = `speech-${role}-${round}`;
        card.className = 'speech-card';
        card.innerHTML = `
            <div class="speech-header">
                <span class="role-avatar">${this.getRoleEmoji(role)}</span>
                <span class="role-name">${this.getRoleName(role)}</span>
                <span class="round-badge">第${round}轮</span>
            </div>
            <div class="speech-content"></div>
            <div class="speech-footer">
                <span class="speech-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;

        const container = document.querySelector('#debate-container');
        container.appendChild(card);

        // 滚动到视图
        card.scrollIntoView({ behavior: 'smooth', block: 'end' });

        return card;
    }

    // 格式化发言内容
    formatSpeechContent(content, role) {
        let formatted = content;

        // Markdown 转 HTML
        formatted = this.markdownToHTML(formatted);

        // 关键词高亮
        formatted = this.highlightKeywords(formatted);

        // 话题突显
        formatted = this.highlightRoundTopic(formatted);

        return formatted;
    }

    // Markdown转HTML
    markdownToHTML(text) {
        if (!text) return '';

        let lines = text.split('\n');
        let html = [];
        let inList = false;

        for (let line of lines) {
            // 粗体
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');

            // 标题
            if (line.startsWith('### ')) {
                html.push(`<h3>${line.substring(4)}</h3>`);
            } else if (line.startsWith('#### ')) {
                html.push(`<h4>${line.substring(5)}</h4>`);
            } else if (line.startsWith('##### ')) {
                html.push(`<h5>${line.substring(6)}</h5>`);
            }
            // 列表
            else if (line.match(/^[-*] /)) {
                if (!inList) {
                    html.push('<ul>');
                    inList = true;
                }
                html.push(`<li>${line.substring(2)}</li>`);
            }
            // 普通段落
            else if (line.trim()) {
                if (inList) {
                    html.push('</ul>');
                    inList = false;
                }
                html.push(`<p>${line}</p>`);
            }
        }

        if (inList) html.push('</ul>');

        return html.join('\n');
    }

    // 关键词高亮
    highlightKeywords(text) {
        const keywords = [
            '建议', '问题', '风险', '机会', '数据', '案例', '经验', '教训',
            '优势', '劣势', '挑战', '解决方案', '关键', '重要', '核心', '必须',
            '可以考虑', '需要注意', '值得关注', '补充说明', '具体来说',
            '第一', '第二', '第三', '首先', '其次', '最后', '总之', '因此',
            '但是', '然而', '不过', '另外'
        ];

        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'g');
            text = text.replace(regex, '<strong class="keyword">$1</strong>');
        });

        return text;
    }

    // 话题突显
    highlightRoundTopic(text) {
        const currentTopic = this.getCurrentRoundTopic();
        if (!currentTopic) return text;

        // 提取话题关键短语
        const phrases = currentTopic.split(/[：、/]/).filter(p => p.length > 2);
        phrases.forEach(phrase => {
            const regex = new RegExp(`(${phrase})`, 'g');
            text = text.replace(regex, '<strong class="topic-highlight">$1</strong>');
        });

        return text;
    }

    // 获取当前轮次话题
    getCurrentRoundTopic() {
        // 从辩论引擎获取当前话题
        return window.debateEngine?.getCurrentTopic() || '';
    }

    // 获取角色Emoji
    getRoleEmoji(roleId) {
        const emojis = {
            'leader': '👔',
            'innovator': '💡',
            'optimizer': '⚡',
            'guardian': '🛡️',
            'explorer': '🔍',
            'harmonizer': '🤝',
            'expert': '🎯',
            'challenger': '❓'
        };
        return emojis[roleId] || '👤';
    }

    // 获取角色名称
    getRoleName(roleId) {
        const names = {
            'leader': '领袖',
            'innovator': '创新者',
            'optimizer': '优化师',
            'guardian': '守护者',
            'explorer': '探索者',
            'harmonizer': '协调者',
            'expert': '专家',
            'challenger': '挑战者'
        };
        return names[roleId] || roleId;
    }

    // 触发语音输出
    triggerVoiceOutput(text, role) {
        if (window.VoiceModule && window.voiceEnabled) {
            window.VoiceModule.speakText(text, role);
        }
    }

    // 暂停辩论
    pauseDebate() {
        window.debateEngine?.pause();
        this.showNotification('辩论已暂停', 'info');
    }

    // 提交评论
    submitComment() {
        const input = document.querySelector('#delegateInput');
        if (input && input.value) {
            window.debateEngine?.submitDelegateComment(input.value);
            this.closeModal();
        }
    }

    // 确认继续
    confirmContinue() {
        window.debateEngine?.confirmAndContinue();
        this.closeModal();
    }

    // 显示感谢
    showThanks() {
        this.showNotification('感谢您的参与！', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    // 显示CTA
    showCTA() {
        const ctaHtml = `
            <div class="cta-section">
                <h3>🎯 后续服务</h3>
                <ul>
                    <li><strong>深度报告</strong>：获取更详细的战略分析报告</li>
                    <li><strong>小白教程</strong>：一步步实施指导</li>
                    <li><strong>跟踪服务</strong>：持续优化和调整建议</li>
                </ul>
                <p class="contact-info">
                    扫描下方二维码或点击按钮，获取更多服务详情
                </p>
            </div>
        `;
        this.showModal('后续服务', ctaHtml);
    }

    // 关闭模态框
    closeModal() {
        const modal = document.querySelector('.delegate-prompt-modal');
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 初始化工具提示
    initializeTooltips() {
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) + 'px';
                tooltip.style.top = rect.top - 35 + 'px';
            });

            el.addEventListener('mouseleave', () => {
                document.querySelectorAll('.tooltip').forEach(t => t.remove());
            });
        });
    }

    // 设置键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter 确认
            if (e.ctrlKey && e.key === 'Enter') {
                const confirmBtn = document.querySelector('.btn-confirm:not([disabled])');
                if (confirmBtn) confirmBtn.click();
            }

            // ESC 关闭模态框
            if (e.key === 'Escape') {
                this.closeModal();
            }

            // Ctrl+P 暂停
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.pauseDebate();
            }
        });
    }

    // 处理状态变更
    handleStateChange(event) {
        const { state, progress } = event.detail;
        this.currentPhase = state;

        // 更新进度条
        this.updateProgressBar(progress);

        // 更新UI状态
        this.updateUIState(state);
    }

    // 更新进度条
    updateProgressBar(progress) {
        const bar = document.querySelector('.progress-bar');
        if (bar) {
            bar.style.width = `${progress}%`;
            bar.setAttribute('aria-valuenow', progress);
        }
    }

    // 更新UI状态
    updateUIState(state) {
        document.body.setAttribute('data-debate-state', state);

        // 根据状态显示/隐藏元素
        const stateElements = {
            'planning': ['.planning-section'],
            'debating': ['.debate-section', '.speech-container'],
            'summarizing': ['.summary-section'],
            'complete': ['.complete-section', '.cta-section']
        };

        // 隐藏所有
        Object.values(stateElements).flat().forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = 'none';
            });
        });

        // 显示当前状态相关元素
        if (stateElements[state]) {
            stateElements[state].forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    el.style.display = 'block';
                });
            });
        }
    }

    // 显示模态框（通用）
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="DebateUI.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="${btn.class}" onclick="${btn.onclick}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => modal.classList.add('modal-visible'), 10);
    }

    // 格式化时间
    formatTime(date) {
        return new Date(date).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 自动滚动到底部
    autoScrollToBottom() {
        const container = document.querySelector('#debate-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

// 导出给主文件使用
window.DebateUI = new DebateUIManager();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.DebateUI.initDebateUI();
});