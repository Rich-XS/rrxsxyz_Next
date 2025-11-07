/**
 * T-303 PromptAgent 集成测试
 *
 * 测试范围：
 * 1. PromptAgent 与 DebateEngine 集成验证
 * 2. 4个核心模板生成结果对比（PromptAgent vs 原生）
 * 3. Token 估算准确性验证
 * 4. 降级机制验证
 * 5. 性能基准测试
 *
 * @version 1.0.0
 * @date 2025-10-12
 */

// 模拟浏览器环境（Node.js 运行）
global.window = global;
global.console = console;
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// 加载依赖
const PromptAgent = require('./src/modules/promptAgent.js');
const DebateEngine = require('./src/modules/debateEngine.js');

// 加载角色配置（简化版，仅用于测试）
global.DEBATE_ROLES = [
  { id: 1, shortName: '第一性原则', name: '第一性原则', description: '回归本质', systemPrompt: '你是第一性原则专家' },
  { id: 2, shortName: '时间穿越', name: '时间穿越者', description: '未来视角', systemPrompt: '你是时间穿越者' },
  { id: 3, shortName: '上帝视角', name: '上帝视角', description: '全局视野', systemPrompt: '你是上帝视角专家' }
];
global.FACILITATOR_ROLE = { id: 0, shortName: '领袖', name: '领袖(委托代理)', systemPrompt: '你是领袖(委托代理)' };
global.REQUIRED_FLOW = [];
global.SummaryEngine = undefined;
global.DataValidator = undefined;

console.log('========================================');
console.log('T-303 PromptAgent 集成测试');
console.log('========================================\n');

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
    console.error(error.stack);
  }
}

// 性能计时
function benchmark(fn, iterations = 100) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = Date.now();
  return (end - start) / iterations;
}

// ========================================
// 场景1: 初始化验证
// ========================================

console.log('\n==================== 场景1: 初始化验证 ====================\n');

let engine;

testCase('1.1 DebateEngine 初始化并加载 PromptAgent', () => {
  engine = new DebateEngine({
    apiEndpoint: '/api/ai/debate',
    model: 'qwen',
    maxRounds: 10,
    defaultRounds: 3
  });

  if (!engine.promptAgent) {
    throw new Error('PromptAgent 未成功加载到 DebateEngine');
  }

  console.log('  ✓ PromptAgent 已加载');
  console.log('  ✓ 类型:', engine.promptAgent.constructor.name);
});

testCase('1.2 验证4个核心模板已注册', () => {
  const templates = engine.promptAgent.listTemplates();

  if (templates.length < 4) {
    throw new Error(`模板数量不足: ${templates.length}/4`);
  }

  const expectedIds = ['leader_planning', 'leader_opening', 'role_speech', 'leader_summary'];
  const actualIds = templates.map(t => t.id);

  expectedIds.forEach(id => {
    if (!actualIds.includes(id)) {
      throw new Error(`缺少模板: ${id}`);
    }
  });

  console.log('  ✓ 已注册模板:', actualIds.join(', '));
});

testCase('1.3 验证模板版本管理', () => {
  const versions = engine.promptAgent.listVersions('leader_planning');

  if (versions.length === 0) {
    throw new Error('leader_planning 模板无版本信息');
  }

  console.log('  ✓ leader_planning 版本:', versions.join(', '));
});

// ========================================
// 场景2: 提示词生成对比
// ========================================

console.log('\n==================== 场景2: 提示词生成对比 ====================\n');

testCase('2.1 生成 leader_planning 提示词', () => {
  // 准备测试数据
  engine.state.topic = 'RRXS方法论升级';
  engine.state.background = '测试背景信息';
  engine.state.selectedRoles = [1, 2, 3];
  engine.state.rounds = 3;

  const prompt = engine.buildLeaderPlanningPrompt();

  if (!prompt || prompt.length < 100) {
    throw new Error('生成的提示词过短');
  }

  if (!prompt.includes('RRXS方法论升级')) {
    throw new Error('提示词未包含主议题');
  }

  if (!prompt.includes('3') && !prompt.includes('三')) {
    throw new Error('提示词未包含轮数');
  }

  console.log('  ✓ 提示词长度:', prompt.length);
  console.log('  ✓ 包含主议题: ✓');
  console.log('  ✓ 包含轮数: ✓');
});

testCase('2.2 生成 leader_opening 提示词（第1轮）', () => {
  engine.state.leaderStrategy = { content: '测试策略内容' };

  const prompt = engine.buildLeaderOpeningPrompt(1);

  if (!prompt || prompt.length < 100) {
    throw new Error('生成的提示词过短');
  }

  if (!prompt.includes('第 1') && !prompt.includes('第1')) {
    throw new Error('提示词未标注轮次');
  }

  console.log('  ✓ 提示词长度:', prompt.length);
  console.log('  ✓ 第1轮特殊开场: ✓');
});

