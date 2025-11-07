const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const aiService = require('./services/aiService');
const emailService = require('./services/emailService');
const userDataService = require('./services/userDataService');
const userAuthService = require('./services/userAuthService');

// ✅ [Night-Auth 2025-10-17] 多魔汰邮件路由
const duomotaiEmailRoutes = require('./routes/duomotaiEmail');

// ✅ [Task #2 - D-60 后续] 引入错误处理和熔断器模块
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { aiServiceBreaker, retryPolicy, fallbackManager } = require('./utils/circuitBreaker');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ [Task #2 - D-60 后续] 确保 logs 目录存在
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false // 开发环境下禁用CSP，生产环境需要配置
}));

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS ?
  process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // 允许file://协议访问（本地HTML文件）
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('file://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 限制请求体大小
app.use(express.json({
  limit: process.env.MAX_REQUEST_SIZE || '10mb'
}));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 默认15分钟
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // 默认每窗口100个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api', limiter);

// ✅ [Night-Auth 2025-10-17] 注册多魔汰邮件路由
app.use('/api/duomotai/email', duomotaiEmailRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ========================================
// 用户认证API
// ========================================

// 发送验证码
app.post('/api/auth/send-code',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请提供有效的手机号码')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phone } = req.body;
      const result = await userAuthService.sendVerificationCode(phone);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('发送验证码失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send verification code',
        message: error.message
      });
    }
  }
);

// 验证码登录
app.post('/api/auth/login',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phone, code } = req.body;

      // 验证验证码
      const codeVerification = userAuthService.verifyCode(phone, code);
      if (!codeVerification.valid) {
        return res.status(400).json({
          success: false,
          error: codeVerification.message
        });
      }

      // 创建或获取用户
      const user = await userAuthService.createOrGetUser(phone);

      // 生成Token
      const token = userAuthService.generateToken(user);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            phone: user.phone,
            nickname: user.profile.nickname,
            avatar: user.profile.avatar,
            isTestMode: user.isTestMode
          },
          token,
          message: '登录成功'
        }
      });

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

// 验证Token中间件
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const verification = userAuthService.verifyToken(token);
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: verification.message
    });
  }

  req.user = {
    userId: verification.userId,
    phone: verification.phone,
    isTestMode: verification.isTestMode
  };

  next();
};

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await userAuthService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.profile.nickname,
        avatar: user.profile.avatar,
        isTestMode: user.isTestMode,
        debateHistory: user.debateHistory || []
      }
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      message: error.message
    });
  }
});

// 获取用户辩论历史
app.get('/api/auth/debate-history', authMiddleware, async (req, res) => {
  try {
    const history = await userAuthService.getUserDebateHistory(req.user.userId);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('获取辩论历史失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get debate history',
      message: error.message
    });
  }
});

// ========================================
// Server-Sent Events (SSE) for Real-time Streaming
// ========================================

// ✅ [Task #013] 多魔汰辩论 AI 流式输出端点
app.post('/api/ai/debate/stream',
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('systemPrompt').notEmpty().withMessage('System prompt is required'),
    body('roleName').notEmpty().withMessage('Role name is required'),
    body('model').optional().isIn(['deepseek', 'anyrouter', 'gemini', 'gemini-balance', 'qwen', 'openai']).withMessage('Invalid model specified'),
    body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be between 0 and 2'),
    body('maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('Max tokens must be between 1 and 4000')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { prompt, systemPrompt, roleName, model = 'deepseek', temperature = 0.7, maxTokens = 500 } = req.body;

      console.log(`✅ [Task #013] Debate AI 流式请求: role=${roleName}, model=${model}, prompt length=${prompt.length}`);

      // 设置 SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // 调用 aiService 流式生成
      await aiService.generateDebateResponseStream({
        model,
        prompt,
        systemPrompt,
        roleName,
        temperature,
        maxTokens,
        onChunk: (chunk) => {
          // ✅ [Bug #013 DEBUG] 检查 aiService 返回的 chunk 是否乱码
          console.log(`🔥🔥🔥 [Bug #013 DEBUG - Backend] aiService返回chunk (前50字符): "${chunk.substring(0, 50)}"`);

          // 发送 SSE 数据块
          res.write(`data: ${JSON.stringify({
            type: 'chunk',
            content: chunk,
            timestamp: new Date().toISOString()
          })}\n\n`);
        },
        onComplete: (fullContent, tokens) => {
          // 发送完成事件
          res.write(`data: ${JSON.stringify({
            type: 'complete',
            content: fullContent,
            tokens: tokens,
            model: model,
            timestamp: new Date().toISOString()
          })}\n\n`);
          res.end();
          console.log(`✅ [Task #013] 流式输出完成: ${roleName}, tokens=${tokens}`);
        },
        onError: (error) => {
          // 发送错误事件
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          })}\n\n`);
          res.end();
          console.error(`❌ [Task #013] 流式输出失败: ${roleName}, error=${error.message}`);
        }
      });

      // 处理客户端断开连接
      req.on('close', () => {
        console.log(`🔌 [Task #013] 客户端断开 SSE 连接: ${roleName}`);
      });

    } catch (error) {
      console.error('❌ [Task #013] Debate AI 流式端点错误:', error);
      // SSE 错误处理（headers 已发送，只能发送 error event）
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    }
  }
);

