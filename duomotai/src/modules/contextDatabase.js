/**
 * 对话信息数据库（ContextDatabase）
 *
 * 功能：
 * - 存储所有发言的结构化数据
 * - 提取关键观点和争议焦点
 * - 建立发言之间的关联关系
 * - 提供上下文查询接口（支持递进式对话）
 *
 * @version v9
 * @date 2025-10-13
 */

class ContextDatabase {
  constructor() {
    this.speeches = []; // 所有发言记录
    this.keyPoints = new Map(); // 角色ID -> 关键观点列表
    this.controversies = []; // 争议焦点列表
    this.relations = []; // 发言关联关系
  }

  /**
   * 添加发言记录
   * ✅ [FIX] 增加类型检查，防止 content.match/substring 错误
   */
  addSpeech(speech) {
    // ✅ [FIX] 确保 speech.content 是字符串
    let contentText = speech.content;
    if (typeof contentText !== 'string') {
      if (contentText && typeof contentText === 'object' && contentText.content) {
        contentText = contentText.content;
      } else {
        console.warn('⚠️ addSpeech 收到非字符串 content，使用空字符串', contentText);
        contentText = '';
      }
    }

    const enrichedSpeech = {
      ...speech,
      content: contentText, // ✅ [FIX] 使用处理后的字符串
      id: `speech_${speech.round}_${speech.roleId}_${Date.now()}`,
      keyPoints: this.extractKeyPoints(contentText),
      dataRefs: this.extractDataReferences(contentText),
      timestamp: speech.timestamp || new Date().toISOString()
    };

    this.speeches.push(enrichedSpeech);

    // 更新角色关键观点索引
    if (!this.keyPoints.has(speech.roleId)) {
      this.keyPoints.set(speech.roleId, []);
    }
    this.keyPoints.get(speech.roleId).push({
      round: speech.round,
      points: enrichedSpeech.keyPoints,
      content: contentText.substring(0, 100) + '...' // ✅ [FIX] 使用处理后的字符串
    });

    // ✅ [v9] 自动保存到 LocalStorage
    this.saveToLocalStorage();

    return enrichedSpeech;
  }

  /**
   * 提取关键观点（简单规则版本）
   * ✅ [FIX] 增加类型检查，防止 content.match 错误
   */
  extractKeyPoints(content) {
    // ✅ [FIX] 类型检查：确保 content 是字符串
    if (typeof content !== 'string') {
      console.warn('⚠️ extractKeyPoints 收到非字符串参数:', typeof content);
      if (content && typeof content === 'object' && content.content) {
        content = content.content;
      } else {
        return []; // 无法提取，返回空数组
      }
    }

    const points = [];

    // 规则1：提取"建议"相关句子
    const suggestionMatches = content.match(/[建议|推荐|应该|需要|必须][^。！？]*[。！？]/g);
    if (suggestionMatches) {
      points.push(...suggestionMatches.map(s => ({ type: '建议', text: s.trim() })));
    }

    // 规则2：提取"问题"相关句子
    const problemMatches = content.match(/[问题|风险|挑战|担心|忧虑][^。！？]*[。！？]/g);
    if (problemMatches) {
      points.push(...problemMatches.map(s => ({ type: '问题', text: s.trim() })));
    }

    // 规则3：提取"数据"相关句子
    const dataMatches = content.match(/[\d]+[%|万|亿|倍|个|次|年|月|天][^。！？]*[。！？]/g);
    if (dataMatches) {
      points.push(...dataMatches.map(s => ({ type: '数据', text: s.trim() })));
    }

    return points.slice(0, 5); // 限制最多5个关键点
  }

