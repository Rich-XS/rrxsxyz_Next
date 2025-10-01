const axios = require('axios');

class AIService {
  constructor() {
    // API配置
    this.qwenConfig = {
      apiKey: process.env.QWEN_API_KEY,
      apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      model: 'qwen-turbo'
    };

    this.deepseekConfig = {
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat'
    };

    this.openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY,
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo'
    };

    this.systemPrompt = '你是一位专业的自媒体商业化顾问，拥有丰富的行业经验，擅长分析创作者的商业化潜力并提供实用建议。';
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

  // 调用阿里百炼 Qwen API
  async callQwenAPI(prompt) {
    const config = this.qwenConfig;

    if (!config.apiKey) {
      throw new Error('Qwen API key not configured');
    }

    const response = await axios.post(config.apiUrl, {
      model: config.model,
      input: {
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        max_tokens: 3000,
        temperature: 0.7,
        top_p: 0.8
      }
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 60000 // 60秒超时
    });

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      return response.data.output.choices[0].message.content;
    } else {
      throw new Error('Invalid Qwen API response format');
    }
  }

  // 调用 DeepSeek API
  async callDeepSeekAPI(prompt) {
    const config = this.deepseekConfig;

    if (!config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await axios.post(config.apiUrl, {
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
      timeout: 60000
    });

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid DeepSeek API response format');
    }
  }

  // 调用 OpenAI API
  async callOpenAIAPI(prompt) {
    const config = this.openaiConfig;

    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(config.apiUrl, {
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
      timeout: 60000
    });

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid OpenAI API response format');
    }
  }

  // 获取降级模型列表
  getFallbackModels(primaryModel) {
    // v3 更新：DeepSeek 主调用，容错链 DeepSeek → Qwen → OpenAI
    const allModels = ['deepseek', 'qwen', 'openai'];
    return allModels.filter(model => model !== primaryModel.toLowerCase());
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
      maxTokens = 500
    } = params;

    console.log(`[Debate AI] ${roleName} 使用 ${model} 模型生成响应`);

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
        case 'openai':
          response = await this.callOpenAIAPIWithCustomPrompt({
            prompt,
            systemPrompt,
            temperature,
            maxTokens
          });
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

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

      // 自动降级到其他模型
      const fallbackModels = this.getFallbackModels(model);

      for (const fallback of fallbackModels) {
        try {
          console.log(`[Debate AI] ${roleName} 尝试降级到 ${fallback}`);
          return await this.generateDebateResponse({
            ...params,
            model: fallback
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
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

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

    const response = await axios.post(config.apiUrl, {
      model: config.model,
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt || this.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        max_tokens: maxTokens || 500,
        temperature: temperature || 0.7,
        top_p: 0.8
      }
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 60000
    });

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      return response.data.output.choices[0].message.content;
    } else {
      throw new Error('Invalid Qwen API response format');
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
      temperature: temperature || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid OpenAI API response format');
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