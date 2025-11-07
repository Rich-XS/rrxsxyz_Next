/**
 * summaryEngine.js - 辩论摘要引擎
 *
 * 功能：智能摘要每轮辩论，控制Token消耗
 * 目标：10轮辩论 Token < 5000
 * 摘要长度：120-180字/轮
 *
 * 优先级：数据引用 > 关键建议 > 争议点
 *
 * @version 1.0.0
 * @date 2025-10-12
 */

class SummaryEngine {
  constructor() {
    this.summaries = []; // 存储所有轮次摘要
    this.maxSummaryLength = 180; // 最大摘要字数
    this.minSummaryLength = 120; // 最小摘要字数
  }

  /**
   * 摘要单轮辩论
   * @param {Object} roundData - 轮次数据
   * @param {number} roundData.round - 轮次编号
   * @param {string} roundData.topic - 本轮主题
   * @param {Array} roundData.speeches - 本轮所有发言
   * @returns {Object} summary - 摘要结果
   */
  summarizeRound(roundData) {
    // ✅ [阶段三 T-304] 验证 roundData 结构完整性（摘要前校验）
    if (typeof DataValidator !== 'undefined') {
      try {
        const validator = new DataValidator();
        const structureValidation = validator.validateRoundStructure(roundData);

        if (!structureValidation.valid) {
          console.warn(`⚠️ [T-304 summaryEngine] 第${roundData.round}轮数据结构验证失败:`, structureValidation.errors);
          console.warn(`⚠️ [T-304 summaryEngine] 将尝试继续生成摘要，但可能不完整`);
        } else {
          console.log(`✅ [T-304 summaryEngine] 第${roundData.round}轮数据结构验证通过（摘要前）`);
        }
      } catch (validationError) {
        console.error(`❌ [T-304 summaryEngine] 第${roundData.round}轮数据验证失败:`, validationError);
      }
    }

    const summary = {
      round: roundData.round,
      topic: roundData.topic,
      keyInsights: [], // 关键洞察（最多5条）
      dataHighlights: [], // 数据亮点（最多3条）
      controversies: [], // 争议焦点（最多2条）
      consensus: '', // 共识结论（如有）
      text: '', // 最终摘要文本
      characterCount: 0, // 字数统计
      tokenEstimate: 0 // Token估算
    };

    // Step 1: 提取所有数据引用
    const allDataRefs = this.extractAllDataReferences(roundData.speeches);
    summary.dataHighlights = allDataRefs.slice(0, 3);

    // Step 2: 提取关键建议（排除重复）
    const allSuggestions = this.extractUniqueSuggestions(roundData.speeches);
    summary.keyInsights = allSuggestions.slice(0, 5).map(s => s.text);

    // Step 3: 提取争议焦点（被多人提及的问题）
    const controversies = this.detectControversies(roundData.speeches);
    summary.controversies = controversies.slice(0, 2);

    // Step 4: 检测共识（多数人同意的建议）
    summary.consensus = this.detectConsensus(allSuggestions);

    // Step 5: 生成摘要文本
    summary.text = this.buildSummaryText(summary);

    // Step 6: 字数控制（优先级裁剪）
    if (summary.text.length > this.maxSummaryLength) {
      summary.text = this.trimToLength(summary.text, this.maxSummaryLength);
    }

    summary.characterCount = summary.text.length;
    summary.tokenEstimate = Math.ceil(summary.characterCount / 2); // 中文约2字符=1token

    // 保存摘要
    this.summaries.push(summary);

    return summary;
  }

  /**
   * 提取所有数据引用（去重）
   * @param {Array} speeches - 发言列表
   * @returns {Array} dataRefs - 数据引用数组
   */
  extractAllDataReferences(speeches) {
    const dataRefs = [];
    const seen = new Set();

    speeches.forEach(speech => {
      if (speech.dataRefs && Array.isArray(speech.dataRefs)) {
        speech.dataRefs.forEach(ref => {
          if (!seen.has(ref)) {
            seen.add(ref);
            dataRefs.push(ref);
          }
        });
      }
    });

    return dataRefs;
  }

  /**
   * 提取唯一建议（排除重复）
   * @param {Array} speeches - 发言列表
   * @returns {Array} suggestions - 建议数组
   */
  extractUniqueSuggestions(speeches) {
    const suggestions = [];

    speeches.forEach(speech => {
      if (speech.keyPoints && Array.isArray(speech.keyPoints)) {
        speech.keyPoints
          .filter(p => p.type === '建议')
          .forEach(point => {
            // 检查是否有相似建议（简单文本相似度）
            const similar = suggestions.find(s =>
              this.textSimilarity(s.text, point.text) > 0.7
            );

            if (!similar) {
              suggestions.push({
                text: point.text,
                speaker: speech.roleName,
                count: 1
              });
            } else {
              // 增加计数（多人提及）
              similar.count++;
            }
          });
      }
    });

    // 按提及次数排序
    return suggestions.sort((a, b) => b.count - a.count);
  }

