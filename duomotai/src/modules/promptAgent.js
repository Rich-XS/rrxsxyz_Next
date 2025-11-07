/**
 * promptAgent.js - 提示词模板库引擎
 *
 * 功能：
 * - 提示词模板管理（注册、获取、版本控制）
 * - 参数化生成（动态填充参数）
 * - Token 估算和自动裁剪
 * - 缓存机制（避免重复生成）
 *
 * 优先级：P0（阶段三核心任务 T-303）
 *
 * @version 1.0.0
 * @date 2025-10-12
 */

class PromptAgent {
  constructor(config = {}) {
    this.templates = new Map();  // Map<templateId, Template[]>
    this.cache = new Map();      // Map<cacheKey, { prompt, tokens, timestamp }>
    this.cacheTTL = config.cacheTTL || 3600000; // 缓存1小时（默认）
    this.maxCacheSize = config.maxCacheSize || 100; // 最大缓存条目数
  }

  /**
   * 注册模板
   * @param {Object} template - 模板对象
   * @param {string} template.id - 模板ID（唯一标识）
   * @param {string} template.name - 模板名称
   * @param {string} template.version - 版本号（如 'v1.0'）
   * @param {Array<string>} template.requiredParams - 必填参数列表
   * @param {Array<string>} template.optionalParams - 可选参数列表
   * @param {Function} template.template - 模板函数 (params) => string
   * @param {number} template.maxTokens - 最大 Token 数
   * @param {number} template.temperature - AI 温度参数
   * @param {Object} template.metadata - 元数据
   */
  registerTemplate(template) {
    const { id, version, name } = template;

    if (!id || !version || !name) {
      throw new Error('Template must have id, version, and name');
    }

    if (typeof template.template !== 'function') {
      throw new Error('Template.template must be a function');
    }

    if (!this.templates.has(id)) {
      this.templates.set(id, []);
    }

    const versions = this.templates.get(id);

    // 检查版本是否已存在
    const existingIndex = versions.findIndex(t => t.version === version);

    if (existingIndex >= 0) {
      console.warn(`⚠️ [PromptAgent] 覆盖现有模板: ${id}@${version}`);
      versions[existingIndex] = template; // 覆盖
    } else {
      versions.push(template);
    }

    // 按版本号排序
    versions.sort((a, b) => this._compareVersions(a.version, b.version));

    console.log(`✅ [PromptAgent] 注册模板: ${id}@${version} - ${name}`);
  }

