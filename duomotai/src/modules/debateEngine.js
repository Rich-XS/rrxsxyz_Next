// 多魔汰辩论引擎 v3 - 5阶段流程控制器
// 集成 DeepSeek API + 委托人实时交互

/**
 * 辩论引擎类 - 管理完整的风暴辩论流程
 *
 * 5 阶段流程：
 * 1. 准备阶段（Preparation）：用户输入话题、选择角色、设定轮数
 * 2. 策划阶段（Planning）：领袖分析议题，制定辩论策略
 * 3. 确认阶段（Confirmation）：委托人确认/补充信息
 * 4. 辩论阶段（Debate）：多轮辩论，委托人可实时介入
 * 5. 交付阶段（Delivery）：生成报告，感谢弹窗，收集反馈
 */

class DebateEngine {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/ai/debate',
      maxRounds: config.maxRounds || 10,
      defaultRounds: config.defaultRounds || 5,
      minRoles: config.minRoles || 8, // 必选8角色
      maxTokensPerRound: config.maxTokensPerRound || 500,
      ...config
    };

    // 状态管理
    this.state = {
      phase: 'idle', // idle, preparation, planning, confirmation, debate, delivery
      topic: '',
      background: '',
      selectedRoles: [], // 选中的角色ID数组
      rounds: this.config.defaultRounds,
      currentRound: 0,
      debateHistory: [], // 完整辩论记录
      delegateInputs: [], // 委托人发言记录
      reportData: null
    };

    // 事件监听器
    this.listeners = {
      phaseChange: [],
      roundStart: [],
      roleSpeak: [],
      delegatePrompt: [],
      error: []
    };

    // 加载角色配置
    this.loadRoles();
  }

  /**
   * 加载角色配置（从 roles.js）
   */
  loadRoles() {
    if (typeof DEBATE_ROLES !== 'undefined') {
      this.roles = DEBATE_ROLES;
      this.facilitator = FACILITATOR_ROLE;
      this.requiredFlow = REQUIRED_FLOW;
      console.log('✅ 角色配置加载成功：', this.roles.length, '个角色');
    } else {
      console.error('❌ 无法加载角色配置，请确保 roles.js 已引入');
      this.roles = [];
    }
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * ========================================
   * 阶段 1：准备阶段（Preparation）
   * ========================================
   */
  async startPreparation({ topic, background, selectedRoles, rounds }) {
    console.log('📋 进入准备阶段');

    // 验证输入
    if (!topic || topic.trim().length < 5) {
      throw new Error('话题不能少于5个字');
    }

    if (selectedRoles.length < this.config.minRoles) {
      throw new Error(`至少需要选择 ${this.config.minRoles} 个角色`);
    }

    // 更新状态
    this.state.phase = 'preparation';
    this.state.topic = topic.trim();
    this.state.background = background?.trim() || '';
    this.state.selectedRoles = selectedRoles;
    this.state.rounds = rounds || this.config.defaultRounds;

    this.emit('phaseChange', { phase: 'preparation', state: this.state });

    // 自动进入策划阶段
    await this.startPlanning();
  }

  /**
   * ========================================
   * 阶段 2：策划阶段（Planning）
   * ========================================
   */
  async startPlanning() {
    console.log('🧠 进入策划阶段 - 领袖规划辩论策略');

    this.state.phase = 'planning';
    this.emit('phaseChange', { phase: 'planning', state: this.state });

    try {
      // 调用领袖角色，生成辩论策略
      const leaderStrategy = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderPlanningPrompt(),
        temperature: 0.7,
        maxTokens: 800
      });

      // 保存领袖规划
      this.state.leaderStrategy = leaderStrategy;

      // 触发委托人确认
      this.emit('delegatePrompt', {
        type: 'planning_confirmation',
        message: '领袖已完成初步规划，请查看并补充信息：',
        strategy: leaderStrategy,
        canSkip: false
      });

      console.log('✅ 策划阶段完成，等待委托人确认');

    } catch (error) {
      console.error('❌ 策划阶段失败：', error);
      this.emit('error', { phase: 'planning', error });
      throw error;
    }
  }

  /**
   * 构建领袖规划提示词
   */
  buildLeaderPlanningPrompt() {
    const rolesInfo = this.state.selectedRoles
      .map(id => {
        const role = this.roles.find(r => r.id === id);
        return role ? `${role.shortName}（${role.description}）` : '';
      })
      .filter(Boolean)
      .join('、');

    return `你是多魔汰辩论系统的领袖，现在需要为以下辩论议题制定策略：

**辩论议题**：${this.state.topic}

**背景信息**：${this.state.background || '（无）'}

**参与角色**（共${this.state.selectedRoles.length}位）：${rolesInfo}

**辩论轮数**：${this.state.rounds}轮

请制定辩论策略：
1. **议题拆解**：将主议题拆解为${this.state.rounds}个子议题，每轮聚焦一个维度
2. **角色分工**：说明哪些角色在哪些轮次重点发言
3. **预期产出**：每轮辩论期望达成什么共识或决策
4. **委托人节点**：标注哪些轮次需要委托人重点参与

请用结构化格式输出（使用 Markdown），总字数控制在600字内。`;
  }

  /**
   * ========================================
   * 阶段 3：确认阶段（Confirmation）
   * ========================================
   */
  async confirmAndStart(delegateInput = '') {
    console.log('✅ 进入确认阶段 - 委托人补充信息');

    this.state.phase = 'confirmation';
    this.emit('phaseChange', { phase: 'confirmation', state: this.state });

    // 保存委托人输入
    if (delegateInput.trim()) {
      this.state.delegateInputs.push({
        phase: 'confirmation',
        round: 0,
        input: delegateInput.trim(),
        timestamp: new Date().toISOString()
      });
    }

    // 如果有补充信息，让领袖调整策略
    if (delegateInput.trim()) {
      try {
        const adjustedStrategy = await this.callAI({
          role: this.facilitator,
          prompt: `基于委托人的补充信息，调整辩论策略：

**原策略**：
${this.state.leaderStrategy.content || this.state.leaderStrategy}

**委托人补充**：
${delegateInput}

请输出调整后的策略（保持原格式），总字数300字内。`,
          temperature: 0.6,
          maxTokens: 500
        });

        this.state.leaderStrategy = adjustedStrategy;
        console.log('✅ 策略已根据委托人输入调整');

      } catch (error) {
        console.warn('⚠️ 策略调整失败，使用原策略：', error);
      }
    }

    // 开始辩论
    await this.startDebate();
  }

  /**
   * ========================================
   * 阶段 4：辩论阶段（Debate）
   * ========================================
   */
  async startDebate() {
    console.log('🔥 进入辩论阶段 - 开始多轮风暴辩论');

    this.state.phase = 'debate';
    this.state.currentRound = 1;
    this.emit('phaseChange', { phase: 'debate', state: this.state });

    // 执行所有轮次
    for (let round = 1; round <= this.state.rounds; round++) {
      await this.runRound(round);
    }

    // 辩论结束，进入交付阶段
    await this.startDelivery();
  }

  /**
   * 执行单轮辩论
   */
  async runRound(roundNumber) {
    console.log(`\n🎯 第 ${roundNumber}/${this.state.rounds} 轮辩论开始`);

    this.state.currentRound = roundNumber;
    this.emit('roundStart', { round: roundNumber });

    const roundData = {
      round: roundNumber,
      topic: '', // 由领袖确定本轮议题
      speeches: []
    };

    try {
      // 1. 领袖开场：介绍本轮议题
      const leaderOpening = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderOpeningPrompt(roundNumber),
        temperature: 0.7,
        maxTokens: 300
      });

      roundData.topic = this.extractRoundTopic(leaderOpening.content || leaderOpening);
      roundData.speeches.push({
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: leaderOpening.content || leaderOpening,
        timestamp: new Date().toISOString()
      });

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: leaderOpening.content || leaderOpening
      });

      // 2. 委托人开场发言机会（可选）
      if (roundNumber === 1 || roundNumber === Math.ceil(this.state.rounds / 2)) {
        const delegateOpeningInput = await this.promptDelegate({
          type: 'round_opening',
          round: roundNumber,
          message: `第 ${roundNumber} 轮辩论开始，您有什么补充或期望吗？`,
          canSkip: true
        });

        if (delegateOpeningInput?.trim()) {
          roundData.speeches.push({
            roleId: 'delegate',
            roleName: '委托人',
            content: delegateOpeningInput,
            timestamp: new Date().toISOString()
          });

          this.state.delegateInputs.push({
            phase: 'debate',
            round: roundNumber,
            type: 'opening',
            input: delegateOpeningInput,
            timestamp: new Date().toISOString()
          });
        }
      }

      // 3. 角色按流线顺序发言
      const sortedRoles = this.getSortedRoles();

      for (const role of sortedRoles) {
        const speech = await this.callAI({
          role: role,
          prompt: this.buildRoleSpeechPrompt(role, roundNumber, roundData),
          temperature: 0.8,
          maxTokens: 400
        });

        roundData.speeches.push({
          roleId: role.id,
          roleName: role.shortName,
          content: speech.content || speech,
          color: role.color,
          layer: role.layer,
          timestamp: new Date().toISOString()
        });

        this.emit('roleSpeak', {
          round: roundNumber,
          role: role,
          content: speech.content || speech
        });

        // 模拟真实辩论节奏（可选延迟）
        await this.delay(500);
      }

      // 4. 领袖总结本轮
      const leaderSummary = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderSummaryPrompt(roundNumber, roundData),
        temperature: 0.6,
        maxTokens: 350
      });

      roundData.speeches.push({
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: leaderSummary.content || leaderSummary,
        type: 'summary',
        timestamp: new Date().toISOString()
      });

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: leaderSummary.content || leaderSummary,
        type: 'summary'
      });

      // 5. 委托人轮后发言机会（可选）
      if (roundNumber < this.state.rounds) {
        const delegateClosingInput = await this.promptDelegate({
          type: 'round_closing',
          round: roundNumber,
          message: `第 ${roundNumber} 轮结束，您有什么补充或调整建议吗？`,
          canSkip: true,
          timeout: 30000 // 30秒超时
        });

        if (delegateClosingInput?.trim()) {
          roundData.speeches.push({
            roleId: 'delegate',
            roleName: '委托人',
            content: delegateClosingInput,
            timestamp: new Date().toISOString()
          });

          this.state.delegateInputs.push({
            phase: 'debate',
            round: roundNumber,
            type: 'closing',
            input: delegateClosingInput,
            timestamp: new Date().toISOString()
          });
        }
      }

      // 保存本轮数据
      this.state.debateHistory.push(roundData);
      console.log(`✅ 第 ${roundNumber} 轮辩论完成`);

    } catch (error) {
      console.error(`❌ 第 ${roundNumber} 轮辩论失败：`, error);
      this.emit('error', { phase: 'debate', round: roundNumber, error });
      throw error;
    }
  }

  /**
   * 获取排序后的角色（按必选流线 + 可选角色）
   */
  getSortedRoles() {
    const requiredRoles = [];
    const optionalRoles = [];

    this.state.selectedRoles.forEach(roleId => {
      const role = this.roles.find(r => r.id === roleId);
      if (!role) return;

      if (role.required && role.order) {
        requiredRoles.push(role);
      } else {
        optionalRoles.push(role);
      }
    });

    // 必选角色按 order 排序，可选角色随机或按ID排序
    requiredRoles.sort((a, b) => a.order - b.order);

    return [...requiredRoles, ...optionalRoles];
  }

  /**
   * 构建领袖开场提示词
   */
  buildLeaderOpeningPrompt(roundNumber) {
    const previousRounds = this.state.debateHistory
      .map(r => `第${r.round}轮：${r.topic}`)
      .join('\n');

    return `你是领袖，现在主持第 ${roundNumber}/${this.state.rounds} 轮辩论。

**主议题**：${this.state.topic}

**辩论策略**：
${this.state.leaderStrategy?.content || this.state.leaderStrategy}

${previousRounds ? `**已完成轮次**：\n${previousRounds}` : ''}

请简洁介绍本轮辩论的焦点议题和期望产出（150字内）。`;
  }

  /**
   * 构建角色发言提示词
   */
  buildRoleSpeechPrompt(role, roundNumber, roundData) {
    const recentSpeeches = roundData.speeches
      .slice(-3)
      .map(s => `${s.roleName}：${s.content}`)
      .join('\n\n');

    return `${role.systemPrompt}

**当前辩论情况**：
- 主议题：${this.state.topic}
- 当前轮次：第 ${roundNumber}/${this.state.rounds} 轮
- 本轮焦点：${roundData.topic}

${recentSpeeches ? `**最近发言**：\n${recentSpeeches}` : ''}

请基于你的角色定位发言，控制在200-300字。`;
  }

  /**
   * 构建领袖总结提示词
   */
  buildLeaderSummaryPrompt(roundNumber, roundData) {
    const speeches = roundData.speeches
      .filter(s => s.roleId !== this.facilitator.id)
      .map(s => `${s.roleName}：${s.content.substring(0, 100)}...`)
      .join('\n\n');

    return `你是领袖，现在总结第 ${roundNumber} 轮辩论。

**本轮议题**：${roundData.topic}

**发言摘要**：
${speeches}

请总结：
1. 本轮核心观点（2-3条）
2. 达成的共识或分歧点
3. 对下一轮的启示

控制在250字内。`;
  }

  /**
   * 提取本轮议题（从领袖开场发言中）
   */
  extractRoundTopic(leaderSpeech) {
    // 简单提取：取第一句话或前50字
    const match = leaderSpeech.match(/本轮.*?[:：](.+?)(?:[。\n]|$)/);
    if (match) {
      return match[1].trim();
    }
    return leaderSpeech.substring(0, 50).replace(/\n/g, ' ');
  }

  /**
   * ========================================
   * 阶段 5：交付阶段（Delivery）
   * ========================================
   */
  async startDelivery() {
    console.log('📦 进入交付阶段 - 生成报告和收集反馈');

    this.state.phase = 'delivery';
    this.emit('phaseChange', { phase: 'delivery', state: this.state });

    try {
      // 1. 生成最终报告
      const report = await this.generateReport();
      this.state.reportData = report;

      // 2. 领袖感谢致辞
      const thanksMessage = await this.callAI({
        role: this.facilitator,
        prompt: `作为领袖，辩论已完成。请代表${this.state.selectedRoles.length}位专家和系统，向委托人表达感谢和祝福（150字内）。`,
        temperature: 0.8,
        maxTokens: 250
      });

      this.emit('delegatePrompt', {
        type: 'thanks',
        message: thanksMessage.content || thanksMessage,
        report: report
      });

      // 3. 收集委托人反馈
      const feedback = await this.promptDelegate({
        type: 'feedback',
        message: '辩论已结束，请分享您的收获和建议：',
        canSkip: true,
        timeout: 60000 // 60秒
      });

      if (feedback?.trim()) {
        this.state.reportData.delegateFeedback = feedback;
      }

      console.log('✅ 交付阶段完成');
      this.emit('phaseChange', { phase: 'completed', state: this.state, report: report });

    } catch (error) {
      console.error('❌ 交付阶段失败：', error);
      this.emit('error', { phase: 'delivery', error });
      throw error;
    }
  }

  /**
   * 生成辩论报告
   */
  async generateReport() {
    console.log('📄 生成辩论报告...');

    const report = {
      metadata: {
        topic: this.state.topic,
        background: this.state.background,
        roles: this.state.selectedRoles.length,
        rounds: this.state.rounds,
        startTime: this.state.debateHistory[0]?.speeches[0]?.timestamp,
        endTime: new Date().toISOString(),
        delegateInputsCount: this.state.delegateInputs.length
      },
      summary: '',
      keyInsights: [],
      actionPlan: [],
      iterationSuggestions: [],
      fullTranscript: this.state.debateHistory
    };

    try {
      // 调用 AI 生成结构化报告
      const summaryPrompt = this.buildReportSummaryPrompt();
      const summaryResponse = await this.callAI({
        role: this.facilitator,
        prompt: summaryPrompt,
        temperature: 0.5,
        maxTokens: 1000
      });

      const summaryContent = summaryResponse.content || summaryResponse;

      // 解析 AI 输出（简单版本，实际应该更复杂的解析）
      report.summary = this.extractSection(summaryContent, '总结') || summaryContent.substring(0, 500);
      report.keyInsights = this.extractListItems(summaryContent, '核心洞察') || [];
      report.actionPlan = this.extractListItems(summaryContent, '行动计划') || [];
      report.iterationSuggestions = this.extractListItems(summaryContent, '迭代建议') || [];

    } catch (error) {
      console.warn('⚠️ 报告生成失败，使用基础模板：', error);
      report.summary = `本次辩论围绕"${this.state.topic}"展开了${this.state.rounds}轮深度讨论，共有${this.state.selectedRoles.length}位专家参与。`;
    }

    return report;
  }

  /**
   * 构建报告总结提示词
   */
  buildReportSummaryPrompt() {
    const transcript = this.state.debateHistory
      .map(round => {
        const speeches = round.speeches
          .filter(s => s.type !== 'summary')
          .map(s => `  - ${s.roleName}：${s.content.substring(0, 80)}...`)
          .join('\n');
        return `第${round.round}轮：${round.topic}\n${speeches}`;
      })
      .join('\n\n');

    return `作为领袖，请为本次辩论生成结构化报告：

**主议题**：${this.state.topic}

**辩论记录**（摘要）：
${transcript}

请按以下格式输出：

## 总结
（整体辩论的核心结论，200字）

## 核心洞察
1. ...
2. ...
3. ...

## 行动计划
1. ...
2. ...
3. ...

## 迭代建议
1. ...
2. ...

总字数800字内。`;
  }

  /**
   * 从文本中提取章节
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0].replace(/##\s*\w+/, '').trim() : null;
  }

  /**
   * 从文本中提取列表项
   */
  extractListItems(text, sectionName) {
    const section = this.extractSection(text, sectionName);
    if (!section) return [];

    const items = section.match(/\d+\.\s*(.+?)(?=\d+\.|$)/gs);
    return items ? items.map(item => item.replace(/^\d+\.\s*/, '').trim()) : [];
  }

  /**
   * ========================================
   * AI 调用接口（DeepSeek 主调用 + 容错）
   * ========================================
   */
  async callAI({ role, prompt, temperature = 0.7, maxTokens = 500 }) {
    // 构建完整请求
    const requestBody = {
      model: 'deepseek', // 主用 DeepSeek
      prompt: prompt,
      systemPrompt: role.systemPrompt,
      roleName: role.name,
      temperature: temperature,
      maxTokens: maxTokens
    };

    try {
      // 调用后端 API
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        return {
          content: data.data.content || data.data.text || data.data,
          model: data.model || 'deepseek',
          tokens: data.tokens
        };
      } else {
        throw new Error(data.error || 'API 返回数据格式错误');
      }

    } catch (error) {
      console.warn(`⚠️ AI 调用失败（${role.shortName}），尝试 fallback：`, error);

      // Fallback: 使用 JS 模拟响应（离线模式）
      return this.fallbackAI({ role, prompt });
    }
  }

  /**
   * JS Fallback: 离线模式模拟 AI 响应
   */
  fallbackAI({ role, prompt }) {
    console.log('🔄 使用 JS fallback 模拟 AI 响应');

    const templates = {
      facilitator: `作为领袖，我认为这个议题的核心在于平衡短期收益与长期价值。建议我们按以下逻辑推进：1）明确目标和约束条件；2）评估各方案的可行性；3）制定具体执行路径。各位专家请分享你们的专业视角。`,
      first_principle: `从第一性原理出发，我们需要回归本质：这个问题的根本目标是什么？剥离所有表象和假设，基本事实是什么？从这些确定性出发，最简单的解决方案可能比我们想象的更直接。`,
      devil_advocate: `我必须指出几个潜在风险：1）我们的假设是否经过充分验证？2）数据来源是否可靠？3）最坏情况下会发生什么？4）是否存在认知偏差影响判断？请用事实和数据反驳我的质疑。`,
      user_advocate: `站在用户角度，我关心的是：这个方案真的解决了用户的核心痛点吗？用户体验旅程是否顺畅？用户最担心什么？竞品为什么能吸引用户？我们必须确保一切以用户为中心。`,
      competitor: `作为竞争对手，我会这样应对你的策略：1）在你的弱点发起进攻；2）利用平台优势形成壁垒；3）通过价格战或补贴抢夺用户。你的护城河在哪里？如何应对这些威胁？`
    };

    const template = templates[role.key] || templates.facilitator;

    return {
      content: template,
      model: 'fallback-js',
      tokens: 0
    };
  }

  /**
   * ========================================
   * 委托人交互工具函数
   * ========================================
   */
  async promptDelegate({ type, round, message, canSkip, timeout = 30000 }) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('⏱️ 委托人输入超时，自动跳过');
        resolve('');
      }, timeout);

      this.emit('delegatePrompt', {
        type,
        round,
        message,
        canSkip,
        callback: (input) => {
          clearTimeout(timeoutId);
          resolve(input || '');
        }
      });
    });
  }

  /**
   * 延迟工具函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ========================================
   * 导出功能
   * ========================================
   */
  exportReportAsJSON() {
    if (!this.state.reportData) {
      throw new Error('报告尚未生成');
    }

    const json = JSON.stringify(this.state.reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `多魔汰辩论报告_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    console.log('✅ 报告已导出为 JSON');
  }

  exportReportAsPDF() {
    // TODO: 使用 html2canvas + jsPDF 生成 PDF
    console.log('📄 PDF 导出功能开发中...');
    alert('PDF 导出功能即将推出！目前请使用 JSON 格式。');
  }

  /**
   * 重置引擎状态
   */
  reset() {
    this.state = {
      phase: 'idle',
      topic: '',
      background: '',
      selectedRoles: [],
      rounds: this.config.defaultRounds,
      currentRound: 0,
      debateHistory: [],
      delegateInputs: [],
      reportData: null
    };
    console.log('🔄 辩论引擎已重置');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebateEngine;
}
