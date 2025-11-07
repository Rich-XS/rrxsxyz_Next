import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright配置文件 - 多魔汰项目自动化测试
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件位置
  testDir: './tests/e2e',

  // 全局超时配置
  timeout: 60 * 1000, // 60秒
  expect: {
    timeout: 10 * 1000 // 断言超时10秒
  },

  // 失败重试
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],

  // 全局配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:8080',

    // 截图和视频
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // 浏览器选项
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // 测试项目（不同浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 可选：其他浏览器
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // 移动端模拟
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 本地开发服务器（可选）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:8080',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
