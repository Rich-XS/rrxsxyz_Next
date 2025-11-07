// ✅ [T-076] 模型参数优化器 - 基于用户反馈迭代优化
// 功能：收集历史反馈 → 分析性能指标 → 推荐参数调整

class ModelOptimizer {
  constructor() {
    this.storageKey = 'debate_model_feedback_history';
    this.feedbackHistory = this.loadHistory();
    this.defaultParams = {
      temperature: 0.6,
      maxTokens: 800,
      streaming: true
    };
  }

  /**
   * 记录单次辩论反馈
   */
  recordDebateFeedback(debateData) {
    const feedback = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      topic: debateData.topic,
      rounds: debateData.rounds,
      participants: debateData.participants,
      duration: debateData.duration || 0,
      tokenStats: debateData.tokenStats || {},
      delegateFeedback: debateData.delegateFeedback || '',
      satisfaction: this.extractSatisfaction(debateData.delegateFeedback),
      modelParams: debateData.modelParams || this.defaultParams,
      metrics: {
        avgTokensPerRound: debateData.tokenStats?.total ?
          Math.round(debateData.tokenStats.total / debateData.rounds) : 0,
        debateQuality: this.assessQuality(debateData),
        userEngagement: this.assessEngagement(debateData)
      }
    };

    this.feedbackHistory.push(feedback);
    this.saveHistory();

    console.log('✅ [T-076] 辩论反馈已记录', {
      id: feedback.id,
      satisfaction: feedback.satisfaction,
      quality: feedback.metrics.debateQuality
    });