  /**
   * 提取数据引用
   * ✅ [FIX] 增加类型检查，防止 content.match 错误
   */
  extractDataReferences(content) {
    // ✅ [FIX] 类型检查：确保 content 是字符串
    if (typeof content !== 'string') {
      console.warn('⚠️ extractDataReferences 收到非字符串参数:', typeof content);
      if (content && typeof content === 'object' && content.content) {
        content = content.content;
      } else {
        return []; // 无法提取，返回空数组
      }
    }

    const refs = [];

    // 匹配百分比、数字、年份等
    const numberMatches = content.match(/\d+[%万亿倍]/g);
    if (numberMatches) {
      refs.push(...numberMatches);
    }

    // 匹配来源引用（如"根据XX报告"）
    const sourceMatches = content.match(/根据[^，。！？]+(报告|数据|调研|分析)/g);
    if (sourceMatches) {
      refs.push(...sourceMatches);
    }

    return refs;
  }

  /**
   * 获取某角色之前的所有发言
   */
  getSpeechesByRole(roleId, beforeRound = Infinity) {
    return this.speeches.filter(s => s.roleId === roleId && s.round < beforeRound);
  }

  /**
   * 获取某角色的关键观点历史
   */
  getRoleKeyPoints(roleId) {
    return this.keyPoints.get(roleId) || [];
  }

  /**
   * 获取相关上下文（为专家提供完整背景）
   */
  getRelevantContext(roleId, currentRound) {
    return {
      // 该角色之前的发言
      myHistory: this.getSpeechesByRole(roleId, currentRound),

      // 其他角色的关键观点（精简版）
      othersKeyPoints: Array.from(this.keyPoints.entries())
        .filter(([id]) => id !== roleId)
        .map(([id, points]) => ({
          roleId: id,
          recentPoints: points.slice(-2) // 只取最近2轮的观点
        })),

      // 所有轮次的完整发言（按轮次组织）
      allRounds: this.speeches
        .filter(s => s.round < currentRound)
        .reduce((acc, speech) => {
          if (!acc[speech.round]) acc[speech.round] = [];
          acc[speech.round].push({
            roleName: speech.roleName,
            keyPoints: speech.keyPoints,
            dataRefs: speech.dataRefs
          });
          return acc;
        }, {})
    };
  }

  /**
   * 识别争议焦点（简单版本：找出多次被提及的问题）
   */
  getControversies() {
    const topicCounts = new Map();

    this.speeches.forEach(speech => {
      speech.keyPoints.forEach(point => {
        if (point.type === '问题') {
          const key = point.text.substring(0, 20); // 用前20字作为主题标识
          topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
        }
      });
    });

    // 返回被提及2次以上的问题
    return Array.from(topicCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取完整辩论时间线（用于领袖决策）
   */
  getDebateTimeline() {
    return this.speeches.map(s => ({
      round: s.round,
      speaker: s.roleName,
      keyPoints: s.keyPoints.map(p => p.text).slice(0, 2),
      hasData: s.dataRefs.length > 0
    }));
  }

  /**
   * ✅ [v9] 保存到 LocalStorage
   */
  saveToLocalStorage() {
    const data = {
      speeches: this.speeches,
      keyPoints: Array.from(this.keyPoints.entries()),
      controversies: this.controversies,
      relations: this.relations,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('v9_debate_context', JSON.stringify(data));
    console.log('✅ [v9] ContextDatabase 已保存到 LocalStorage', {
      speeches: this.speeches.length,
      roles: this.keyPoints.size
    });
  }

  /**
   * ✅ [v9] 从 LocalStorage 加载
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('v9_debate_context');
      if (saved) {
        const data = JSON.parse(saved);
        this.speeches = data.speeches || [];
        this.keyPoints = new Map(data.keyPoints || []);
        this.controversies = data.controversies || [];
        this.relations = data.relations || [];
        console.log('✅ [v9] ContextDatabase 已从 LocalStorage 加载', {
          speeches: this.speeches.length,
          roles: this.keyPoints.size,
          savedAt: data.savedAt
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [v9] LocalStorage 加载失败:', error);
      return false;
    }
  }

  /**
   * ✅ [v9] 清除 LocalStorage（用于测试或重置）
   */
  clearLocalStorage() {
    localStorage.removeItem('v9_debate_context');
    console.log('✅ [v9] ContextDatabase LocalStorage 已清除');
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextDatabase;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.ContextDatabase = ContextDatabase;
}

console.log('✅ contextDatabase.js 已加载');