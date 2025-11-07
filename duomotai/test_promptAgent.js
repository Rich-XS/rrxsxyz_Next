/**
 * T-303 PromptAgent 单元测试
 *
 * 测试范围：
 * 1. 模板注册和获取
 * 2. 参数验证（缺失必填参数）
 * 3. 提示词生成（正常场景）
 * 4. 版本管理（latest / 指定版本）
 * 5. Token 估算准确性
 * 6. 缓存机制有效性
 * 7. 自动裁剪功能
 *
 * @version 1.0.0
 * @date 2025-10-12
 */

// 模拟浏览器环境（Node.js 运行）
global.window = global;
global.console = console;

// 加载 PromptAgent
const PromptAgent = require('./src/modules/promptAgent.js');

console.log('========================================');
console.log('T-303 PromptAgent 单元测试');
console.log('========================================\n');

const agent = new PromptAgent({ cacheTTL: 1000, maxCacheSize: 5 }); // 1秒 TTL，测试用
let passedTests = 0;
let failedTests = 0;

// 测试辅助函数
function testCase(name, fn) {
  try {
    console.log(`\n📋 测试用例: ${name}`);
    fn();
    passedTests++;
    console.log(`✅ 通过\n`);
  } catch (error) {
    failedTests++;
    console.error(`❌ 失败: ${error.message}\n`);
  }
}

// ========================================
// 场景1: 模板注册和获取
// ========================================

console.log('\n==================== 场景1: 模板注册和获取 ====================\n');

testCase('1.1 注册单个模板', () => {
  agent.registerTemplate({
    id: 'test_template_1',
    name: '测试模板1',
    version: 'v1.0',
    requiredParams: ['name'],
    optionalParams: ['age'],
    template: (params) => `你好，${params.name}！`,
    maxTokens: 100,
    temperature: 0.7,
    metadata: {
      author: 'test',
      createdAt: '2025-10-12'
    }
  });

  const template = agent.getTemplate('test_template_1');

  if (!template) {
    throw new Error('模板未注册成功');
  }

  if (template.version !== 'v1.0') {
    throw new Error('版本号不匹配');
  }

  console.log('  模板已注册:', template.name);
});

testCase('1.2 注册多个版本', () => {
  agent.registerTemplate({
    id: 'test_template_2',
    name: '测试模板2',
    version: 'v1.0',
    requiredParams: ['topic'],
    template: (params) => `话题：${params.topic}`,
    maxTokens: 50,
    temperature: 0.5
  });

  agent.registerTemplate({
    id: 'test_template_2',
    name: '测试模板2（升级版）',
    version: 'v1.1',
    requiredParams: ['topic'],
    template: (params) => `话题（升级版）：${params.topic}`,
    maxTokens: 60,
    temperature: 0.6
  });

  const versions = agent.listVersions('test_template_2');

  if (versions.length !== 2) {
    throw new Error('版本数量不正确');
  }

  if (versions[0] !== 'v1.0' || versions[1] !== 'v1.1') {
    throw new Error('版本顺序不正确');
  }

  console.log('  版本列表:', versions.join(', '));
});

testCase('1.3 获取最新版本', () => {
  const latestTemplate = agent.getTemplate('test_template_2', 'latest');

  if (!latestTemplate) {
    throw new Error('未能获取最新版本');
  }

  if (latestTemplate.version !== 'v1.1') {
    throw new Error('最新版本不正确');
  }

  console.log('  最新版本:', latestTemplate.version);
});

testCase('1.4 获取指定版本', () => {
  const v10Template = agent.getTemplate('test_template_2', 'v1.0');

  if (!v10Template) {
    throw new Error('未能获取指定版本');
  }

  if (v10Template.version !== 'v1.0') {
    throw new Error('版本不匹配');
  }

  console.log('  指定版本:', v10Template.version);
});

// ========================================
// 场景2: 参数验证
// ========================================

console.log('\n==================== 场景2: 参数验证 ====================\n');