    return feedback;
  }

  /**
   * 提取满意度评分 (1-5)
   */
  extractSatisfaction(feedbackText) {
    if (!feedbackText || feedbackText.trim() === '') return 3; // 默认中等

    const text = feedbackText.toLowerCase();

    // 高满意度关键词
    if (text.match(/非常满意|很好|优秀|完美|太棒了/)) return 5;
    if (text.match(/满意|不错|好/)) return 4;

    // 低满意度关键词
    if (text.match(/不满意|很差|失望/)) return 2;
    if (text.match(/非常不满|极差|糟糕/)) return 1;

    return 3; // 默认中等
  }

  /**
   * 评估辩论质量 (0-100)
   */
  assessQuality(debateData) {
    let score = 50; // 基础分

    // Token使用合理性 (+20)
    const avgTokens = debateData.tokenStats?.total / debateData.rounds || 0;
    if (avgTokens > 1500 && avgTokens < 3000) score += 20;
    else if (avgTokens < 1500) score += 10; // 太少
    else if (avgTokens > 5000) score += 5; // 太多

    // 委托人参与度 (+20)
    if (debateData.delegateInputs && debateData.delegateInputs.length > 2) score += 20;
    else if (debateData.delegateInputs && debateData.delegateInputs.length > 0) score += 10;

    // 有反馈文本 (+10)
    if (debateData.delegateFeedback && debateData.delegateFeedback.trim().length > 10) score += 10;

    return Math.min(100, score);
  }

  /**
   * 评估用户参与度 (0-100)
   */
  assessEngagement(debateData) {
    let score = 0;

    // 委托人输入次数
    const inputCount = debateData.delegateInputs?.length || 0;
    score += Math.min(50, inputCount * 10); // 最多50分

    // 反馈长度
    const feedbackLength = debateData.delegateFeedback?.length || 0;
    score += Math.min(30, Math.floor(feedbackLength / 10)); // 最多30分

    // 完成所有轮次 (+20)
    if (debateData.completedRounds === debateData.rounds) score += 20;

    return Math.min(100, score);
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions() {
    if (this.feedbackHistory.length < 3) {
      return {
        recommendation: 'insufficient_data',
        message: '历史数据不足（少于3次），继续使用默认参数',
        suggestedParams: this.defaultParams
      };
    }

    const recentFeedback = this.feedbackHistory.slice(-5); // 最近5次
    const avgSatisfaction = recentFeedback.reduce((sum, f) => sum + f.satisfaction, 0) / recentFeedback.length;
    const avgQuality = recentFeedback.reduce((sum, f) => sum + f.metrics.debateQuality, 0) / recentFeedback.length;
    const avgTokens = recentFeedback.reduce((sum, f) => sum + f.metrics.avgTokensPerRound, 0) / recentFeedback.length;

    const suggestions = [];
    const suggestedParams = { ...this.defaultParams };

    // 规则1: Token使用过多 → 降低 maxTokens
    if (avgTokens > 3000) {
      suggestedParams.maxTokens = 600;
      suggestions.push('Token使用偏高，建议降低maxTokens至600');
    } else if (avgTokens < 1500) {
      suggestedParams.maxTokens = 1000;
      suggestions.push('Token使用偏低，建议提升maxTokens至1000');
    }

    // 规则2: 满意度低 → 提高 temperature (增加创造性)
    if (avgSatisfaction < 3 && avgQuality < 60) {
      suggestedParams.temperature = 0.7;
      suggestions.push('满意度偏低，建议提高temperature至0.7（增加创造性）');
    } else if (avgSatisfaction >= 4) {
      suggestedParams.temperature = 0.6;
      suggestions.push('满意度良好，保持当前temperature (0.6)');
    }

    // 规则3: 质量高但Token多 → 优化效率
    if (avgQuality >= 75 && avgTokens > 2500) {
      suggestions.push('辩论质量优秀但Token消耗较高，可考虑使用摘要引擎优化');
    }

    return {
      recommendation: suggestions.length > 0 ? 'optimized' : 'maintain',
      message: suggestions.length > 0 ?
        '基于历史反馈，建议以下优化：\n' + suggestions.join('\n') :
        '当前参数表现良好，建议保持',
      suggestedParams,
      metrics: {
        avgSatisfaction: avgSatisfaction.toFixed(1),
        avgQuality: avgQuality.toFixed(0),
        avgTokensPerRound: avgTokens.toFixed(0),
        dataPoints: recentFeedback.length
      }
    };
  }

  /**
   * 应用优化参数到引擎
   */
  applyOptimization(debateEngine) {
    const optimization = this.getOptimizationSuggestions();

    if (optimization.recommendation === 'insufficient_data') {
      console.log('⚠️ [T-076] 数据不足，使用默认参数');
      return false;
    }

    // 更新引擎配置
    debateEngine.config.maxTokensPerRound = optimization.suggestedParams.maxTokens;
    debateEngine.config.defaultTemperature = optimization.suggestedParams.temperature;

    console.log('✅ [T-076] 模型参数已优化', optimization.suggestedParams);
    console.log('📊 [T-076] 优化依据', optimization.metrics);

    return optimization;
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    if (this.feedbackHistory.length === 0) {
      return {
        totalDebates: 0,
        avgSatisfaction: 0,
        avgQuality: 0,
        trend: 'no_data'
      };
    }

    const recentFeedback = this.feedbackHistory.slice(-10);
    const avgSatisfaction = recentFeedback.reduce((sum, f) => sum + f.satisfaction, 0) / recentFeedback.length;
    const avgQuality = recentFeedback.reduce((sum, f) => sum + f.metrics.debateQuality, 0) / recentFeedback.length;

    // 趋势分析（最近3次 vs 之前3次）
    let trend = 'stable';
    if (recentFeedback.length >= 6) {
      const recent3 = recentFeedback.slice(-3);
      const previous3 = recentFeedback.slice(-6, -3);

      const recentAvg = recent3.reduce((sum, f) => sum + f.satisfaction, 0) / 3;
      const previousAvg = previous3.reduce((sum, f) => sum + f.satisfaction, 0) / 3;

      if (recentAvg > previousAvg + 0.5) trend = 'improving';
      else if (recentAvg < previousAvg - 0.5) trend = 'declining';
    }

    return {
      totalDebates: this.feedbackHistory.length,
      avgSatisfaction: avgSatisfaction.toFixed(1),
      avgQuality: avgQuality.toFixed(0),
      trend,
      recentDebates: recentFeedback.map(f => ({
        timestamp: f.timestamp,
        topic: f.topic.substring(0, 20) + '...',
        satisfaction: f.satisfaction,
        quality: f.metrics.debateQuality
      }))
    };
  }

  /**
   * 加载历史记录
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ [T-076] 加载历史记录失败:', error);
    }
    return [];
  }

  /**
   * 保存历史记录
   */
  saveHistory() {
    try {
      // 只保留最近30条记录
      const trimmedHistory = this.feedbackHistory.slice(-30);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedHistory));
      console.log('✅ [T-076] 历史记录已保存', trimmedHistory.length, '条');
    } catch (error) {
      console.error('❌ [T-076] 保存历史记录失败:', error);
    }
  }

  /**
   * 清除历史记录
   */
  clearHistory() {
    this.feedbackHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('✅ [T-076] 历史记录已清除');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelOptimizer;
}