// ========================================
// Mock SSE Demo Endpoint (保留用于测试)
// ========================================
app.get('/api/sse/stream', (req, res) => {
  // 1. Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userProfileText = "用户画像：年龄段：26-35, 性别：男, 昵称：CodeMaster, 邮箱：claude@anthropic.com";

  let counter = 0;
  const intervalId = setInterval(() => {
    counter++;
    if (counter > 10) {
      res.write(`data: {"event": "DONE", "message": "Stream finished after 10 updates."}\n\n`);
      clearInterval(intervalId);
      res.end();
      return;
    }

    const mockData = {
      event: 'debate_update',
      round: counter,
      topic: 'RRXS.XYZ 未来发展战略',
      content: `--- [Session Update ${counter}] ---
**[RRXS 5P]** ${counter % 2 === 0 ? 'Product' : 'Platform'} Phase Update.
${userProfileText}
[SSE Message]: Processing step ${counter}/10. Current AI Model: DeepSeek.`,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(mockData)}\n\n`);

  }, 1500);

  req.on('close', () => {
    console.log('Client disconnected from SSE stream.');
    clearInterval(intervalId);
  });
});

// ✅ [Task #2 - D-60 后续] 多魔汰辩论AI响应生成接口 - 使用熔断器保护
app.post('/api/ai/debate',
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('systemPrompt').notEmpty().withMessage('System prompt is required'),
    body('roleName').notEmpty().withMessage('Role name is required'),
    body('model').optional().isIn(['deepseek', 'anyrouter', 'gemini', 'gemini-balance', 'qwen', 'openai']).withMessage('Invalid model specified'),
    body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be between 0 and 2'),
    body('maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('Max tokens must be between 1 and 4000')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { prompt, systemPrompt, roleName, model = 'deepseek', temperature = 0.7, maxTokens = 500 } = req.body;

    console.log(`Debate AI request: role=${roleName}, model=${model}, prompt length=${prompt.length}`);

    // ✅ [D-77 修复] 移除双重降级机制，aiService 内部已有完整降级链（qwen→deepseek→anyrouter→gemini→openai）
    // 原因：熔断器 20 秒超时 < DeepSeek 响应时间（20-30 秒），导致 DeepSeek 成功结果被丢弃
    const result = await aiService.generateDebateResponse({
      model,
      prompt,
      systemPrompt,
      roleName,
      temperature,
      maxTokens
    });

    res.json(result);
  })
);

// ✅ [Task #2 - D-60 后续] AI分析接口 - 使用熔断器保护
app.post('/api/ai/analyze',
  [
    body('prompt').isLength({ min: 10 }).withMessage('Prompt must be at least 10 characters long'),
    body('userInfo').optional().isObject().withMessage('User info must be an object'),
    body('model').optional().isIn(['deepseek', 'anyrouter', 'gemini', 'qwen', 'openai']).withMessage('Invalid model specified')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { prompt, userInfo, model = 'qwen' } = req.body;

    console.log(`AI Analysis request: model=${model}, prompt length=${prompt.length}`);

    // ✅ [D-77 修复] 移除双重降级机制，aiService 内部已有完整降级链
    const analysis = await aiService.generateAnalysis(prompt, model, userInfo);

    res.json({
      success: true,
      data: {
        analysis,
        model,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// 邮件发送接口
app.post('/api/email/send-report',
  [
    body('to').isEmail().withMessage('Valid email address required'),
    body('userName').isLength({ min: 1 }).withMessage('User name is required'),
    body('reportContent').isLength({ min: 100 }).withMessage('Report content is required'),
    body('userInfo').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { to, userName, reportContent, userInfo } = req.body;

      console.log(`Email sending request: to=${to}, user=${userName}`);

      const result = await emailService.sendReport({
        to,
        userName,
        reportContent,
        userInfo
      });

      res.json({
        success: true,
        data: {
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({
        success: false,
        error: 'Email sending failed',
        message: error.message
      });
    }
  }
);

// 用户注册信息保存接口
app.post('/api/user/register',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
    body('email').isEmail().withMessage('请提供有效的邮箱地址'),
    body('name').isLength({ min: 1, max: 50 }).withMessage('姓名长度应在1-50字符之间'),
    body('age').isIn(['<20', '20-30', '30-40', '40-50', '50-60', '60+']).withMessage('请选择有效的年龄段'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('请选择有效的性别')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userInfo = req.body;
      console.log(`用户注册请求: ${userInfo.name} (${userInfo.phone})`);

      const result = await userDataService.saveUserRegistration(userInfo);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('用户注册保存失败:', error);
      res.status(500).json({
        success: false,
        error: 'User registration save failed',
        message: error.message
      });
    }
  }
);

// 用户测评完成数据保存接口
app.post('/api/user/assessment',
  [
    body('userInfo').isObject().withMessage('用户信息是必需的'),
    body('answers').isObject().withMessage('答案数据是必需的'),
    body('analysisResult').optional().isString().withMessage('分析结果必须是字符串')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userInfo, answers, analysisResult } = req.body;
      console.log(`用户测评完成: ${userInfo.name} (${userInfo.phone})`);

      const result = await userDataService.saveUserAssessment(userInfo, answers, analysisResult);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('用户测评数据保存失败:', error);
      res.status(500).json({
        success: false,
        error: 'User assessment save failed',
        message: error.message
      });
    }
  }
);

// ✅ [Task #044] 获取用户画像接口 (必须在 /api/user/:phone 之前，避免路由冲突)
app.get('/api/user/profile',
  async (req, res) => {
    console.log('🔵 [ROUTE HIT] GET /api/user/profile endpoint reached');
    try {
      const { phone } = req.query;
      console.log(`📱 [DEBUG] Received phone parameter: "${phone}", type: ${typeof phone}, length: ${phone?.length}`);

      // 宽松的手机号验证 - 接受测试账号
      const cleanPhone = phone ? phone.trim() : '';
      if (!cleanPhone || (cleanPhone !== '13917895758' && !/^1[3-9]\d{9}$/.test(cleanPhone))) {
        console.log(`❌ [DEBUG] Phone validation failed: "${cleanPhone}"`);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number'
        });
      }

      const profile = await userDataService.getUserProfile(phone);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }

      res.json({
        success: true,
        profile: profile
      });

    } catch (error) {
      console.error('获取用户画像失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile',
        message: error.message
      });
    }
  }
);

// 获取用户数据接口 (参数路由，必须在固定路由之后)
app.get('/api/user/:phone',
  async (req, res) => {
    try {
      const { phone } = req.params;

      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number'
        });
      }

      const userData = await userDataService.getUserData(phone);

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: userData
      });

    } catch (error) {
      console.error('获取用户数据失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data',
        message: error.message
      });
    }
  }
);

// ✅ [Task #044] 保存/更新用户画像接口
app.post('/api/user/profile',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
    body('ageGroup').isIn(['18-25', '26-35', '36-45', '46-55', '56+']).withMessage('请选择有效的年龄段'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('请选择有效的性别'),
    body('nickname').isLength({ min: 1, max: 20 }).withMessage('昵称长度应在1-20字符之间'),
    body('email').isEmail().withMessage('请提供有效的邮箱地址')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const profile = req.body;
      console.log(`✅ [Task #044] 用户画像保存请求: ${profile.nickname} (${profile.phone})`);

      const result = await userDataService.saveUserProfile(profile);

      res.json({
        success: true,
        profile: result
      });

    } catch (error) {
      console.error('❌ [Task #044] 用户画像保存失败:', error);
      res.status(500).json({
        success: false,
        error: 'User profile save failed',
        message: error.message
      });
    }
  }
);

// 获取用户统计信息接口
app.get('/api/stats/summary',
  async (req, res) => {
    try {
      const stats = await userDataService.getSummaryStats();
      res.json(stats);

    } catch (error) {
      console.error('获取统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get summary stats',
        message: error.message
      });
    }
  }
);

// 获取所有用户列表接口（管理用）
app.get('/api/admin/users',
  async (req, res) => {
    try {
      const users = await userDataService.getAllUsers();
      res.json(users);

    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users list',
        message: error.message
      });
    }
  }
);

