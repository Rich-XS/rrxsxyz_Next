// Gemini-Balance API 测试脚本
// 用途：验证API连通性、响应时间、输出质量
// 创建时间：2025-10-28

const axios = require('axios');

// 配置（从aiModels.js复制）
const config = {
  apiKey: 'sk-BaiWen_RRXS',
  apiUrl: 'http://54.252.140.109:6600/v1/chat/completions',
  model: 'gemini-2.5-flash-preview'
};

// 测试案例：简单的规划任务（类似多魔汰策划阶段）
const testPrompt = `你是【领袖(委托代理)】，现在需要为以下议题制定辩论策略：

**核心议题**：是否应该从职场转型做自媒体？
**背景信息**：45岁，10年行业经验，对内容创作不确定
**参与专家**：5位
**辩论轮数**：3轮

请生成一个简洁的策略规划（约300字），包括：
1. 核心策略声明（50字）
2. 分轮主题规划（3轮，每轮一行："第X轮 / 主题 / 目标"）
3. 结束语（30字）

⚠️ 严格控制总字数在300字以内。`;

async function testGeminiBalance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Gemini-Balance API 测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 API URL: ${config.apiUrl}`);
  console.log(`🔑 API Key: ${config.apiKey}`);
  console.log(`🤖 Model: ${config.model}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();

  try {
    console.log('⏱️  开始请求...');

    const response = await axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的辩论策划专家，擅长制定简洁明确的辩论策略。'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.6
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('✅ 请求成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 性能指标');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  响应时间: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}秒)`);

    if (response.data.usage) {
      console.log(`🔢 Token统计:`);
      console.log(`   - Prompt Tokens: ${response.data.usage.prompt_tokens || 'N/A'}`);
      console.log(`   - Completion Tokens: ${response.data.usage.completion_tokens || 'N/A'}`);
      console.log(`   - Total Tokens: ${response.data.usage.total_tokens || 'N/A'}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 生成内容');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      console.log(content);
      console.log(`\n📏 字数统计: ${content.length} 字`);

      // 检查是否符合300字要求
      if (content.length <= 350) {
        console.log('✅ 字数控制良好（≤350字）');
      } else {
        console.log(`⚠️  超出字数限制（目标≤350字，实际${content.length}字）`);
      }
    } else {
      console.log('⚠️  响应格式异常，无法提取内容');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 测试完成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('❌ 测试失败\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  错误详情');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  失败时间: ${responseTime}ms`);

    if (error.response) {
      // API返回了错误响应
      console.log(`📡 HTTP状态码: ${error.response.status}`);
      console.log(`📝 错误消息:`, error.response.data);
    } else if (error.request) {
      // 请求已发送但无响应
      console.log('📡 网络连接问题：请求已发送但无响应');
      console.log('可能原因：');
      console.log('  1. AWS EC2服务器未启动');
      console.log('  2. 网络连接问题');
      console.log('  3. 防火墙阻止');
    } else {
      // 请求配置错误
      console.log('⚙️  请求配置错误:', error.message);
    }

    console.log('\n完整错误:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// 运行测试
testGeminiBalance();