  /**
   * 生成提示词
   * @param {string} templateId - 模板ID
   * @param {Object} params - 参数对象
   * @param {string} version - 版本号（默认'latest'）
   * @returns {Object} { prompt, tokens, metadata }
   */
  generate(templateId, params = {}, version = 'latest') {
    // 1. 获取模板
    const template = this.getTemplate(templateId, version);

    if (!template) {
      throw new Error(`Template not found: ${templateId}@${version}`);
    }

    // 2. 验证参数
    this._validateParams(params, template.requiredParams || []);

    // 3. 检查缓存
    const cacheKey = this._generateCacheKey(templateId, params, version);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`✅ [PromptAgent] 使用缓存: ${templateId}@${version}`);
      return {
        prompt: cached.prompt,
        tokens: cached.tokens,
        metadata: cached.metadata
      };
    }

    // 4. 生成提示词
    const prompt = template.template(params);

    // 5. Token 估算
    const tokens = this.estimateTokens(prompt);

    // 6. 构建结果对象
    const result = {
      prompt,
      tokens,
      metadata: {
        templateId,
        version: template.version,
        maxTokens: template.maxTokens,
        temperature: template.temperature
      }
    };

    // 7. 缓存结果
    this._addToCache(cacheKey, result);

    console.log(`✅ [PromptAgent] 生成提示词: ${templateId}@${version} (${tokens} tokens)`);

    return result;
  }

  /**
   * 获取模板
   * @param {string} templateId - 模板ID
   * @param {string} version - 版本号（'latest' 或具体版本）
   * @returns {Object|null} 模板对象
   */
  getTemplate(templateId, version = 'latest') {
    const versions = this.templates.get(templateId);

    if (!versions || versions.length === 0) {
      return null;
    }

    if (version === 'latest') {
      return versions[versions.length - 1]; // 返回最新版本
    }

    return versions.find(t => t.version === version) || null;
  }

  /**
   * 列出所有版本
   * @param {string} templateId - 模板ID
   * @returns {Array<string>} 版本列表
   */
  listVersions(templateId) {
    const versions = this.templates.get(templateId);
    return versions ? versions.map(t => t.version) : [];
  }

  /**
   * 列出所有模板
   * @returns {Array<Object>} 模板列表 [{id, name, versions}]
   */
  listTemplates() {
    const result = [];

    this.templates.forEach((versions, id) => {
      const latest = versions[versions.length - 1];
      result.push({
        id,
        name: latest.name,
        versions: versions.map(t => t.version),
        latestVersion: latest.version
      });
    });

    return result;
  }

  /**
   * Token 估算（中文约2字符=1token，英文约4字符=1token）
   * @param {string} prompt - 提示词
   * @returns {number} 估算的 Token 数
   */
  estimateTokens(prompt) {
    if (!prompt) return 0;

    // 简单启发式：中文字符多则使用 2 字符/token，否则 3 字符/token
    const chineseChars = (prompt.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = prompt.length;
    const chineseRatio = chineseChars / totalChars;

    const factor = chineseRatio > 0.5 ? 2 : 3;
    return Math.ceil(totalChars / factor);
  }

  /**
   * 自动裁剪（保留核心内容）
   * @param {string} prompt - 原始提示词
   * @param {number} maxTokens - 最大 Token 数
   * @returns {string} 裁剪后的提示词
   */
  optimize(prompt, maxTokens) {
    const currentTokens = this.estimateTokens(prompt);

    if (currentTokens <= maxTokens) {
      return prompt;
    }

    const targetLength = Math.floor(maxTokens * 2); // Token 转字符数（保守估计）

    // 简单裁剪：保留前 80%，添加省略标记
    const trimmedLength = Math.floor(targetLength * 0.8);
    const trimmed = prompt.substring(0, trimmedLength);

    console.warn(`⚠️ [PromptAgent] 提示词已裁剪: ${currentTokens} → ${maxTokens} tokens`);

    return trimmed + '\n...(内容已裁剪以优化成本)';
  }

  /**
   * 清除缓存
   * @param {string} templateId - 可选，只清除指定模板的缓存
   */
  clearCache(templateId = null) {
    if (templateId) {
      // 清除指定模板的缓存
      const keysToDelete = [];

      this.cache.forEach((value, key) => {
        if (key.startsWith(`${templateId}@`)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));

      console.log(`✅ [PromptAgent] 清除模板缓存: ${templateId} (${keysToDelete.length} 条)`);
    } else {
      // 清除所有缓存
      this.cache.clear();
      console.log('✅ [PromptAgent] 所有缓存已清除');
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp >= this.cacheTTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`✅ [PromptAgent] 清理过期缓存: ${keysToDelete.length} 条`);
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStats() {
    const templateCount = this.templates.size;
    const versionCount = Array.from(this.templates.values())
      .reduce((sum, versions) => sum + versions.length, 0);
    const cacheSize = this.cache.size;

    return {
      templateCount,
      versionCount,
      cacheSize,
      cacheTTL: this.cacheTTL,
      maxCacheSize: this.maxCacheSize
    };
  }

  // ========================================
  // 私有方法
  // ========================================

  /**
   * 验证参数
   */
  _validateParams(params, requiredParams) {
    if (!requiredParams || requiredParams.length === 0) {
      return; // 无必填参数
    }

    const missing = requiredParams.filter(p => !(p in params));

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * 生成缓存键
   */
  _generateCacheKey(templateId, params, version) {
    // 简化的缓存键生成（基于参数的 JSON 字符串）
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    return `${templateId}@${version}:${paramsStr}`;
  }

  /**
   * 添加到缓存（支持 LRU 策略）
   */
  _addToCache(cacheKey, result) {
    // 如果缓存已满，删除最早的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      prompt: result.prompt,
      tokens: result.tokens,
      metadata: result.metadata,
      timestamp: Date.now()
    });
  }

  /**
   * 版本号比较（简单实现）
   * @param {string} v1 - 版本号1（如 'v1.0'）
   * @param {string} v2 - 版本号2
   * @returns {number} -1 (v1 < v2), 0 (v1 === v2), 1 (v1 > v2)
   */
  _compareVersions(v1, v2) {
    const parts1 = v1.replace('v', '').split('.').map(Number);
    const parts2 = v2.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 !== p2) {
        return p1 - p2;
      }
    }

    return 0;
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptAgent;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.PromptAgent = PromptAgent;
}

console.log('✅ [T-303] promptAgent.js 已加载（提示词模板库引擎）');
