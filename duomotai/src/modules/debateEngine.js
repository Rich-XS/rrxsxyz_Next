// 多魔汰辩论引擎 v9 - 真实动态对话系统（AI驱动）
// 集成 DeepSeek API + 委托人实时交互 + 对话信息数据库

/**
 * ========================================
 * 辩论引擎类 - 管理完整的风暴辩论流程
 * ========================================
 *
 * v9 重大升级：真实动态对话系统（AI驱动）
 *
 * 5 阶段流程：
 * 1. 准备阶段（Preparation）：用户输入话题、选择角色、设定轮数
 * 2. 策划阶段（Planning）：领袖(委托代理)分析议题，制定辩论策略
 * 3. 确认阶段（Confirmation）：委托人确认/补充信息
 * 4. 辩论阶段（Debate）：多轮辩论，委托人可实时介入，AI动态调整发言顺序
 * 5. 交付阶段（Delivery）：生成报告，感谢弹窗，收集反馈
 */

class DebateEngine {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/ai/debate',
      model: config.model || 'deepseek', // ✅ [测试] 切换到DeepSeek，对比流式输出质量
      maxRounds: config.maxRounds || 10,
      defaultRounds: config.defaultRounds || 5,
      minRoles: config.minRoles || 9, // 必选9角色
      maxTokensPerRound: config.maxTokensPerRound || 500,
      userPhone: config.userPhone || null, // ✅ [D-76 FIX] 用户手机号
      ...config
    };

    // ✅ [D-76 FIX] 测试用户检测（字数减半优化）
    this.isTestUser = this.config.userPhone === '13917895758';
    console.log(`🔍 [DebateEngine] 测试用户模式: ${this.isTestUser ? 'ON（字数减半）' : 'OFF（标准字数）'}`);

    // ✅ [D-91 NEW] 字数倍数调整系统 (V56.0)
    // 基准字数：当前经验值
    // 应用规则：测试用户0.5x，真实用户0.8x
    this.wordCountMultiplier = this.isTestUser ? 0.5 : 0.8;
    console.log(`📈 [D-91] 字数倍数: ${this.wordCountMultiplier}x (${this.isTestUser ? '测试用户' : '真实用户'})`);

    // ✅ [D-76 FIX] 字数限制配置（根据测试用户动态调整）
    // ✅ [D-77 FIX] 首轮开场修正：900字→800字（符合400-800字需求）
    // ✅ [D-78 FIX] 新增3个独立环节配置（轮开场、上半轮小结、预总结）
    // ✅ [D-84 FIX] 新增专家发言字数限制配置
    // ✅ [D-91 NEW] 应用倍数系统：所有字数基准值乘以 wordCountMultiplier
    const baseWordLimits = {
      leaderOpening: 800,           // 基准：800字（测试→400字，真实→640字）
      leaderOtherRounds: 150,       // 基准：150字（测试→75字，真实→120字）
      leaderRoundOpening: 100,      // 基准：100字（测试→50字，真实→80字）
      leaderHalfSummary: 200,       // 基准：200字（测试→100字，真实→160字）
      leaderPreSummary: 300,        // 基准：300字（测试→150字，真实→240字）
      planning: 700,                // 基准：700字（测试→350字，真实→560字）
      transition: 250,              // 基准：250字（测试→125字，真实→200字）
      summary: 600,                 // 基准：600字（测试→300字，真实→480字）
      expertSpeech: 400,            // 基准：400字（测试→200字，真实→320字）
    };

    // 应用倍数计算
    this.wordLimits = {};
    for (const [key, value] of Object.entries(baseWordLimits)) {
      this.wordLimits[key] = Math.round(value * this.wordCountMultiplier);
    }
    console.log(`📊 [DebateEngine] 字数限制配置（已应用${this.wordCountMultiplier}x倍数）:`, this.wordLimits);

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
      reportData: null,
      userCompleted: false, // 用户手动完成的标志
      roundTopics: [], // ✅ [#009] 结构化存储各轮主题 [{round: 1, topic: '...', goal: '...'}]
      // ✅ [Task #13] Token consumption tracking
      tokenStats: {
        total: 0,
        byRound: [],
        currentRoundTokens: 0,
        byRole: new Map(),
        history: []
      }
    };

    // ✅ [v9] 初始化对话信息数据库
    this.contextDatabase = typeof ContextDatabase !== 'undefined' ? new ContextDatabase() : null;
    if (this.contextDatabase) {
      this.contextDatabase.loadFromLocalStorage();
      console.log('✅ [v9] contextDatabase 已初始化');
    } else {
      console.warn('⚠️ [v9] contextDatabase 未加载（需引入 contextDatabase.js）');
    }

    // ✅ [模块化重构] 初始化 AI 调用器
    this.aiCaller = typeof AICaller !== 'undefined' ? new AICaller(this.config) : null;
    if (this.aiCaller) {
      // 设置 Token 更新回调
      this.aiCaller.setTokenUpdateCallback((tokens, roleId) => {
        this.updateTokenStats(tokens, roleId, this.state.currentRound);
      });
      console.log('✅ [模块化] aiCaller 已初始化');
    } else {
      console.warn('⚠️ [模块化] aiCaller 未加载（需引入 aiCaller.js）');
    }

    // ✅ [模块化重构] 初始化报告生成器
    this.reportGenerator = typeof ReportGenerator !== 'undefined' ? new ReportGenerator() : null;
    if (this.reportGenerator) {
      console.log('✅ [模块化] reportGenerator 已初始化');
    } else {
      console.warn('⚠️ [模块化] reportGenerator 未加载（需引入 reportGenerator.js）');
    }

    // ✅ [模块化重构] 初始化委托人处理器
    this.delegateHandler = typeof DelegateHandler !== 'undefined' ? new DelegateHandler(this) : null;
    if (this.delegateHandler) {
      console.log('✅ [模块化] delegateHandler 已初始化');
    } else {
      console.warn('⚠️ [模块化] delegateHandler 未加载（需引入 delegateHandler.js）');
    }

    // ✅ [阶段三 T-302] 初始化摘要引擎（Token 优化）
    this.summaryEngine = typeof SummaryEngine !== 'undefined' ? new SummaryEngine() : null;
    if (this.summaryEngine) {
      console.log('✅ [T-302] summaryEngine 已初始化，Token 优化已启用');
    } else {
      console.warn('⚠️ [T-302] summaryEngine 未加载，Token 优化未启用（需引入 summaryEngine.js）');
    }

    // ✅ [阶段三 T-304] 初始化数据校验引擎（数据质量保障）
    this.dataValidator = typeof DataValidator !== 'undefined' ? new DataValidator() : null;
    if (this.dataValidator) {
      console.log('✅ [T-304] dataValidator 已初始化，数据校验已启用');
    } else {
      console.warn('⚠️ [T-304] dataValidator 未加载，数据校验未启用（需引入 dataValidator.js）');
    }

    // ✅ [阶段三 T-303] 初始化提示词模板库（成本优化与版本管理）
    this.promptAgent = typeof PromptAgent !== 'undefined' ? new PromptAgent() : null;
    if (this.promptAgent) {
      this._initializePromptTemplates(); // 注册所有模板
      console.log('✅ [T-303] promptAgent 已初始化，提示词模板库已加载');
    } else {
      console.warn('⚠️ [T-303] promptAgent 未加载，使用原生提示词生成方式（需引入 promptAgent.js）');
    }

    // ✅ [模块化重构] 加载提示词模板
    PromptTemplates = typeof PromptTemplates !== 'undefined' ? PromptTemplates : null;
    if (PromptTemplates) {
      console.log('✅ promptTemplates 已加载（提示词模板集合）');
    } else {
      console.warn('⚠️ promptTemplates 未加载（需引入 promptTemplates.js）');
    }

    // ✅ [v9.2] 用户画像实例（由外部传入）
    this.userProfile = null;

    // 事件监听器
    this.listeners = {
      phaseChange: [],
      roundStart: [],
      roleSpeak: [],
      delegatePrompt: [],
      roundPause: [],  // ✅ [V57-P1-3] 轮次间停顿事件
      planningProgress: [],  // ✅ [V57.12 FIX] 策划进度流式显示事件
      error: [],
      tokenUpdate: []  // ✅ [Task #13] New listener for token updates
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
   * ✅ [阶段三 T-303] 初始化提示词模板（注册4个核心模板）
   */
  _initializePromptTemplates() {
    // 检查是否有 promptTemplates 模块
    if (!PromptTemplates) {
      console.warn('⚠️ promptTemplates 模块未加载，跳过模板注册');
      return;
    }

    // 模板1: leader_planning（领袖策划阶段提示词）
    this.promptAgent.registerTemplate({
      id: 'leader_planning',
      name: '领袖策划阶段提示词',
      version: 'v1.0',
      requiredParams: ['topic', 'background', 'selectedRoles', 'rounds', 'rolesInfo'],
      optionalParams: ['delegateInputs'],
      template: (params) => PromptTemplates.buildLeaderPlanningTemplate(params),
      maxTokens: 2000,
      temperature: 0.6,
      metadata: {
        author: 'system',
        createdAt: '2025-10-12',
        description: '领袖制定辩论策略的提示词，包含角色介绍、任务要求、输出格式规范',
        changelog: '初始版本'
      }
    });

    // 模板2: leader_opening（领袖开场提示词）
    this.promptAgent.registerTemplate({
      id: 'leader_opening',
      name: '领袖开场提示词',
      version: 'v1.0',
      requiredParams: ['roundNumber', 'rounds', 'topic'],
      optionalParams: ['background', 'leaderStrategy', 'selectedRoles', 'rolesInfo', 'highPriorityInputs', 'previousRounds'],
      template: (params) => PromptTemplates.buildLeaderOpeningTemplate(params),
      maxTokens: 2000, // 第一轮需要2000，其他轮300（在模板函数内部控制）
      temperature: 0.6,
      metadata: {
        author: 'system',
        createdAt: '2025-10-12',
        description: '领袖开场提示词（第1轮约900字，其他轮150字）',
        changelog: '初始版本'
      }
    });

    // 模板3: role_speech（专家发言提示词）
    this.promptAgent.registerTemplate({
      id: 'role_speech',
      name: '专家发言提示词',
      version: 'v1.0',
      requiredParams: ['role', 'roundNumber', 'rounds', 'topic', 'roundTopic', 'currentRoundSpeeches'],
      optionalParams: ['isSupplementary', 'userProfileText', 'delegateHistory', 'highPriorityInputs', 'relevantContext'],
      template: (params) => PromptTemplates.buildRoleSpeechTemplate(params),
      maxTokens: 1500,  // ✅ [FIX Item 2-9] 从800提升至1500，确保500字中文不被截断
      temperature: 0.6,
      metadata: {
        author: 'system',
        createdAt: '2025-10-12',
        description: '专家发言提示词（支持Phase 1轮流发言和Phase 2补充发言）',
        changelog: '初始版本'
      }
    });

    // 模板4: leader_summary（领袖总结提示词）
    this.promptAgent.registerTemplate({
      id: 'leader_summary',
      name: '领袖总结提示词',
      version: 'v1.0',
      requiredParams: ['roundNumber', 'roundTopic', 'speeches'],
      optionalParams: ['currentRoundInputs', 'previousHighPriorityInputs'],
      template: (params) => PromptTemplates.buildLeaderSummaryTemplate(params),
      maxTokens: 700,
      temperature: 0.6,
      metadata: {
        author: 'system',
        createdAt: '2025-10-12',
        description: '领袖单轮总结提示词（约300字）',
        changelog: '初始版本'
      }
    });

    console.log('✅ [T-303] 已注册4个核心提示词模板:', this.promptAgent.listTemplates().map(t => t.id).join(', '));
  }

  /**
   * ✅ [v9.2] 设置用户画像
   */
  setUserProfile(userProfile) {
    this.userProfile = userProfile;
    console.log('✅ [v9.2] 用户画像已集成到辩论引擎', this.userProfile?.getProfileText());
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
   * ✅ [Task #13] 更新 Token 消耗统计
   * @param {number} tokens - 消耗的 token 数量
   * @param {number|null} roleId - 角色 ID（可选）
   * @param {number|null} roundNumber - 当前辩论轮次（可选）
   */
  updateTokenStats(tokens, roleId = null, roundNumber = null) {
    if (!tokens || tokens <= 0) return;

    // 更新总消耗
    this.state.tokenStats.total += tokens;

    // 更新当前轮次消耗
    if (roundNumber !== null) {
      this.state.tokenStats.currentRoundTokens += tokens;

      // 更新 byRound 数组
      const roundIndex = this.state.tokenStats.byRound.findIndex(r => r.round === roundNumber);
      if (roundIndex >= 0) {
        this.state.tokenStats.byRound[roundIndex].tokens += tokens;
      } else {
        this.state.tokenStats.byRound.push({ round: roundNumber, tokens });
      }
    }

    // 更新 byRole Map
    if (roleId !== null) {
      const currentRoleTokens = this.state.tokenStats.byRole.get(roleId) || 0;
      this.state.tokenStats.byRole.set(roleId, currentRoleTokens + tokens);
    }

    // 添加到历史记录
    this.state.tokenStats.history.push({
      tokens,
      roleId,
      round: roundNumber,
      timestamp: new Date().toISOString()
    });

    // 触发 UI 更新事件
    this.emit('tokenUpdate', {
      total: this.state.tokenStats.total,
      currentRound: this.state.tokenStats.currentRoundTokens,
      byRound: this.state.tokenStats.byRound,
      byRole: Array.from(this.state.tokenStats.byRole.entries())
    });

    console.log('✅ [Task #13] Token 统计已更新', {
      tokens,
      roleId,
      round: roundNumber,
      total: this.state.tokenStats.total
    });
  }

  /**
   * ✅ [FIX P0-01] AI 调用桥接方法
   * 将 debateEngine 的 callAI 调用桥接到 aiCaller.call()
   */
  async callAI({ role, prompt, temperature, maxTokens, streaming, onChunk }) {
    if (!this.aiCaller) {
      throw new Error('❌ aiCaller 未初始化，无法调用 AI');
    }

    // ✅ [V57.8 DEBUG] 记录桥接前的参数
    console.log('🔍 [DEBUG-debateEngine.callAI()] 桥接前参数:', {
      roleName: role?.shortName || role?.name,
      streaming: streaming,
      streamingType: typeof streaming,
      hasOnChunk: !!onChunk,
      onChunkType: typeof onChunk,
      onChunkIsFunction: typeof onChunk === 'function',
      temperature,
      maxTokens
    });

    return await this.aiCaller.call({
      role,
      prompt,
      temperature,
      maxTokens,
      streaming,
      onChunk
    });
  }

  /**
   * ✅ [FIX P0-05] 委托人交互桥接方法
   * 将 debateEngine 的 promptDelegate 调用桥接到 delegateHandler.prompt()
   */
  async promptDelegate({ type, round, message, canSkip, timeout }) {
    if (!this.delegateHandler) {
      throw new Error('❌ delegateHandler 未初始化，无法调用委托人交互');
    }

    return await this.delegateHandler.prompt({
      type,
      round,
      message,
      canSkip,
      timeout
    });
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
    this.state.rounds = parseInt(rounds) || this.config.defaultRounds;  // ✅ [T-325] 强制转换为数字，确保类型一致

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
    console.log('🧠 进入策划阶段 - 领袖(委托代理)规划辩论策略');

    this.state.phase = 'planning';
    this.emit('phaseChange', { phase: 'planning', state: this.state });

    try {
      // ✅ [V57.8 方案A] 节流emit：每100ms或每50字符emit一次，避免频繁DOM更新
      let planningAccumulated = '';
      let lastEmitTime = Date.now();
      let lastEmitLength = 0;
      const EMIT_INTERVAL_MS = 100; // 100ms节流间隔
      const EMIT_CHAR_THRESHOLD = 50; // 50字符节流阈值
      const planningSpeechId = `speech_planning_${Date.now()}`;

      // 调用领袖(委托代理)角色，生成辩论策略
      const leaderStrategy = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderPlanningPrompt(),
        temperature: 0.6,  // ✅ [FIX #096] 降低到0.6，确保数据真实性
        maxTokens: Math.round(this.wordLimits.planning * 1.2),  // ✅ [V57.17 FIX] 从*2降低到*1.2，严格控制字数（350→420 tokens）
        streaming: true,  // ✅ [V57.8 方案A] 启用流式，配合节流逻辑
        onChunk: (chunk) => {
          planningAccumulated += chunk;

          const now = Date.now();
          const timeSinceLastEmit = now - lastEmitTime;
          const charsSinceLastEmit = planningAccumulated.length - lastEmitLength;

          // ✅ [V57.8 节流逻辑] 满足以下任一条件才emit：
          // 1. 距离上次emit >= 100ms
          // 2. 累积字符 >= 50字
          if (timeSinceLastEmit >= EMIT_INTERVAL_MS || charsSinceLastEmit >= EMIT_CHAR_THRESHOLD) {
            this.emit('planningProgress', {
              content: planningAccumulated,
              charCount: planningAccumulated.length,
              speechId: planningSpeechId,
              isStreaming: true,
              isComplete: false
            });

            lastEmitTime = now;
            lastEmitLength = planningAccumulated.length;

            console.log(`📝 [V57.8 节流emit] 策划进度: ${planningAccumulated.length} 字 (间隔: ${timeSinceLastEmit}ms)`);
          }
        }
      });

      // ✅ [V57.14 FIX] 流式完成后，发送最终 emit
      const finalContent = typeof leaderStrategy === 'string'
        ? leaderStrategy
        : (leaderStrategy?.content || '');

      this.emit('planningProgress', {
        content: finalContent,
        charCount: finalContent.length,
        speechId: planningSpeechId,
        isStreaming: false,
        isComplete: true
      });

      console.log(`✅ [V57.14] 策划完成，最终内容长度: ${finalContent.length} 字`);

      // 保存领袖(委托代理)规划
      this.state.leaderStrategy = leaderStrategy;

      // ✅ [#009] 解析并存储结构化的轮次主题
      this.parseRoundTopics(leaderStrategy);

      // 触发委托人确认（使用 Promise 等待用户响应）
      const delegateResponse = await new Promise((resolve) => {
        // ✅ [FIX BUG-009] 在 emit 前验证 resolve 函数
        console.log('✅ [BUG-009] startPlanning 准备发送 delegatePrompt 事件', {
          hasResolve: typeof resolve === 'function',
          resolveType: typeof resolve,
          strategyLength: typeof leaderStrategy === 'string' ? leaderStrategy.length : 'N/A'
        });

        // ✅ [P1-Nickname] 获取用户昵称用于个性化欢迎语
        const userNickname = typeof window !== 'undefined' && window.UserAuth ?
          (window.UserAuth.currentUser?.nickname || '尊敬的委托人') :
          '尊敬的委托人';

        this.emit('delegatePrompt', {
          type: 'planning_confirmation',
          message: '领袖(委托代理)已完成初步规划，请查看并补充信息：',
          strategy: leaderStrategy,
          canSkip: false,
          userNickname: userNickname,  // ✅ [P1-Nickname] 传递用户昵称
          callback: resolve  // 直接传递 resolve 作为回调
        });

        console.log('✅ [BUG-009] delegatePrompt 事件已发送，等待用户响应...');
      });

      console.log('✅ [BUG-009] Promise 已解析，委托人响应:', delegateResponse);

      // 如果委托人直接确认（空字符串），进入辩论
      if (delegateResponse === '' || delegateResponse === null || delegateResponse === undefined) {
        console.log('✅ [BUG-009] 委托人直接确认（空响应），调用 confirmAndStart');
        await this.confirmAndStart('');
      } else {
        console.log('✅ [BUG-009] 委托人提交了补充意见:', delegateResponse);
      }
      // 如果委托人提交了补充意见，会在 submitDelegateInput() 中处理

    } catch (error) {
      console.error('❌ 策划阶段失败：', error);
      this.emit('error', { phase: 'planning', error });
      throw error;
    }
  }

  /**
   * 构建领袖(委托代理)规划提示词
   * ✅ [T-303] 使用 PromptAgent 生成提示词，支持降级
   */
  buildLeaderPlanningPrompt() {
    // 构建角色信息
    const rolesInfo = this.state.selectedRoles
      .map(id => {
        const role = this.roles.find(r => r.id === id);
        return role ? `${role.shortName}（${role.description}）` : '';
      })
      .filter(Boolean)
      .join('、');

    // ✅ [T-303] 暂时禁用 PromptAgent，避免查找延迟
    // if (this.promptAgent) {
    //   try {
    //     const result = this.promptAgent.generate('leader_planning', {
    //       topic: this.state.topic,
    //       background: this.state.background,
    //       selectedRoles: this.state.selectedRoles,
    //       rounds: this.state.rounds,
    //       rolesInfo: rolesInfo
    //     });

    //     console.log(`✅ [T-303] 使用 PromptAgent 生成 leader_planning 提示词 (${result.tokens} tokens)`);
    //     return result.prompt;
    //   } catch (error) {
    //     console.warn(`⚠️ [T-303] PromptAgent 生成失败，使用降级方式:`, error);
    //   }
    // }

    // 降级：使用模板函数直接生成
    if (typeof PromptTemplates !== 'undefined') {
      return PromptTemplates.buildLeaderPlanningTemplate({
        topic: this.state.topic,
        background: this.state.background,
        selectedRoles: this.state.selectedRoles,
        rounds: this.state.rounds,
        rolesInfo: rolesInfo,
        wordLimits: this.wordLimits  // ✅ [D-76 FIX] 传入字数限制配置
      });
    }

    // 最后降级：简单模板
    return `请为议题"${this.state.topic}"制定${this.state.rounds}轮辩论策略`;
  }

  /**
   * ✅ [#009] 解析策划内容，提取结构化的轮次主题
   * @param {String} leaderStrategy - 领袖策划内容
   */
  parseRoundTopics(leaderStrategy) {
    const strategyText = leaderStrategy.content || leaderStrategy;

    // 正则匹配：第X轮 / 主题 / 目标
    const roundPattern = /第(\d+)轮\s*[/／]\s*([^/／\n]+?)\s*[/／]\s*([^\n]+)/g;
    const matches = [...strategyText.matchAll(roundPattern)];

    this.state.roundTopics = matches.map(match => ({
      round: parseInt(match[1]),
      topic: match[2].trim(),
      goal: match[3].trim(),
      adjustedAt: null // 记录调整时间戳（如果被动态调整）
    }));

    console.log(`✅ [#009] 解析策划主题完成：${this.state.roundTopics.length}/${this.state.rounds}轮`,
      this.state.roundTopics.map(r => `第${r.round}轮: ${r.topic}`).join('; ')
    );

    // 验证解析结果
    if (this.state.roundTopics.length !== this.state.rounds) {
      console.warn(`⚠️ [#009] 解析的轮次数(${this.state.roundTopics.length})与预期轮数(${this.state.rounds})不符，后续轮次将临时生成`);
    }
  }

  /**
   * ========================================
   * 阶段 3：确认阶段（Confirmation）
   * ========================================
   */

  /**
   * 根据委托人反馈调整策略（策划阶段重新规划）
   */
  async adjustStrategy(feedback) {
    console.log('✅ 根据委托人反馈调整策略');

    try {
      // 构建角色信息
      const rolesInfo = this.state.selectedRoles
        .map(id => {
          const role = this.roles.find(r => r.id === id);
          return role ? `${role.shortName}（${role.description}）` : '';
        })
        .filter(Boolean)
        .join('、');

      // ✅ [V57.10 FIX] 节流emit：每100ms或每50字符emit一次
      let planningAccumulated = '';
      let lastEmitTime = Date.now();
      let lastEmitLength = 0;
      const EMIT_INTERVAL_MS = 100;
      const EMIT_CHAR_THRESHOLD = 50;
      const planningSpeechId = `speech_planning_adjust_${Date.now()}`;

      const adjustedStrategy = await this.callAI({
        role: this.facilitator,
        prompt: `你现在是"多魔汰风暴辩论系统"中的核心角色【领袖(委托代理)】。

你的任务是：根据委托人的补充意见，重新调整辩论策略，制定一个详细且具有高度落地实效的优化版作战规划方案。

## 原始输入
**核心议题**：${this.state.topic}
**背景信息**：${this.state.background || '无'}
**参与角色**：${rolesInfo}（共${this.state.selectedRoles.length}位专家）
**辩论轮数**：${this.state.rounds}轮

## 原策略
${this.state.leaderStrategy.content || this.state.leaderStrategy}

## 委托人补充意见
${feedback}

## 领袖(委托代理)的职责范围
1. 策略规划：制定一个宏观的辩论主线和分轮推进逻辑，确保最终产出直接解决委托人的核心痛点
2. 话题拆解：将委托人的单一议题拆解为 ${this.state.rounds} 个递进式的、具有明确焦点的分轮辩论主题
3. 组织与约束：为每轮辩论设定明确的焦点问题和产出期望（即本轮需要解决的核心问题）
4. 代理人视角：你需要以"平衡短期收益与长期价值，注重落地性"为核心视角，组织所有子议题
5. 互动锚点：在规划中明确指出哪些关键节点（第X轮开始前或结束时）需要邀请委托人进行补充信息、点评或方向微调，以确保实效性和委托人满意度

## 工作输出格式要求（严格遵守）

### 开场客套语（必需）
用1-2句话亲切回应委托人的补充，例如："感谢您的宝贵意见！我已根据您的补充重新调整了规划方案，现为您呈上优化版本。"

### 核心议题(标题粗体)
${this.state.topic}

### 背景信息
${this.state.background || '无'}

### 领袖(委托代理)的核心策略声明(标题粗体)
用一段话（80-120字）总结调整后的辩论主线和核心目标，**重点融入委托人的补充意见**。例如：本次辩论旨在通过聚焦[痛点]，运用${this.state.selectedRoles.length}位专家角色的专业视角，在${this.state.rounds}轮内形成一套[短期可落地]、[长期可持续]的RRXS方法论升级方案。

### 参与角色阵容(标题粗体)
${rolesInfo}（共${this.state.selectedRoles.length}位专家）

### 分轮辩论主题规划(标题粗体)

请严格按照以下三列格式输出（不要颜色列，不要委托人互动列），总共 ${this.state.rounds} 轮：

每轮格式：第X轮 / 主题名称 / 本轮目标和产出期望

示例（请根据实际轮数${this.state.rounds}灵活调整内容，**重点融入委托人的补充意见**）：
分轮辩论主题规划:
第1轮 / 初始定调：当前挑战与愿景校准 / 明确痛点、目标和约束条件
第2轮 / 角色评估：核心优势与风险分析 / 评估核心定位的可行性
...（中间轮次根据${this.state.rounds}展开递进议题）
最后一轮 / 方案整合与行动步骤 / 形成高度可执行的行动清单

重要：必须严格输出 ${this.state.rounds} 轮，不多不少。

### 结束客套语（必需）
用1-2句话温暖收尾，邀请委托人确认或补充。例如："以上是根据您意见优化后的规划，期待您的确认。如果满意，咱们就开始这场精彩的风暴辩论吧！"

## 重要输出规范
1. 不要使用Markdown格式符号（如 ** # - 等），直接输出纯文本
2. 不要有空行，所有内容紧凑显示
3. 分轮规划必须严格按照"第X轮 / 主题 / 目标"三段式格式，每轮一行
4. ⚠️ 总字数严格不超过${this.wordLimits.planning}字（测试用户${this.wordLimits.planning}字，真实用户${Math.round(700 * 0.8)}字）
5. 语气专业、亲切、高效
6. 确保逻辑清晰，层次分明
7. 标题粗体, 内容正常字体, 重要关键词粗体
8. 分论辩论主题规划 粗体

现在，请基于上述指示和委托人的补充意见，立即生成优化后的完整作战规划方案。`,
        temperature: 0.5,  // ✅ [FIX #096] 降低到0.5，策略调整需要精确
        maxTokens: Math.round(this.wordLimits.planning * 1.2),  // ✅ [V57.17 FIX] 从*2降低到*1.2，严格控制字数（350→420 tokens）
        streaming: true,  // ✅ [V57.10 FIX] 启用流式输出
        onChunk: (chunk) => {  // ✅ [V57.10 FIX] 流式回调
          planningAccumulated += chunk;
          const now = Date.now();
          const timeSinceLastEmit = now - lastEmitTime;
          const charsSinceLastEmit = planningAccumulated.length - lastEmitLength;

          if (timeSinceLastEmit >= EMIT_INTERVAL_MS || charsSinceLastEmit >= EMIT_CHAR_THRESHOLD) {
            this.emit('planningProgress', {
              content: planningAccumulated,
              charCount: planningAccumulated.length,
              speechId: planningSpeechId,
              isStreaming: true,
              isComplete: false
            });
            lastEmitTime = now;
            lastEmitLength = planningAccumulated.length;
            console.log(`📝 [V57.10 节流emit] 补充策划进度: ${planningAccumulated.length} 字 (间隔: ${timeSinceLastEmit}ms)`);
          }
        }
      });

      // ✅ [V57.14 FIX] 流式完成后，发送最终 emit
      const finalAdjustedContent = typeof adjustedStrategy === 'string'
        ? adjustedStrategy
        : (adjustedStrategy?.content || '');

      this.emit('planningProgress', {
        content: finalAdjustedContent,
        charCount: finalAdjustedContent.length,
        speechId: planningSpeechId,
        isStreaming: false,
        isComplete: true
      });

      console.log(`✅ [V57.14] 补充策划完成，最终内容长度: ${finalAdjustedContent.length} 字`);

      this.state.leaderStrategy = adjustedStrategy;
      console.log('✅ 策略已根据委托人反馈调整');

      return adjustedStrategy;

    } catch (error) {
      console.error('❌ 策略调整失败：', error);
      throw error;
    }
  }

  /**
   * ✅ [#009] 调整后续轮次主题 - 使用 DelegateHandler 模块
   */
  async adjustRoundTopics(feedback, currentRound) {
    if (!this.delegateHandler) {
      this.delegateHandler = typeof DelegateHandler !== 'undefined' ?
        new DelegateHandler(this) : null;
    }

    if (this.delegateHandler && this.aiCaller) {
      const adjustedTopics = await this.delegateHandler.adjustRoundTopics(
        feedback,
        currentRound,
        this.state.roundTopics,
        this.aiCaller,
        this.facilitator
      );
      this.state.roundTopics = adjustedTopics;
      return adjustedTopics;
    } else {
      console.warn('⚠️ DelegateHandler 或 aiCaller 未加载，保持原主题不变');
      return this.state.roundTopics;
    }
  }

  /**
   * ✅ [#009] 检测是否需要调整主题 - 使用 DelegateHandler 模块
   */
  detectTopicAdjustmentNeeded(feedback) {
    if (this.delegateHandler) {
      return this.delegateHandler.detectTopicAdjustmentNeeded(feedback);
    } else {
      // 降级：简单关键词检测
      const adjustmentKeywords = ['调整', '改变', '换个', '不要', '应该', '建议'];
      return adjustmentKeywords.some(keyword => feedback.includes(keyword));
    }
  }

  async confirmAndStart(delegateInput = '') {
    console.log('✅ 进入确认阶段 - 委托人确认策略');

    this.state.phase = 'confirmation';
    this.emit('phaseChange', { phase: 'confirmation', state: this.state });

    // 保存委托人最终确认输入（如果有）
    if (delegateInput.trim()) {
      this.state.delegateInputs.push({
        phase: 'confirmation',
        round: 0,
        input: delegateInput.trim(),
        priority: 'normal', // ✅ [FIX #091] 默认优先级
        timestamp: new Date().toISOString()
      });
    }

    // ✅ [用户要求] 显示准备提示："准备开始第一轮，专家邀请入会中..."
    this.emit('roleSpeak', {
      round: 0,
      role: { id: 'system', shortName: '系统', icon: '⚙️' },
      content: '策略确认完成！正在准备开始第一轮风暴辩论，专家邀请入会中...\n\n预计需要 1-2 分钟，请稍候。', // ✅ [D-94] 移除✨表情符号
      type: 'system_notification',
      topic: '准备中',
      isComplete: true
    });

    // 延迟 2 秒，让用户看到提示
    await this.delay(2000);

    // 开始辩论（策略已在 adjustStrategy 中调整，无需重复调整）
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

    // 执行所有轮次（支持中途暂停）
    for (let round = 1; round <= this.state.rounds; round++) {
      const result = await this.runRound(round);

      // 检查是否用户主动暂停
      if (result === 'PAUSED') {
        console.log(`⏸️ 辩论在第 ${round} 轮暂停，提前进入交付阶段`);
        break; // 跳出循环，提前结束辩论
      }

      // 检查是否用户主动完成（最后一轮或手动触发）
      if (this.state.userCompleted) {
        console.log(`✅ 用户主动完成辩论，在第 ${round} 轮结束`);
        break; // 跳出循环，提前结束辩论
      }

      // ✅ [V57-P1-3] 轮次间停顿优化 - 在非最后一轮时添加2秒停顿
      if (round < this.state.rounds) {
        console.log(`⏱️ [V57-P1-3] 准备进入第 ${round + 1} 轮，停顿2秒...`);
        this.emit('roundPause', {
          round: round,
          nextRound: round + 1,
          pauseDuration: 2000,
          message: `第 ${round} 轮辩论已完成，准备进入第 ${round + 1} 轮...`
        });
        await this.delay(2000);
        console.log(`✅ [V57-P1-3] 2秒停顿完成，开始第 ${round + 1} 轮辩论`);
      }
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
      topic: '', // 由领袖(委托代理)确定本轮议题
      speeches: []
    };

    try {
      // ✅ [#009] 优先使用预定义的轮次主题（如果存在）
      const predefinedTopic = this.state.roundTopics.find(t => t.round === roundNumber);
      if (predefinedTopic) {
        roundData.topic = predefinedTopic.topic;
        console.log(`✅ [#009] 使用预定义主题：第${roundNumber}轮 - ${predefinedTopic.topic}${predefinedTopic.adjustedAt ? ' [已动态调整]' : ''}`);
      }

      // 1. 领袖(委托代理)开场：介绍本轮议题
      // ✅ [FIX V5.3-FIX4] 启用流式输出，减少等待时间
      let leaderOpeningAccumulated = '';
      const leaderOpeningSpeechId = `speech_${roundNumber}_leader_opening_${Date.now()}`;

      const leaderOpening = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderOpeningPrompt(roundNumber),
        temperature: 0.5,  // ✅ [V57.2 Issue#4] 降低到0.5加快响应速度
        // ✅ [V57.2 Issue#4] 优化maxTokens：从*2/*3降低到*1.5/*2，加快生成速度
        maxTokens: roundNumber === 1
          ? Math.round(this.wordLimits.leaderOpening * 1.5)  // 首轮400-800字 → 600-1200 tokens
          : Math.round(this.wordLimits.leaderRoundOpening * 2),  // 其他轮100-300字 → 200-600 tokens
        streaming: true, // ✅ [FIX V5.3-FIX4] 启用流式模式
        onChunk: (chunk) => {
          leaderOpeningAccumulated += chunk;
          this.emit('roleSpeak', {
            round: roundNumber,
            role: this.facilitator,
            content: leaderOpeningAccumulated,
            type: 'introduction',
            topic: roundData.topic || '准备中',
            speechId: leaderOpeningSpeechId,
            isStreaming: true,
            isComplete: false
          });
        }
      });

      // ✅ [#009] 如果没有预定义主题，使用提取逻辑（降级方案）
      if (!roundData.topic) {
        roundData.topic = this.extractRoundTopic(leaderOpening.content || leaderOpening);
        console.log(`✅ [#009] 降级：从领袖发言中提取主题 - ${roundData.topic}`);
      }

      // ✅ [FIX P0-11] 确保 content 总是字符串，不会传递对象
      const leaderContent = typeof leaderOpening === 'string'
        ? leaderOpening
        : (leaderOpening?.content || '');

      const leaderSpeech = {
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: leaderContent,
        round: roundNumber,
        timestamp: new Date().toISOString()
      };

      roundData.speeches.push(leaderSpeech);

      // ✅ [v9] 记录到对话信息数据库
      if (this.contextDatabase) {
        this.contextDatabase.addSpeech(leaderSpeech);
      }

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: leaderContent,  // ✅ [FIX P0-11] 使用已提取的字符串内容
        type: 'introduction',  // ✅ [FIX P0-08] 标记为开场发言，用于高优先级语音打断
        topic: roundData.topic,  // ✅ [Task #132] 传递本轮话题用于突显
        speechId: leaderOpeningSpeechId,  // ✅ [FIX V5.3-FIX4] 使用相同的speechId
        isStreaming: false,  // ✅ [FIX V5.3-FIX4] 流式已完成
        isComplete: true  // ✅ [FIX P0-02] 标记为完成，触发语音朗读
      });

      // ✅ [FIX BUG#1 P0] 竞态条件修复：给 speakText() 足够时间完成入队
      // 问题根因：roleSpeak 事件触发 speakText() 是异步的，需要时间将内容加入 voiceQueue
      // 如果立即调用 waitForVoiceOrDelay()，会在 speakText() 还未完成入队时检查队列
      // 结果：voiceQueue 仍为空，getCurrentVoicePromise() 立即 resolve，phase 转换不等待
      // 修复：延迟 200ms 确保 speakText() 已完成入队，voiceQueue 不再为空
      await this.delay(200);
      console.log('✅ [BUG#1 FIX] speakText() 入队完成，开始等待语音播放...');

      // ✅ [D-63] 等待语音与文字流完成后再继续（Option B - 语音打开时）
      await this.waitForVoiceOrDelay();

      // 2. ✅ [Task #134] 委托人开场发言机会（每轮都提供）
      const delegateOpeningInput = await this.promptDelegate({
        type: 'round_opening',
        round: roundNumber,
        message: `第 ${roundNumber} 轮辩论开始，您有什么补充或期望吗？`,
        canSkip: true
      });

      if (delegateOpeningInput?.trim()) {
        const delegateSpeech = {
          roleId: 'delegate',
          roleName: '委托人',
          content: delegateOpeningInput,
          round: roundNumber,
          timestamp: new Date().toISOString()
        };

        roundData.speeches.push(delegateSpeech);

        // ✅ [v9] 记录到对话信息数据库
        if (this.contextDatabase) {
          this.contextDatabase.addSpeech(delegateSpeech);
        }

        this.state.delegateInputs.push({
          phase: 'debate',
          round: roundNumber,
          type: 'opening',
          input: delegateOpeningInput,
          priority: 'normal', // ✅ [FIX #091] 默认优先级
          timestamp: new Date().toISOString()
        });

        // ✅ [V57.3 FIX] 开场补充显示到UI（修复Issue#9遗漏Bug）
        this.emit('roleSpeak', {
          round: roundNumber,
          role: { id: 'delegate', shortName: '委托人', icon: '💬' },
          content: delegateOpeningInput,
          phase: 'round_robin',  // 开场阶段
          topic: roundData.topic,
          isComplete: true
        });
      }

      // 3. ✅ [v9.1] 两阶段发言流程（全员发言 + 动态补充）
      const alreadySpoken = []; // 追踪已发言专家（允许重复邀请）
      const speakerCount = {}; // ✅ [v9] 统计每个专家发言次数

      // ✅ [v9.1] 动态计算限制（基于参与专家数）
      const participantRoles = this.state.selectedRoles
        .map(id => this.roles.find(r => r.id === id))
        .filter(role => role && role.id !== this.facilitator.id);
      const participantCount = participantRoles.length;

      const MAX_SPEAKER_TIMES = 2; // 单专家最多发言2次
      const MAX_ROUND_SPEECHES = participantCount * 2; // 单轮最多总发言 = 专家数 × 2
      const MAX_ITERATIONS = 50; // ✅ [FIX #125] 降低阈值从100到50，更快触发保护
      const MAX_CONSECUTIVE_FAILURES = 10; // ✅ [FIX #125] 连续失败计数器阈值
      let iterationCount = 0; // 安全计数器
      let consecutiveFailures = 0; // ✅ [FIX #125] 追踪连续无效决策次数

      console.log(`📊 [v9.1] 本轮参与专家：${participantCount}人，单轮最多发言：${MAX_ROUND_SPEECHES}次`);

      // ✅ [v9.1] Phase 1: 全员发言（每个专家发言一次）
      console.log(`🎤 [v9.1] Phase 1: 全员发言阶段开始（${participantCount}位专家）`);

      for (const role of participantRoles) {
        // 专家发言
        console.log(`🎤 [v9.1] ${role.shortName} 开始发言...（第1次，全员发言）`);

        // ✅ [Task #013] 启用流式输出
        let accumulatedContent = ''; // 累积流式内容
        const speechId = `speech_${roundNumber}_${role.id}_${Date.now()}`; // 唯一ID用于增量更新

        // 🔍 [DEBUG] 生成提示词并记录
        const generatedPrompt = this.buildRoleSpeechPrompt(role, roundNumber, roundData, false);
        console.log(`🔍 [DEBUG-提示词] ${role.shortName} 提示词长度: ${generatedPrompt.length} 字符`);
        console.log(`🔍 [DEBUG-提示词] 前500字: ${generatedPrompt.substring(0, 500)}...`);

        const speech = await this.callAI({
          role: role,
          prompt: generatedPrompt, // Phase 1: 轮流发言
          temperature: 0.5,  // ✅ [V57.2 Issue#5] 降低到0.5加快响应速度
          maxTokens: Math.round(this.wordLimits.expertSpeech * 1.5),  // ✅ [V57.2 Issue#5] 从*2降低到*1.5，加快生成速度（测试200字→300 tokens）
          streaming: true, // ✅ [Task #013] 启用流式模式
          onChunk: (chunk) => {
            // 🔍 [DEBUG] 记录每个chunk的内容
            console.log(`🔍 [DEBUG-Chunk] ${role.shortName} 接收到chunk: 长度=${chunk.length}, 内容="${chunk.substring(0, 50)}..."`);

            // ✅ [Task #013] 接收到每个数据块时，发送增量更新事件
            accumulatedContent += chunk;
            this.emit('roleSpeak', {
              round: roundNumber,
              role: role,
              content: accumulatedContent,
              phase: 'round_robin',
              topic: roundData.topic,
              speechId: speechId, // ✅ [Task #013] 唯一ID用于增量更新
              isStreaming: true, // ✅ [Task #013] 标记为流式模式
              isComplete: false // ✅ [Task #013] 标记为未完成
            });
          }
        });

        // 🔍 [DEBUG] 记录最终内容
        console.log(`🔍 [DEBUG-最终内容] ${role.shortName} accumulatedContent长度: ${accumulatedContent.length}`);
        console.log(`🔍 [DEBUG-最终内容] ${role.shortName} speech.content长度: ${speech.content ? speech.content.length : 'undefined'}`);
        console.log(`🔍 [DEBUG-最终内容] ${role.shortName} 累积内容前200字: ${accumulatedContent.substring(0, 200)}...`);

        // ✅ [FIX P0-11] 修复：确保 finalContent 总是字符串，防止对象传递
        const finalContent = (typeof accumulatedContent === 'string' && accumulatedContent)
          ? accumulatedContent
          : (typeof speech === 'string'
            ? speech
            : (speech?.content || ''));

        const roleSpeech = {
          roleId: role.id,
          roleName: role.shortName,
          content: finalContent,  // ✅ [FIX P0-03] 使用累积内容
          color: role.color,
          layer: role.layer,
          round: roundNumber,
          timestamp: new Date().toISOString()
        };

        roundData.speeches.push(roleSpeech);
        if (this.contextDatabase) {
          this.contextDatabase.addSpeech(roleSpeech);
        }

        // ✅ [Task #013] 发送最终完成事件
        this.emit('roleSpeak', {
          round: roundNumber,
          role: role,
          content: finalContent,  // ✅ [FIX P0-03] 使用累积内容
          phase: 'round_robin',
          topic: roundData.topic,
          speechId: speechId, // ✅ [Task #013] 同样的ID
          isStreaming: false, // ✅ [Task #013] 标记为非流式（完成）
          isComplete: true // ✅ [FIX P0-02] 标记为完成，触发语音朗读
        });

        // ✅ [FIX BUG#1 P0] 竞态条件修复：给 speakText() 足够时间完成入队
        await this.delay(200);
        console.log('✅ [BUG#1 FIX] 专家Phase 1发言 speakText() 入队完成，开始等待语音播放...');

        // 记录已发言
        alreadySpoken.push(role.id);
        speakerCount[role.id] = 1;

        // ✅ [D-63] 等待语音与文字流完成后再继续（Option B - 语音打开时）
        await this.waitForVoiceOrDelay();
      }

      console.log(`✅ [v9.1] Phase 1 完成，${participantCount}位专家已全员发言`);

      // ✅ [V57-P0-1] 承上发言：总结Phase 1核心观点（在委托人补充之前）
      console.log(`📝 [V57-P0-1] 生成承上发言（Phase 1总结）...`);

      const upwardPrompt = `你是领袖(委托代理)，刚才${participantCount}位专家已完成本轮Phase 1全员发言。

**Phase 1发言要点**：
${roundData.speeches.filter(s => s.roleId !== this.facilitator.id).map(s => `${s.roleName}：${s.content.substring(0, 120)}...`).join('\n')}

现在，请你完成承上发言（控制在${this.wordLimits.leaderHalfSummary}字内，总结Phase 1核心观点）：

**核心内容**：
1. 总结Phase 1的核心共识（2-3个要点，需引用具体专家名称）
2. 指出浮现的主要争议点或分歧（如有）
3. 简要说明即将邀请委托人进行补充

**语气要求**：
- 简洁明了，聚焦核心观点
- 为委托人补充预留空间
- 避免使用"欢迎"、"宣布"等客套语

请生成承上发言。`;

      let upwardAccumulated = '';
      const upwardSpeechId = `speech_${roundNumber}_leader_upward_${Date.now()}`;

      const upwardSpeech = await this.callAI({
        role: this.facilitator,
        prompt: upwardPrompt,
        temperature: 0.6,
        maxTokens: this.wordLimits.leaderHalfSummary * 4,  // 200-400字 → 800-1600 tokens
        streaming: true,
        onChunk: (chunk) => {
          upwardAccumulated += chunk;
          this.emit('roleSpeak', {
            round: roundNumber,
            role: this.facilitator,
            content: upwardAccumulated,
            type: 'upward',  // ✅ [V57-P0-1] 承上
            topic: roundData.topic,
            speechId: upwardSpeechId,
            isStreaming: true,
            isComplete: false
          });
        }
      });

      const upwardContent = typeof upwardSpeech === 'string'
        ? upwardSpeech
        : (upwardSpeech?.content || '');

      const upwardSpeechData = {
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: upwardContent,
        type: 'upward',
        round: roundNumber,
        timestamp: new Date().toISOString()
      };

      roundData.speeches.push(upwardSpeechData);
      if (this.contextDatabase) {
        this.contextDatabase.addSpeech(upwardSpeechData);
      }

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: upwardContent,
        type: 'upward',
        topic: roundData.topic,
        speechId: upwardSpeechId,
        isStreaming: false,
        isComplete: true
      });

      await this.delay(200);
      await this.waitForVoiceOrDelay();

      console.log(`✅ [V57-P0-1] 承上发言完成`);

      // ✅ [V57-P0-1] 委托人中场补充（在启下之前）
      const delegateMidInput = await this.promptDelegate({
        type: 'before_transition',
        round: roundNumber,
        message: `第 ${roundNumber} 轮Phase 1已完成。您对当前讨论有什么点评或补充吗？`,
        canSkip: true,
        timeout: 30000
      });

      if (delegateMidInput?.trim()) {
        const delegateMidSpeech = {
          roleId: 'delegate',
          roleName: '委托人',
          content: delegateMidInput,
          round: roundNumber,
          timestamp: new Date().toISOString()
        };

        roundData.speeches.push(delegateMidSpeech);
        if (this.contextDatabase) {
          this.contextDatabase.addSpeech(delegateMidSpeech);
        }

        this.state.delegateInputs.push({
          phase: 'debate',
          round: roundNumber,
          type: 'midpoint_comment',
          input: delegateMidInput,
          priority: 'normal',
          timestamp: new Date().toISOString()
        });

        this.emit('roleSpeak', {
          round: roundNumber,
          role: { id: 'delegate', shortName: '委托人', icon: '💬' },
          content: delegateMidInput,
          phase: 'transition',
          topic: roundData.topic,
          isComplete: true
        });
      }

      // ✅ [V57-P0-1] 启下发言：引入Phase 2补充（在委托人补充之后）
      console.log(`📝 [V57-P0-1] 生成启下发言（Phase 2引入）...`);

      const downwardPrompt = `你是领袖(委托代理)，刚才Phase 1已完成，委托人也进行了补充${delegateMidInput ? '（"' + delegateMidInput.substring(0, 100) + '..."）' : ''}。

**当前讨论状态**：
${roundData.speeches.map(s => `${s.roleName}：${s.content.substring(0, 80)}...`).join('\n')}

现在，请你完成启下发言（控制在${this.wordLimits.transition}字内，引入Phase 2补充发言）：

**核心内容**：
1. 基于Phase 1的讨论和委托人反馈，明确指出哪些议题需要深化
2. 具体说明邀请哪些专家进行补充发言，并给出理由
3. 说明Phase 2补充发言的预期产出

**语气要求**：
- 避免使用"欢迎"、"宣布"等客套语
- 聚焦内容连接和逻辑递进
- 体现对对话进展的把控和引导

请生成启下发言。`;

      let downwardAccumulated = '';
      const downwardSpeechId = `speech_${roundNumber}_${this.facilitator.id}_downward_${Date.now()}`;

      const downwardSpeech = await this.callAI({
        role: this.facilitator,
        prompt: downwardPrompt,
        temperature: 0.5,
        maxTokens: 800,  // ✅ [V57-P0-1] 启下200-300字（400-800 tokens）
        streaming: true,
        onChunk: (chunk) => {
          downwardAccumulated += chunk;
          this.emit('roleSpeak', {
            round: roundNumber,
            role: this.facilitator,
            content: downwardAccumulated,
            type: 'downward',
            phase: 'transition',
            topic: roundData.topic,
            speechId: downwardSpeechId,
            isStreaming: true,
            isComplete: false
          });
        }
      });

      const finalDownwardContent = (typeof downwardAccumulated === 'string' && downwardAccumulated)
        ? downwardAccumulated
        : (typeof downwardSpeech === 'string'
          ? downwardSpeech
          : (downwardSpeech?.content || ''));

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: finalDownwardContent,
        type: 'downward',
        phase: 'transition',
        topic: roundData.topic,
        speechId: downwardSpeechId,
        isStreaming: false,
        isComplete: true
      });

      await this.delay(200);
      console.log('✅ [V57-P0-1] 启下发言完成');

      await this.waitForVoiceOrDelay();

      // ✅ [v9.1] Phase 2: 动态补充阶段（AI邀请或专家主动补充）
      console.log(`🎤 [v9.1] Phase 2: 动态补充阶段开始（最多再邀请${participantCount}次）`);

      while (true) {
        iterationCount++;
        if (iterationCount > MAX_ITERATIONS) {
          // ✅ [FIX #125] 增强日志：显示当前状态和专家发言统计
          console.warn(`⚠️ [FIX #125] 第 ${roundNumber} 轮超过安全阈值(${MAX_ITERATIONS}次迭代)，强制结束`);
          console.error(`[DEBUG] 当前状态: 总发言${alreadySpoken.length}次, 专家发言统计:`, JSON.stringify(speakerCount));
          console.error(`[DEBUG] 本轮参与专家数: ${participantCount}, 单轮最多发言: ${MAX_ROUND_SPEECHES}`);
          break;
        }

        // ✅ [v9.1] 单轮总发言次数限制（不超过专家数×2）
        if (alreadySpoken.length >= MAX_ROUND_SPEECHES) {
          console.log(`✅ [v9.1] 第 ${roundNumber} 轮已发言${alreadySpoken.length}次，达到上限(${MAX_ROUND_SPEECHES})，结束发言阶段`);
          break;
        }

        // 领袖AI决策：下一位发言专家（补充阶段）
        const nextRole = await this.decideNextSpeaker(roundNumber, roundData, alreadySpoken, speakerCount);

        // 如果领袖认为本轮讨论已充分，结束发言阶段
        if (!nextRole) {
          console.log(`✅ [v9.1] 第 ${roundNumber} 轮专家发言阶段结束（领袖决定讨论已充分）`);
          break;
        }

        // ✅ [v9.1] 检查该专家是否已超过发言次数限制（最多2次）
        const currentSpeakerCount = speakerCount[nextRole.id] || 0;
        if (currentSpeakerCount >= MAX_SPEAKER_TIMES) {
          // ✅ [FIX #125] 连续失败计数器，防止无限循环
          consecutiveFailures++;
          console.warn(`⚠️ [v9.1] ${nextRole.shortName}(ID${nextRole.id}) 已发言${currentSpeakerCount}次，达到上限(${MAX_SPEAKER_TIMES})，重新决策（连续失败：${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}）`);

          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(`⚠️ [FIX #125] 连续${consecutiveFailures}次无效决策，AI 决策循环异常，强制结束本轮补充阶段`);
            break; // 强制退出循环
          }

          continue; // 跳过此专家，重新决策
        }

        // ✅ [FIX #125] 成功选择专家，重置连续失败计数器
        consecutiveFailures = 0;

        // 专家补充发言
        console.log(`🎤 [v9.1] ${nextRole.shortName} 补充发言...（第${currentSpeakerCount + 1}次）`);

        // ✅ [Task #013] 启用流式输出 - Phase 2 补充发言
        let supplementaryAccumulatedContent = '';
        const supplementarySpeechId = `speech_${roundNumber}_${nextRole.id}_supplementary_${Date.now()}`;

        const speech = await this.callAI({
          role: nextRole,
          prompt: this.buildRoleSpeechPrompt(nextRole, roundNumber, roundData, true), // ✅ Phase 2: 补充发言（递进要求）
          temperature: 0.5,  // ✅ [V57.2 Issue#5] 降低到0.5加快响应速度
          maxTokens: Math.round(this.wordLimits.expertSpeech * 1.5),  // ✅ [V57.2 Issue#5] 从*2降低到*1.5，加快生成速度
          streaming: true, // ✅ [Task #013] 启用流式模式
          onChunk: (chunk) => {
            // ✅ [Task #013] 接收到每个数据块时，发送增量更新事件
            supplementaryAccumulatedContent += chunk;
            this.emit('roleSpeak', {
              round: roundNumber,
              role: nextRole,
              content: supplementaryAccumulatedContent,
              phase: 'supplementary',
              topic: roundData.topic,
              speechId: supplementarySpeechId, // ✅ [Task #013] 唯一ID用于增量更新
              isStreaming: true, // ✅ [Task #013] 标记为流式模式
              isComplete: false // ✅ [Task #013] 标记为未完成
            });
          }
        });

        // ✅ [FIX P0-11] 修复：确保 finalSupplementaryContent 总是字符串，防止对象传递
        const finalSupplementaryContent = (typeof supplementaryAccumulatedContent === 'string' && supplementaryAccumulatedContent)
          ? supplementaryAccumulatedContent
          : (typeof speech === 'string'
            ? speech
            : (speech?.content || ''));

        const roleSpeech = {
          roleId: nextRole.id,
          roleName: nextRole.shortName,
          content: finalSupplementaryContent,  // ✅ [FIX P0-03] 使用累积内容
          color: nextRole.color,
          layer: nextRole.layer,
          round: roundNumber,
          timestamp: new Date().toISOString()
        };

        roundData.speeches.push(roleSpeech);

        // ✅ [v9] 记录到对话信息数据库
        if (this.contextDatabase) {
          this.contextDatabase.addSpeech(roleSpeech);
        }

        this.emit('roleSpeak', {
          round: roundNumber,
          role: nextRole,
          content: finalSupplementaryContent,  // ✅ [FIX P0-03] 使用累积内容
          phase: 'supplementary', // ✅ [v9.2] Phase 2: 补充发言
          topic: roundData.topic,  // ✅ [Task #132] 传递本轮话题用于突显
          speechId: supplementarySpeechId,  // ✅ [P0 FIX Item 1] 传递speechId，避免重复创建DOM
          isComplete: true  // ✅ [FIX P0-02] 标记为完成，触发语音朗读
        });

        // ✅ [FIX BUG#1 P0] 竞态条件修复：给 speakText() 足够时间完成入队
        await this.delay(200);
        console.log('✅ [BUG#1 FIX] 专家Phase 2补充发言 speakText() 入队完成，开始等待语音播放...');

        // 记录已发言（允许同一专家多次发言）
        alreadySpoken.push(nextRole.id);

        // ✅ [v9] 更新专家发言次数统计
        speakerCount[nextRole.id] = (speakerCount[nextRole.id] || 0) + 1;

        // ✅ [D-63] 等待语音与文字流完成后再继续
        await this.waitForVoiceOrDelay();
      }

      console.log(`✅ [v9.1] Phase 2 补充发言阶段结束`);

      // ✅ [D-78 新增] 预总结：总结下半轮关键洞察，邀请委托人最终补充
      console.log(`📝 [D-78] 生成预总结...`);

      const preSummaryPrompt = `你是领袖(委托代理)，刚才专家们已完成本轮的上半轮发言和下半轮补充发言。

**本轮全部发言摘要**：
${roundData.speeches.filter(s => s.roleId !== this.facilitator.id && !['half_summary', 'upward', 'downward', 'pre_summary', 'introduction', 'transition', 'summary'].includes(s.type)).map(s => `${s.roleName}：${s.content.substring(0, 100)}...`).join('\n')}

现在，请你完成预总结（控制在${this.wordLimits.leaderPreSummary}字内）：

**核心内容**：
1. 总结下半轮补充发言的关键洞察（1-2个核心要点）
2. 综合上下半轮，指出本轮讨论的主要收获
3. 说明接下来将邀请委托人进行最终补充

**语气要求**：
- 简洁明了，聚焦关键洞察
- 为委托人最终补充预留空间
- 为即将到来的本轮总结做铺垫

请生成预总结。`;

      let preSummaryAccumulated = '';
      const preSummarySpeechId = `speech_${roundNumber}_leader_presummary_${Date.now()}`;

      const preSummary = await this.callAI({
        role: this.facilitator,
        prompt: preSummaryPrompt,
        temperature: 0.6,
        maxTokens: this.wordLimits.leaderPreSummary * 4,  // 300-500字 → 1200-2000 tokens
        streaming: true,
        onChunk: (chunk) => {
          preSummaryAccumulated += chunk;
          this.emit('roleSpeak', {
            round: roundNumber,
            role: this.facilitator,
            content: preSummaryAccumulated,
            type: 'pre_summary',  // 新类型：预总结
            topic: roundData.topic,
            speechId: preSummarySpeechId,
            isStreaming: true,
            isComplete: false
          });
        }
      });

      const preSummaryContent = typeof preSummary === 'string'
        ? preSummary
        : (preSummary?.content || '');

      const preSummarySpeech = {
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: preSummaryContent,
        type: 'pre_summary',
        round: roundNumber,
        timestamp: new Date().toISOString()
      };

      roundData.speeches.push(preSummarySpeech);
      if (this.contextDatabase) {
        this.contextDatabase.addSpeech(preSummarySpeech);
      }

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: preSummaryContent,
        type: 'pre_summary',
        topic: roundData.topic,
        speechId: preSummarySpeechId,
        isStreaming: false,
        isComplete: true
      });

      await this.delay(200);
      await this.waitForVoiceOrDelay();

      console.log(`✅ [D-78] 预总结完成`);

      // 4. 委托人总结前发言机会（每轮都提供）
      const delegateBeforeSummaryInput = await this.promptDelegate({
        type: 'before_summary',
        round: roundNumber,
        message: `第 ${roundNumber} 轮角色发言已完成，领袖(委托代理)即将总结。您有什么补充或点评吗？`,
        canSkip: true,
        timeout: 30000 // 30秒超时
      });

      // 检查是否用户主动暂停
      if (delegateBeforeSummaryInput === '[PAUSE]') {
        console.log('⏸️ 用户主动暂停辩论，提前进入交付阶段');
        this.state.currentRound = roundNumber; // 记录暂停轮次
        return 'PAUSED'; // 返回特殊标记，通知主流程跳转到交付阶段
      }

      if (delegateBeforeSummaryInput?.trim()) {
        const delegateCommentSpeech = {
          roleId: 'delegate',
          roleName: '委托人',
          content: delegateBeforeSummaryInput,
          round: roundNumber,
          timestamp: new Date().toISOString()
        };

        roundData.speeches.push(delegateCommentSpeech);

        // ✅ [v9] 记录到对话信息数据库
        if (this.contextDatabase) {
          this.contextDatabase.addSpeech(delegateCommentSpeech);
        }

        // ✅ [FIX #091] 检测并处理高权重标记
        const isHighPriority = delegateBeforeSummaryInput.startsWith('[HIGH_PRIORITY]');
        const cleanInput = isHighPriority ? delegateBeforeSummaryInput.replace('[HIGH_PRIORITY]', '').trim() : delegateBeforeSummaryInput;

        this.state.delegateInputs.push({
          phase: 'debate',
          round: roundNumber,
          type: 'before_summary',
          input: cleanInput,
          priority: isHighPriority ? 'high' : 'normal', // ✅ [FIX #091] 高权重标记
          timestamp: new Date().toISOString()
        });

        // ✅ [V57.3 FIX] 总结前补充显示到UI（修复Issue#9遗漏Bug）
        this.emit('roleSpeak', {
          round: roundNumber,
          role: { id: 'delegate', shortName: '委托人', icon: '💬' },
          content: cleanInput,  // 使用去除标记后的内容
          phase: 'supplementary',  // 总结前阶段
          topic: roundData.topic,
          isComplete: true
        });

        if (isHighPriority) {
          console.log(`✅ [#091] 委托人高权重补充信息已记录（第 ${roundNumber} 轮）:`, cleanInput.substring(0, 50) + '...');
        }

        // ✅ [#009] 动态主题调整：检测委托人反馈是否需要调整后续主题
        if (roundNumber < this.state.rounds) {
          // 只在非最后一轮时才检测（有后续轮次可调整）
          const needsAdjustment = this.detectTopicAdjustmentNeeded(cleanInput);

          if (needsAdjustment) {
            console.log(`🔄 [#009] 检测到委托人反馈需要调整后续主题，正在调用 AI 重新规划...`);

            try {
              const adjustedTopics = await this.adjustRoundTopics(cleanInput, roundNumber);
              console.log(`✅ [#009] 后续轮次主题已根据委托人反馈动态调整`);

              // 通知前端：主题已调整（可选，用于UI提示）
              this.emit('topicsAdjusted', {
                round: roundNumber,
                adjustedTopics: adjustedTopics.filter(t => t.round > roundNumber)
              });

            } catch (error) {
              console.warn(`⚠️ [#009] 主题调整失败，继续使用原主题:`, error);
            }
          }
        }
      }

      // 5. 领袖(委托代理)总结本轮
      const leaderSummary = await this.callAI({
        role: this.facilitator,
        prompt: this.buildLeaderSummaryPrompt(roundNumber, roundData),
        temperature: 0.6,
        maxTokens: 1200  // ✅ [用户要求] 本轮总结400-600字（800-1200 tokens）
      });

      // ✅ [FIX P0-11] 确保 summary content 总是字符串
      const summaryContent = typeof leaderSummary === 'string'
        ? leaderSummary
        : (leaderSummary?.content || '');

      const summarySpeech = {
        roleId: this.facilitator.id,
        roleName: this.facilitator.shortName,
        content: summaryContent,
        type: 'summary',
        round: roundNumber,
        timestamp: new Date().toISOString()
      };

      roundData.speeches.push(summarySpeech);

      // ✅ [v9] 记录到对话信息数据库
      if (this.contextDatabase) {
        this.contextDatabase.addSpeech(summarySpeech);
      }

      this.emit('roleSpeak', {
        round: roundNumber,
        role: this.facilitator,
        content: summaryContent,  // ✅ [FIX P0-11] 使用已提取的字符串内容
        type: 'summary',
        topic: roundData.topic,  // ✅ [Task #132] 传递本轮话题用于突显
        isComplete: true  // ✅ [FIX P0-02] 标记为完成，触发语音朗读并移除圆点
      });

      // ✅ [FIX BUG#1 P0] 竞态条件修复：给 speakText() 足够时间完成入队
      await this.delay(200);
      console.log('✅ [BUG#1 FIX] 领袖总结 speakText() 入队完成，开始等待语音播放...');

      // ✅ [D-63] 等待语音与文字流完成后再继续
      await this.waitForVoiceOrDelay();

      // 保存本轮数据
      this.state.debateHistory.push(roundData);
      console.log(`✅ 第 ${roundNumber} 轮辩论完成`);

      // ✅ [阶段三 T-304] 验证本轮数据结构和完整性
      if (this.dataValidator) {
        try {
          const structureValidation = this.dataValidator.validateRoundStructure(roundData);
          if (!structureValidation.valid) {
            console.warn(`⚠️ [T-304] 第${roundNumber}轮数据结构验证失败:`, structureValidation.errors);
          } else {
            console.log(`✅ [T-304] 第${roundNumber}轮数据结构验证通过`);
          }
        } catch (validationError) {
          console.error(`❌ [T-304] 第${roundNumber}轮数据验证失败:`, validationError);
        }
      }

      // ✅ [阶段三 T-302] 生成本轮摘要（Token 优化）
      if (this.summaryEngine) {
        try {
          const roundSummary = this.summaryEngine.summarizeRound(roundData);
          console.log(`✅ [T-302] 第${roundNumber}轮摘要生成完成:`, {
            characterCount: roundSummary.characterCount,
            tokenEstimate: roundSummary.tokenEstimate,
            keyInsights: roundSummary.keyInsights.length,
            dataHighlights: roundSummary.dataHighlights.length
          });

          // 保存到 contextDatabase (初始化 roundSummaries 如不存在)
          if (this.contextDatabase) {
            if (!this.contextDatabase.roundSummaries) {
              this.contextDatabase.roundSummaries = [];
            }
            this.contextDatabase.roundSummaries.push(roundSummary);
            this.contextDatabase.saveToLocalStorage();

            console.log(`✅ [T-302] 摘要已保存到 ContextDatabase，累计Token估算:`,
              this.summaryEngine.getTokenStats().totalTokens
            );
          }
        } catch (summaryError) {
          console.error(`⚠️ [T-302] 第${roundNumber}轮摘要生成失败:`, summaryError);
        }
      }

    } catch (error) {
      console.error(`❌ 第 ${roundNumber} 轮辩论失败：`, error);
      this.emit('error', { phase: 'debate', round: roundNumber, error });
      throw error;
    }
  }

  /**
   * 获取排序后的角色（按必选流线 + 可选角色）- v9已废弃，保留用于向下兼容
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
   * ✅ [v9] AI驱动的动态发言顺序决策
   * 领袖根据对话进展、委托人反馈、争议焦点等，智能决定下一位发言专家
   */
  async decideNextSpeaker(roundNumber, roundData, alreadySpoken = [], speakerCount = {}) {
    const MAX_SPEAKER_TIMES = 2; // ✅ [v9.1] 与 runRound 保持一致（改为2次）

    // 获取可发言专家列表（排除领袖和已发言专家，v9允许重复邀请）
    const availableRoles = this.state.selectedRoles
      .map(id => this.roles.find(r => r.id === id))
      .filter(role => role && role.id !== this.facilitator.id);

    // ✅ [v9] 过滤已达发言上限的专家（≥3次）
    const eligibleRoles = availableRoles.filter(r => (speakerCount[r.id] || 0) < MAX_SPEAKER_TIMES);

    if (eligibleRoles.length === 0) {
      console.warn('⚠️ [v9] 所有专家已达发言上限(3次)，本轮讨论结束');
      return null; // 返回null表示本轮讨论完成
    }

    // 如果所有专家都发过言，允许二次邀请（但不超过3次）
    const unspokenRoles = eligibleRoles.filter(r => !alreadySpoken.includes(r.id));
    const candidateRoles = unspokenRoles.length > 0 ? unspokenRoles : eligibleRoles;

    // 获取当前对话上下文
    const timeline = this.contextDatabase ? this.contextDatabase.getDebateTimeline() : [];
    const controversies = this.contextDatabase ? this.contextDatabase.getControversies() : [];

    // 构建AI决策提示词
    const decisionPrompt = `你是领袖(委托代理)，现在需要决定下一位发言的专家。

**当前辩论情况**：
- 主议题：${this.state.topic}
- 当前轮次：第 ${roundNumber}/${this.state.rounds} 轮
- 本轮焦点：${roundData.topic}
- 本轮已发言：${roundData.speeches.map(s => s.roleName).join('、')}

**辩论时间线（最近要点）**：
${timeline.slice(-5).map(t => `- 第${t.round}轮 ${t.speaker}：${t.keyPoints.join('；')} ${t.hasData ? '[有数据支撑]' : ''}`).join('\n')}

**当前争议焦点**：
${controversies.length > 0 ? controversies.map(c => `- ${c.topic}（被提及${c.count}次）`).join('\n') : '暂无明显争议'}

**可邀请的专家列表**：
${candidateRoles.map(r => {
  const speakCount = speakerCount[r.id] || 0;
  const status = speakCount === 0 ? '' : ` [已发言${speakCount}次]`;
  return `- ${r.id}. ${r.shortName}（${r.intro || r.description}）${status}`;
}).join('\n')}

**决策要求**：
1. 基于当前对话进展和争议焦点，选择最合适的下一位发言专家
2. 如果某个话题需要深入探讨，可以邀请已发言专家再次回应
3. 优先考虑能推进对话深度、解决争议、提供数据支撑的专家
4. 如果本轮讨论已充分（所有关键角色都发过言且无明显争议），返回"COMPLETE"

请直接回复专家ID（如"3"）或"COMPLETE"，不要有任何其他内容。`;

    try {
      const decision = await this.callAI({
        role: this.facilitator,
        prompt: decisionPrompt,
        temperature: 0.3, // 低温度确保决策稳定
        maxTokens: 50
      });

      const decisionText = (decision.content || decision).trim();

      // 解析决策结果
      if (decisionText === 'COMPLETE' || decisionText.includes('COMPLETE')) {
        console.log(`✅ [v9] 领袖决定本轮讨论已充分，结束发言阶段`);
        return null; // 返回null表示本轮讨论完成
      }

      // 提取专家ID
      const roleIdMatch = decisionText.match(/\d+/);
      if (roleIdMatch) {
        const roleId = parseInt(roleIdMatch[0]);
        const selectedRole = candidateRoles.find(r => r.id === roleId);

        if (selectedRole) {
          const isReinvite = alreadySpoken.includes(roleId);
          console.log(`✅ [v9] 领袖邀请 ${selectedRole.shortName}（ID${roleId}）发言${isReinvite ? '【二次邀请】' : ''}`);
          return selectedRole;
        }
      }

      // 降级方案：如果AI决策失败，按默认顺序选择
      console.warn('⚠️ [v9] AI决策解析失败，使用默认顺序');
      return candidateRoles[0] || null;

    } catch (error) {
      console.warn('⚠️ [v9] AI决策失败，使用默认顺序:', error);
      return candidateRoles[0] || null;
    }
  }

  /**
   * 构建领袖(委托代理)开场提示词
   * ✅ [T-303] 使用 PromptAgent 生成提示词，支持降级
   */
  buildLeaderOpeningPrompt(roundNumber) {
    const previousRounds = this.state.debateHistory
      .map(r => `第${r.round}轮：${r.topic}`)
      .join('\n');

    // 提取角色信息
    const rolesInfo = this.state.selectedRoles
      .map(id => {
        const role = this.roles.find(r => r.id === id);
        return role ? `${role.shortName}（${role.description}）` : '';
      })
      .filter(Boolean)
      .join('、');

    // 提取高权重委托人输入
    const highPriorityInputs = this.state.delegateInputs
      .filter(d => d.priority === 'high')
      .map(d => d.input)
      .join('\n');

    // ✅ [T-303] 暂时禁用 PromptAgent，避免查找延迟
    // if (this.promptAgent) {
    //   try {
    //     const result = this.promptAgent.generate('leader_opening', {
    //       roundNumber,
    //       rounds: this.state.rounds,
    //       topic: this.state.topic,
    //       background: this.state.background,
    //       leaderStrategy: this.state.leaderStrategy,
    //       selectedRoles: this.state.selectedRoles,
    //       rolesInfo,
    //       highPriorityInputs,
    //       previousRounds
    //     });

    //     console.log(`✅ [T-303] 使用 PromptAgent 生成 leader_opening 提示词 (${result.tokens} tokens)`);
    //     return result.prompt;
    //   } catch (error) {
    //     console.warn(`⚠️ [T-303] PromptAgent 生成失败，使用降级方式:`, error);
    //   }
    // }

    // 降级：使用模板函数直接生成
    if (PromptTemplates) {
      return PromptTemplates.buildLeaderOpeningTemplate({
        roundNumber,
        rounds: this.state.rounds,
        topic: this.state.topic,
        background: this.state.background,
        leaderStrategy: this.state.leaderStrategy,
        selectedRoles: this.state.selectedRoles,
        rolesInfo,
        highPriorityInputs,
        previousRounds,
        wordLimits: this.wordLimits  // ✅ [V55.5 FIX] 传递字数限制配置
      });
    }

    // 最后降级：简单模板
    return `第${roundNumber}轮辩论开始，请介绍本轮议题`;
  }

  /**
   * 构建角色发言提示词（v9.1 - 基于完整历史上下文 + 补充发言递进要求）
   * ✅ [T-303] 使用 PromptAgent 生成提示词，支持降级
   * @param {Object} role - 角色对象
   * @param {Number} roundNumber - 轮次
   * @param {Object} roundData - 本轮数据
   * @param {Boolean} isSupplementary - 是否为补充发言（Phase 2）
   */
  buildRoleSpeechPrompt(role, roundNumber, roundData, isSupplementary = false) {
    // ✅ [v9] 使用对话信息数据库获取完整上下文
    const relevantContext = this.contextDatabase ?
      this.contextDatabase.getRelevantContext(role.id, roundNumber) :
      { myHistory: [], othersKeyPoints: [], allRounds: {} };

    // ✅ [v9.2] 获取用户画像文本
    const userProfileText = this.userProfile?.getProfileText() || '';

    // ✅ [v9.2] 汇总委托人所有发言
    const delegateHistory = this.delegateHandler ? this.delegateHandler.getDelegateInputsSummary() : '';

    // 构建本轮当前发言摘要（不包括AI即将生成的）
    const currentRoundSpeeches = roundData.speeches
      .map(s => `${s.roleName}：${s.content.substring(0, 150)}...`)
      .join('\n');

    // ✅ [FIX #091] 提取高权重委托人输入
    const highPriorityInputs = this.state.delegateInputs
      .filter(d => d.priority === 'high' && d.round <= roundNumber)
      .map(d => `[第${d.round}轮] ${d.input}`)
      .join('\n');

    // ✅ [T-303] 暂时禁用 PromptAgent，避免查找延迟
    // if (this.promptAgent) {
    //   try {
    //     const result = this.promptAgent.generate('role_speech', {
    //       role,
    //       roundNumber,
    //       rounds: this.state.rounds,
    //       topic: this.state.topic,
    //       roundTopic: roundData.topic,
    //       currentRoundSpeeches,
    //       isSupplementary,
    //       userProfileText,
    //       delegateHistory,
    //       highPriorityInputs,
    //       relevantContext,
    //       roles: this.roles
    //     });

    //     console.log(`✅ [T-303] 使用 PromptAgent 生成 role_speech 提示词 (${result.tokens} tokens)`);
    //     return result.prompt;
    //   } catch (error) {
    //     console.warn(`⚠️ [T-303] PromptAgent 生成失败，使用降级方式:`, error);
    //   }
    // }

    // 降级：使用模板函数直接生成
    if (PromptTemplates) {
      return PromptTemplates.buildRoleSpeechTemplate({
        role,
        roundNumber,
        rounds: this.state.rounds,
        topic: this.state.topic,
        roundTopic: roundData.topic,
        currentRoundSpeeches,
        isSupplementary,
        userProfileText,
        delegateHistory,
        highPriorityInputs,
        relevantContext,
        roles: this.roles,
        wordLimits: this.wordLimits  // ✅ [D-84 FIX] 传递字数限制配置
      });
    }

    // 最后降级：简单模板
    return `${role.systemPrompt}\n\n请发表关于"${roundData.topic}"的观点`;
  }

  /**
   * 构建领袖(委托代理)总结提示词
   * ✅ [T-303] 使用 PromptAgent 生成提示词，支持降级
   */
  buildLeaderSummaryPrompt(roundNumber, roundData) {
    const speeches = roundData.speeches
      .filter(s => s.roleId !== this.facilitator.id)
      .map(s => `${s.roleName}：${s.content.substring(0, 100)}...`)
      .join('\n\n');

    // ✅ [UX优化] 提取本轮委托人补充（重点呼应）
    const currentRoundInputs = this.state.delegateInputs
      .filter(d => d.priority === 'high' && d.round === roundNumber)
      .map(d => d.input)
      .join('\n');

    // ✅ [FIX #091] 提取之前轮次的高权重委托人输入（持续关注）
    const previousHighPriorityInputs = this.state.delegateInputs
      .filter(d => d.priority === 'high' && d.round < roundNumber)
      .map(d => `[第${d.round}轮] ${d.input}`)
      .join('\n');

    // ✅ [T-303] 暂时禁用 PromptAgent，避免查找延迟
    // if (this.promptAgent) {
    //   try {
    //     const result = this.promptAgent.generate('leader_summary', {
    //       roundNumber,
    //       roundTopic: roundData.topic,
    //       speeches,
    //       currentRoundInputs,
    //       previousHighPriorityInputs
    //     });

    //     console.log(`✅ [T-303] 使用 PromptAgent 生成 leader_summary 提示词 (${result.tokens} tokens)`);
    //     return result.prompt;
    //   } catch (error) {
    //     console.warn(`⚠️ [T-303] PromptAgent 生成失败，使用降级方式:`, error);
    //   }
    // }

    // 降级：使用模板函数直接生成
    if (PromptTemplates) {
      return PromptTemplates.buildLeaderSummaryTemplate({
        roundNumber,
        roundTopic: roundData.topic,
        speeches,
        currentRoundInputs,
        previousHighPriorityInputs
      });
    }

    // 最后降级：简单模板
    return `请总结第${roundNumber}轮辩论的要点`;
  }

  /**
   * 提取本轮议题（从领袖(委托代理)开场发言中）
   * ✅ [FIX] 增加类型检查，防止 leaderSpeech.match is not a function 错误
   */
  extractRoundTopic(leaderSpeech) {
    // ✅ 类型检查：确保 leaderSpeech 是字符串
    if (typeof leaderSpeech !== 'string') {
      console.warn('⚠️ extractRoundTopic 收到非字符串参数:', typeof leaderSpeech, leaderSpeech);

      // 尝试提取 content 字段
      if (leaderSpeech && typeof leaderSpeech === 'object') {
        if (typeof leaderSpeech.content === 'string') {
          leaderSpeech = leaderSpeech.content;
        } else {
          console.error('❌ 无法从对象中提取字符串内容，返回默认主题');
          return '本轮讨论';
        }
      } else {
        console.error('❌ leaderSpeech 既不是字符串也不是对象，返回默认主题');
        return '本轮讨论';
      }
    }

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
      // ✅ [阶段三 T-304] 批量验证所有辩论数据（质量评估）
      if (this.dataValidator) {
        try {
          const { valid, report: validationReport } = this.dataValidator.validateAll(this.state.debateHistory);
          const qualityAssessment = this.dataValidator.assessDataQuality(this.state.debateHistory);

          console.log(`✅ [T-304] 辩论数据批量验证完成 - 有效性: ${valid}, 质量评分: ${qualityAssessment.score}/100`);
          console.log(`📊 [T-304] 质量评估详情:`, qualityAssessment.breakdown);

          if (!valid) {
            console.warn(`⚠️ [T-304] 辩论数据存在问题:`, validationReport);
          }

          // 保存验证结果到状态（可选，用于报告展示）
          this.state.dataValidation = {
            valid,
            report: validationReport,
            quality: qualityAssessment
          };
        } catch (validationError) {
          console.error(`❌ [T-304] 辩论数据批量验证失败:`, validationError);
        }
      }

      // 1. 领袖(委托代理)本风暴辩论总结（所有轮）
      console.log('📝 生成本风暴辩论总结...');

      // 构建所有轮次的简要摘要
      const allRoundsSummary = this.state.debateHistory
        .map(round => `第${round.round}轮《${round.topic}》：共${round.speeches.length}次发言`)
        .join('\n');

      const finalSummaryPrompt = `你是【领袖(委托代理)】，${this.state.rounds}轮风暴辩论已全部完成。

**核心议题**：${this.state.topic}
**背景信息**：${this.state.background || '无'}
**辩论轮次**：${this.state.rounds}轮
**参与专家**：${this.state.selectedRoles.length}位

**各轮简要**：
${allRoundsSummary}

**委托人关键补充**（${this.state.delegateInputs.length}次）：
${this.state.delegateInputs.slice(0, 5).map(d => `[第${d.round}轮] ${d.input.substring(0, 50)}...`).join('\n')}

请生成一篇完整的"本风暴辩论总结"（约${this.wordLimits.summary}字，测试用户减半），包括：
1. **开场回顾**：回顾核心议题和辩论目标
2. **各轮要点**：总结每轮的核心洞察和关键结论（按轮次）
3. **核心共识**：提炼跨轮次的核心共识和最重要的发现
4. **委托人关注点回应**：呼应委托人的关键补充意见

**输出要求**：
- 总字数：约${this.wordLimits.summary}字
- 结构清晰，分段明确
- 聚焦核心价值，避免流水账
- 语气：专业、总结性、有结论`;

      const finalSummary = await this.callAI({
        role: this.facilitator,
        prompt: finalSummaryPrompt,
        temperature: 0.6,
        maxTokens: this.wordLimits.summary * 2  // ✅ [D-76 FIX] 动态maxTokens（测试用户减半）
      });

      // ✅ [FIX P0-11] 确保 finalSummary content 总是字符串
      const finalSummaryContent = typeof finalSummary === 'string'
        ? finalSummary
        : (finalSummary?.content || '');

      // 发送总结到UI显示
      // ✅ [V57.1 FIX Issue#1] 不创建"第4轮"，最终总结属于交付阶段，round设置为0表示非辩论轮
      this.emit('roleSpeak', {
        round: 0,  // 标记为交付阶段，不是额外的第N轮
        role: this.facilitator,
        content: finalSummaryContent,  // ✅ [FIX P0-11] 使用已提取的字符串内容
        type: 'final_summary',
        topic: '本风暴辩论总结',
        isComplete: true
      });

      // ✅ [FIX BUG#1 P0] 竞态条件修复：给 speakText() 足够时间完成入队
      await this.delay(200);
      console.log('✅ [BUG#1 FIX] 最终总结 speakText() 入队完成，开始等待语音播放...');

      // 等待语音播放完成
      await this.waitForVoiceOrDelay();

      // 2. 生成最终报告
      const report = await this.generateReport();
      this.state.reportData = report;

      // 3. 领袖(委托代理)感谢致辞
      const thanksMessage = await this.callAI({
        role: this.facilitator,
        prompt: `你是【领袖(委托代理)】，辩论已完成。请代表${this.state.selectedRoles.length}位专家和系统，向委托人表达感谢和祝福（${this.wordLimits.thanks}字内，测试用户减半）。

⚠️ **严禁使用"作为领袖"等角色混淆表述**，直接以领袖身份发言即可。`,
        temperature: 0.8,
        maxTokens: this.wordLimits.thanks * 2  // ✅ [D-76 FIX] 动态maxTokens
      });

      this.emit('delegatePrompt', {
        type: 'thanks',
        message: thanksMessage.content || thanksMessage,
        report: report,
        // 注意：不在这里收集反馈，等用户点击"完成辩论"按钮后再收集
        callback: async () => {
          // 用户点击完成按钮后，收集反馈
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
        }
      });

      console.log('✅ 交付阶段完成');
      this.emit('phaseChange', { phase: 'completed', state: this.state, report: report });

    } catch (error) {
      console.error('❌ 交付阶段失败：', error);
      this.emit('error', { phase: 'delivery', error });
      throw error;
    }
  }

  /**
   * 生成辩论报告 - 使用 ReportGenerator 模块
   */
  async generateReport() {
    console.log('📄 生成辩论报告...');

    if (!this.reportGenerator) {
      this.reportGenerator = typeof ReportGenerator !== 'undefined' ?
        new ReportGenerator() : null;
    }

    if (this.reportGenerator && this.aiCaller) {
      const report = await this.reportGenerator.generateReport(this.state, this.aiCaller, this.facilitator);
      this.state.reportData = report;
      return report;
    } else {
      // 降级：基础报告
      console.warn('⚠️ reportGenerator 或 aiCaller 未加载，使用基础报告模板');
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
        summary: `本次辩论围绕"${this.state.topic}"展开了${this.state.rounds}轮深度讨论，共有${this.state.selectedRoles.length}位专家参与。`,
        keyInsights: [],
        actionPlan: [],
        iterationSuggestions: [],
        fullTranscript: this.state.debateHistory
      };
      this.state.reportData = report;
      return report;
    }
  }

  /**
   * 导出报告为JSON - 使用 ReportGenerator 模块
   */
  exportReportAsJSON() {
    if (this.reportGenerator) {
      this.reportGenerator.exportAsJSON(this.state);
    } else {
      console.error('❌ reportGenerator 未加载，无法导出');
    }
  }

  /**
   * 导出报告为PDF - 使用 ReportGenerator 模块
   */
  exportReportAsPDF() {
    if (this.reportGenerator) {
      this.reportGenerator.exportAsPDF(this.state);
    } else {
      console.error('❌ reportGenerator 未加载，无法导出');
    }
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

  /**
   * ✅ [FIX P0-06] 延迟工具方法（模拟真实辩论节奏）
   * @param {number} ms - 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ [D-63 增强] 等待文字流和语音都完成
   * - Option A (语音关闭): 等待文字流完成，然后延迟 1 秒
   * - Option B (语音打开): 等待文字流和语音都完成，最多 15 秒超时
   */
  async waitForVoiceOrDelay() {
    // ✅ [FIX V5.3-FIX4 CORRECT] 等待文字流完成（专家发言的打字机效果）
    if (window.currentTypingPromise) {
      console.log('📝 [同步] 等待文字流完成...');
      try {
        await window.currentTypingPromise;
        console.log('✅ [同步] 文字流已完成');
        window.currentTypingPromise = null;  // 清除
      } catch (error) {
        console.warn('⚠️ [同步] 文字流异常:', error);
      }
    }

    // 检查 VoiceModule 是否可用
    if (typeof window === 'undefined' || !window.VoiceModule) {
      // 浏览器环境：延迟1秒（给用户阅读时间）
      await this.delay(600); // ✅ [D-93] 优化延迟
      return;
    }

    // 检查语音是否开启
    const isVoiceEnabled = window.VoiceModule.isVoiceEnabled();

    if (!isVoiceEnabled) {
      // ✅ [D-93 NEW] Option A: 语音关闭，延迟600ms（发言之间的间隔优化 V56.0: 5秒 → 2-3秒）
      console.log('⏱️ [同步] 语音关闭，延迟 600ms');
      await this.delay(600);
      return;
    }

    // Option B: 语音打开，等待语音完成
    console.log('🔊 [同步] 语音打开，等待语音完成...');

    try {
      // 创建 15 秒超时保护（给更长的发言更多时间）
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Voice timeout')), 15000)
      );

      // 获取语音完成 Promise
      const voicePromise = window.VoiceModule.getCurrentVoicePromise();

      // ✅ [FIX P1-#2] TypeError风险修复：验证Promise有效性
      if (!voicePromise || typeof voicePromise.then !== 'function') {
        console.warn('⚠️ [同步] getCurrentVoicePromise返回无效Promise，使用固定延迟');
        await this.delay(600); // ✅ [D-93] 同步优化延迟
        return;
      }

      // 等待语音完成或超时（以先到者为准）
      await Promise.race([voicePromise, timeoutPromise]);
      console.log('✅ [同步] 语音播放完成，继续下一发言');

    } catch (error) {
      if (error.message === 'Voice timeout') {
        console.warn('⚠️ [同步] 语音播放超时（15秒），强制继续');
      } else {
        console.error('❌ [同步] 语音播放异常:', error);
      }
      // 异常情况下也继续流程，避免卡死
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebateEngine;
}