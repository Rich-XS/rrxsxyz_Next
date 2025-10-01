// 用户认证前端服务
window.UserAuth = {
    API_BASE: window.location.hostname === 'localhost' ? 'http://localhost:3000' : '',

    // 当前用户信息
    currentUser: null,
    token: null,

    // 初始化：从localStorage恢复登录状态
    init() {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user_info');

        if (savedToken && savedUser) {
            this.token = savedToken;
            this.currentUser = JSON.parse(savedUser);
            console.log('[UserAuth] 已恢复登录状态:', this.currentUser.nickname);
        }
    },

    // 发送验证码
    async sendVerificationCode(phone) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '发送验证码失败');
            }

            return result.data;

        } catch (error) {
            console.error('[UserAuth] 发送验证码失败:', error);
            throw error;
        }
    },

    // 验证码登录
    async login(phone, code) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '登录失败');
            }

            // 保存登录信息
            this.token = result.data.token;
            this.currentUser = result.data.user;

            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_info', JSON.stringify(this.currentUser));

            console.log('[UserAuth] 登录成功:', this.currentUser.nickname);

            return result.data;

        } catch (error) {
            console.error('[UserAuth] 登录失败:', error);
            throw error;
        }
    },

    // 密码登录（v5新增）
    async loginWithPassword(phone, password) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/login-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '登录失败');
            }

            // 保存登录信息
            this.token = result.data.token;
            this.currentUser = result.data.user;

            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_info', JSON.stringify(this.currentUser));

            console.log('[UserAuth] 密码登录成功:', this.currentUser.nickname);

            return result.data;

        } catch (error) {
            console.error('[UserAuth] 密码登录失败:', error);
            throw error;
        }
    },

    // 退出登录
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        console.log('[UserAuth] 已退出登录');
    },

    // 检查是否已登录
    isLoggedIn() {
        return !!this.token && !!this.currentUser;
    },

    // 获取当前用户信息
    async getCurrentUser() {
        if (!this.token) {
            throw new Error('未登录');
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '获取用户信息失败');
            }

            this.currentUser = result.data;
            localStorage.setItem('user_info', JSON.stringify(this.currentUser));

            return result.data;

        } catch (error) {
            console.error('[UserAuth] 获取用户信息失败:', error);
            // Token可能过期，清除登录状态
            this.logout();
            throw error;
        }
    },

    // 获取辩论历史
    async getDebateHistory() {
        if (!this.token) {
            throw new Error('未登录');
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/debate-history`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '获取辩论历史失败');
            }

            return result.data;

        } catch (error) {
            console.error('[UserAuth] 获取辩论历史失败:', error);
            throw error;
        }
    },

    // 显示登录弹窗
    showLoginModal(options = {}) {
        const {
            title = '请先登录',
            message = '登录后可保存辩论进度和历史记录',
            onSuccess = () => {}
        } = options;

        const modal = this.createLoginModal(title, message, onSuccess);
        document.body.appendChild(modal);

        // 自动聚焦手机号输入框
        setTimeout(() => {
            modal.querySelector('#loginPhone').focus();
        }, 100);
    },

    // 创建登录弹窗DOM
    createLoginModal(title, message, onSuccess) {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s;
            ">
                <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 1.5em;">
                    ${title}
                </h2>
                <p style="margin: 0 0 30px 0; color: #666;">
                    ${message}
                </p>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">
                        手机号
                    </label>
                    <input
                        type="tel"
                        id="loginPhone"
                        placeholder="请输入手机号"
                        maxlength="11"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 10px;
                            font-size: 1em;
                            box-sizing: border-box;
                        "
                    />
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">
                        验证码
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <input
                            type="text"
                            id="loginCode"
                            placeholder="请输入6位验证码"
                            maxlength="6"
                            style="
                                flex: 1;
                                padding: 12px;
                                border: 2px solid #e0e0e0;
                                border-radius: 10px;
                                font-size: 1em;
                            "
                        />
                        <button
                            id="sendCodeBtn"
                            style="
                                padding: 12px 20px;
                                background: linear-gradient(45deg, #667eea, #764ba2);
                                color: white;
                                border: none;
                                border-radius: 10px;
                                cursor: pointer;
                                font-size: 0.9em;
                                white-space: nowrap;
                            "
                        >
                            发送验证码
                        </button>
                    </div>
                </div>

                <div id="loginMessage" style="
                    display: none;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 0.9em;
                "></div>

                <div style="display: flex; gap: 15px;">
                    <button
                        id="loginBtn"
                        style="
                            flex: 1;
                            padding: 15px;
                            background: linear-gradient(45deg, #667eea, #764ba2);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 1.1em;
                            font-weight: bold;
                        "
                    >
                        登录
                    </button>
                    <button
                        id="cancelLoginBtn"
                        style="
                            flex: 1;
                            padding: 15px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 1.1em;
                        "
                    >
                        取消
                    </button>
                </div>
            </div>

            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        // 事件监听
        this.attachLoginModalEvents(modal, onSuccess);

        return modal;
    },

    // 附加登录弹窗事件
    attachLoginModalEvents(modal, onSuccess) {
        const phoneInput = modal.querySelector('#loginPhone');
        const codeInput = modal.querySelector('#loginCode');
        const sendCodeBtn = modal.querySelector('#sendCodeBtn');
        const loginBtn = modal.querySelector('#loginBtn');
        const cancelBtn = modal.querySelector('#cancelLoginBtn');
        const message = modal.querySelector('#loginMessage');

        let countdown = 0;
        let countdownTimer = null;

        // 显示消息
        const showMessage = (text, type = 'info') => {
            message.textContent = text;
            message.style.display = 'block';
            message.style.background = type === 'error' ? '#f8d7da' : (type === 'success' ? '#d4edda' : '#d1ecf1');
            message.style.color = type === 'error' ? '#721c24' : (type === 'success' ? '#155724' : '#0c5460');
        };

        // 发送验证码
        sendCodeBtn.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                showMessage('请输入正确的手机号', 'error');
                return;
            }

            if (countdown > 0) return;

            sendCodeBtn.disabled = true;
            showMessage('正在发送验证码...', 'info');

            try {
                const result = await this.sendVerificationCode(phone);
                showMessage(result.message || '验证码已发送', 'success');

                // 开始倒计时
                countdown = 60;
                countdownTimer = setInterval(() => {
                    countdown--;
                    sendCodeBtn.textContent = `${countdown}秒后重发`;
                    if (countdown === 0) {
                        clearInterval(countdownTimer);
                        sendCodeBtn.textContent = '发送验证码';
                        sendCodeBtn.disabled = false;
                    }
                }, 1000);

            } catch (error) {
                showMessage(error.message || '发送验证码失败', 'error');
                sendCodeBtn.disabled = false;
            }
        });

        // 登录
        loginBtn.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();
            const code = codeInput.value.trim();

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                showMessage('请输入正确的手机号', 'error');
                return;
            }

            if (!/^\d{6}$/.test(code)) {
                showMessage('请输入6位验证码', 'error');
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
            showMessage('正在登录...', 'info');

            try {
                const result = await this.login(phone, code);
                showMessage('登录成功！', 'success');

                setTimeout(() => {
                    modal.remove();
                    onSuccess(result.user);
                }, 1000);

            } catch (error) {
                showMessage(error.message || '登录失败', 'error');
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        });

        // 取消
        cancelBtn.addEventListener('click', () => {
            if (countdownTimer) clearInterval(countdownTimer);
            modal.remove();
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (countdownTimer) clearInterval(countdownTimer);
                modal.remove();
            }
        });

        // Enter键登录
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    window.UserAuth.init();
});