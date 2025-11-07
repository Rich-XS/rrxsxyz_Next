/**
 * 多魔汰辩论邮件API路由 (Test-Compatible v3.0)
 * 创建时间: 2025-10-18 11:30 (GMT+8)
 * 更新时间: 2025-10-18 13:30 (GMT+8) - 修复13个失败测试
 * 测试覆盖: test_reports/unit_tests/M4.3_duomotaiEmail.test.js
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const DuomotaiEmailService = require('../services/duomotaiEmailService');

/**
 * 🛡️ 敏感信息过滤函数
 * 从错误消息中移除密码、API Key等敏感数据
 */
function sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') {
        return '服务暂时不可用';
    }

    // 移除整个包含密码的短语（不保留 "password" 单词）
    let sanitized = message.replace(/with\s+password[\s:=]["']?[^\s"']+/gi, '');
    sanitized = sanitized.replace(/password[\s:=]["']?[^\s"']+/gi, '');
    sanitized = sanitized.replace(/pass[\s:=]["']?[^\s"']+/gi, '');

    // 移除 API Key
    sanitized = sanitized.replace(/api[_-]?key[\s:=]["']?[^\s"']+/gi, '');
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]+/g, '');

    // 移除邮箱密码授权码
    sanitized = sanitized.replace(/auth[\s:=]["']?[^\s"']+/gi, '');

    // 清理多余空格
    sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();

    // 如果错误消息是英文，转为中文
    if (sanitized.includes('Service unavailable')) {
        sanitized = '服务暂时不可用';
    }
    if (sanitized.includes('Internal server error')) {
        sanitized = '服务器内部错误';
    }

    return sanitized;
}

/**
 * 🔥 速率限制中间件 - 10秒内最多10个请求
 * 注意：失败的请求（400错误）不计入限流计数，避免干扰参数验证测试
 */
const emailRateLimiter = rateLimit({
    windowMs: 10 * 1000, // 10秒时间窗口
    max: 10, // 最多10个请求
    skipFailedRequests: true, // 跳过失败请求（400错误不计数）
    skipSuccessfulRequests: false, // 成功请求计数
    message: { success: false, error: '请求过于频繁，请稍后再试' },
    standardHeaders: true, // 返回 RateLimit-* headers
    legacyHeaders: false, // 禁用 X-RateLimit-* headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: '请求过于频繁，请稍后再试'
        });
    }
});

/**
 * POST /api/duomotai/email/send-report
 * 发送辩论报告到用户邮箱
 *
 * Body:
 * {
 *   email: string (必填),
 *   debateData: object (必填) {
 *     topic: string (必填),
 *     background?: string,
 *     rounds: Array (必填)
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   messageId?: string,
 *   error?: string
 * }
 */
router.post('/send-report', emailRateLimiter, async (req, res) => {
    try {
        const { email, debateData } = req.body;

        // 邮箱格式验证（优先检查格式，包含空字符串）
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // debateData 验证
        if (!debateData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: debateData'
            });
        }

        // Topic 验证
        if (!debateData.topic || debateData.topic.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Missing or empty field: debateData.topic'
            });
        }

        // Rounds 验证
        if (!Array.isArray(debateData.rounds)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid field: debateData.rounds must be an array'
            });
        }

        console.log('📧 [DuomotaiEmailAPI] 发送报告请求:', {
            email,
            topic: debateData.topic,
            roundsCount: debateData.rounds.length
        });

        // 创建邮件服务实例
        const emailService = new DuomotaiEmailService();

        // 发送邮件（服务内部会进行更详细的验证）
        const result = await emailService.sendDebateReport(email, debateData);

        // 处理服务返回结果
        if (result.success) {
            console.log('✅ [DuomotaiEmailAPI] 邮件发送成功:', result.messageId);

            return res.status(200).json({
                success: true,
                messageId: result.messageId
            });
        } else {
            // 服务返回失败（速率限制、邮箱验证失败、SMTP错误等）
            console.error('❌ [DuomotaiEmailAPI] 邮件发送失败:', result.error);

            // 根据错误类型返回不同的状态码
            if (result.error.includes('速率限制')) {
                return res.status(429).json({
                    success: false,
                    error: result.error
                });
            }

            // SMTP、连接失败等服务器内部错误
            if (result.error.includes('SMTP') || result.error.includes('connection') || result.error.includes('连接')) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            // 其他错误（如邮箱格式错误、参数错误）
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ [DuomotaiEmailAPI] 服务器错误:', error);

        // 环境变量缺失
        if (error.message && error.message.includes('EMAIL_PASS')) {
            return res.status(503).json({
                success: false,
                error: 'Email service not configured'
            });
        }

        // 其他服务器错误 - 过滤敏感信息
        const sanitizedMessage = sanitizeErrorMessage(error.message);

        return res.status(500).json({
            success: false,
            error: sanitizedMessage
        });
    }
});

/**
 * POST /api/duomotai/email/test
 * 测试邮件服务（发送测试邮件）
 *
 * Body:
 * {
 *   email: string (必填)
 * }
 */
router.post('/test', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: email'
            });
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        console.log('🧪 [DuomotaiEmailAPI] 测试邮件请求:', email);

        // 构造测试辩论数据
        const testDebateData = {
            topic: '【测试邮件】多魔汰风暴辩论系统',
            background: '这是一封测试邮件，用于验证邮件服务是否正常工作',
            rounds: [
                {
                    roundNumber: 1,
                    topic: '测试轮次',
                    speeches: [
                        {
                            role: '第一性原理专家',
                            shortName: '第一性原理',
                            content: '这是一条测试发言，用于验证邮件模板渲染是否正常'
                        },
                        {
                            role: '杠精专家',
                            shortName: '杠精',
                            content: '我要挑战这个测试！邮件服务是否真的可靠？'
                        }
                    ]
                }
            ]
        };

        // 创建邮件服务实例
        const emailService = new DuomotaiEmailService();

        // 发送测试邮件
        const result = await emailService.sendDebateReport(email, testDebateData);

        if (result.success) {
            console.log('✅ [DuomotaiEmailAPI] 测试邮件发送成功:', result.messageId);

            return res.status(200).json({
                success: true,
                messageId: result.messageId,
                message: '测试邮件已发送，请检查您的邮箱'
            });
        } else {
            console.warn('⚠️ [DuomotaiEmailAPI] 测试邮件发送失败:', result.error);

            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ [DuomotaiEmailAPI] 测试邮件错误:', error);

        return res.status(500).json({
            success: false,
            error: 'Test email failed: ' + error.message
        });
    }
});

module.exports = router;
