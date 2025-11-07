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
      model: config.model || 'qwen',
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
    // 如果启用流式模式且提供了回调，使用 SSE 流式 API
    if (streaming && onChunk) {
      return await this.callStreaming({ role, prompt, temperature, maxTokens, onChunk });
    }

    // 非流式调用
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.streamTimeout);

      const response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
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

                // ✅ [Bug #013 DEBUG] 检查收到的 chunk 是否乱码
                console.log(`🔥🔥🔥 [Bug #013 DEBUG] 收到chunk (前50字符): "${chunk.substring(0, 50)}"`);

                if (onChunk) {
                  onChunk(chunk);
                }

                console.log(`📦 [Streaming] 接收数据块：${chunk.substring(0, 20)}...`);

              } else if (parsed.type === 'complete') {
                // 流式完成
                fullContent = parsed.content || fullContent;
                tokens = parsed.tokens || 0;

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
   * JS Fallback: 离线模式模拟 AI 响应
   */
  fallback({ role, prompt }) {
    console.log('🔄 使用 JS fallback 模拟 AI 响应');

    const templates = {
      facilitator: `我认为这个议题的核心在于平衡短期收益与长期价值。建议我们按以下逻辑推进：1）明确目标和约束条件；2）评估各方案的可行性；3）制定具体执行路径。各位专家请分享你们的专业视角。`,
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