testCase('2.1 缺失必填参数', () => {
  try {
    agent.generate('test_template_1', {}); // 缺少 'name' 参数
    throw new Error('应该抛出缺失参数错误');
  } catch (error) {
    if (!error.message.includes('Missing required parameters')) {
      throw new Error('错误信息不正确');
    }
    console.log('  捕获预期错误:', error.message);
  }
});

testCase('2.2 提供完整参数', () => {
  const result = agent.generate('test_template_1', { name: '张三' });

  if (!result.prompt) {
    throw new Error('未生成提示词');
  }

  if (result.prompt !== '你好，张三！') {
    throw new Error('提示词内容不正确');
  }

  console.log('  生成结果:', result.prompt);
});

// ========================================
// 场景3: 提示词生成
// ========================================

console.log('\n==================== 场景3: 提示词生成 ====================\n');

testCase('3.1 正常生成', () => {
  const result = agent.generate('test_template_2', { topic: '人工智能' }, 'v1.0');

  if (!result.prompt) {
    throw new Error('未生成提示词');
  }

  if (result.prompt !== '话题：人工智能') {
    throw new Error('提示词内容不正确');
  }

  if (result.metadata.version !== 'v1.0') {
    throw new Error('元数据版本不正确');
  }

  console.log('  生成结果:', result.prompt);
  console.log('  Token 估算:', result.tokens);
});

testCase('3.2 使用最新版本生成', () => {
  const result = agent.generate('test_template_2', { topic: '人工智能' }, 'latest');

  if (!result.prompt) {
    throw new Error('未生成提示词');
  }

  if (result.prompt !== '话题（升级版）：人工智能') {
    throw new Error('提示词内容不正确（应使用 v1.1）');
  }

  console.log('  生成结果:', result.prompt);
});

// ========================================
// 场景4: Token 估算
// ========================================

console.log('\n==================== 场景4: Token 估算 ====================\n');

testCase('4.1 纯中文 Token 估算', () => {
  const prompt = '这是一个测试提示词，用于验证 Token 估算的准确性。';
  const tokens = agent.estimateTokens(prompt);

  // 中文约 2 字符 = 1 token，这里24个字符应约 12 tokens
  if (tokens < 10 || tokens > 15) {
    throw new Error(`Token 估算不合理: ${tokens}（预期 10-15）`);
  }

  console.log('  中文提示词:', prompt);
  console.log('  估算 Tokens:', tokens);
});

testCase('4.2 英文 Token 估算', () => {
  const prompt = 'This is a test prompt for token estimation validation.';
  const tokens = agent.estimateTokens(prompt);

  // 英文约 3-4 字符 = 1 token，这里54个字符应约 13-18 tokens
  if (tokens < 10 || tokens > 20) {
    throw new Error(`Token 估算不合理: ${tokens}（预期 10-20）`);
  }

  console.log('  英文提示词:', prompt);
  console.log('  估算 Tokens:', tokens);
});

testCase('4.3 混合中英文 Token 估算', () => {
  const prompt = '这是一个 mixed test 提示词，包含中文和 English。';
  const tokens = agent.estimateTokens(prompt);

  // 混合文本应在 10-20 tokens 之间
  if (tokens < 10 || tokens > 25) {
    throw new Error(`Token 估算不合理: ${tokens}（预期 10-25）`);
  }

  console.log('  混合提示词:', prompt);
  console.log('  估算 Tokens:', tokens);
});

// ========================================
// 场景5: 缓存机制
// ========================================

console.log('\n==================== 场景5: 缓存机制 ====================\n');

testCase('5.1 缓存命中', () => {
  agent.clearCache(); // 清空缓存

  // 第一次生成
  const result1 = agent.generate('test_template_1', { name: '李四' });

  // 第二次生成（应该命中缓存）
  const result2 = agent.generate('test_template_1', { name: '李四' });

  if (result1.prompt !== result2.prompt) {
    throw new Error('缓存结果不一致');
  }

  console.log('  第一次生成:', result1.prompt);
  console.log('  第二次生成（缓存）:', result2.prompt);
});

