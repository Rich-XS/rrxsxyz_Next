/**
 * dataValidator.js - 数据校验引擎
 *
 * 功能：自动校验AI生成内容中的数据引用，防止编造数据
 * 优先级：P0（阶段三核心任务）
 *
 * @version 1.0.0
 * @date 2025-10-12
 */

class DataValidator {
  constructor() {
    // 已知可信来源白名单
    this.trustedSources = [
      '国家统计局', '世界银行', '麦肯锡', 'Gartner',
      'IDC', 'CB Insights', '艾瑞咨询', '易观分析',
      '艾媒咨询', 'QuestMobile', 'Frost & Sullivan',
      '中国互联网络信息中心', 'CNNIC', 'iResearch',
      'McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC',
      '抖音官方', '微信官方', '小红书官方', '快手官方'
    ];

    // 数据类型正则
    this.patterns = {
      percentage: /\d+(\.\d+)?%/g,           // 百分比
      number: /\d+(\.\d+)?[万亿千百]/g,      // 数字+单位
      year: /\d{4}年/g,                      // 年份
      date: /\d{4}年\d{1,2}月/g,             // 年月
      quarter: /\d{4}年Q[1-4]/g,             // 季度
      growth: /[增长|下降|提升|降低]\s*\d+/g  // 变化趋势
    };
  }

  /**
   * 校验发言中的数据引用
   * @param {Object} speech - 发言对象
   * @returns {Object} validation - 校验结果
   */
  validate(speech) {
    const result = {
      validated: [],
      needsVerification: [],
      warnings: [],
      score: 100  // 可信度评分 (0-100)
    };

    if (!speech || !speech.content) {
      return result;
    }

    // ✅ [Bug #014 修复] 输入大小验证 - 防止 ReDoS 攻击
    const MAX_INPUT_SIZE = 50 * 1024; // 50KB
    if (speech.content.length > MAX_INPUT_SIZE) {
      console.warn(`⚠️ [DataValidator] 输入内容过大 (${speech.content.length} 字符)，已截断至 ${MAX_INPUT_SIZE} 字符`);
      speech.content = speech.content.substring(0, MAX_INPUT_SIZE);
      result.warnings.push({
        reason: '输入内容过大已截断',
        level: 'warning',
        badge: '⚠️ 内容截断'
      });
      result.score -= 5; // 截断内容扣5分
    }

    // Step 1: 提取所有数据声明
    const dataClaims = this.extractDataClaims(speech.content);

    if (dataClaims.length === 0) {
      return result;
    }

    console.log(`🔍 [DataValidator] 检测到 ${dataClaims.length} 条数据声明`);

    // Step 2: 逐条校验
    dataClaims.forEach(claim => {
      // 检查是否有来源标注
      const hasSource = this.hasSourceAttribution(claim);

      if (hasSource) {
        const source = this.extractSource(claim);
        const isTrusted = this.trustedSources.some(trusted =>
          source && source.includes(trusted)
        );

        if (isTrusted) {
          result.validated.push({
            claim,
            source,
            confidence: 'high',
            badge: '✓ 已验证来源'
          });
        } else if (source) {
          result.validated.push({
            claim,
            source,
            confidence: 'medium',
            badge: '⚠️ 来源待核实'
          });
          result.score -= 5;  // 非可信来源扣5分
        }
      } else {
        // 无来源标注，标记为需要验证
        result.needsVerification.push({
          claim,
          reason: '缺少来源标注',
          suggestion: `建议补充来源，如「根据${this.trustedSources[0]}数据...」`,
          badge: '⚠️ 需要验证'
        });
        result.score -= 10;  // 无来源扣10分
      }
    });

    // Step 3: 检测明显不合理的数据
    const unreasonable = this.detectUnreasonableData(dataClaims);
    unreasonable.forEach(item => {
      result.warnings.push({
        claim: item,
        reason: '数据异常（数值过大/过小/不符合常识）',
        level: 'warning',
        badge: '❌ 数据异常'
      });
      result.score -= 20;  // 异常数据扣20分
    });

    // 确保评分不低于0
    result.score = Math.max(0, result.score);

    console.log(`✅ [DataValidator] 校验完成 - 评分: ${result.score}/100`, {
      validated: result.validated.length,
      needsVerification: result.needsVerification.length,
      warnings: result.warnings.length
    });

    return result;
  }

