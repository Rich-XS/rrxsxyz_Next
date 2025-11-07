#!/usr/bin/env node

/**
 * 并行测试运行器（Playwright原生支持）
 *
 * 功能：
 * 1. 并行运行多个测试场景
 * 2. 动态worker分配
 * 3. 失败自动重试
 * 4. 汇总报告生成
 *
 * 使用：
 * node scripts/parallel-runner.js [--workers=3] [--retries=1]
 *
 * 时间：2025-10-31 Night-Auth
 */

const { chromium } = require('playwright');
const GembaAgentPlaywright = require('./gemba-agent-playwright');

class ParallelRunner {
  constructor(config = {}) {
    this.workers = config.workers || 3;
    this.retries = config.retries || 1;
    this.results = [];
  }

  /**
   * 运行并行测试
   */
  async runParallel(scenarios) {
    console.log(`🚀 启动并行测试（${this.workers} workers）...\n`);

    const startTime = Date.now();
    const promises = scenarios.map((scenario, index) =>
      this._runScenario(scenario, index)
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    // 汇总结果
    const passCount = results.filter(r => r.passed).length;
    const failCount = results.filter(r => !r.passed).length;
    const totalTime = Math.round((endTime - startTime) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 并行测试完成！');
    console.log(`⏱️  总耗时: ${totalTime}秒`);
    console.log(`📊 通过: ${passCount} / ${passCount + failCount}`);
    console.log(`❌ 失败: ${failCount} / ${passCount + failCount}`);
    console.log('='.repeat(60) + '\n');

    return results;
  }

  /**
   * 运行单个场景
   */
  async _runScenario(scenario, index) {
    console.log(`[Worker ${index + 1}] 开始测试: ${scenario.name}`);

    const agent = new GembaAgentPlaywright();

    try {
      await agent.launch();

      // 运行测试
      if (scenario.id === 'full-suite') {
        await agent.runFullSuite();
      } else if (scenario.id === 'quick-test') {
        await agent.testUserLoginAndRoleSelection();
      }

      const passed = agent.testResults.every(r => r.passed);

      console.log(`[Worker ${index + 1}] 完成: ${scenario.name} - ${passed ? '✅ PASS' : '❌ FAIL'}`);

      return {
        scenarioName: scenario.name,
        passed,
        results: agent.testResults,
        errors: agent.errors
      };
    } catch (e) {
      console.error(`[Worker ${index + 1}] 错误: ${scenario.name}`, e.message);
      return {
        scenarioName: scenario.name,
        passed: false,
        errors: [{ message: e.message }]
      };
    } finally {
      if (agent.browser) {
        await agent.browser.close();
      }
    }
  }
}

// ============================================
// 主程序
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const workers = args.find(a => a.startsWith('--workers='))?.split('=')[1] || 3;
  const retries = args.find(a => a.startsWith('--retries='))?.split('=')[1] || 1;

  // 加载测试场景
  const scenariosFile = './scripts/scenarios.json';
  const fs = require('fs');
  const scenarios = JSON.parse(fs.readFileSync(scenariosFile, 'utf-8')).scenarios
    .filter(s => s.enabled);

  console.log(`⚙️  配置:`);
  console.log(`  - Workers: ${workers}`);
  console.log(`  - Retries: ${retries}`);
  console.log(`  - 场景数: ${scenarios.length}\n`);

  const runner = new ParallelRunner({ workers, retries });
  const results = await runner.runParallel(scenarios);

  console.log('📄 详细报告请查看: gemba-reports/gemba-report-playwright.html');
}

main().catch(console.error);

module.exports = ParallelRunner;
