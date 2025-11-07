/**
 * AI 模型统一配置文件
 *
 * 创建时间: 2025-10-26
 * 用途: 集中管理所有 AI 模型的配置信息和降级链顺序
 *
 * ✅ [2025-10-29] 降级链策略（基于实测性能）:
 * Qwen (1.31s/100分，最快+最优) → GLM (4.01s/100分) → DeepSeek (5.65s/50分)
 * 注：Gemini-Balance 暂时排除（8.18s返回为空，需调试）
 */

module.exports = {
  /**
   * AI 模型降级链顺序
   * 优先级从高到低（基于2025-10-29测试结果）
   */
  FALLBACK_CHAIN: ['qwen', 'glm', 'deepseek'],

  /**
   * 模型配置
   * 每个模型包含: apiKey, apiUrl, model (模型名称)
   */
  MODELS: {
    /**
     * DeepSeek - 首选模型
     * 优点: 快速响应（10-15秒）、成本低、质量高
     * 用途: 主力模型，适合所有场景
     */
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || 'sk-5be9fab5741f4acb9fb45606d7e0ce3c',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
      description: 'DeepSeek Chat - 快速、成本低、质量高',
      timeout: 60000  // 60秒超时
    },

    /**
     * Qwen (通义千问) - 第二选择
     * 优点: 稳定性好、兼容性强、中文理解优秀
     * 用途: DeepSeek 故障时的主要备选
     */
    qwen: {
      apiKey: process.env.QWEN_API_KEY || 'sk-5be9fab5741f4acb9fb45606d7e0ce3c',
      apiUrl: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-turbo',
      description: 'Qwen Turbo - 稳定、兼容性强',
      timeout: 60000  // 60秒超时
    },

    /**
     * GLM (智谱清言) - 第三选择
     * 优点: 成本最低、中文支持好
     * 用途: 前两个模型都故障时的备选
     */
    glm: {
      apiKey: process.env.GLM_API_KEY || '84f6791d922a430db6b414f51a0ed49e.C6ORLFM5cAuCrpwW',
      apiUrl: process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-flash',
      description: 'GLM-4 Flash - 成本低、中文优化',
      timeout: 60000  // 60秒超时
    },

    /**
     * Gemini-Balance - 最后备选
     * 优点: 通过负载均衡服务，稳定性高
     * 用途: 所有其他模型都故障时的最后保障
     */
    'gemini-balance': {
      apiKey: process.env.GEMINI_BALANCE_API_KEY || 'sk-BaiWen_RRXS',
      apiUrl: process.env.GEMINI_BALANCE_API_URL || 'http://54.252.140.109:8000/v1/chat/completions',  // ✅ 修正端口：6600 → 8000
      model: 'gemini-2.5-flash',  // ✅ 去掉preview，使用稳定版
      description: 'Gemini Balance - 负载均衡、高稳定性',
      timeout: 60000  // 60秒超时
    }
  },

  /**
   * 获取模型配置
   * @param {string} modelName - 模型名称
   * @returns {object} 模型配置对象
   */
  getModelConfig(modelName) {
    const normalizedName = modelName.toLowerCase();
    return this.MODELS[normalizedName];
  },

  /**
   * 获取降级链
   * @param {string} primaryModel - 主模型名称
   * @param {Array} excludeModels - 需要排除的模型列表
   * @returns {Array} 降级模型列表
   */
  getFallbackChain(primaryModel = 'deepseek', excludeModels = []) {
    const normalizedPrimary = primaryModel.toLowerCase();
    const normalizedExclude = excludeModels.map(m => m.toLowerCase());

    // 找到主模型在链中的位置
    const primaryIndex = this.FALLBACK_CHAIN.indexOf(normalizedPrimary);

    if (primaryIndex === -1) {
      // 如果主模型不在链中，返回完整链（排除已尝试的模型）
      return this.FALLBACK_CHAIN.filter(m => !normalizedExclude.includes(m));
    }

    // 返回主模型之后的所有模型（排除已尝试的模型）
    return this.FALLBACK_CHAIN
      .slice(primaryIndex + 1)
      .filter(m => !normalizedExclude.includes(m));
  },

  /**
   * 获取模型显示名称
   * @param {string} modelName - 模型名称
   * @returns {string} 显示名称
   */
  getDisplayName(modelName) {
    const names = {
      'deepseek': 'DeepSeek',
      'qwen': 'Qwen',
      'glm': 'GLM',
      'gemini-balance': 'Gemini-Balance'
    };
    return names[modelName.toLowerCase()] || modelName;
  },

  /**
   * 获取完整降级链显示名称
   * @returns {string} 降级链字符串
   */
  getFallbackChainDisplay() {
    return this.FALLBACK_CHAIN
      .map(m => this.getDisplayName(m))
      .join(' → ');
  }
};