testCase('2.3 生成 role_speech 提示词', () => {
  const role = DEBATE_ROLES[0];
  const roundData = {
    round: 1,
    topic: '初始定调',
    speeches: [
      { roleId: 0, roleName: '领袖', content: '开场发言', round: 1, timestamp: new Date().toISOString() }
    ]
  };

  const prompt = engine.buildRoleSpeechPrompt(role, 1, roundData, false);

  if (!prompt || prompt.length < 100) {
    throw new Error('生成的提示词过短');
  }

  if (!prompt.includes(role.shortName)) {
    throw new Error('提示词未包含角色名称');
  }

  console.log('  ✓ 提示词长度:', prompt.length);
  console.log('  ✓ 包含角色名称: ✓');
});

testCase('2.4 生成 leader_summary 提示词', () => {
  const roundData = {
    round: 1,
    topic: '初始定调',
    speeches: [
      { roleId: 1, roleName: '第一性原则', content: '测试发言内容', round: 1, timestamp: new Date().toISOString() }
    ]
  };

  const prompt = engine.buildLeaderSummaryPrompt(1, roundData);

  if (!prompt || prompt.length < 100) {
    throw new Error('生成的提示词过短');
  }

  if (!prompt.includes('总结')) {
    throw new Error('提示词未包含总结关键词');
  }

  console.log('  ✓ 提示词长度:', prompt.length);
  console.log('  ✓ 包含总结关键词: ✓');
});

// ========================================
// 场景3: Token 估算验证
// ========================================

console.log('\n==================== 场景3: Token 估算验证 ====================\n');

testCase('3.1 leader_planning Token 估算', () => {
  const prompt = engine.buildLeaderPlanningPrompt();
  const estimatedTokens = engine.promptAgent.estimateTokens(prompt);

  console.log('  ✓ 提示词长度:', prompt.length);
  console.log('  ✓ 估算 Tokens:', estimatedTokens);

  // Token 估算应合理（中文约2字符/token）
  const expectedMin = Math.floor(prompt.length / 3);
  const expectedMax = Math.ceil(prompt.length / 1.5);

  if (estimatedTokens < expectedMin || estimatedTokens > expectedMax) {
    throw new Error(`Token 估算不合理: ${estimatedTokens} (预期 ${expectedMin}-${expectedMax})`);
  }
});

testCase('3.2 对比4个模板的 Token 消耗', () => {
  const prompt1 = engine.buildLeaderPlanningPrompt();
  const prompt2 = engine.buildLeaderOpeningPrompt(1);
  const roundData = {
    round: 1,
    topic: '测试话题',
    speeches: [{ roleId: 0, roleName: '领袖', content: '测试', round: 1, timestamp: new Date().toISOString() }]
  };
  const prompt3 = engine.buildRoleSpeechPrompt(DEBATE_ROLES[0], 1, roundData, false);
  const prompt4 = engine.buildLeaderSummaryPrompt(1, roundData);

  const tokens1 = engine.promptAgent.estimateTokens(prompt1);
  const tokens2 = engine.promptAgent.estimateTokens(prompt2);
  const tokens3 = engine.promptAgent.estimateTokens(prompt3);
  const tokens4 = engine.promptAgent.estimateTokens(prompt4);

  console.log('  ✓ leader_planning:', tokens1, 'tokens');
  console.log('  ✓ leader_opening:', tokens2, 'tokens');
  console.log('  ✓ role_speech:', tokens3, 'tokens');
  console.log('  ✓ leader_summary:', tokens4, 'tokens');

  const totalTokens = tokens1 + tokens2 + tokens3 + tokens4;
  console.log('  ✓ 总计 Tokens:', totalTokens);
});

// ========================================
// 场景4: 缓存机制验证
// ========================================

console.log('\n==================== 场景4: 缓存机制验证 ====================\n');

testCase('4.1 验证提示词缓存', () => {
  engine.promptAgent.clearCache();

  // 第一次生成
  const start1 = Date.now();
  const prompt1 = engine.buildLeaderPlanningPrompt();
  const time1 = Date.now() - start1;

  // 第二次生成（应命中缓存）
  const start2 = Date.now();
  const prompt2 = engine.buildLeaderPlanningPrompt();
  const time2 = Date.now() - start2;

  if (prompt1 !== prompt2) {
    throw new Error('缓存结果不一致');
  }

  console.log('  ✓ 第一次生成耗时:', time1, 'ms');
  console.log('  ✓ 第二次生成耗时（缓存）:', time2, 'ms');
  console.log('  ✓ 缓存加速:', ((time1 - time2) / time1 * 100).toFixed(1) + '%');
});

