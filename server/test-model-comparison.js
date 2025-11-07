// 4模型对比测试脚本 - 策划性能&质量评估
// 用途：测试 DeepSeek/Qwen/Gemini-Balance/GLM 在策划场景下的表现
// 创建时间：2025-10-29

require('dotenv').config(); // ✅ 加载 .env 环境变量
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const aiModelsConfig = require('./config/aiModels');

// ✅ 日志文件配置
const LOG_FILE = path.join(__dirname, 'test-results.log');

// ✅ 双输出函数：控制台 + 文件（追加模式）
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n', 'utf8');
}

// 测试用例：简化的策划任务（类似多魔汰策划阶段）
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

const systemPrompt = '你是一个专业的辩论策划专家，擅长制定简洁明确的辩论策略。';

// 获取4个模型配置
const models = {
  deepseek: aiModelsConfig.getModelConfig('deepseek'),
  qwen: aiModelsConfig.getModelConfig('qwen'),
  'gemini-balance': aiModelsConfig.getModelConfig('gemini-balance'),
  glm: aiModelsConfig.getModelConfig('glm')
};

// 测试单个模型
async function testModel(modelName, config) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🧪 测试模型: ${modelName.toUpperCase()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 API URL: ${config.apiUrl}`);
  console.log(`🔑 API Key: ${config.apiKey.substring(0, 15)}...`);
  console.log(`🤖 Model: ${config.model}`);

  const startTime = Date.now();

  try {
    const response = await axios.post(config.apiUrl, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      max_tokens: 800,
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

    // 提取内容
    const content = response.data.choices[0].message.content;
    const charCount = content.length;

    // 提取Token统计
    const tokens = response.data.usage || {};
    const promptTokens = tokens.prompt_tokens || 'N/A';
    const completionTokens = tokens.completion_tokens || 'N/A';
    const totalTokens = tokens.total_tokens || 'N/A';

    // 质量评估（简单版）
    const hasStrategy = content.includes('策略') || content.includes('战略');
    const hasRounds = (content.match(/第[1-3]轮/g) || []).length >= 3;
    const hasConclusion = content.includes('结束') || content.includes('总结') || content.includes('期待');
    const qualityScore = (hasStrategy ? 30 : 0) + (hasRounds ? 50 : 0) + (hasConclusion ? 20 : 0);
    const withinLimit = charCount <= 350;

    console.log(`\n✅ 测试成功！`);
    console.log(`\n📊 性能指标`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⏱️  响应时间: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}秒)`);
    console.log(`🔢 Token统计:`);
    console.log(`   - Prompt Tokens: ${promptTokens}`);
    console.log(`   - Completion Tokens: ${completionTokens}`);
    console.log(`   - Total Tokens: ${totalTokens}`);
    console.log(`📏 字数统计: ${charCount} 字 ${withinLimit ? '✅ (≤350)' : '⚠️ (超限)'}`);
    console.log(`\n📝 内容质量评估`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   - 包含策略声明: ${hasStrategy ? '✅' : '❌'} (30分)`);
    console.log(`   - 包含3轮规划: ${hasRounds ? '✅' : '❌'} (50分)`);
    console.log(`   - 包含结束语: ${hasConclusion ? '✅' : '❌'} (20分)`);
    console.log(`   - 质量总分: ${qualityScore}/100`);
    console.log(`\n📄 生成内容（前200字）`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(content.substring(0, 200) + '...\n');

    return {
      modelName,
      success: true,
      responseTime,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      charCount,
      withinLimit,
      qualityScore,
      quality: {
        hasStrategy,
        hasRounds,
        hasConclusion
      },
      content
    };

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`\n❌ 测试失败`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⏱️  失败时间: ${responseTime}ms`);

    if (error.response) {
      console.log(`📡 HTTP状态码: ${error.response.status}`);
      console.log(`📝 错误消息:`, error.response.data);
    } else if (error.request) {
      console.log(`📡 网络连接问题：请求已发送但无响应`);
    } else {
      console.log(`⚙️  请求配置错误:`, error.message);
    }

    return {
      modelName,
      success: false,
      responseTime,
      error: error.response?.data || error.message
    };
  }
}

// 主测试流程
async function runComparison() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 4模型策划性能对比测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 测试场景: 多魔汰策划阶段（300字策略规划）');
  console.log('🔍 测试模型: DeepSeek / Qwen / Gemini-Balance / GLM');
  console.log('⏱️  开始时间:', new Date().toLocaleString('zh-CN'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  // 串行测试（避免并发请求被限流）
  for (const [modelName, config] of Object.entries(models)) {
    const result = await testModel(modelName, config);
    results.push(result);

    // 测试间隔（避免频繁请求）
    if (modelName !== 'glm') {
      console.log('\n⏳ 等待3秒后测试下一个模型...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 汇总对比
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果汇总对比');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 对比表格
  console.log('┌─────────────────┬──────────┬──────────┬──────────┬──────────┐');
  console.log('│ 模型            │ 响应时间 │ 字数     │ 质量评分 │ 状态     │');
  console.log('├─────────────────┼──────────┼──────────┼──────────┼──────────┤');

  results.forEach(result => {
    const name = result.modelName.padEnd(15);
    const time = result.success ? `${(result.responseTime / 1000).toFixed(2)}s`.padEnd(8) : 'FAILED'.padEnd(8);
    const chars = result.success ? `${result.charCount}字`.padEnd(8) : 'N/A'.padEnd(8);
    const quality = result.success ? `${result.qualityScore}/100`.padEnd(8) : 'N/A'.padEnd(8);
    const status = result.success ? '✅ 成功' : '❌ 失败';

    console.log(`│ ${name} │ ${time} │ ${chars} │ ${quality} │ ${status.padEnd(8)} │`);
  });

  console.log('└─────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // 排名分析
  const successResults = results.filter(r => r.success);

  if (successResults.length > 0) {
    console.log('\n🏆 性能排名（响应时间）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const sortedByTime = [...successResults].sort((a, b) => a.responseTime - b.responseTime);
    sortedByTime.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${result.modelName.toUpperCase()}: ${(result.responseTime / 1000).toFixed(2)}秒`);
    });

    console.log('\n🏆 质量排名（内容评分）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const sortedByQuality = [...successResults].sort((a, b) => b.qualityScore - a.qualityScore);
    sortedByQuality.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${result.modelName.toUpperCase()}: ${result.qualityScore}/100 分`);
    });

    console.log('\n💰 Token消耗对比');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    successResults.forEach(result => {
      console.log(`${result.modelName.toUpperCase()}: ${result.tokens.total} tokens (输入:${result.tokens.prompt} / 输出:${result.tokens.completion})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 测试完成');
  console.log('⏱️  结束时间:', new Date().toLocaleString('zh-CN'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 返回结果供后续分析
  return results;
}

// 运行测试
runComparison()
  .then(results => {
    console.log('🎉 所有测试已完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试过程发生错误:', error);
    process.exit(1);
  });
