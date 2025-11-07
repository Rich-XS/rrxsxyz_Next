/**
 * 多魔汰辩论报告邮件服务 (Test-Driven Implementation)
 *
 * 功能: 将辩论总结报告发送到用户邮箱
 * 创建时间: 2025-10-18 (Test-Compatible Rewrite)
 * 测试覆盖: test_reports/unit_tests/M4.2_duomotaiEmailService.test.js
 *
 * @module duomotaiEmailService
 * @version v2.0 (Test-Compatible)
 */

const nodemailer = require('nodemailer');

class DuomotaiEmailService {
    constructor(options = {}) {
        // P0: 验证必需的环境变量
        if (!process.env.EMAIL_PASS) {
            throw new Error('EMAIL_PASS environment variable is required');
        }

        // 初始化速率限制
        this.rateLimit = options.rateLimit || {
            maxEmails: 5,
            perMinutes: 1
        };
        this.emailHistory = [];

        // 创建邮件传输器
        this.transporter = nodemailer.createTransport({
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * 发送辩论报告邮件
     * @param {string} email - 收件人邮箱
     * @param {object} debateData - 辩论数据
     * @param {string} debateData.topic - 辩论主题
     * @param {string} [debateData.background] - 背景信息
     * @param {Array} debateData.rounds - 辩论轮次数组
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendDebateReport(email, debateData) {
        // 1. 邮箱验证
        const emailValidation = this._validateEmail(email);
        if (!emailValidation.valid) {
            return {
                success: false,
                error: emailValidation.error
            };
        }

        // 2. 数据验证
        const dataValidation = this._validateDebateData(debateData);
        if (!dataValidation.valid) {
            return {
                success: false,
                error: dataValidation.error
            };
        }

        // 3. 速率限制检查
        const rateLimitCheck = this._checkRateLimit();
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                error: rateLimitCheck.error
            };
        }

        // 4. 生成邮件内容
        const htmlContent = this._generateHTML(debateData);
        const subject = `[多魔汰报告] ${debateData.topic}`;

        // 5. 发送邮件（带超时控制）
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent
        };

        try {
            const result = await this._sendWithTimeout(mailOptions, 30000);

            // 记录发送历史（用于速率限制）
            this.emailHistory.push(Date.now());

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                error: this._formatError(error)
            };
        }
    }

    /**
     * 邮箱格式验证
     */
    _validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Invalid email: missing or not a string' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Invalid email: format incorrect' };
        }

        return { valid: true };
    }

    /**
     * 辩论数据验证
     */
    _validateDebateData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid debate data: missing or not an object' };
        }

        if (!data.topic || data.topic.trim() === '') {
            return { valid: false, error: 'Invalid debate data: topic is required' };
        }

        if (!Array.isArray(data.rounds)) {
            return { valid: false, error: 'Invalid debate data: rounds must be an array' };
        }

        return { valid: true };
    }

    /**
     * 速率限制检查
     */
    _checkRateLimit() {
        const now = Date.now();
        const windowMs = this.rateLimit.perMinutes * 60 * 1000;

        // 清理过期记录
        this.emailHistory = this.emailHistory.filter(time => now - time < windowMs);

        // 检查是否超过限制
        if (this.emailHistory.length >= this.rateLimit.maxEmails) {
            return {
                allowed: false,
                error: `速率限制：每${this.rateLimit.perMinutes}分钟最多发送${this.rateLimit.maxEmails}封邮件`
            };
        }

        return { allowed: true };
    }

    /**
     * 带超时的邮件发送
     */
    _sendWithTimeout(mailOptions, timeout) {
        return Promise.race([
            this.transporter.sendMail(mailOptions),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SMTP timeout')), timeout)
            )
        ]);
    }

    /**
     * 格式化错误信息
     */
    _formatError(error) {
        const message = error.message || error.toString();

        // 网络错误优先匹配（在认证错误之前）
        if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED') ||
            message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
            return '网络连接失败，请检查网络设置';
        }

        // SMTP超时
        if (message.includes('SMTP timeout') || message.includes('timeout')) {
            return '邮件发送超时，请稍后重试';
        }

        // 认证错误
        if (message.includes('Invalid login') || message.includes('535') ||
            message.includes('Login Fail') || message.includes('Authentication failed')) {
            return '邮箱认证失败，请检查EMAIL_USER和EMAIL_PASS配置';
        }

        // 不暴露内部错误详情
        return '邮件发送失败，请稍后重试';
    }

    /**
     * 生成HTML邮件内容（带XSS防护）
     */
    _generateHTML(debateData) {
        const topic = this._escapeHtml(debateData.topic || '');
        const background = this._escapeHtml(debateData.background || '');
        const currentDate = new Date().toISOString().split('T')[0];

        let roundsHtml = '';
        if (debateData.rounds && debateData.rounds.length > 0) {
            debateData.rounds.forEach(round => {
                const roundTopic = this._escapeHtml(round.topic || `第${round.roundNumber}轮辩论`);

                let speechesHtml = '';
                if (round.speeches && round.speeches.length > 0) {
                    round.speeches.forEach(speech => {
                        const roleName = this._escapeHtml(speech.shortName || speech.role || '');
                        const content = this._escapeHtml(speech.content || '');

                        speechesHtml += `
                            <div class="speech">
                                <strong>${roleName}:</strong>
                                <p>${content}</p>
                            </div>
                        `;
                    });
                }

                roundsHtml += `
                    <section class="round">
                        <h3>第${round.roundNumber}轮：${roundTopic}</h3>
                        ${speechesHtml}
                    </section>
                `;
            });
        }

        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多魔汰辩论报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            line-height: 1.8;
            color: #2C3E50;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .background {
            background: #FFFAF0;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            border-left: 4px solid #FF9500;
        }
        .background h2 {
            margin-top: 0;
            color: #FF9500;
            font-size: 20px;
        }
        .round {
            margin: 25px 0;
            padding: 20px;
            background: #F5F5F7;
            border-radius: 12px;
            border-left: 4px solid #34C759;
        }
        .round h3 {
            margin-top: 0;
            color: #34C759;
            font-size: 18px;
        }
        .speech {
            margin: 15px 0;
            padding: 12px;
            background: white;
            border-radius: 8px;
        }
        .speech strong {
            color: #FF3B30;
            font-size: 16px;
        }
        .speech p {
            margin: 8px 0 0 0;
            word-wrap: break-word;
            white-space: pre-wrap;
            overflow-wrap: break-word;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E0E0E0;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .header { padding: 20px; }
            h1 { font-size: 22px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${topic}</h1>
            <p>多魔汰风暴辩论系统报告</p>
        </div>

        ${background ? `
        <div class="background">
            <h2>背景信息</h2>
            <p>${background}</p>
        </div>
        ` : ''}

        ${roundsHtml}

        <div class="footer">
            <p><strong>多魔汰系统生成</strong></p>
            <p>生成日期：${currentDate}</p>
            <p>© 2025 RRXS.xyz - AI专家级决策支持系统</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * HTML转义（XSS防护）
     */
    _escapeHtml(text) {
        if (typeof text !== 'string') return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = DuomotaiEmailService;