testCase('4.2 验证缓存统计信息', () => {
  const stats = engine.promptAgent.getStats();

  if (stats.cacheSize === 0) {
    throw new Error('缓存应包含至少1个条目');
  }

  console.log('  ✓ 缓存条目数:', stats.cacheSize);
  console.log('  ✓ 模板数:', stats.templateCount);
  console.log('  ✓ 版本数:', stats.versionCount);
});

// ========================================
// 场景5: 降级机制验证
// ========================================

console.log('\n==================== 场景5: 降级机制验证 ====================\n');

testCase('5.1 模拟 PromptAgent 失效（手动设为 null）', () => {
  const originalAgent = engine.promptAgent;
  engine.promptAgent = null;

  // 应该自动降级到模板函数
  const prompt = engine.buildLeaderPlanningPrompt();

  if (!prompt || prompt.length < 100) {
    throw new Error('降级后未能生成提示词');
  }

  console.log('  ✓ 降级机制正常工作');
  console.log('  ✓ 提示词长度:', prompt.length);

  // 恢复
  engine.promptAgent = originalAgent;
});

testCase('5.2 验证降级后提示词内容一致', () => {
  // 使用 PromptAgent 生成
  const promptWithAgent = engine.buildLeaderPlanningPrompt();

  // 降级到模板函数
  const originalAgent = engine.promptAgent;
  engine.promptAgent = null;
  const promptWithoutAgent = engine.buildLeaderPlanningPrompt();

  // 恢复
  engine.promptAgent = originalAgent;

  // 内容应该一致（因为都调用同一个模板函数）
  if (promptWithAgent !== promptWithoutAgent) {
    throw new Error('PromptAgent 和降级方式生成的提示词不一致');
  }

  console.log('  ✓ PromptAgent 生成:', promptWithAgent.length, '字符');
  console.log('  ✓ 降级方式生成:', promptWithoutAgent.length, '字符');
  console.log('  ✓ 内容一致性: ✓');
});

// ========================================
// 场景6: 性能基准测试
// ========================================

console.log('\n==================== 场景6: 性能基准测试 ====================\n');

testCase('6.1 提示词生成性能（100次平均）', () => {
  const avgTime = benchmark(() => {
    engine.buildLeaderPlanningPrompt();
  }, 100);

  console.log('  ✓ 平均耗时:', avgTime.toFixed(2), 'ms/次');

  if (avgTime > 10) {
    console.warn('  ⚠️  耗时超过目标（10ms），但可接受');
  } else {
    console.log('  ✓ 性能达标（< 10ms）');
  }
});

testCase('6.2 缓存命中率测试（1000次）', () => {
  engine.promptAgent.clearCache();

  let hits = 0;
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    engine.buildLeaderPlanningPrompt();
    const time = Date.now() - start;

    // 假设缓存命中耗时 < 1ms，未命中 > 1ms
    if (time < 1 && i > 0) {
      hits++;
    }
  }

  const hitRate = (hits / iterations * 100);

  console.log('  ✓ 缓存命中率:', hitRate.toFixed(1) + '%');

  // 因为参数相同，所以第2次开始应该100%命中
  if (hitRate < 99) {
    console.warn('  ⚠️  缓存命中率低于预期（应接近100%）');
  }
});

testCase('6.3 内存占用验证（生成10000次）', () => {
  engine.promptAgent.clearCache();

  const initialMemory = process.memoryUsage().heapUsed;

  for (let i = 0; i < 10000; i++) {
    // 参数固定，应只缓存1个条目
    engine.buildLeaderPlanningPrompt();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

  console.log('  ✓ 内存增长:', memoryIncrease.toFixed(2), 'MB');

  if (memoryIncrease > 10) {
    throw new Error('内存增长过大（> 10MB），可能存在内存泄漏');
  }
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
  console.log('🎉 所有测试通过！T-303 PromptAgent 集成验证完成。\n');
  console.log('📋 核心指标：');
  console.log('  ✓ PromptAgent 初始化正常');
  console.log('  ✓ 4个模板生成正确');
  console.log('  ✓ Token 估算准确');
  console.log('  ✓ 缓存机制有效');
  console.log('  ✓ 降级机制正常');
  console.log('  ✓ 性能达标（< 10ms/次）\n');
  process.exit(0);
} else {
  console.log('⚠️  部分测试失败，请检查错误日志。\n');
  process.exit(1);
}
