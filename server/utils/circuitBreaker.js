/**
 * 智能重试与熔断器 - 防止级联故障
 * RCCM Solution - Long Term
 *
 * @version v1.0
 * @date 2025-10-13
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.timeout = options.timeout || 10000; // 请求超时时间
    this.errorThreshold = options.errorThreshold || 50; // 错误率阈值(%)
    this.volumeThreshold = options.volumeThreshold || 20; // 最小请求量
    this.sleepWindow = options.sleepWindow || 60000; // 熔断恢复时间窗口
    this.bucketSize = options.bucketSize || 10000; // 统计窗口大小

    // 状态：CLOSED(正常), OPEN(熔断), HALF_OPEN(半开)
    this.state = 'CLOSED';
    this.stats = {
      requests: 0,
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      lastFailTime: null
    };

    this.bucket = [];
    this.nextAttempt = Date.now();
  }

  /**
   * 执行请求
   */
  async execute(fn, fallback) {
    // 检查熔断器状态
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log(`⚡ [${this.name}] 熔断器开启，执行降级策略`);
        return fallback ? fallback() : Promise.reject(new Error('Circuit breaker is OPEN'));
      }
      // 尝试进入半开状态
      this.state = 'HALF_OPEN';
      console.log(`🔄 [${this.name}] 熔断器进入半开状态，尝试恢复`);
    }

    const startTime = Date.now();

    try {
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);

      // 请求成功
      this.onSuccess(Date.now() - startTime);

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        console.log(`✅ [${this.name}] 熔断器恢复正常`);
      }

      return result;

    } catch (error) {
      // 请求失败
      this.onFailure(Date.now() - startTime);

      if (this.state === 'HALF_OPEN' || this.shouldOpen()) {
        this.open();
      }

      // 执行降级策略
      if (fallback) {
        console.log(`🔄 [${this.name}] 执行降级策略`);
        return fallback();
      }

      throw error;
    }
  }

  /**
   * 记录成功
   */
  onSuccess(responseTime) {
    this.stats.requests++;
    this.stats.successes++;
    this.stats.consecutiveFailures = 0;

    this.bucket.push({
      timestamp: Date.now(),
      success: true,
      responseTime
    });

    this.cleanup();
  }

  /**
   * 记录失败
   */
  onFailure(responseTime) {
    this.stats.requests++;
    this.stats.failures++;
    this.stats.consecutiveFailures++;
    this.stats.lastFailTime = Date.now();

    this.bucket.push({
      timestamp: Date.now(),
      success: false,
      responseTime
    });

    this.cleanup();
  }

  /**
   * 判断是否应该开启熔断
   */
  shouldOpen() {
    const recentRequests = this.getRecentRequests();

    if (recentRequests.length < this.volumeThreshold) {
      return false; // 请求量不足
    }

    const failureCount = recentRequests.filter(r => !r.success).length;
    const errorRate = (failureCount / recentRequests.length) * 100;

    return errorRate >= this.errorThreshold;
  }

  /**
   * 开启熔断器
   */
  open() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.sleepWindow;
    console.error(`🚨 [${this.name}] 熔断器开启！将在 ${this.sleepWindow/1000} 秒后尝试恢复`);
  }

  /**
   * 获取最近的请求记录
   */
  getRecentRequests() {
    const now = Date.now();
    return this.bucket.filter(r => (now - r.timestamp) < this.bucketSize);
  }

  /**
   * 清理过期记录
   */
  cleanup() {
    const now = Date.now();
    this.bucket = this.bucket.filter(r => (now - r.timestamp) < this.bucketSize);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const recentRequests = this.getRecentRequests();
    const failures = recentRequests.filter(r => !r.success).length;
    const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / (recentRequests.length || 1);

    return {
      state: this.state,
      requests: recentRequests.length,
      failures: failures,
      errorRate: recentRequests.length > 0 ? (failures / recentRequests.length * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      consecutiveFailures: this.stats.consecutiveFailures,
      lastFailTime: this.stats.lastFailTime ? new Date(this.stats.lastFailTime).toISOString() : null
    };
  }
}

/**
 * 智能重试策略
 */
class RetryPolicy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.factor = options.factor || 2;
    this.jitter = options.jitter || true;
  }

  /**
   * 执行带重试的请求
   */
  async execute(fn, context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 [Retry] 尝试第 ${attempt + 1}/${this.maxRetries + 1} 次`);
        return await fn();
      } catch (error) {
        lastError = error;

        // 判断是否可重试的错误
        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          throw error;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ [Retry] 等待 ${delay}ms 后重试...`);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * 判断错误是否可重试
   */
  isRetryable(error) {
    // 网络错误、超时、502、503、504 可重试
    const retryableCodes = [502, 503, 504, 429];
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'];

    if (error.response && retryableCodes.includes(error.response.status)) {
      return true;
    }

    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * 计算重试延迟（指数退避 + 抖动）
   */
  calculateDelay(attempt) {
    let delay = this.initialDelay * Math.pow(this.factor, attempt);
    delay = Math.min(delay, this.maxDelay);

    if (this.jitter) {
      // 添加随机抖动 (0.5 ~ 1.5倍)
      delay = delay * (0.5 + Math.random());
    }

    return Math.round(delay);
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 服务降级管理器
 */
class FallbackManager {
  constructor() {
    this.fallbacks = new Map();
  }

  /**
   * 注册降级策略
   */
  register(service, fallback) {
    this.fallbacks.set(service, fallback);
    console.log(`📦 [Fallback] 注册降级策略：${service}`);
  }

  /**
   * 执行降级
   */
  async execute(service, context = {}) {
    const fallback = this.fallbacks.get(service);

    if (!fallback) {
      console.warn(`⚠️ [Fallback] 未找到服务 ${service} 的降级策略`);
      throw new Error(`No fallback registered for service: ${service}`);
    }

    console.log(`🔄 [Fallback] 执行 ${service} 降级策略`);
    return await fallback(context);
  }

  /**
   * 批量注册降级策略
   */
  registerAll(fallbacks) {
    Object.entries(fallbacks).forEach(([service, fallback]) => {
      this.register(service, fallback);
    });
  }
}

// 创建实例
const aiServiceBreaker = new CircuitBreaker({
  name: 'AI_SERVICE',
  errorThreshold: 30, // 30% 错误率触发熔断
  volumeThreshold: 10, // 最少10个请求
  sleepWindow: 30000, // 30秒后尝试恢复
  timeout: 20000 // 20秒超时
});

const dbBreaker = new CircuitBreaker({
  name: 'DATABASE',
  errorThreshold: 50,
  volumeThreshold: 5,
  sleepWindow: 10000,
  timeout: 5000
});

const retryPolicy = new RetryPolicy({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2
});

const fallbackManager = new FallbackManager();

// 注册AI服务降级策略
fallbackManager.register('ai-analysis', async (context) => {
  return {
    success: true,
    data: {
      content: '由于AI服务暂时不可用，系统已生成基础分析报告。建议稍后重试以获得更详细的分析。',
      model: 'fallback',
      cached: true
    }
  };
});

fallbackManager.register('ai-debate', async (context) => {
  const { roleName } = context;
  return {
    success: true,
    data: {
      content: `[${roleName}] 由于网络原因，我的观点暂时无法完整表达。核心观点是：我们需要更多数据支撑决策。`,
      model: 'fallback',
      cached: true
    }
  };
});

module.exports = {
  CircuitBreaker,
  RetryPolicy,
  FallbackManager,
  aiServiceBreaker,
  dbBreaker,
  retryPolicy,
  fallbackManager
};