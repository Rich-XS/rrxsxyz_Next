/**
 * promptTemplates.js - 辩论引擎提示词模板集合
 *
 * 功能：
 * - 领袖策划阶段提示词模板
 * - 领袖开场提示词模板
 * - 专家发言提示词模板
 * - 领袖总结提示词模板
 *
 * @version v9
 * @date 2025-10-13
 */

class PromptTemplates {
  /**
   * 🛡️ [Bug #011 修复] 提示词参数净化函数
   *
   * 功能：
   * 1. 移除常见的提示词注入攻击模式
   * 2. 限制参数长度，防止溢出攻击
   * 3. 转义特殊字符
   *
   * @param {string} param - 需要净化的参数
   * @param {object} options - 净化选项
   * @returns {string} - 净化后的安全参数
   */
  static sanitizePromptParam(param, options = {}) {
    // 默认选项
    const {
      maxLength = 5000,        // 最大长度（防止溢出）
      allowNewlines = true,    // 是否允许换行符
      strictMode = false       // 严格模式（移除所有特殊指令关键词）
    } = options;

    // 1. 类型检查
    if (typeof param !== 'string') {
      return String(param || '');
    }

    // 2. 长度限制
    let sanitized = param.substring(0, maxLength);

    // 3. 移除常见的提示词注入攻击模式
    const injectionPatterns = [
      // 中文注入模式
      /忽略.*?(上述|之前|以上|前面).*?(指令|提示|规则|要求)/gi,
      /忽略.*?(系统|角色|身份|任务).*?(设定|提示|指令)/gi,
      /你现在是.*?(新的|另一个|不同的)/gi,
      /重新定义.*?(角色|身份|任务|系统)/gi,
      /改为.*?(输出|回复|响应|执行)/gi,
      /无论.*?只.*?(回复|输出|说)/gi,

      // 英文注入模式
      /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
      /you\s+are\s+now\s+(a|an)\s+/gi,
      /disregard\s+(all\s+)?(previous|above)\s+/gi,
      /new\s+(instruction|prompt|rule|system)/gi,
      /override\s+(system|role|instruction)/gi,

      // 分隔符注入模式（试图"关闭"当前提示词）
      /---+\s*(新|New|SYSTEM|系统).{0,20}(提示|Prompt|Instruction)/gi,
      /###\s*(新|New|SYSTEM).{0,20}(提示|Prompt)/gi,

      // 角色劫持模式
      /\[SYSTEM\]/gi,
      /\[ASSISTANT\]/gi,
      /\[USER\]/gi,
      /<\|system\|>/gi,
      /<\|assistant\|>/gi
    ];

    // 应用所有模式过滤
    injectionPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[已过滤]');
    });

    // 4. 严格模式：移除所有可能的指令关键词组合
    if (strictMode) {
      const strictPatterns = [
        /系统提示/gi,
        /角色设定/gi,
        /指令/gi,
        /system prompt/gi,
        /instruction/gi
      ];
      strictPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[已移除]');
      });
    }

    // 5. 换行符处理
    if (!allowNewlines) {
      sanitized = sanitized.replace(/\n/g, ' ');
    } else {
      // 限制连续换行符数量（防止利用大量换行"隐藏"恶意内容）
      sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');
    }

    // 6. 移除可疑的特殊字符组合
    sanitized = sanitized
      .replace(/[\u200B-\u200D\uFEFF]/g, '')  // 零宽字符
      .replace(/\u0000/g, '');                  // NULL字符

    // 7. 返回净化后的参数
    return sanitized.trim();
  }

  /**
   * 🛡️ [Bug #011 修复] 批量净化参数对象
   *
   * @param {object} params - 参数对象
   * @param {array} keys - 需要净化的键名数组
   * @returns {object} - 净化后的参数对象（原对象的拷贝）
   */
  static sanitizeParams(params, keys) {
    const sanitized = { ...params };

    keys.forEach(key => {
      if (sanitized[key] !== undefined && sanitized[key] !== null) {
        sanitized[key] = this.sanitizePromptParam(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * 模板函数1: leader_planning（领袖策划阶段）
   */
  static buildLeaderPlanningTemplate(params) {
    // ✅ [Bug #011 修复] 净化所有用户输入参数
    const sanitized = this.sanitizeParams(params, [
      'topic',
      'background',
      'rolesInfo'
    ]);

    // ⚠️ 数字参数验证（防止恶意数值）
    const safeRounds = Math.max(1, Math.min(10, parseInt(params.rounds) || 3));
    const safeSelectedRoles = sanitized.selectedRoles || params.selectedRoles;
    const safeRolesCount = Math.max(1, Math.min(20, parseInt(safeSelectedRoles?.length) || 0));
    const { topic, background, rolesInfo } = sanitized;

    // ✅ [D-96 NEW] 获取动态字数限制配置（V56.3修复）
    const wordLimits = params.wordLimits || {};
    const planningWords = wordLimits.planning || 700;  // 基准700字，测试用户350字，真实用户560字
    const strategyStmtWords = Math.round(planningWords * 0.15);  // ~100字（测试~53字，真实~84字）
    const logicWordsWords = Math.round(planningWords * 0.25);  // ~175字（测试~88字，真实~140字）

    // ✅ [D-83 FIX] 添加调试日志，验证selectedRoles传递
    console.log(`🔍 [D-83 FIX] buildLeaderPlanningTemplate 参数检查:`, {
      paramsSelectedRoles: params.selectedRoles,
      sanitizedSelectedRoles: sanitized.selectedRoles,
      safeSelectedRoles: safeSelectedRoles,
      safeRolesCount: safeRolesCount,
      rolesInfo: rolesInfo,
      planningWords: planningWords,
      strategyStmtWords: strategyStmtWords,
      logicWordsWords: logicWordsWords
    });

    return `你现在是"多魔汰风暴辩论系统"中的核心角色【领袖(委托代理)】。

你的任务是：根据委托人提供的项目背景和辩论需求，立刻为接下来的 ${safeRounds} 轮风暴辩论制定一个详细且具有高度落地实效的初步作战规划方案。

## 领袖(委托代理)的职责范围
1. 策略规划：制定一个宏观的风暴辩论主线和分轮推进逻辑，确保最终产出直接解决委托人的核心痛点
2. 话题拆解：将委托人的单一议题拆解为 ${safeRounds} 个递进式的、具有明确焦点的分轮风暴辩论主题
3. 组织与约束：为每轮风暴辩论设定明确的焦点问题和产出期望（即本轮需要解决的核心问题）
4. 代理人视角：你需要以"平衡短期收益与长期价值，注重落地性"为核心视角，组织所有子议题
5. 互动锚点：在规划中明确指出哪些关键节点（第X轮开始前或结束时）需要邀请委托人进行补充信息、点评或方向微调，以确保实效性和委托人满意度

## 工作输出格式要求（严格遵守）

### 开场客套语（必需）
用1-2句话亲切问候委托人，例如："您好！很高兴为您服务-成为您的委托代理人-Victoria! 我已仔细研读您的议题和背景，现为您呈上初步规划方案，期待您的宝贵意见。"

### 核心议题(标题粗体)
${topic}

### 背景信息
${background || '无'}

### 领袖(委托代理)的核心策略声明(标题粗体)
用一段话（${strategyStmtWords}字左右）总结本次风暴辩论的主线和核心目标。例如：本次风暴辩论旨在通过聚焦[痛点]，运用${safeRolesCount}位专家角色的专业视角，在${safeRounds}轮内形成一套[短期可落地]、[长期可持续]的RRXS方法论升级方案。

### 参与角色阵容(标题粗体)
${rolesInfo}（共${safeRolesCount}位专家）

### 形成各轮主题规划的思路和逻辑(标题粗体)
用一段话（${logicWordsWords}字左右）说明：
1. 为什么选择这样的轮次划分逻辑
2. 各轮主题之间的递进关系是什么
3. 如何确保从问题定位到解决方案的完整路径
4. 委托人的核心诉求如何体现在规划中

🚨 **【强制】分轮风暴辩论主题规划（缺失将导致回复无效）**

⚠️ **极其重要**：以下格式必须完整输出，这是委托人确认策略的核心依据。如果缺失或格式不正确，将被视为无效回复。

请严格按照以下三列格式输出（不要颜色列，不要委托人互动列），总共 ${safeRounds} 轮：

**格式要求**：每轮必须包含3个部分，用 " / " 分隔
- **第X轮** / **主题名称**（20-30字）/ **本轮目标和产出期望**（30-50字）

**示例**（请根据实际轮数${safeRounds}灵活调整内容，但必须保持此格式）：

📋 **分轮风暴辩论主题规划**:

第1轮 / 初始定调：当前挑战与愿景校准 / 明确痛点、目标和约束条件，为后续风暴辩论建立基础共识
第2轮 / 角色评估：核心优势与风险分析 / 评估核心定位的可行性，识别关键风险点
...（中间轮次根据${safeRounds}展开递进议题，每轮必须有明确的主题和产出）
最后一轮 / 方案整合与行动步骤 / 形成高度可执行的行动清单，确保可落地实施

🚨 **强制要求**：
1. 必须严格输出 ${safeRounds} 轮，不多不少
2. 每轮必须包含完整的三部分（轮次/主题/目标）
3. 主题和目标必须具体明确，不得含糊其辞

### 结束客套语（必需）
用1-2句话温暖收尾，邀请委托人确认或补充。例如："以上是我的初步规划，期待您的反馈。如果您觉得方案合适，咱们就准备开始这场精彩的风暴辩论吧！"

## 重要输出规范
1. 不要使用Markdown格式符号（如 ** # - 等），直接输出纯文本
2. 不要有空行，所有内容紧凑显示
3. 分轮规划必须严格按照"第X轮 / 主题 / 目标"三段式格式，每轮一行
4. 总字数控制在${params.wordLimits?.planning || 700}字左右（测试用户减半）
5. 语气专业、亲切、高效
6. 确保逻辑清晰，层次分明
7. 标题粗体, 内容正常字体, 重要关键词粗体
8. 分轮风暴辩论主题规划 粗体

现在，请基于上述指示和委托人的输入，立即生成初步作战规划方案。`;
  }

  /**
   * 模板函数2: leader_opening（领袖开场）
   */
  static buildLeaderOpeningTemplate(params) {
    // ✅ [Bug #011 修复] 净化所有用户输入参数
    const sanitized = this.sanitizeParams(params, [
      'topic',
      'background',
      'leaderStrategy',
      'rolesInfo',
      'highPriorityInputs',
      'previousRounds'
    ]);

    // ⚠️ 数字参数验证（防止恶意数值）
    const safeRoundNumber = Math.max(1, Math.min(10, parseInt(params.roundNumber) || 1));
    const safeRounds = Math.max(1, Math.min(10, parseInt(params.rounds) || 3));
    const safeRolesCount = Math.max(1, Math.min(20, parseInt(params.selectedRoles?.length) || 0));

    const { topic, background, leaderStrategy, rolesInfo, highPriorityInputs, previousRounds } = sanitized;

    // ✅ [V55.5 FIX] 使用动态字数限制
    const wordLimits = params.wordLimits || {};
    const leaderOpeningWords = wordLimits.leaderOpening || 800;  // 测试用户400字，普通用户800字
    const leaderRoundOpeningWords = wordLimits.leaderRoundOpening || 150;  // 测试用户100字，普通用户300字

    // 第一轮特殊开场（感谢+介绍+背景+策划，约900字）
    if (safeRoundNumber === 1) {
      const delegateContext = highPriorityInputs
        ? `\n**委托人特别强调的要点**：\n${highPriorityInputs}\n`
        : '';

      return `🚨 **【强制】第一轮开场完整性要求（违反将导致回复无效）**：

你是领袖(委托代理)，现在主持第 1/${safeRounds} 轮风暴辩论。这是整个风暴辩论的开场，你必须完整输出以下 8 个部分，缺一不可。

⚠️ **重要**：如果你的回复缺少任何一个部分，将被视为无效回复并要求重新生成。

**主议题**：${topic}

**项目背景**：
${background || '委托人未提供详细背景'}
${delegateContext}
**风暴辩论策略概要**：
${leaderStrategy?.content || leaderStrategy}

**参与专家阵容**：
${rolesInfo}（共${safeRolesCount}位专家）

---

**你的开场任务（约 ${leaderOpeningWords} 字，必须完整包含以下 8 个部分）**：

1. **感谢致辞**（约 80 字）
   - 感谢委托人信任，选择多魔汰风暴辩论系统
   - 表达领袖(委托代理)的使命感和责任感
   - 人性化问候并自报家门（如"您好！很高兴为您服务-成为您的委托代理人-Victoria!"）

2. **委托人介绍与发言邀请**（约 120 字）
   - 基于委托人提供的背景信息，简要介绍委托人的身份和核心诉求
   - 展现对委托人处境的理解和共鸣（如年龄阶段、行业背景、转型挑战等）
   - 明确邀请委托人在开场后发表补充意见："在正式开始前，非常期待您先分享一下对本次风暴辩论的期望，或您特别关注的问题，这将帮助我们更精准地为您服务"

3. **专家阵容介绍**（约 120 字）
   - 介绍参与本次辩论的 ${safeRolesCount} 位专家及其角色定位
   - 强调专家的多元视角和专业能力（核心分析层、外部威胁与机遇层、价值与行动层）
   - 说明专家将按流线顺序发言（第一性原则→时间穿越→上帝视角→杠精专家→买单客户→竞争友商→落地执行者）

4. **辩论流程机制说明**（约 150 字）
   - **每轮分两阶段**：
     a. **上半轮-轮流发言（Phase 1）**：每位专家按流线顺序依次发言，全面阐述观点（预计 ${safeRolesCount} 位专家各发言一次）
     b. **中场转场小结**：我会总结 Phase 1 的核心共识和争议点，并邀请特定专家进行深化讨论
     c. **下半轮-补充发言（Phase 2）**：基于 Phase 1 的讨论，专家针对性补充新数据、新案例或更具体的执行建议（最多再邀请 ${safeRolesCount} 次）
   - **委托人互动节点**：第 1 轮开场前、各轮总结前，您都有机会补充意见或调整方向，确保风暴辩论始终聚焦您的核心关切

5. **项目背景深度理解**（约 180 字）
   - 基于委托人提供的背景信息，进行深度解读
   - 如果委托人有特别强调的要点（高权重补充信息），必须重点体现并表达共鸣
   - 分析核心痛点和关键挑战
   - 明确本次风暴辩论的核心目标

6. **策划结构说明**（约 120 字）
   - 简要说明 ${safeRounds} 轮风暴辩论的整体逻辑和递进关系
   - 解释为什么采用这样的轮次划分
   - 强调每轮的产出价值

7. **各轮主题简介**（约 180 字）
   - 逐一介绍每轮的核心议题和预期成果（格式：第 X 轮 - 主题名称 - 产出期望）
   - 说明轮次之间的关联性
   - 让委托人对整个流程有清晰预期

8. **本轮（第 1 轮）焦点与启动**（约 100 字）
   - 明确第 1 轮的具体议题
   - 说明为什么第 1 轮聚焦这个议题
   - 阐述本轮的预期产出
   - 正式宣布风暴辩论开始（如"现在，让我们正式启动第 1 轮风暴辩论！"）

**重要输出规范**：
- 不要使用 Markdown 格式符号（如 ** # - 等）
- ✅ [D-94 NEW] 禁止使用任何表情符号或特殊图标（如✨🚀📊等），只输出纯文本
- 语气专业、亲切、充满使命感
- **第 4 部分（辩论流程机制说明）必须完整且清晰**，确保委托人理解两阶段发言机制
- 如果委托人有高权重补充信息，必须充分理解并表达共鸣
- 确保逻辑清晰，层次分明
- 总字数控制在 ${leaderOpeningWords} 字左右

现在，请基于上述结构，生成第一轮的全面开场发言。`;
    }

    // 非第一轮：简短开场
    return `你是领袖(委托代理)，现在主持第 ${safeRoundNumber}/${safeRounds} 轮风暴辩论。

**主议题**：${topic}

**风暴辩论策略**：
${leaderStrategy?.content || leaderStrategy}

${previousRounds ? `**已完成轮次**：\n${previousRounds}` : ''}

**重要规范**：不要使用任何表情符号或特殊图标（如✨🚀等），只输出纯文本

✅ [V57-P1-4] **质量要求**：
- 清晰承接前一轮的核心观点，说明本轮为何重要
- 明确说明本轮与前轮的关联性（"基于第${safeRoundNumber - 1}轮的讨论，我们发现..."）
- 为本轮的讨论设定具体的成果目标
- 如适当，预告后续轮次的方向

请简洁介绍本轮风暴辩论的焦点议题和期望产出（${leaderRoundOpeningWords}字内），并清晰展现轮次间的递进逻辑。`;
  }

  /**
   * 模板函数3: role_speech（专家发言）
   */
  static buildRoleSpeechTemplate(params) {
    // ✅ [Bug #011 修复] 净化所有用户输入参数
    const sanitized = this.sanitizeParams(params, [
      'topic',
      'roundTopic',
      'currentRoundSpeeches',
      'userProfileText',
      'delegateHistory',
      'highPriorityInputs'
    ]);

    // ⚠️ 数字参数验证
    const safeRoundNumber = Math.max(1, Math.min(10, parseInt(params.roundNumber) || 1));
    const safeRounds = Math.max(1, Math.min(10, parseInt(params.rounds) || 3));

    const { role, isSupplementary, relevantContext, wordLimits } = params;  // ✅ [D-84 FIX] 接收 wordLimits 参数
    const { topic, roundTopic, currentRoundSpeeches, userProfileText, delegateHistory, highPriorityInputs } = sanitized;

    // ✅ [D-84 FIX] 计算专家发言字数范围（使用动态配置）
    const expertWordLimit = wordLimits?.expertSpeech || 400;  // 默认400字（兼容旧版本）
    const minWords = Math.floor(expertWordLimit * 0.75);  // 最小字数：75%
    const maxWords = expertWordLimit;  // 最大字数：100%

    // ✅ [V57.1 FIX Issue#3] 获取所有参与专家列表，防止AI邀请不存在的专家
    const participatingExperts = (params.selectedRoles || [])
      .map(id => {
        const r = (params.roles || []).find(role => role.id === id);
        return r ? `${r.shortName}` : '';
      })
      .filter(Boolean)
      .join('、');

    const profileContext = userProfileText || delegateHistory ? `
**📋 委托人完整画像与发言历史**：
${userProfileText}
${delegateHistory ? `\n**委托人历史发言**：\n${delegateHistory}` : ''}

⚠️ **重要**：请基于委托人的个人信息（年龄/性别/昵称）和历史发言，提供更有针对性和个性化的建议。
` : '';

    const delegateContext = highPriorityInputs
      ? `\n**⚠️ 委托人重要补充（高权重，必须重点考虑）**：\n${highPriorityInputs}\n`
      : '';

    // 构建你的发言历史（展现角色立场演进）- ✅ [D-63优化] 只展示最近1次，减少Token消耗
    let myHistoryText = '';
    if (relevantContext.myHistory && relevantContext.myHistory.length > 0) {
      const recentHistory = relevantContext.myHistory.slice(-1); // 只保留最近1次
      if (recentHistory.length > 0) {
        myHistoryText = `\n**📋 你之前的核心观点**：\n`;
        myHistoryText += `- 第${recentHistory[0].round}轮：${recentHistory[0].content.substring(0, 150)}...\n`;
        myHistoryText += `（提示：本轮发言需展现递进关系）\n`;
      }
    }

    // 构建其他角色关键观点（了解他们的核心立场）- ✅ [D-63优化] 只展示当前轮，减少Token消耗
    let othersKeyPointsText = '';
    if (currentRoundSpeeches) {
      othersKeyPointsText = `\n**💡 本轮已发言专家的核心观点**：\n${currentRoundSpeeches}\n`;
    }

    return `${role.systemPrompt}

🚨 **【核心要求1】身份锁定**：你是【${role.shortName}】${safeRoundNumber === 1 ? '，必须以"作为' + role.shortName + '，..."开头' : '，直接以你的观点开始即可（无需重复"作为' + role.shortName + '"）'}，严禁冒充领袖或其他角色。

**当前风暴辩论情况**：
- 主议题：${topic}
- 当前轮次：第 ${safeRoundNumber}/${safeRounds} 轮
- 本轮焦点：${roundTopic}
- 🚨 **【核心要求0】参与专家限定（V57.1 FIX Issue#3）**：本场风暴辩论的专家阵容仅包括：${participatingExperts}。禁止任何引用、邀请、提及参与专家列表以外的专家或虚构角色（如"某某领域专家"、"某某公司高管"等）。如需交叉论证，必须直接点名本场参与专家的观点。
${profileContext}
${delegateContext}
${myHistoryText}
${othersKeyPointsText}

**本轮当前发言**：
${currentRoundSpeeches}

${isSupplementary ? `**🔥【核心要求2】Phase 2 补充发言**：严禁重复Phase 1观点，必须明确引用其他专家（"基于XX专家..."），提供新的数据/案例/视角。` : `**📢 Phase 1 轮流发言**：这是你本轮的首次发言，请全面阐述你的观点。`}

**【核心要求3】数据与建议**：
1. ✅ [V57-P1-4] 数据结构化：每个数据点必须包含 [来源年份] [具体数值] [解读意义]
   - 示例：根据2024年艾瑞咨询报告，自媒体内容创作者增长50%，说明市场机会扩大
2. ✅ [V57-P1-4] 案例具体化：引用真实案例时必须说明 [案例对象] [具体执行] [最终成果]
   - 示例：小红书博主@XXX通过垂直化内容，用6个月达到100万粉丝，实现月收入5万
3. ✅ [V57-P1-4] 建议可执行化：每个建议必须包含 [建议内容] [执行步骤] [时间周期] [预期效果]
   - 不要笼统的"加强运营"，要说"建议按照选题-制作-发布-复盘的周期，每周3条内容，预计3月内评估数据"
4. **⚠️ 字数要求：严格控制在${minWords}-${maxWords}字，禁止超出${maxWords}字**（如果内容不足${minWords}字，可适当扩充；如果超过${maxWords}字，必须精简）
5. ✅ [V57-P1-4] 论证逻辑：必须明确展现 [观点] → [依据（数据/案例）] → [推论] 的三层逻辑
6. **⚠️ 禁止输出任何元信息标签**（如 "[字数: XXX]"、"[完成]" 等），只输出发言内容
7. **⚠️ 禁止使用任何表情符号或特殊图标**（如✨🚀📊等），只输出纯文本
8. **⚠️ 完整性优先**：必须完整输出所有承诺的部分（如提到"风险与应对"就必须写出内容，不能只有标题）

现在，请以【${role.shortName}】的身份发表本轮意见。`;
  }

  /**
   * 模板函数4: leader_summary（领袖总结）
   */
  static buildLeaderSummaryTemplate(params) {
    // ✅ [Bug #011 修复] 净化所有用户输入参数
    const sanitized = this.sanitizeParams(params, [
      'roundTopic',
      'speeches',
      'currentRoundInputs',
      'previousHighPriorityInputs'
    ]);

    // ⚠️ 数字参数验证
    const safeRoundNumber = Math.max(1, Math.min(10, parseInt(params.roundNumber) || 1));

    const { roundTopic, speeches, currentRoundInputs, previousHighPriorityInputs } = sanitized;

    // 构建委托人上下文
    let delegateContext = '';

    if (currentRoundInputs) {
      delegateContext += `\n**【最高优先级】💬 本轮委托人补充（必须完整、逐条回应）**：\n${currentRoundInputs}\n\n⚠️ 请逐条详细回应委托人的每一条意见，确保每一条都得到认真对待和明确回应。对每条意见需说明：(1)我们如何理解 (2)本轮如何讨论 (3)对判断的影响。\n`;
    }

    if (previousHighPriorityInputs) {
      delegateContext += `\n**📌 之前轮次委托人重点关注**：\n${previousHighPriorityInputs}\n`;
    }

    return `你是领袖(委托代理)，现在总结第 ${safeRoundNumber} 轮风暴辩论。

**本轮议题**：${roundTopic}

**发言摘要**：
${speeches}
${delegateContext}

**总结要求**：
1. **评分（可选）**：如适用，提供综合评分（XX/100）及评分依据
2. **委托人信息整合**：${currentRoundInputs ? '完整引用委托人补充，逐条回应（理解/讨论/影响）' : '回顾之前轮次委托人关注重点，总结对决策的影响'}
3. **核心观点总结**：2-3条，明确对委托人的价值
4. **数据支撑**：包含至少一个最新数据/案例（优先2024-2025年）
5. **行动建议**：提供可立即执行的下一步建议（时间/成本/资源），直接回应委托人核心诉求

**语气要求**：体现决策的确定性和执行力，感谢委托人参与，说明其补充如何优化了决策方向。

控制在300字内。`;
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptTemplates;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.PromptTemplates = PromptTemplates;
}

console.log('✅ promptTemplates.js 已加载');