  /**
   * 提取数据声明（含百分比、数字、年份的句子）
   * @param {string} content - 发言内容
   * @returns {Array} dataClaims - 数据声明数组
   */
  extractDataClaims(content) {
    // ✅ [Bug #014 修复] 防御性检查
    if (!content || typeof content !== 'string') {
      return [];
    }

    // ✅ [Bug #014 修复] 简化正则，避免回溯 - 使用 split 替代复杂正则
    const sentenceDelimiters = /[。！？.!?]/;
    const sentences = content.split(sentenceDelimiters)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
      .filter(s => s.length < 1000); // 单句最大1000字符，防止异常长句

    // 筛选包含数据的句子
    return sentences.filter(sentence => {
      // 检查是否包含任何数据模式
      return Object.values(this.patterns).some(pattern => {
        // ✅ [Bug #014 修复] 重置 lastIndex 防止全局正则状态污染
        pattern.lastIndex = 0;
        return pattern.test(sentence);
      });
    });
  }

  /**
   * 检查是否有来源标注
   * @param {string} claim - 数据声明
   * @returns {boolean} hasSource - 是否有来源
   */
  hasSourceAttribution(claim) {
    const sourceIndicators = [
      '根据', '来自', '据', '引用', '显示',
      '报告', '研究', '调查', '数据', '统计',
      '发布', '公布', '指出', '表明'
    ];

    return sourceIndicators.some(indicator => claim.includes(indicator));
  }

