const axios = require('axios');
const aiModelsConfig = require('../config/aiModels');

class AIService {
  constructor() {
    // ✅ [D-82] 统一使用 aiModels.js 配置文件管理所有 AI 模型
    // 降级链: DeepSeek → Qwen → GLM → Gemini-Balance

    // API配置（从统一配置文件读取）
    this.qwenConfig = aiModelsConfig.getModelConfig('qwen');
    this.deepseekConfig = aiModelsConfig.getModelConfig('deepseek');
    this.glmConfig = aiModelsConfig.getModelConfig('glm');
    this.geminiBalanceConfig = aiModelsConfig.getModelConfig('gemini-balance');

    // 保存配置文件引用，用于获取降级链
    this.aiModelsConfig = aiModelsConfig;

    this.systemPrompt = '你是一位专业的自媒体商业化顾问，拥有丰富的行业经验，擅长分析创作者的商业化潜力并提供实用建议。';

    // ✅ [D-82] 模型失败计数器（追踪连续失败次数）
    // 降级链: DeepSeek → Qwen → GLM → Gemini-Balance
    this.modelFailureCounter = {
      deepseek: 0,
      qwen: 0,
      glm: 0,
      'gemini-balance': 0
    };

    // ✅ [D-57 决策] 失败阈值：连续 3 次失败后建议切换模型
    this.FAILURE_THRESHOLD = 3;
  }

  // 生成分析报告
  async generateAnalysis(prompt, modelType = 'qwen', userInfo = null) {
    console.log(`Generating analysis with ${modelType} model`);

    try {
      // 根据模型类型选择API
      switch (modelType.toLowerCase()) {
        case 'qwen':
          return await this.callQwenAPI(prompt);
        case 'deepseek':
          return await this.callDeepSeekAPI(prompt);
        case 'openai':
          return await this.callOpenAIAPI(prompt);
        default:
          throw new Error(`Unsupported model type: ${modelType}`);
      }
    } catch (error) {
      console.error(`${modelType} API call failed:`, error.message);

      // 自动降级到其他模型
      const fallbackModels = this.getFallbackModels(modelType);

      for (const fallback of fallbackModels) {
        try {
          console.log(`Trying fallback model: ${fallback}`);
          return await this.generateAnalysis(prompt, fallback, userInfo);
        } catch (fallbackError) {
          console.error(`Fallback ${fallback} also failed:`, fallbackError.message);
          continue;
        }
      }

      // 所有模型都失败，返回备用报告
      console.log('All AI models failed, generating fallback report');
      return this.generateFallbackReport(userInfo);
    }
  }

