/**
 * Playwright 配置文件
 *
 * 用途：统一管理浏览器自动化测试配置
 * 创建时间：2025-10-31 Night-Auth
 * 决策：D-77 + Playwright迁移
 */

module.exports = {
  // 测试目录
  testDir: './scripts',

  // 全局超时（60秒）
  timeout: 60000,

  // 失败重试次数
  retries: 1,

  // 并行worker数量（默认：CPU核心数）
  workers: 3,

  // 报告生成器
  reporter: [
    ['html', { outputFolder: 'gemba-reports/playwright-report' }],
    ['json', { outputFile: 'gemba-reports/test-results.json' }],
    ['list']  // 控制台输出
  ],

  // 全局配置
  use: {
    // 浏览器设置
    headless: false,  // 显示浏览器（便于调试）
    viewport: { width: 1280, height: 800 },

    // 视频录制（所有测试）
    video: {
      mode: 'on',
      size: { width: 1280, height: 800 }
    },

    // 截图（失败时）
    screenshot: 'only-on-failure',

    // Trace（失败时保留，用于调试）
    trace: 'retain-on-failure',

    // 基础URL
    baseURL: 'http://localhost:8080',

    // 导航超时
    navigationTimeout: 30000,

    // 操作超时
    actionTimeout: 10000,

    // 忽略HTTPS错误
    ignoreHTTPSErrors: true,

    // 自动等待（Playwright核心优势）
    waitForSelector: {
      state: 'visible',  // 等待元素可见
      timeout: 10000
    }
  },

  // 多浏览器配置（可选）
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: 'chrome',  // 使用系统Chrome（如果已安装）
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    },

    // 可选：Firefox测试（Phase 2）
    // {
    //   name: 'firefox',
    //   use: { browserName: 'firefox' }
    // },

    // 可选：Safari测试（Phase 2）
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' }
    // }
  ],

  // 输出目录
  outputDir: 'gemba-reports/test-artifacts',

  // 全局 setup/teardown（可选）
  // globalSetup: require.resolve('./scripts/global-setup.js'),
  // globalTeardown: require.resolve('./scripts/global-teardown.js'),

  // Web Server（可选，自动启动本地服务器）
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3001,
  //   timeout: 120000,
  //   reuseExistingServer: true
  // }
};
