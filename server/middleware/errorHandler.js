/**
 * 错误处理中间件 - 防止500/502错误
 * RCCM Solution - Short Term
 *
 * @version v1.0
 * @date 2025-10-13
 */

const winston = require('winston');
const path = require('path');

// 创建日志记录器
const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/500-errors.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3
    })
  ]
});

// 如果是开发环境，也输出到控制台
if (process.env.NODE_ENV !== 'production') {
  errorLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误，防止500错误直接暴露给用户
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误详情
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: req.body,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    }
  };

  // 记录到日志文件
  errorLogger.error('Server Error', errorInfo);

  // 判断错误类型并设置响应状态码
  let statusCode = 500;
  let errorType = 'INTERNAL_SERVER_ERROR';
  let userMessage = '服务器处理请求时发生错误，请稍后重试';

  // 细分错误类型
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'VALIDATION_ERROR';
    userMessage = '请求参数验证失败';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorType = 'UNAUTHORIZED';
    userMessage = '未授权访问';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 502;
    errorType = 'BAD_GATEWAY';
    userMessage = 'AI服务暂时不可用，请稍后重试';
  } else if (err.message && err.message.includes('timeout')) {
    statusCode = 504;
    errorType = 'GATEWAY_TIMEOUT';
    userMessage = '请求超时，请稍后重试';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 502;
    errorType = 'SERVICE_UNAVAILABLE';
    userMessage = '无法连接到外部服务';
  }

  // 开发环境返回详细错误，生产环境返回友好提示
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error: errorType,
    message: userMessage,
    ...(isDevelopment && {
      debug: {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      }
    }),
    // 提供错误ID用于追踪
    errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    // 提供降级方案提示
    fallback: {
      message: '如果问题持续，您可以：',
      options: [
        '1. 刷新页面重试',
        '2. 检查网络连接',
        '3. 使用离线模式（部分功能可用）',
        '4. 联系技术支持'
      ]
    }
  });
};

/**
 * 异步错误捕获包装器
 * 自动捕获异步函数的错误并传递给错误处理中间件
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`未找到资源 - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: '请求的资源不存在',
    path: req.originalUrl
  });
};

/**
 * 健康检查端点错误处理
 */
const healthCheckErrorHandler = (req, res, next) => {
  // 检查关键服务状态
  const services = {
    database: true, // 这里应该检查实际的数据库连接
    redis: true,     // 检查Redis连接（如果使用）
    aiService: true  // 检查AI服务可用性
  };

  const allHealthy = Object.values(services).every(status => status === true);

  if (!allHealthy) {
    res.status(503).json({
      success: false,
      error: 'SERVICE_DEGRADED',
      message: '部分服务不可用',
      services
    });
  } else {
    next();
  }
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  healthCheckErrorHandler,
  errorLogger
};