  /**
   * 检测争议焦点（被多人提及的问题）
   * @param {Array} speeches - 发言列表
   * @returns {Array} controversies - 争议焦点数组
   */
  detectControversies(speeches) {
    const problemCounts = new Map();

    speeches.forEach(speech => {
      if (speech.keyPoints && Array.isArray(speech.keyPoints)) {
        speech.keyPoints
          .filter(p => p.type === '问题' || p.type === '风险')
          .forEach(point => {
            const key = point.text.substring(0, 20); // 取前20字作为key
            const existing = problemCounts.get(key);

            if (existing) {
              existing.count++;
              existing.speakers.add(speech.roleName);
            } else {
              problemCounts.set(key, {
                text: point.text,
                count: 1,
                speakers: new Set([speech.roleName])
              });
            }
          });
      }
    });

    // 筛选被至少2人提及的问题
    const controversies = Array.from(problemCounts.values())
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map(item => `${item.text}（${item.count}人提及）`);

    return controversies;
  }

  /**
   * 检测共识（多数人同意的建议）
   * @param {Array} suggestions - 建议列表
   * @returns {string} consensus - 共识文本
   */
  detectConsensus(suggestions) {
    // 如果某个建议被3人以上提及，视为共识
    const consensusItem = suggestions.find(s => s.count >= 3);

    if (consensusItem) {
      return `共识：${consensusItem.text}（${consensusItem.count}人同意）`;
    }

    return '';
  }

  /**
   * 构建摘要文本
   * @param {Object} summary - 摘要对象
   * @returns {string} text - 摘要文本
   */
  buildSummaryText(summary) {
    let text = `第${summary.round}轮：${summary.topic}\n`;

    // 核心洞察（最重要）
    if (summary.keyInsights.length > 0) {
      text += `核心洞察：${summary.keyInsights.join('；')}。\n`;
    }

    // 数据亮点
    if (summary.dataHighlights.length > 0) {
      text += `数据亮点：${summary.dataHighlights.join('、')}。\n`;
    }

    // 争议焦点
    if (summary.controversies.length > 0) {
      text += `争议焦点：${summary.controversies.join('；')}。\n`;
    }

    // 共识
    if (summary.consensus) {
      text += `${summary.consensus}\n`;
    }

    return text.trim();
  }

  /**
   * 裁剪文本到指定长度（保持完整性）
   * @param {string} text - 原始文本
   * @param {number} maxLength - 最大长度
   * @returns {string} trimmedText - 裁剪后文本
   */
  trimToLength(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }

    // 按优先级裁剪：保留核心洞察 > 数据亮点 > 争议焦点 > 共识
    const lines = text.split('\n');
    let result = lines[0]; // 保留标题行

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // 如果添加这行会超长，检查优先级
      if ((result + '\n' + line).length > maxLength) {
        // 优先保留"核心洞察"和"数据亮点"
        if (line.includes('核心洞察') || line.includes('数据亮点')) {
          // 裁剪这一行的内容
          const available = maxLength - result.length - 4; // -4 for "...\n"
          const trimmedLine = line.substring(0, available) + '...';
          result += '\n' + trimmedLine;
          break;
        } else {
          // 跳过低优先级行
          break;
        }
      }

      result += '\n' + line;
    }

    return result;
  }

  /**
   * 计算文本相似度（简单版本）
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {number} similarity - 相似度 (0-1)
   */
  textSimilarity(text1, text2) {
    // 简单的字符重叠率计算
    const set1 = new Set(text1.split(''));
    const set2 = new Set(text2.split(''));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * 获取所有摘要
   * @returns {Array} summaries - 摘要列表
   */
  getAllSummaries() {
    return this.summaries;
  }

  /**
   * 获取Token消耗统计
   * @returns {Object} stats - 统计数据
   */
  getTokenStats() {
    const totalTokens = this.summaries.reduce(
      (sum, s) => sum + s.tokenEstimate,
      0
    );

    return {
      rounds: this.summaries.length,
      totalTokens,
      averageTokensPerRound: this.summaries.length > 0
        ? Math.round(totalTokens / this.summaries.length)
        : 0,
      targetTokens: 5000,
      isWithinTarget: totalTokens < 5000
    };
  }

  /**
   * 重置引擎
   */
  reset() {
    this.summaries = [];
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SummaryEngine;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.SummaryEngine = SummaryEngine;
}