testCase('5.2 缓存失效（不同参数）', () => {
  const result1 = agent.generate('test_template_1', { name: '张三' });
  const result2 = agent.generate('test_template_1', { name: '李四' });

  if (result1.prompt === result2.prompt) {
    throw new Error('不同参数应生成不同结果');
  }

  console.log('  参数1生成:', result1.prompt);
  console.log('  参数2生成:', result2.prompt);
});

testCase('5.3 缓存过期', async () => {
  agent.clearCache();

  const result1 = agent.generate('test_template_1', { name: '王五' });

  // 等待 1.1 秒（超过 cacheTTL = 1000ms）
  await new Promise(resolve => setTimeout(resolve, 1100));

  // 清理过期缓存
  agent.cleanExpiredCache();

  const stats = agent.getStats();

  if (stats.cacheSize !== 0) {
    throw new Error('过期缓存未清理');
  }

  console.log('  缓存已过期并清理');
});

testCase('5.4 缓存容量限制', () => {
  agent.clearCache();

  // 生成 6 个缓存条目（超过 maxCacheSize = 5）
  for (let i = 0; i < 6; i++) {
    agent.generate('test_template_1', { name: `用户${i}` });
  }

  const stats = agent.getStats();

  if (stats.cacheSize > 5) {
    throw new Error(`缓存超过限制: ${stats.cacheSize}（最大5）`);
  }

  console.log('  缓存大小:', stats.cacheSize);
  console.log('  缓存限制:', stats.maxCacheSize);
});

// ========================================
// 场景6: 自动裁剪
// ========================================

console.log('\n==================== 场景6: 自动裁剪 ====================\n');

testCase('6.1 不需要裁剪', () => {
  const shortPrompt = '短提示词';
  const optimized = agent.optimize(shortPrompt, 10);

  if (optimized !== shortPrompt) {
    throw new Error('短提示词不应被裁剪');
  }

  console.log('  原始提示词:', shortPrompt);
  console.log('  优化后:', optimized);
});

testCase('6.2 需要裁剪', () => {
  const longPrompt = '这是一个非常长的提示词，包含大量的文本内容，用于测试自动裁剪功能。这个提示词的长度超过了设定的最大 Token 数，因此应该被自动裁剪以优化成本。';
  const optimized = agent.optimize(longPrompt, 10); // 限制 10 tokens（约20字符）

  if (optimized.length >= longPrompt.length) {
    throw new Error('长提示词未被裁剪');
  }

  if (!optimized.includes('...')) {
    throw new Error('裁剪后的提示词应包含省略标记');
  }

  console.log('  原始长度:', longPrompt.length);
  console.log('  裁剪后长度:', optimized.length);
  console.log('  裁剪后内容:', optimized);
});

// ========================================
// 场景7: 统计信息
// ========================================

console.log('\n==================== 场景7: 统计信息 ====================\n');

testCase('7.1 获取统计信息', () => {
  const stats = agent.getStats();

  if (!stats.templateCount || stats.templateCount < 2) {
    throw new Error('模板数量统计不正确');
  }

  if (!stats.versionCount || stats.versionCount < 3) {
    throw new Error('版本数量统计不正确');
  }

  console.log('  统计信息:', JSON.stringify(stats, null, 2));
});

testCase('7.2 列出所有模板', () => {
  const templates = agent.listTemplates();

  if (templates.length < 2) {
    throw new Error('模板列表不正确');
  }

  console.log('  模板列表:', JSON.stringify(templates, null, 2));
});

// ========================================
// 测试总结
// ========================================

console.log('\n========================================');
console.log('测试总结');
console.log('========================================\n');
console.log(`✅ 通过: ${passedTests} 个`);
console.log(`❌ 失败: ${failedTests} 个`);
console.log(`📊 总计: ${passedTests + failedTests} 个`);
console.log(`💯 通过率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%\n`);

if (failedTests === 0) {
  console.log('🎉 所有测试通过！T-303 PromptAgent 核心功能验证完成。\n');
  process.exit(0);
} else {
  console.log('⚠️  部分测试失败，请检查错误日志。\n');
  process.exit(1);
}