  /**
   * 提取来源
   * @param {string} claim - 数据声明
   * @returns {string|null} source - 来源名称
   */
  extractSource(claim) {
    // 尝试多种模式提取来源
    const patterns = [
      /根据([^，。]+?)(?:数据|报告|研究|调查|显示|指出)/,
      /来自([^，。]+?)(?:的)?(?:数据|报告|研究|调查)/,
      /据([^，。]+?)(?:数据|报告|研究|调查|显示)/,
      /引用([^，。]+?)(?:的)?(?:数据|报告|研究)/,
      /([^，。]+?)(?:数据|报告|研究|调查)显示/,
      /([^，。]+?)发布(?:的)?(?:数据|报告|研究)/
    ];

    for (const pattern of patterns) {
      const match = claim.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * 检测不合理数据（简单规则）
   * @param {Array} claims - 数据声明数组
   * @returns {Array} unreasonable - 不合理数据数组
   */
  detectUnreasonableData(claims) {
    const unreasonable = [];

    claims.forEach(claim => {
      // 规则1: 检测超过100%的百分比（排除增长率）
      const percentages = claim.match(/\d+(\.\d+)?%/g);
      if (percentages) {
        percentages.forEach(p => {
          const value = parseFloat(p);
          // 如果是增长率，允许超过100%
          const isGrowthRate = /[增长|增加|提升|上涨].*?\d+(\.\d+)?%/.test(claim);
          if (value > 100 && !isGrowthRate) {
            unreasonable.push(claim);
          }
          // 检测异常高的百分比（超过500%）
          if (value > 500) {
            unreasonable.push(claim);
          }
        });
      }

      // 规则2: 检测明显过大的数字（超过1000万亿）
      if (/\d{4,}万亿/.test(claim)) {
        unreasonable.push(claim);
      }

      // 规则3: 检测未来年份（超过当前年份+5）
      const years = claim.match(/\d{4}年/g);
      const currentYear = new Date().getFullYear();
      if (years) {
        years.forEach(yearStr => {
          const year = parseInt(yearStr);
          if (year > currentYear + 5) {
            unreasonable.push(claim);
          }
        });
      }

      // 规则4: 检测负百分比（格式错误）
      if (/-\d+%/.test(claim) && !/[下降|降低|减少]/.test(claim)) {
        unreasonable.push(claim);
      }
    });

    // 去重
    return [...new Set(unreasonable)];
  }

  /**
   * 生成前端标注HTML
   * @param {Object} validation - 校验结果
   * @returns {string} html - 标注HTML
   */
  generateBadges(validation) {
    const badges = [];

    // 已验证来源
    if (validation.validated && validation.validated.length > 0) {
      const highConfidence = validation.validated.filter(v => v.confidence === 'high').length;
      if (highConfidence > 0) {
        badges.push(`<span class="data-badge validated">✓ ${highConfidence}条已验证来源</span>`);
      }

      const mediumConfidence = validation.validated.filter(v => v.confidence === 'medium').length;
      if (mediumConfidence > 0) {
        badges.push(`<span class="data-badge medium">⚠️ ${mediumConfidence}条来源待核实</span>`);
      }
    }

    // 需要验证
    if (validation.needsVerification && validation.needsVerification.length > 0) {
      badges.push(`<span class="data-badge warning">⚠️ ${validation.needsVerification.length}条需要验证</span>`);
    }

    // 数据异常
    if (validation.warnings && validation.warnings.length > 0) {
      badges.push(`<span class="data-badge error">❌ ${validation.warnings.length}条数据异常</span>`);
    }

    // 评分标注
    const scoreColor = validation.score >= 80 ? 'good' : validation.score >= 60 ? 'medium' : 'poor';
    badges.push(`<span class="data-badge ${scoreColor}">📊 可信度 ${validation.score}/100</span>`);

    return badges.join(' ');
  }

  /**
   * 获取统计信息
   * @returns {Object} stats - 统计数据
   */
  getStats() {
    return {
      trustedSourcesCount: this.trustedSources.length,
      patternsCount: Object.keys(this.patterns).length
    };
  }

  // ========================================
  // 阶段三 T-304 扩展：4维度数据验证系统
  // ========================================

  /**
   * 1. 数据结构验证 (Structure Validation)
   * 验证辩论轮次数据结构完整性
   */
  validateRoundStructure(roundData) {
    const errors = [];

    // ✅ [T-304 异常测试] 处理 null/undefined 输入
    if (!roundData || typeof roundData !== 'object') {
      return {
        valid: false,
        errors: [{
          type: 'INVALID_INPUT',
          message: 'roundData 必须是有效对象（不能为 null/undefined）'
        }],
        fieldCount: 0
      };
    }

    const requiredFields = ['round', 'topic', 'speeches'];

    requiredFields.forEach(field => {
      if (!roundData[field]) {
        errors.push({
          type: 'MISSING_FIELD',
          field,
          message: `必填字段 "${field}" 缺失`
        });
      }
    });

    // 验证speeches数组
    if (roundData.speeches && Array.isArray(roundData.speeches)) {
      roundData.speeches.forEach((speech, index) => {
        const speechErrors = this.validateSpeechStructure(speech);
        if (!speechErrors.valid) {
          errors.push({
            type: 'INVALID_SPEECH',
            index,
            errors: speechErrors.errors
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      fieldCount: Object.keys(roundData).length
    };
  }

  /**
   * 验证发言数据结构
   */
  validateSpeechStructure(speech) {
    const errors = [];
    const required = ['roleId', 'roleName', 'content', 'round', 'timestamp'];

    required.forEach(field => {
      if (!speech[field]) {
        errors.push({
          type: 'MISSING_FIELD',
          field,
          message: `发言缺少 "${field}" 字段`
        });
      }
    });

    if (speech.content && speech.content.length < 10) {
      errors.push({
        type: 'CONTENT_TOO_SHORT',
        length: speech.content.length,
        message: `发言内容过短（${speech.content.length}字）`
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 2. 数据完整性验证 (Integrity Validation)
   * 检查辩论历史数据的完整性和连续性
   */
  validateDebateIntegrity(debateHistory, config = {}) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(debateHistory) || debateHistory.length === 0) {
      errors.push({
        type: 'EMPTY_DEBATE',
        message: '辩论历史为空'
      });
      return { valid: false, errors, warnings };
    }

    // 检查轮次连续性
    const rounds = debateHistory.map(r => r.round).sort((a, b) => a - b);
    for (let i = 1; i < rounds.length; i++) {
      if (rounds[i] !== rounds[i - 1] + 1) {
        errors.push({
          type: 'ROUND_GAP',
          expected: rounds[i - 1] + 1,
          actual: rounds[i],
          message: `轮次不连续：第${rounds[i-1]}轮后应为第${rounds[i-1]+1}轮`
        });
      }
    }

    // 检查每轮发言完整性
    debateHistory.forEach(round => {
      if (!round.speeches || round.speeches.length === 0) {
        errors.push({
          type: 'EMPTY_ROUND',
          round: round.round,
          message: `第${round.round}轮没有发言记录`
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRounds: debateHistory.length
    };
  }

  /**
   * 3. 数据一致性验证 (Consistency Validation)
   * 验证数据逻辑一致性
   */
  validateRoundConsistency(roundData) {
    const errors = [];

    // 检查所有发言的轮次号是否一致
    if (roundData.speeches) {
      roundData.speeches.forEach((speech, index) => {
        if (speech.round !== roundData.round) {
          errors.push({
            type: 'ROUND_MISMATCH',
            index,
            expected: roundData.round,
            actual: speech.round,
            message: `发言${index+1}的轮次号不一致`
          });
        }
      });
    }

    // 检查时间戳顺序
    if (roundData.speeches && roundData.speeches.length > 1) {
      for (let i = 1; i < roundData.speeches.length; i++) {
        const prevTime = new Date(roundData.speeches[i-1].timestamp);
        const currTime = new Date(roundData.speeches[i].timestamp);

        if (prevTime > currTime) {
          errors.push({
            type: 'TIMESTAMP_OUT_OF_ORDER',
            index: i,
            message: `发言${i+1}的时间戳早于发言${i}`
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 4. 数据质量评分 (Quality Scoring)
   * 综合评估辩论数据质量
   */
  assessDataQuality(debateHistory, config = {}) {
    const breakdown = {
      structure: 0,    // 结构完整性 (0-25)
      integrity: 0,    // 数据完整性 (0-25)
      consistency: 0,  // 一致性 (0-25)
      richness: 0      // 数据丰富度 (0-25)
    };

    const suggestions = [];

    // 1. 结构完整性评分
    let structureScore = 25;
    debateHistory.forEach(round => {
      const validation = this.validateRoundStructure(round);
      if (!validation.valid) {
        structureScore -= validation.errors.length * 5;
      }
    });
    breakdown.structure = Math.max(0, structureScore);

    // 2. 数据完整性评分
    const integrityResult = this.validateDebateIntegrity(debateHistory, config);
    let integrityScore = 25 - integrityResult.errors.length * 5;
    breakdown.integrity = Math.max(0, integrityScore);

    // 3. 一致性评分
    let consistencyScore = 25;
    debateHistory.forEach(round => {
      const consistencyResult = this.validateRoundConsistency(round);
      if (!consistencyResult.valid) {
        consistencyScore -= consistencyResult.errors.length * 3;
      }
    });
    breakdown.consistency = Math.max(0, consistencyScore);

    // 4. 数据丰富度评分
    const totalSpeeches = debateHistory.reduce((sum, r) =>
      sum + (r.speeches?.length || 0), 0);
    const avgSpeeches = totalSpeeches / (debateHistory.length || 1);
    const avgLength = this._calculateAvgContentLength(debateHistory);

    let richnessScore = 0;
    richnessScore += Math.min(10, avgSpeeches); // 发言数量
    richnessScore += Math.min(10, avgLength / 50); // 内容长度
    richnessScore += Math.min(5, debateHistory.length / 2); // 轮次数
    breakdown.richness = Math.round(richnessScore);

    // 生成改进建议
    if (breakdown.structure < 20) {
      suggestions.push({
        priority: 'high',
        message: `结构完整性较低（${breakdown.structure}/25），建议检查必填字段`
      });
    }

    if (avgLength < 100) {
      suggestions.push({
        priority: 'medium',
        message: `平均发言长度较短（${Math.round(avgLength)}字），建议增加内容深度`
      });
    }

    const totalScore = Object.values(breakdown).reduce((sum, s) => sum + s, 0);

    return {
      score: totalScore,
      breakdown,
      suggestions,
      summary: this._getQualitySummary(totalScore)
    };
  }

  /**
   * 批量验证（一键检查）
   */
  validateAll(debateHistory, config = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      structure: [],
      integrity: null,
      consistency: [],
      quality: null
    };

    // 结构验证
    debateHistory.forEach(round => {
      const result = this.validateRoundStructure(round);
      report.structure.push({
        round: round.round,
        valid: result.valid,
        errors: result.errors
      });
    });

    // 完整性验证
    report.integrity = this.validateDebateIntegrity(debateHistory, config);

    // 一致性验证
    debateHistory.forEach(round => {
      const result = this.validateRoundConsistency(round);
      if (!result.valid) {
        report.consistency.push({
          round: round.round,
          errors: result.errors
        });
      }
    });

    // 质量评分
    report.quality = this.assessDataQuality(debateHistory, config);

    const valid = report.structure.every(r => r.valid) &&
                  report.integrity.valid &&
                  report.consistency.length === 0;

    console.log('✅ [T-304] 批量验证完成', {
      valid,
      qualityScore: report.quality.score
    });

    return { valid, report };
  }

  // 辅助函数
  _calculateAvgContentLength(debateHistory) {
    let totalLength = 0;
    let count = 0;

    debateHistory.forEach(round => {
      if (round.speeches) {
        round.speeches.forEach(speech => {
          if (speech.content) {
            totalLength += speech.content.length;
            count++;
          }
        });
      }
    });

    return count > 0 ? totalLength / count : 0;
  }

  _getQualitySummary(score) {
    if (score >= 90) return '优秀（Excellent）';
    if (score >= 75) return '良好（Good）';
    if (score >= 60) return '及格（Fair）';
    if (score >= 40) return '较差（Poor）';
    return '极差（Critical）';
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.DataValidator = DataValidator;
}

console.log('✅ [T-304] dataValidator.js 已加载（包含4维度验证系统）');
