/**
 * AI调用服务模块 - 处理所有AI API调用
 *
 * 功能：
 * - 统一的AI调用接口
 * - SSE流式调用支持
 * - 降级和容错机制
 * - Token统计
 *
 * @version v1.0
 * @date 2025-10-13
 */

class AICaller {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/ai/debate',
      model: config.model || 'gemini',  // ✅ 切换到Gemini测试
      defaultTimeout: config.defaultTimeout || 60000,
      streamTimeout: config.streamTimeout || 120000,
      ...config
    };

    // Token统计回调
    this.onTokenUpdate = null;
  }

  /**
   * 设置Token更新回调
   */
  setTokenUpdateCallback(callback) {
    this.onTokenUpdate = callback;
  }

  /**
   * 主调用接口（支持流式和非流式）
   */
  async call({ role, prompt, temperature = 0.7, maxTokens = 650, streaming = false, onChunk = null }) {
    // ✅ [V57.8 DEBUG] 记录所有接收到的参数
    console.log('🔍 [DEBUG-aiCaller.call()] 接收到参数:', {
      roleName: role?.shortName || role?.name,
      streaming: streaming,
      streamingType: typeof streaming,
      hasOnChunk: !!onChunk,
      onChunkType: typeof onChunk,
      onChunkIsFunction: typeof onChunk === 'function',
      temperature,
      maxTokens,
      promptLength: prompt?.length
    });

    // 如果启用流式模式且提供了回调，使用 SSE 流式 API
    if (streaming && onChunk) {
      console.log('✅ [DEBUG-aiCaller] 条件满足，调用 callStreaming()');
      return await this.callStreaming({ role, prompt, temperature, maxTokens, onChunk });
    }

    // 非流式调用
    console.log('⚠️ [DEBUG-aiCaller] 条件不满足，调用 callRegular()，原因:', {
      streaming,
      hasOnChunk: !!onChunk
    });
    return await this.callRegular({ role, prompt, temperature, maxTokens });
  }

  /**
   * 常规非流式AI调用
   */
  async callRegular({ role, prompt, temperature, maxTokens }) {
    const requestBody = {
      model: this.config.model,
      prompt: prompt,
      systemPrompt: role.systemPrompt,
      roleName: role.name,
      temperature: temperature,
      maxTokens: maxTokens
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.defaultTimeout);

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // ✅ [Bug #012 修复] 移除 Authorization header
          // 理由：后端 AI 服务不应由前端直接认证，应通过后端网关代理
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // 触发Token更新
        if (data.tokens && this.onTokenUpdate) {
          this.onTokenUpdate(data.tokens, role.id);
        }

        return {
          content: data.data.content || data.data.text || data.data,
          model: data.model || this.config.model,
          tokens: data.tokens
        };
      } else {
        throw new Error(data.error || 'API 返回数据格式错误');
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ AI 调用超时（${role.shortName}），已等待 ${this.config.defaultTimeout/1000} 秒`);
        throw new Error(`AI 服务响应超时（${this.config.defaultTimeout/1000}秒），请稍后重试或检查网络连接`);
      }

      console.warn(`⚠️ AI 调用失败（${role.shortName}），尝试 fallback：`, error);
      return this.fallback({ role, prompt });
    }
  }

  /**
   * SSE 流式 AI 调用
   */
  async callStreaming({ role, prompt, temperature, maxTokens, onChunk }) {
    const streamEndpoint = this.config.apiEndpoint.replace('/api/ai/debate', '/api/ai/debate/stream');

    const requestBody = {
      model: this.config.model,
      prompt: prompt,
      systemPrompt: role.systemPrompt,
      roleName: role.name,
      temperature: temperature,
      maxTokens: maxTokens
    };

    console.log(`🔥🔥🔥 [Bug #013 DEBUG] callStreaming() 被调用！角色: ${role.shortName}, 端点: ${streamEndpoint}, 模型: ${this.config.model}`);

    // 🔍 [DEBUG] 添加提示词内容调试
    console.log(`🔍 [DEBUG-AI调用] ${role.shortName} 提示词长度: ${prompt.length} 字符`);
    console.log(`🔍 [DEBUG-AI调用] ${role.shortName} 提示词前300字: "${prompt.substring(0, 300)}..."`);
    console.log(`🔍 [DEBUG-AI调用] maxTokens设置: ${maxTokens}, temperature: ${temperature}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.streamTimeout);

      const response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // ✅ [Bug #012 修复] 移除 Authorization header
          // 理由：后端 AI 服务不应由前端直接认证，应通过后端网关代理
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`SSE API 调用失败: ${response.status} ${response.statusText}`);
      }

      // 处理 SSE 流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let tokens = 0;
      let buffer = ''; // 缓冲区用于处理不完整的数据块

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`✅ [Streaming] 流式读取完成：${role.shortName}`);
          break;
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割，处理 SSE 格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行到缓冲区

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'chunk') {
                // 流式数据块
                const chunk = parsed.content;
                fullContent += chunk;

                // 🔍 [DEBUG-内容追踪] 检查收到的 chunk 是否乱码
                console.log(`🔍 [DEBUG-Chunk接收] ${role.shortName}`);
                console.log(`  - Chunk长度: ${chunk.length} 字符`);
                console.log(`  - Chunk内容(前100字): "${chunk.substring(0, 100)}"`);
                console.log(`  - 累积总长度: ${fullContent.length} 字符`);

                // 检查是否包含乱码特征
                const hasGarbled = /[^\u4e00-\u9fa5\u0000-\u00ff，。！？；：""''（）【】《》、\s]/.test(chunk);
                if (hasGarbled) {
                  console.warn(`⚠️ [DEBUG-警告] 检测到可能的乱码字符！`);
                }

                if (onChunk) {
                  onChunk(chunk);
                }

              } else if (parsed.type === 'complete') {
                // 流式完成
                fullContent = parsed.content || fullContent;
                tokens = parsed.tokens || 0;

                // 🔍 [DEBUG] 流式完成时的最终内容
                console.log(`🔍 [DEBUG-流式完成] ${role.shortName}`);
                console.log(`  - 最终内容长度: ${fullContent.length} 字符`);
                console.log(`  - Token消耗: ${tokens}`);
                console.log(`  - 内容前200字: "${fullContent.substring(0, 200)}..."`);

                console.log(`✅ [Streaming] 流式完成：${role.shortName}, tokens: ${tokens}`);

              } else if (parsed.type === 'error') {
                // 流式错误
                throw new Error(parsed.error || '流式响应错误');
              }

            } catch (parseError) {
              console.warn('⚠️ [Streaming] SSE 数据解析失败:', parseError, 'data:', data);
            }
          }
        }
      }

      // 触发Token更新
      if (tokens > 0 && this.onTokenUpdate) {
        this.onTokenUpdate(tokens, role.id);
      }

      return {
        content: fullContent,
        model: this.config.model,
        tokens: tokens
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ 流式 AI 调用超时（${role.shortName}），已等待 ${this.config.streamTimeout/1000} 秒`);
        throw new Error(`流式 AI 服务响应超时（${this.config.streamTimeout/1000}秒），请稍后重试`);
      }

      console.warn(`⚠️ 流式 AI 调用失败（${role.shortName}），尝试非流式降级：`, error);

      // 降级方案：尝试非流式 API
      return await this.callRegular({ role, prompt, temperature, maxTokens });
    }
  }

  /**
   * JS Fallback: 离线模式模拟 AI 响应（完整策划内容）
   * ✅ [FIX] 扩展模板内容，确保策划阶段有足够长的内容（500-1000字符）
   */
  fallback({ role, prompt }) {
    console.log('🔄 使用 JS fallback 模拟 AI 响应');

    // 提取决策问题关键信息
    const topicMatch = prompt.match(/【问题】(.*?)(?:【|$)/s);
    const topic = topicMatch ? topicMatch[1].trim() : '该决策问题';

    const templates = {
      // 领袖（主持人）- 策划阶段
      facilitator: `各位专家，感谢大家参与这次重要的决策讨论：${topic}

【策略规划框架】

一、核心目标明确
我建议我们首先明确三个层面的目标：
1. **短期目标**（0-3个月）：快速验证核心假设，建立初步反馈循环
2. **中期目标**（3-12个月）：形成可持续的增长模式，优化关键指标
3. **长期愿景**（1-3年）：建立竞争壁垒，实现规模化增长

二、关键约束识别
我们需要正视以下约束条件：
• 资源限制（时间、资金、人力）
• 市场环境（竞争态势、政策法规）
• 能力边界（技术、经验、网络）

三、推进逻辑建议
我建议按以下步骤展开深度辩论：
1. **第一性原理分析** - 回归问题本质，识别核心假设
2. **风险与机遇评估** - 全面审视内外部因素
3. **方案可行性论证** - 资源匹配度与执行路径
4. **决策标准确立** - 明确评判依据与优先级

请各位专家从自己的专业视角深入分析，我会综合大家的意见形成最终建议。`,

      // 第一性原则专家
      first_principle: `从第一性原理角度，我对"${topic}"进行本质分析：

【本质剖析】

一、问题的根本目标是什么？
剥离所有表象，这个决策的最终目的是：实现可持续的价值创造。不是为了跟风，不是为了证明自己，而是真正解决用户的核心痛点或抓住市场的本质机会。

二、哪些是基本事实（确定性）？
• 用户需求：真实存在且可验证的痛点
• 市场趋势：数据支撑的长期方向
• 资源现状：当前可调动的实际能力

三、哪些是假设（不确定性）？
• 市场规模预测 - 需要小规模验证
• 用户付费意愿 - 需要MVP测试
• 执行团队能力 - 需要边做边学

四、最简单的解决方案
从零构建，最核心的三个步骤：
1. **最小可行产品（MVP）** - 用最低成本验证核心假设
2. **快速反馈循环** - 2-4周一个迭代，根据数据调整
3. **渐进式投入** - 验证后再规模化，避免一次性豪赌

五、哪些复杂性是必要的？
• 质量标准：影响用户体验，必须保证
• 数据安全：涉及法律合规，不可妥协
• 核心技术：形成竞争壁垒，值得投入

哪些复杂性是多余的？
• 过度设计：功能堆砌，用户不买单
• 过早优化：过度关注性能，忽视验证
• 流程繁琐：内部管理复杂化，降低效率

【建议】
从本质出发，建议采用"精益创业"模式：先做最小MVP，快速验证核心假设，根据数据反馈迭代优化。避免一开始就追求完美，而是用事实数据指导决策。`,

      // 杠精专家（批判性思维）
      devil_advocate: `我必须对"${topic}"提出质疑，这是我的专业职责：

【批判性审视】

一、假设验证不足
我看到几个未经验证的危险假设：
1. **市场需求假设** - 你确定用户真的需要这个吗？还是你觉得他们需要？
   • 有没有做过用户访谈？样本量多少？
   • 有没有竞品分析？为什么别人做不好？

2. **资源能力假设** - 你确定能做到吗？
   • 核心团队有相关经验吗？
   • 预算足够吗？时间预估合理吗？

3. **执行路径假设** - 计划靠谱吗？
   • 有没有考虑突发风险？
   • 关键里程碑是否可衡量？

二、数据来源可靠性
请回答以下问题：
• 数据从哪里来？一手还是二手？
• 样本是否有代表性？是否存在幸存者偏差？
• 数据是否最新？是否考虑了宏观环境变化？

三、最坏情况分析
如果一切都往坏的方向发展：
• **财务风险** - 最多损失多少？能承受吗？
• **时间成本** - 如果失败，损失的机会成本是什么？
• **声誉风险** - 对个人/团队品牌的影响？

四、认知偏差识别
警惕以下常见偏差：
• **确认偏差** - 只看支持自己观点的证据
• **锚定效应** - 被初始信息固化思维
• **过度自信** - 高估成功概率，低估风险

【挑战】
请用事实和数据反驳我的质疑。如果不能，说明准备不足，建议暂缓决策，先做充分调研和小规模验证。`,

      // 买单客户（用户视角）
      user_advocate: `站在用户（付费客户）的角度，我对"${topic}"的真实反应：

【用户核心关切】

一、这真的解决了我的痛点吗？
作为用户，我最关心的是：
• **痛点程度** - 这个问题每天困扰我吗？严重到愿意付费解决吗？
• **现有替代方案** - 我现在怎么解决的？为什么不满意？
• **价值主张** - 你的方案比现状好在哪里？好多少？

二、用户体验是否足够顺畅？
用户旅程关键节点：
1. **发现阶段** - 我怎么知道你的存在？信息渠道在哪？
2. **了解阶段** - 我能快速理解你的价值吗？（5秒电梯测试）
3. **试用阶段** - 上手门槛高吗？学习成本大吗？
4. **付费阶段** - 价格合理吗？性价比如何？
5. **使用阶段** - 稳定吗？有没有隐藏成本？

三、用户最担心的问题
坦白说，用户会有这些顾虑：
• **可靠性** - 会不会用了一半就跑路了？
• **隐私安全** - 我的数据会被如何使用？
• **售后服务** - 遇到问题能得到及时支持吗？
• **性价比** - 值这个价吗？有没有更便宜的？

四、竞品为什么能吸引用户？
友商做得好的地方：
• 品牌信任度高
• 用户社区活跃
• 功能更全面/价格更低
• 服务响应更快

【建议】
必须确保一切以用户为中心：
1. 做10次真实用户访谈，了解真实需求
2. 设计用户旅程地图，优化每个触点
3. 建立快速反馈机制，持续改进
4. 用NPS（净推荐值）衡量用户满意度`,

      // 竞争对手视角
      competitor: `作为你的竞争对手，我会这样狙击你的"${topic}"策略：

【竞争对抗策略】

一、在你的弱点发起进攻
我会重点攻击：
1. **资源劣势** - 你的预算和人力有限，我会用价格战拖垮你
   • 补贴用户，让你无法跟进
   • 挖你的核心团队成员

2. **品牌信任度低** - 你是新玩家，用户不信任
   • 强化我的品牌背书（案例、认证、奖项）
   • 制造FUD（恐惧、不确定、怀疑）

3. **产品功能不成熟** - 你的MVP功能单一
   • 快速迭代，推出类似功能
   • 强调我的产品更稳定、更全面

二、利用平台优势形成壁垒
我的护城河：
• **网络效应** - 用户越多，价值越大，你很难突破
• **数据优势** - 我有海量用户数据，算法更精准
• **渠道控制** - 我掌握关键流量入口，你的获客成本更高
• **生态绑定** - 用户已经在我的生态内，切换成本高

三、时间战与资源战
我的长期策略：
1. **拖时间** - 拖到你资金链断裂或团队散伙
2. **打消耗** - 用补贴战、营销战消耗你的资源
3. **等你犯错** - 新创业者容易犯错，我只需等待机会

四、防御与反击组合拳
• **专利布局** - 提前申请相关专利，限制你的创新空间
• **独家合作** - 和关键供应商/渠道签独家协议
• **舆论战** - 通过PR塑造"行业领导者"形象

【警告】
你的护城河在哪里？如何应对这些威胁？如果没有清晰答案，建议重新评估策略。记住：竞争对手不会给你试错的机会。`
    };

    const template = templates[role.key] || templates.facilitator;

    return {
      content: template,
      model: 'fallback-js-enhanced',
      tokens: 0
    };
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AICaller;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.AICaller = AICaller;
}

console.log('✅ aiCaller.js 已加载');