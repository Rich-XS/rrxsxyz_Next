#!/usr/bin/env node

/**
 * Puppeteer vs Playwright 性能对比测试
 *
 * 功能：
 * 1. 对比启动时间
 * 2. 对比响应速度
 * 3. 对比资源消耗
 * 4. 生成对比报告
 *
 * 使用：
 * node scripts/puppeteer-vs-playwright-benchmark.js
 *
 * 时间：2025-10-31 Night-Auth
 */

const puppeteer = require('puppeteer');
const { chromium } = require('playwright');

class Benchmark {
  constructor() {
    this.results = [];
  }

  /**
   * 测试1: 浏览器启动时间
   */
  async testLaunchTime() {
    console.log('\n🧪 测试1: 浏览器启动时间');

    // Puppeteer
    const puppeteerStart = Date.now();
    const puppeteerBrowser = await puppeteer.launch({ headless: true });
    const puppeteerTime = Date.now() - puppeteerStart;
    await puppeteerBrowser.close();
    console.log(`  Puppeteer: ${puppeteerTime}ms`);

    // Playwright
    const playwrightStart = Date.now();
    const playwrightBrowser = await chromium.launch({ headless: true });
    const playwrightTime = Date.now() - playwrightStart;
    await playwrightBrowser.close();
    console.log(`  Playwright: ${playwrightTime}ms`);

    this.results.push({
      name: '浏览器启动时间',
      puppeteer: puppeteerTime,
      playwright: playwrightTime,
      improvement: Math.round((1 - playwrightTime / puppeteerTime) * 100)
    });
  }

  /**
   * 测试2: 页面导航时间
   */
  async testNavigationTime() {
    console.log('\n🧪 测试2: 页面导航时间');

    const testUrl = 'http://localhost:8080/';

    // Puppeteer
    const puppeteerBrowser = await puppeteer.launch({ headless: true });
    const puppeteerPage = await puppeteerBrowser.newPage();
    const puppeteerStart = Date.now();
    await puppeteerPage.goto(testUrl, { waitUntil: 'networkidle2' });
    const puppeteerTime = Date.now() - puppeteerStart;
    await puppeteerBrowser.close();
    console.log(`  Puppeteer: ${puppeteerTime}ms`);

    // Playwright
    const playwrightBrowser = await chromium.launch({ headless: true });
    const playwrightPage = await playwrightBrowser.newPage();
    const playwrightStart = Date.now();
    await playwrightPage.goto(testUrl, { waitUntil: 'networkidle' });
    const playwrightTime = Date.now() - playwrightStart;
    await playwrightBrowser.close();
    console.log(`  Playwright: ${playwrightTime}ms`);

    this.results.push({
      name: '页面导航时间',
      puppeteer: puppeteerTime,
      playwright: playwrightTime,
      improvement: Math.round((1 - playwrightTime / puppeteerTime) * 100)
    });
  }

  /**
   * 测试3: 元素查找时间
   */
  async testSelectorTime() {
    console.log('\n🧪 测试3: 元素查找时间（1000次）');

    const testUrl = 'http://localhost:8080/duomotai/';
    const selector = '.role-card';

    // Puppeteer
    const puppeteerBrowser = await puppeteer.launch({ headless: true });
    const puppeteerPage = await puppeteerBrowser.newPage();
    await puppeteerPage.goto(testUrl, { waitUntil: 'networkidle2' });
    const puppeteerStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      await puppeteerPage.$(selector);
    }
    const puppeteerTime = Date.now() - puppeteerStart;
    await puppeteerBrowser.close();
    console.log(`  Puppeteer: ${puppeteerTime}ms`);

    // Playwright
    const playwrightBrowser = await chromium.launch({ headless: true });
    const playwrightPage = await playwrightBrowser.newPage();
    await playwrightPage.goto(testUrl, { waitUntil: 'networkidle' });
    const playwrightStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      await playwrightPage.$(selector);
    }
    const playwrightTime = Date.now() - playwrightStart;
    await playwrightBrowser.close();
    console.log(`  Playwright: ${playwrightTime}ms`);

    this.results.push({
      name: '元素查找时间（1000次）',
      puppeteer: puppeteerTime,
      playwright: playwrightTime,
      improvement: Math.round((1 - playwrightTime / puppeteerTime) * 100)
    });
  }

  /**
   * 测试4: 截图性能
   */
  async testScreenshotTime() {
    console.log('\n🧪 测试4: 截图性能（10次）');

    const testUrl = 'http://localhost:8080/';

    // Puppeteer
    const puppeteerBrowser = await puppeteer.launch({ headless: true });
    const puppeteerPage = await puppeteerBrowser.newPage();
    await puppeteerPage.goto(testUrl, { waitUntil: 'networkidle2' });
    const puppeteerStart = Date.now();
    for (let i = 0; i < 10; i++) {
      await puppeteerPage.screenshot({ path: `./gemba-reports/benchmark-puppeteer-${i}.png` });
    }
    const puppeteerTime = Date.now() - puppeteerStart;
    await puppeteerBrowser.close();
    console.log(`  Puppeteer: ${puppeteerTime}ms`);

    // Playwright
    const playwrightBrowser = await chromium.launch({ headless: true });
    const playwrightPage = await playwrightBrowser.newPage();
    await playwrightPage.goto(testUrl, { waitUntil: 'networkidle' });
    const playwrightStart = Date.now();
    for (let i = 0; i < 10; i++) {
      await playwrightPage.screenshot({ path: `./gemba-reports/benchmark-playwright-${i}.png` });
    }
    const playwrightTime = Date.now() - playwrightStart;
    await playwrightBrowser.close();
    console.log(`  Playwright: ${playwrightTime}ms`);

    this.results.push({
      name: '截图性能（10次）',
      puppeteer: puppeteerTime,
      playwright: playwrightTime,
      improvement: Math.round((1 - playwrightTime / puppeteerTime) * 100)
    });
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 性能对比报告（Puppeteer vs Playwright）');
    console.log('='.repeat(70));

    this.results.forEach(result => {
      const improvement = result.improvement > 0 ? `⬇️ ${result.improvement}%` : `⬆️ ${Math.abs(result.improvement)}%`;
      console.log(`\n${result.name}:`);
      console.log(`  Puppeteer: ${result.puppeteer}ms`);
      console.log(`  Playwright: ${result.playwright}ms`);
      console.log(`  改善: ${improvement}`);
    });

    const avgImprovement = Math.round(
      this.results.reduce((sum, r) => sum + r.improvement, 0) / this.results.length
    );

    console.log('\n' + '='.repeat(70));
    console.log(`✅ 总体性能提升: ${avgImprovement}%`);
    console.log('='.repeat(70) + '\n');

    return this.results;
  }
}

// ============================================
// 主程序
// ============================================

async function main() {
  console.log('🚀 Puppeteer vs Playwright 性能对比测试\n');
  console.log('⚠️  请确保本地服务器已启动（http://localhost:8080/）\n');

  const benchmark = new Benchmark();

  try {
    await benchmark.testLaunchTime();
    await benchmark.testNavigationTime();
    await benchmark.testSelectorTime();
    await benchmark.testScreenshotTime();

    const results = benchmark.generateReport();

    // 保存结果
    const fs = require('fs');
    fs.writeFileSync(
      './gemba-reports/benchmark-results.json',
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    console.log('💾 结果已保存: gemba-reports/benchmark-results.json');
  } catch (e) {
    console.error('❌ 测试失败:', e.message);
    console.error('提示: 请确保 localhost:8080 服务已启动');
  }
}

main().catch(console.error);

module.exports = Benchmark;
