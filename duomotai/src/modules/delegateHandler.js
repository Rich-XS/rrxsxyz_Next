/**
 * 委托人交互模块 - 处理与委托人的所有交互
 *
 * 功能：
 * - 提示委托人输入
 * - 管理委托人反馈
 * - 处理委托人中断
 * - 动态主题调整
 *
 * @version v1.0
 * @date 2025-10-13
 */

class DelegateHandler {
  constructor(engine) {
    this.engine = engine; // 引用主引擎实例
    this.delegateInputs = [];
  }

  /**
   * 提示委托人输入
   */
  async prompt({ type, round, message, canSkip, timeout = 30000 }) {
    return new Promise((resolve) => {
      // 强制类型转换，确保数字比较的准确性
      const currentRound = parseInt(round);
      const totalRounds = parseInt(this.engine.state.rounds);
      const isLastRound = (currentRound === totalRounds);

      this.engine.emit('delegatePrompt', {
        type,
        round,
        message,
        canSkip,
        totalRounds: totalRounds,
        isLastRound: isLastRound,
        callback: (input) => {
          resolve(input || '');
        }
      });
    });
  }

  /**
   * 处理策划阶段委托人确认
   */
  async handlePlanningConfirmation(leaderStrategy) {
    return new Promise((resolve) => {
      console.log('✅ [DelegateHandler] 准备发送 delegatePrompt 事件', {
        hasResolve: typeof resolve === 'function',
        resolveType: typeof resolve,
        strategyLength: typeof leaderStrategy === 'string' ? leaderStrategy.length : 'N/A'
      });

      this.engine.emit('delegatePrompt', {
        type: 'planning_confirmation',
        message: '领袖(委托代理)已完成初步规划，请查看并补充信息：',
        strategy: leaderStrategy,
        canSkip: false,
        callback: resolve
      });

      console.log('✅ [DelegateHandler] delegatePrompt 事件已发送，等待用户响应...');
    });
  }

  /**
   * 根据委托人反馈调整后续轮次主题
   */
  async adjustRoundTopics(feedback, currentRound, roundTopics, aiCaller, facilitator) {
    console.log(`🔄 [DelegateHandler] 根据委托人反馈动态调整后续轮次主题（从第${currentRound + 1}轮开始）`);

    // 获取已完成的轮次主题（不调整）
    const completedTopics = roundTopics.filter(t => t.round <= currentRound);
    const remainingRounds = this.engine.state.rounds - currentRound;

    if (remainingRounds <= 0) {
      console.warn('⚠️ [DelegateHandler] 所有轮次已完成，无需调整');
      return roundTopics;
    }

    try {
      // 构建 AI 提示词：基于反馈调整后续主题
      const adjustPrompt = `你是【领袖(委托代理)】，需要基于委托人的反馈，动态调整后续辩论轮次的主题。

**主议题**：${this.engine.state.topic}
**总轮数**：${this.engine.state.rounds}轮
**已完成轮次**：${currentRound}轮
**需要调整的轮次**：第${currentRound + 1}轮 ~ 第${this.engine.state.rounds}轮（共${remainingRounds}轮）

**已完成轮次的主题（不可改变）**：
${completedTopics.map(t => `第${t.round}轮: ${t.topic} / ${t.goal}`).join('\n')}

**原定后续轮次主题**：
${roundTopics.filter(t => t.round > currentRound).map(t => `第${t.round}轮: ${t.topic} / ${t.goal}`).join('\n')}

**委托人反馈**：
${feedback}

**调整要求**：
1. 基于委托人的反馈，重新规划第${currentRound + 1}轮到第${this.engine.state.rounds}轮的主题
2. 确保与已完成轮次的逻辑连贯性
3. 每轮必须包含3个部分：轮次/主题/目标
4. 必须输出${remainingRounds}轮，不多不少
5. 格式严格：第X轮 / 主题名称（20-30字）/ 目标和产出期望（30-50字）

**输出格式示例**：
第${currentRound + 1}轮 / 调整后的主题 / 明确的目标和产出
第${currentRound + 2}轮 / 调整后的主题 / 明确的目标和产出
...

请直接输出调整后的轮次规划，不要有任何其他内容。`;

      const adjustedTopicsResponse = await aiCaller.call({
        role: facilitator,
        prompt: adjustPrompt,
        temperature: 0.5, // 低温度确保格式稳定
        maxTokens: 800
      });

      const adjustedText = adjustedTopicsResponse.content || adjustedTopicsResponse;

      // 解析调整后的主题
      const roundPattern = /第(\d+)轮\s*[/／]\s*([^/／\n]+?)\s*[/／]\s*([^\n]+)/g;
      const matches = [...adjustedText.matchAll(roundPattern)];

      const adjustedTopics = matches.map(match => ({
        round: parseInt(match[1]),
        topic: match[2].trim(),
        goal: match[3].trim(),
        adjustedAt: new Date().toISOString() // 标记调整时间
      }));

      // 验证解析结果
      if (adjustedTopics.length !== remainingRounds) {
        console.warn(`⚠️ [DelegateHandler] AI 调整结果数量(${adjustedTopics.length})与预期(${remainingRounds})不符，使用降级方案`);
        return roundTopics;
      }

      // 合并：已完成的 + 调整后的
      const newTopics = [...completedTopics, ...adjustedTopics];

      console.log(`✅ [DelegateHandler] 轮次主题动态调整完成：`,
        adjustedTopics.map(t => `第${t.round}轮: ${t.topic}`).join('; ')
      );

      return newTopics;

    } catch (error) {
      console.error('❌ [DelegateHandler] 轮次主题调整失败：', error);
      // 降级：保持原主题不变
      return roundTopics;
    }
  }