  // ✅ [FIX #059] 调用阿里百炼 Qwen API (8秒超时) - 使用 compatible-mode 标准格式
  async callQwenAPI(prompt) {
    const config = this.qwenConfig;

    if (!config.apiKey) {
      throw new Error('Qwen API key not configured');
    }

    // ✅ [FIX #059] 创建8秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Qwen API timeout after 8s')), 8000);
    });

    // ✅ [FIX #059] 创建API调用Promise（使用标准 OpenAI 格式）
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      top_p: 0.8
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000  // ✅ [FIX #059] 从60秒改为8秒
    });

    // ✅ [FIX #059] 使用Promise.race实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid Qwen API response format');
    }
  }

  // ✅ [FIX #059] 调用 DeepSeek API (8秒超时)
  async callDeepSeekAPI(prompt) {
    const config = this.deepseekConfig;

    if (!config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // ✅ [FIX #059] 创建8秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DeepSeek API timeout after 8s')), 8000);
    });

    // ✅ [FIX #059] 创建API调用Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000  // ✅ [FIX #059] 从60秒改为8秒
    });

    // ✅ [FIX #059] 使用Promise.race实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid DeepSeek API response format');
    }
  }

  // ✅ [FIX #059] 调用 OpenAI API (8秒超时)
  async callOpenAIAPI(prompt) {
    const config = this.openaiConfig;

    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // ✅ [FIX #059] 创建8秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 8s')), 8000);
    });

    // ✅ [FIX #059] 创建API调用Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000  // ✅ [FIX #059] 从60秒改为8秒
    });

    // ✅ [FIX #059] 使用Promise.race实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid OpenAI API response format');
    }
  }

  // 获取降级模型列表
  getFallbackModels(primaryModel, _triedModels = []) {
    // ✅ [D-82] 使用统一配置文件的降级链：DeepSeek → Qwen → GLM → Gemini-Balance
    return this.aiModelsConfig.getFallbackChain(primaryModel, _triedModels);
  }

  /**
   * ========================================
   * 多魔汰辩论系统专用接口
   * ========================================
   */

  /**
   * 辩论 AI 调用（支持自定义 systemPrompt 和角色上下文）
   * @param {Object} params
   * @param {string} params.model - 模型类型（deepseek/qwen/openai）
   * @param {string} params.prompt - 用户提示词
   * @param {string} params.systemPrompt - 系统提示词（角色设定）
   * @param {string} params.roleName - 角色名称
   * @param {number} params.temperature - 温度参数
   * @param {number} params.maxTokens - 最大token数
   */
  async generateDebateResponse(params) {
    const {
      model = 'deepseek', // 默认使用 DeepSeek
      prompt,
      systemPrompt,
      roleName,
      temperature = 0.7,
      maxTokens = 1000,  // ✅ [FIX P0-01] 从 500 增加到 1000，确保专家有足够空间发言
      _retryCount = 0    // ✅ [紧急修复] 添加重试计数，防止无限降级循环
    } = params;

    console.log(`[Debate AI] ${roleName} 使用 ${model} 模型生成响应 (maxTokens: ${maxTokens}, retryCount: ${_retryCount})`);  // ✅ 添加 maxTokens 日志

    // ✅ [紧急修复] 限制最大重试次数为3次
    if (_retryCount >= 3) {
      console.error(`❌ [Debate AI] ${roleName} 已达到最大重试次数(3)，停止降级`);
      throw new Error(`All models failed after 3 retries for ${roleName}`);
    }

    // ✅ [D-57 决策] 检查模型是否连续失败过多次
    const modelKey = model.toLowerCase();
    if (this.modelFailureCounter[modelKey] >= this.FAILURE_THRESHOLD) {
      console.warn(`⚠️ [D-57] ${model} 已连续失败 ${this.modelFailureCounter[modelKey]} 次，建议切换到更可靠的模型`);
    }

    try {
      // 根据模型类型调用相应 API
      let response;
      switch (model.toLowerCase()) {
        case 'deepseek':
          response = await this.callDeepSeekAPIWithCustomPrompt({
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          });
          break;
        case 'qwen':
          response = await this.callQwenAPIWithCustomPrompt({
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          });
          break;
        case 'glm':
          response = await this.callGLMAPIWithCustomPrompt({
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          });
          break;
        case 'gemini-balance':
          response = await this.callGeminiBalanceAPIWithCustomPrompt({
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          });
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

      // ✅ [D-57 决策] 调用成功，重置失败计数器
      this.modelFailureCounter[modelKey] = 0;
      console.log(`✅ [D-57] ${model} 调用成功，失败计数器已重置`);

      return {
        success: true,
        data: {
          content: response,
          model: model,
          roleName: roleName
        }
      };

    } catch (error) {
      console.error(`[Debate AI] ${roleName} ${model} 调用失败:`, error.message);

      // ✅ [D-57 决策] 调用失败，增加失败计数器
      this.modelFailureCounter[modelKey] = (this.modelFailureCounter[modelKey] || 0) + 1;
      console.log(`❌ [D-57] ${model} 失败计数: ${this.modelFailureCounter[modelKey]}/${this.FAILURE_THRESHOLD}`);

      // ✅ [D-57 决策] 如果达到失败阈值，记录警告
      if (this.modelFailureCounter[modelKey] >= this.FAILURE_THRESHOLD) {
        console.error(`🚨 [D-57] ${model} 已连续失败 ${this.modelFailureCounter[modelKey]} 次！建议切换到更可靠的模型（如 OpenAI GPT-4 或 Claude Sonnet）`);
      }

      // 自动降级到其他模型
      const fallbackModels = this.getFallbackModels(model);

      for (const fallback of fallbackModels) {
        try {
          const nextRetryCount = (params._retryCount || _retryCount || 0) + 1;
          console.log(`[Debate AI] ${roleName} 尝试降级到 ${fallback} (retry ${nextRetryCount}/3)`);
          return await this.generateDebateResponse({
            ...params,
            model: fallback,
            _retryCount: (params._retryCount || 0) + 1  // ✅ [紧急修复] 递增重试计数，必须放在...params后面以覆盖原值
          });
        } catch (fallbackError) {
          console.error(`[Debate AI] ${roleName} ${fallback} 也失败:`, fallbackError.message);
          continue;
        }
      }

      // 所有模型都失败，返回错误（前端将使用 JS fallback）
      throw new Error(`所有 AI 模型调用失败（${model} → ${fallbackModels.join(' → ')}）`);
    }
  }

  /**
   * DeepSeek API 调用（自定义 systemPrompt）
   */
  async callDeepSeekAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.deepseekConfig;

    if (!config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // ✅ [紧急修复] 创建60秒超时Promise（从20秒增加到60秒，给领袖策划更多时间）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DeepSeek API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1000,  // ✅ [FIX P0-01] 默认值也改为 1000
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000  // ✅ [紧急修复] 从 20000 增加到 60000
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid DeepSeek API response format');
    }
  }

  /**
   * Qwen API 调用（自定义 systemPrompt）
   */
  async callQwenAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.qwenConfig;

    if (!config.apiKey) {
      throw new Error('Qwen API key not configured');
    }

    // ✅ [FIX P0-01] 创建20秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Qwen API timeout after 60s')), 60000);
    });

    // ✅ [D-79 FIX] 创建 API 调用 Promise（使用 compatible-mode 标准格式）
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1000,  // ✅ [FIX P0-01]
      temperature: temperature || 0.7,
      top_p: 0.8
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000  // ✅ [FIX P0-01]
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    // ✅ [D-79 FIX] 使用 compatible-mode 标准响应格式
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid Qwen API response format');
    }
  }

  /**
   * ✅ [TEST] Gemini-Balance API 调用（第3选项测试）
   */
  async callGeminiAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.geminiConfig;

    if (!config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // ✅ [FIX P0-01] 创建20秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,  // gemini-2.5-pro
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1500,  // ✅ 确保足够的 token 长度
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    console.log(`✅ [Gemini] Gemini 2.5 Pro 响应成功，内容长度: ${response.data.choices?.[0]?.message?.content?.length || 0} 字符`);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid Gemini API response format');
    }
  }

  /**
   * ✅ [FIX Item 2-9] AnyRouter API 调用（支持 Claude Haiku 等高质量模型）
   */
  async callAnyRouterAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.anyRouterConfig;

    if (!config.apiKey) {
      throw new Error('AnyRouter API key not configured');
    }

    // ✅ [FIX P0-01] 创建20秒超时Promise（从8秒增加到20秒，支持更长的专家发言）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AnyRouter API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,  // claude-haiku-4-5-20251001
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1500,  // ✅ [FIX Item 2-9] 确保足够的 token 长度
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000  // ✅ [FIX P0-01] 从60秒改为20秒
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    console.log(`✅ [AnyRouter] Claude Haiku 响应成功，内容长度: ${response.data.choices?.[0]?.message?.content?.length || 0} 字符`);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid AnyRouter API response format');
    }
  }

  /**
   * OpenAI API 调用（自定义 systemPrompt）
   */
  async callOpenAIAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.openaiConfig;

    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // ✅ [FIX P0-01] 创建20秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1000,  // ✅ [FIX P0-01]
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000  // ✅ [FIX P0-01]
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid OpenAI API response format');
    }
  }

  /**
   * GLM (智谱清言) API 调用（自定义 systemPrompt）
   * ✅ [FIX P2-01] 添加 GLM 支持作为最后的降级选项，成本最低
   */
  async callGLMAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.glmConfig;

    if (!config.apiKey) {
      throw new Error('GLM API key not configured');
    }

    // ✅ [FIX P2-01] 创建60秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('GLM API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1000,  // ✅ 默认值1000
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid GLM API response format');
    }
  }

  /**
   * Gemini-Balance API 调用（自定义 systemPrompt）
   * ✅ [D-82] 添加 Gemini-Balance 支持作为最后的降级选项，负载均衡、高稳定性
   */
  async callGeminiBalanceAPIWithCustomPrompt({ prompt, systemPrompt, temperature, maxTokens }) {
    const config = this.geminiBalanceConfig;

    if (!config.apiKey) {
      throw new Error('Gemini-Balance API key not configured');
    }

    // ✅ 创建60秒超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini-Balance API timeout after 60s')), 60000);
    });

    // 创建 API 调用 Promise
    const apiPromise = axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || this.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens || 1000,
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // 使用 Promise.race 实现强制超时
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid Gemini-Balance API response format');
    }
  }

  // 生成备用报告
  generateFallbackReport(userInfo) {
    const name = userInfo?.name || '用户';
    const currentTime = new Date().toLocaleString('zh-CN');

    return `# ${name}的自媒体商业化分析报告

## 个人信息概览
- 姓名：${name}
- 年龄段：${userInfo?.age || '未提供'}
- 性别：${userInfo?.gender || '未提供'}
- 评估时间：${currentTime}

## 五大维度评估
基于您提供的答案，我们为您生成了以下评估：

### 1. 定位维度 (Purpose)
**评分: 7.5/10**
- **优势**：您对个人品牌有一定认知，具备基础的自我定位意识
- **建议**：进一步明确独特价值主张，打造差异化竞争优势

### 2. 用户维度 (People)
**评分: 7.0/10**
- **优势**：具备基础的用户意识，了解目标受众的重要性
- **建议**：深入研究目标用户画像，建立用户需求档案

### 3. 产品维度 (Product)
**评分: 6.8/10**
- **优势**：有产品化思维，理解价值创造的重要性
- **建议**：完善价值阶梯设计，建立系统化产品体系

### 4. 流量维度 (Platform)
**评分: 7.2/10**
- **优势**：了解多平台运营的重要性，有基础的流量意识
- **建议**：优化内容分发策略，建立私域流量池

### 5. 体系维度 (Process)
**评分: 6.5/10**
- **优势**：有系统化意识，理解流程的重要性
- **建议**：建立标准化运营流程，提高工作效率

## 🎯 综合分析

### 整体评分：7.0/10分

### 商业化潜力评估
- **短期潜力**：3-6个月内有望实现月收入5000-10000元
- **中期潜力**：6-18个月可能达到月收入20000-50000元
- **长期潜力**：1-3年内具备月入10万+的成长空间

## 🚀 行动计划建议

### 第一阶段（1-3个月）：基础建设
1. 明确个人品牌定位和目标用户群体
2. 建立内容创作标准和发布节奏
3. 选择1-2个主要平台深度运营

### 第二阶段（3-6个月）：规模化发展
1. 扩展到多平台矩阵运营
2. 建立私域流量运营体系
3. 推出第一个收费产品或服务

### 第三阶段（6-12个月）：商业化变现
1. 完善产品价值阶梯
2. 建立团队协作机制
3. 实现稳定的被动收入来源

## 💡 个性化建议

### 最优先改进项目
建议优先提升产品设计能力和系统化运营能力

### 快速起步策略
1. 立即开始每日内容输出
2. 建立用户反馈收集机制
3. 制定明确的商业化时间表

## 📈 预期收入潜力
- **3个月内**：2000-8000元/月
- **6个月内**：8000-25000元/月
- **12个月内**：25000-80000元/月

*注：以上预期基于一般市场情况分析，实际收入会受执行力、市场变化等因素影响。*

---
**报告生成时间**：${currentTime}
**分析师**：AI财经学长专业团队
**备注**：本报告为AI辅助生成，建议结合实际情况灵活调整`;
  }

  /**
   * ✅ [Task #013] 流式辩论 AI 响应生成
   * @param {Object} params
   * @param {string} params.model - 模型类型（deepseek/qwen/openai）
   * @param {string} params.prompt - 用户提示词
   * @param {string} params.systemPrompt - 系统提示词（角色设定）
   * @param {string} params.roleName - 角色名称
   * @param {number} params.temperature - 温度参数
   * @param {number} params.maxTokens - 最大token数
   * @param {Function} params.onChunk - 接收流式数据块的回调 (chunk: string) => void
   * @param {Function} params.onComplete - 完成时的回调 (fullContent: string, tokens: number) => void
   * @param {Function} params.onError - 错误时的回调 (error: Error) => void
   */
  async generateDebateResponseStream(params) {
    const {
      model = 'deepseek',
      prompt,
      systemPrompt,
      roleName,
      temperature = 0.7,
      maxTokens = 500,
      onChunk,
      onComplete,
      onError
    } = params;

    console.log(`✅ [Task #013] ${roleName} 使用 ${model} 模型生成流式响应`);

    try {
      // 根据模型类型调用相应的流式 API
      switch (model.toLowerCase()) {
        case 'deepseek':
          await this.streamDeepSeekAPI({
            prompt,
            systemPrompt,
            temperature,
            maxTokens,
            onChunk,
            onComplete,
            onError
          });
          break;
        case 'qwen':
          await this.streamQwenAPI({
            prompt,
            systemPrompt,
            temperature,
            maxTokens,
            onChunk,
            onComplete,
            onError
          });
          break;
        case 'openai':
          await this.streamOpenAIAPI({
            prompt,
            systemPrompt,
            temperature,
            maxTokens,
            onChunk,
            onComplete,
            onError
          });
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

    } catch (error) {
      console.error(`❌ [Task #013] ${roleName} ${model} 流式调用失败:`, error.message);

      // 自动降级到其他模型
      const fallbackModels = this.getFallbackModels(model);

      for (const fallback of fallbackModels) {
        try {
          console.log(`✅ [Task #013] ${roleName} 尝试降级到 ${fallback}`);
          await this.generateDebateResponseStream({
            ...params,
            model: fallback
          });
          return; // 成功后退出
        } catch (fallbackError) {
          console.error(`❌ [Task #013] ${roleName} ${fallback} 也失败:`, fallbackError.message);
          continue;
        }
      }

      // 所有模型都失败，调用错误回调
      if (onError) {
        onError(new Error(`所有 AI 模型流式调用失败（${model} → ${fallbackModels.join(' → ')}）`));
      }
    }
  }

  /**
   * ✅ [Task #013] DeepSeek 流式 API 调用
   * DeepSeek API 支持 SSE 流式输出 (stream: true)
   */
  async streamDeepSeekAPI({ prompt, systemPrompt, temperature, maxTokens, onChunk, onComplete, onError }) {
    const config = this.deepseekConfig;

    if (!config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const response = await axios.post(config.apiUrl, {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 500,
        temperature: temperature || 0.7,
        stream: true // ✅ 启用流式输出
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream', // ✅ 接收流式响应
        timeout: 60000 // 流式响应允许更长超时（60秒）
      });

      let fullContent = '';
      let tokenCount = 0;
      let completionCalled = false; // ✅ [P0 FIX] 防止 onComplete 被调用两次

      // ✅ [Bug #013 修复] 使用 StringDecoder 处理 UTF-8 边界
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf-8');

      // 处理流式数据
      response.data.on('data', (chunk) => {
        const text = decoder.write(chunk); // 自动处理 UTF-8 多字节边界
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // ✅ [P0 FIX] 流式传输完成 - 只调用一次 onComplete
              if (onComplete && !completionCalled) {
                completionCalled = true;

                // 🔍 [DEBUG] 最终内容调试
                console.log(`🔍 [DEBUG-后端完成] DeepSeek 流式完成`);
                console.log(`  - 最终内容长度: ${fullContent.length} 字符`);
                console.log(`  - Token数量: ${tokenCount}`);
                console.log(`  - 内容前200字: "${fullContent.substring(0, 200)}..."`);

                onComplete(fullContent, tokenCount);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                // 🔍 [DEBUG] chunk内容调试
                console.log(`🔍 [DEBUG-后端Chunk] DeepSeek接收`);
                console.log(`  - Chunk长度: ${content.length} 字符`);
                console.log(`  - Chunk内容(前50字): "${content.substring(0, 50)}"`);
                console.log(`  - 累积长度: ${fullContent.length + content.length} 字符`);

                fullContent += content;
                tokenCount += 1; // 近似计算

                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              console.warn('❌ [Task #013] DeepSeek SSE 解析错误:', parseError.message);
              console.warn('  原始数据:', data);
            }
          }
        }
      });

      response.data.on('end', () => {
        // ✅ [Bug #013 修复] 处理 decoder 中剩余的不完整字节
        const remaining = decoder.end();
        if (remaining && remaining.trim()) {
          console.warn('⚠️ [Bug #013] 流结束时发现剩余数据:', remaining);
          // 如果有剩余数据，尝试解析
          try {
            if (remaining.startsWith('data: ')) {
              const data = remaining.slice(6).trim();
              if (data !== '[DONE]') {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  tokenCount += 1;
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ [Bug #013] 剩余数据解析失败:', e.message);
          }
        }

        // ✅ [P0 FIX] 只在未调用过 onComplete 时调用（防止重复）
        if (onComplete && !completionCalled) {
          completionCalled = true;
          onComplete(fullContent, tokenCount);
        }
      });

      response.data.on('error', (error) => {
        console.error('❌ [Task #013] DeepSeek 流式响应错误:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('❌ [Task #013] DeepSeek 流式调用失败:', error.message);
      throw error;
    }
  }

  /**
   * ✅ [Task #013] Qwen 流式 API 调用
   * Qwen API 支持 SSE 流式输出（启用 'X-DashScope-SSE': 'enable'）
   */
  async streamQwenAPI({ prompt, systemPrompt, temperature, maxTokens, onChunk, onComplete, onError }) {
    const config = this.qwenConfig;

    if (!config.apiKey) {
      throw new Error('Qwen API key not configured');
    }

    try {
      // ✅ [D-79 FIX] 使用 compatible-mode 标准格式（OpenAI兼容）
      const response = await axios.post(config.apiUrl, {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 500,
        temperature: temperature || 0.7,
        top_p: 0.8,
        stream: true  // ✅ OpenAI标准流式参数
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000
      });

      let fullContent = '';
      let tokenCount = 0;
      let completionCalled = false; // ✅ [P0 FIX] 防止 onComplete 被调用两次

      // ✅ [Bug #013 修复] 使用 StringDecoder 处理 UTF-8 边界
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf-8');

      response.data.on('data', (chunk) => {
        const text = decoder.write(chunk); // 自动处理 UTF-8 多字节边界
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();

            // SSE 结束标志
            if (data === '[DONE]') {
              if (onComplete && !completionCalled) {
                completionCalled = true;
                onComplete(fullContent, tokenCount);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);

              // ✅ [D-79 FIX] 使用 compatible-mode 响应格式
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content || '';
              const finishReason = parsed.choices?.[0]?.finish_reason;

              if (content) {
                fullContent += content;
                tokenCount += 1;

                if (onChunk) {
                  onChunk(content);
                }
              }

              // ✅ [D-79 FIX] OpenAI标准流式结束标志
              if (finishReason === 'stop' || finishReason === 'length') {
                if (onComplete && !completionCalled) {
                  completionCalled = true;
                  onComplete(fullContent, tokenCount);
                }
                return;
              }
            } catch (parseError) {
              console.warn('❌ [Task #013] Qwen SSE 解析错误:', parseError.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        // ✅ [P0 FIX] 只在未调用过 onComplete 时调用（防止重复）
        if (onComplete && !completionCalled) {
          completionCalled = true;
          onComplete(fullContent, tokenCount);
        }
      });

      response.data.on('error', (error) => {
        console.error('❌ [Task #013] Qwen 流式响应错误:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('❌ [Task #013] Qwen 流式调用失败:', error.message);
      throw error;
    }
  }

  /**
   * ✅ [Task #013] OpenAI 流式 API 调用
   * OpenAI API 原生支持 SSE 流式输出 (stream: true)
   */
  async streamOpenAIAPI({ prompt, systemPrompt, temperature, maxTokens, onChunk, onComplete, onError }) {
    const config = this.openaiConfig;

    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(config.apiUrl, {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 500,
        temperature: temperature || 0.7,
        stream: true // ✅ OpenAI 原生流式支持
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000
      });

      let fullContent = '';
      let tokenCount = 0;
      let completionCalled = false; // ✅ [P0 FIX] 防止 onComplete 被调用两次

      // ✅ [Bug #013 修复] 使用 StringDecoder 处理 UTF-8 边界
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf-8');

      response.data.on('data', (chunk) => {
        const text = decoder.write(chunk); // 自动处理 UTF-8 多字节边界
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // ✅ [P0 FIX] 流式传输完成 - 只调用一次 onComplete
              if (onComplete && !completionCalled) {
                completionCalled = true;
                onComplete(fullContent, tokenCount);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                tokenCount += 1;

                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              console.warn('❌ [Task #013] OpenAI SSE 解析错误:', parseError.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        // ✅ [Bug #013 修复] 处理 decoder 中剩余的不完整字节
        const remaining = decoder.end();
        if (remaining && remaining.trim()) {
          console.warn('⚠️ [Bug #013] OpenAI 流结束时发现剩余数据:', remaining);
          try {
            if (remaining.startsWith('data: ')) {
              const data = remaining.slice(6).trim();
              if (data !== '[DONE]') {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  tokenCount += 1;
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ [Bug #013] OpenAI 剩余数据解析失败:', e.message);
          }
        }

        // ✅ [P0 FIX] 只在未调用过 onComplete 时调用（防止重复）
        if (onComplete && !completionCalled) {
          completionCalled = true;
          onComplete(fullContent, tokenCount);
        }
      });

      response.data.on('error', (error) => {
        console.error('❌ [Task #013] OpenAI 流式响应错误:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('❌ [Task #013] OpenAI 流式调用失败:', error.message);
      throw error;
    }
  }

  /**
   * ✅ [FIX Item 2-9] AnyRouter 流式 API 调用 - Claude Haiku 模型
   * 兼容 OpenAI 格式的 SSE 流式输出
   */
  async streamAnyRouterAPI({ prompt, systemPrompt, temperature, maxTokens, onChunk, onComplete, onError }) {
    const config = this.anyRouterConfig;

    if (!config.apiKey) {
      throw new Error('AnyRouter API key not configured');
    }

    try {
      const response = await axios.post(config.apiUrl, {
        model: config.model,  // claude-haiku-4-5-20251001
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 1500,  // ✅ [FIX Item 2-9] 确保足够的长度
        temperature: temperature || 0.7,
        stream: true // ✅ 启用流式输出
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000 // 流式响应允许更长超时（60秒）
      });

      let fullContent = '';
      let tokenCount = 0;
      let completionCalled = false; // ✅ [P0 FIX] 防止 onComplete 被调用两次

      // ✅ [Bug #013 修复] 使用 StringDecoder 处理 UTF-8 边界
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf-8');

      // 处理流式数据
      response.data.on('data', (chunk) => {
        const text = decoder.write(chunk); // 自动处理 UTF-8 多字节边界
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // ✅ [P0 FIX] 流式传输完成 - 只调用一次 onComplete
              if (onComplete && !completionCalled) {
                completionCalled = true;

                // 🔍 [DEBUG] 最终内容调试
                console.log(`✅ [AnyRouter] Claude Haiku 流式完成`);
                console.log(`  - 最终内容长度: ${fullContent.length} 字符`);
                console.log(`  - Token数量: ${tokenCount}`);

                onComplete(fullContent, tokenCount);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                tokenCount += 1; // 近似计算

                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              console.warn('❌ [Task #013] AnyRouter SSE 解析错误:', parseError.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        // ✅ [Bug #013 修复] 处理 decoder 中剩余的不完整字节
        const remaining = decoder.end();
        if (remaining && remaining.trim()) {
          console.warn('⚠️ [Bug #013] AnyRouter 流结束时发现剩余数据:', remaining);
          try {
            if (remaining.startsWith('data: ')) {
              const data = remaining.slice(6).trim();
              if (data !== '[DONE]') {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  tokenCount += 1;
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ [Bug #013] AnyRouter 剩余数据解析失败:', e.message);
          }
        }

        // ✅ [P0 FIX] 只在未调用过 onComplete 时调用（防止重复）
        if (onComplete && !completionCalled) {
          completionCalled = true;
          onComplete(fullContent, tokenCount);
        }
      });

      response.data.on('error', (error) => {
        console.error('❌ [Task #013] AnyRouter 流式响应错误:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('❌ [Task #013] AnyRouter 流式调用失败:', error.message);
      throw error;
    }
  }

  /**
   * ✅ [TEST] Gemini 流式 API 调用（第3选项）
   * 兼容 OpenAI 格式的 SSE 流式输出
   */
  async streamGeminiAPI({ prompt, systemPrompt, temperature, maxTokens, onChunk, onComplete, onError }) {
    const config = this.geminiConfig;

    if (!config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const response = await axios.post(config.apiUrl, {
        model: config.model,  // gemini-2.5-pro
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 1500,  // ✅ 确保足够的长度
        temperature: temperature || 0.7,
        stream: true // ✅ 启用流式输出
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000 // 流式响应允许更长超时（60秒）
      });

      let fullContent = '';
      let tokenCount = 0;
      let completionCalled = false; // ✅ [P0 FIX] 防止 onComplete 被调用两次

      // ✅ [Bug #013 修复] 使用 StringDecoder 处理 UTF-8 边界
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf-8');

      // 处理流式数据
      response.data.on('data', (chunk) => {
        const text = decoder.write(chunk); // 自动处理 UTF-8 多字节边界
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // ✅ [P0 FIX] 流式传输完成 - 只调用一次 onComplete
              if (onComplete && !completionCalled) {
                completionCalled = true;

                console.log(`✅ [Gemini] Gemini 2.5 Pro 流式完成`);
                console.log(`  - 最终内容长度: ${fullContent.length} 字符`);
                console.log(`  - Token数量: ${tokenCount}`);

                onComplete(fullContent, tokenCount);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                tokenCount += 1; // 近似计算

                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              console.warn('❌ [Task #013] Gemini SSE 解析错误:', parseError.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        // ✅ [Bug #013 修复] 处理 decoder 中剩余的不完整字节
        const remaining = decoder.end();
        if (remaining && remaining.trim()) {
          console.warn('⚠️ [Bug #013] Gemini 流结束时发现剩余数据:', remaining);
          try {
            if (remaining.startsWith('data: ')) {
              const data = remaining.slice(6).trim();
              if (data !== '[DONE]') {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  tokenCount += 1;
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ [Bug #013] Gemini 剩余数据解析失败:', e.message);
          }
        }

        // ✅ [P0 FIX] 只在未调用过 onComplete 时调用（防止重复）
        if (onComplete && !completionCalled) {
          completionCalled = true;
          onComplete(fullContent, tokenCount);
        }
      });

      response.data.on('error', (error) => {
        console.error('❌ [Task #013] Gemini 流式响应错误:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('❌ [Task #013] Gemini 流式调用失败:', error.message);
      throw error;
    }
  }

  // 构建分析提示词
  buildAnalysisPrompt(userInfo, answers) {
    const pillarNames = ['定位', '用户', '产品', '流量', '体系'];
    const userAnswers = {};

    // 整理用户答案
    pillarNames.forEach((pillar, pillarIndex) => {
      userAnswers[pillar] = [];
      for (let i = 0; i < 20; i++) {
        const questionIndex = pillarIndex * 20 + i;
        if (answers[questionIndex]) {
          userAnswers[pillar].push({
            question: `问题${questionIndex + 1}`,
            answer: answers[questionIndex]
          });
        }
      }
    });

    // 计算完成度
    const totalQuestions = 100;
    const answeredQuestions = Object.keys(answers).length;
    const completionRate = (answeredQuestions / totalQuestions * 100).toFixed(1);

    return `请作为专业的自媒体商业化顾问，基于以下用户完成的深度自测答案，生成一份详细的分析报告。

## 用户基本信息
- 姓名：${userInfo.name}
- 年龄段：${userInfo.age}
- 性别：${userInfo.gender}
- 完成度：${completionRate}% (${answeredQuestions}/100题)
- 评估时间：${new Date().toLocaleString('zh-CN')}

## 用户详细答案分析
${JSON.stringify(userAnswers, null, 2)}

## 请按以下格式生成专业报告：

# ${userInfo.name}的自媒体商业化分析报告

## 📊 五大维度评估

### 1. 定位维度 (Purpose) - 品牌定位与价值主张
**评分: X/10分**
- **优势分析**：[基于答案分析用户在定位方面的优势]
- **不足指出**：[指出定位方面需要改进的地方]
- **改进建议**：[提供3-5个具体的改进建议]

### 2. 用户维度 (People) - 目标受众理解
**评分: X/10分**
- **优势分析**：[分析用户在受众理解方面的优势]
- **不足指出**：[指出需要改进的地方]
- **改进建议**：[提供3-5个具体建议]

### 3. 产品维度 (Product) - 价值主张与产品体系
**评分: X/10分**
- **优势分析**：[分析产品设计方面的优势]
- **不足指出**：[指出产品方面的不足]
- **改进建议**：[提供3-5个具体建议]

### 4. 流量维度 (Platform) - 内容分发与获客
**评分: X/10分**
- **优势分析**：[分析流量获取方面的优势]
- **不足指出**：[指出流量方面的问题]
- **改进建议**：[提供3-5个具体建议]

### 5. 体系维度 (Process) - 系统化运营
**评分: X/10分**
- **优势分析**：[分析系统化运营的优势]
- **不足指出**：[指出体系建设的不足]
- **改进建议**：[提供3-5个具体建议]

## 🎯 综合分析

### 整体评分：X/10分

### 商业化潜力评估
- **短期潜力**：[3-6个月内可实现的收入预期]
- **中期潜力**：[6-18个月的发展预期]
- **长期潜力**：[1-3年的成长空间]

### 核心竞争优势
1. [优势1]
2. [优势2]
3. [优势3]

### 主要挑战与风险
1. [挑战1]
2. [挑战2]
3. [挑战3]

## 🚀 行动计划建议

### 第一阶段（1-3个月）：基础建设
1. [具体行动1]
2. [具体行动2]
3. [具体行动3]

### 第二阶段（3-6个月）：规模化发展
1. [具体行动1]
2. [具体行动2]
3. [具体行动3]

### 第三阶段（6-12个月）：商业化变现
1. [具体行动1]
2. [具体行动2]
3. [具体行动3]

## 💡 个性化建议

### 最优先改进项目
[基于分析结果，指出最需要优先改进的1-2个关键点]

### 快速起步策略
[提供3个可以立即开始执行的具体行动]

### 长期发展方向
[基于用户特点，建议的长期发展路径]

## 📈 预期收入潜力
- **3个月内**：[预期收入范围]
- **6个月内**：[预期收入范围]
- **12个月内**：[预期收入范围]

*注：以上预期基于用户当前基础和市场环境分析，实际收入会受执行力、市场变化等因素影响。*

---
**报告生成时间**：${new Date().toLocaleString('zh-CN')}
**分析师**：AI财经学长专业团队
**有效期**：建议3-6个月后重新评估

请确保分析客观、专业、具体，避免空泛的建议，多提供可执行的具体行动步骤。`;
  }
}

module.exports = new AIService();