// 批量处理接口（分析+发送邮件+保存数据）
app.post('/api/process-assessment',
  [
    body('userInfo').isObject().withMessage('User info is required'),
    body('answers').isObject().withMessage('Answers are required'),
    body('email').isEmail().withMessage('Valid email address required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userInfo, answers, email, model = 'qwen' } = req.body;

      console.log(`Processing assessment for user: ${userInfo.name}`);

      // 构建分析提示词
      const prompt = aiService.buildAnalysisPrompt(userInfo, answers);

      // 生成AI分析
      const analysis = await aiService.generateAnalysis(prompt, model, userInfo);

      // 发送邮件
      const emailResult = await emailService.sendReport({
        to: email,
        userName: userInfo.name,
        reportContent: analysis,
        userInfo
      });

      // 保存用户测评数据
      const saveResult = await userDataService.saveUserAssessment(userInfo, answers, analysis);

      res.json({
        success: true,
        data: {
          analysis,
          emailSent: true,
          messageId: emailResult.messageId,
          dataSaved: true,
          fileName: saveResult.fileName,
          stats: saveResult.stats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Assessment processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Assessment processing failed',
        message: error.message
      });
    }
  }
);

// ✅ [Task #2 - D-60 后续] 使用新的错误处理中间件
// 404处理（必须在所有路由之后，错误处理之前）
app.use(notFoundHandler);

// 全局错误处理（必须在最后）
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Server version: 2025-10-17-20:40 (DEBUG_ENABLED)`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
  console.log(`🤖 AI models available: DeepSeek, Qwen, GLM, Gemini-Balance`);
  console.log(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;