  /**
   * 检测委托人反馈是否需要调整后续主题
   */
  detectTopicAdjustmentNeeded(feedback) {
    // 简单关键词检测（可扩展为AI智能检测）
    const adjustmentKeywords = [
      '调整', '改变', '换个', '不要', '应该', '建议',
      '重点', '关注', '优先', '忽略', '跳过',
      '聚焦', '深入', '展开', '细化', '简化'
    ];

    const hasKeyword = adjustmentKeywords.some(keyword => feedback.includes(keyword));

    // 长度检测：较长的反馈（>100字）可能包含重要调整意见
    const isLongFeedback = feedback.length > 100;

    const needsAdjustment = hasKeyword || isLongFeedback;

    console.log(`✅ [DelegateHandler] 主题调整检测：${needsAdjustment ? '需要' : '不需要'}（关键词: ${hasKeyword}, 长度: ${feedback.length}字）`);

    return needsAdjustment;
  }

  /**
   * 保存委托人输入
   */
  saveDelegateInput(input, phase, round, type = 'normal') {
    // 检测并处理高权重标记
    const isHighPriority = input.startsWith('[HIGH_PRIORITY]');
    const cleanInput = isHighPriority ? input.replace('[HIGH_PRIORITY]', '').trim() : input;

    const delegateInput = {
      phase,
      round,
      type,
      input: cleanInput,
      priority: isHighPriority ? 'high' : 'normal',
      timestamp: new Date().toISOString()
    };

    this.delegateInputs.push(delegateInput);
    this.engine.state.delegateInputs.push(delegateInput);

    if (isHighPriority) {
      console.log(`✅ [DelegateHandler] 委托人高权重补充信息已记录（第 ${round} 轮）:`, cleanInput.substring(0, 50) + '...');
    }

    return delegateInput;
  }

  /**
   * 获取委托人所有发言汇总
   */
  getDelegateInputsSummary() {
    if (!this.delegateInputs || this.delegateInputs.length === 0) {
      return '';
    }

    return this.delegateInputs
      .map(d => {
        const phaseText = d.phase === 'planning' ? '策划阶段' : d.phase === 'debate' ? '辩论阶段' : d.phase;
        return `[第${d.round || 0}轮 ${phaseText}] ${d.input}`;
      })
      .join('\n');
  }

  /**
   * 获取高权重委托人输入
   */
  getHighPriorityInputs(beforeRound = Infinity) {
    return this.delegateInputs
      .filter(d => d.priority === 'high' && d.round <= beforeRound)
      .map(d => `[第${d.round}轮] ${d.input}`)
      .join('\n');
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DelegateHandler;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.DelegateHandler = DelegateHandler;
}

console.log('✅ delegateHandler.js 已加载');