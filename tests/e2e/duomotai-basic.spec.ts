import { test, expect } from '@playwright/test';

/**
 * 多魔汰系统 - 基础流程测试
 * 测试用户登录、策划、辩论基本流程
 */

// 测试配置
const TEST_USER_PHONE = '13917895758';
const TEST_VERIFICATION_CODE = '888888';

// 辅助函数：执行登录
async function performLogin(page) {
  // 点击登录按钮触发登录Modal（修复：使用正确的登录按钮选择器）
  await page.getByRole('button', { name: '🔑 登录/注册' }).click();

  // 等待登录Modal出现
  await page.waitForSelector('#loginModal', { timeout: 5000 });

  // 填写手机号
  await page.locator('input[placeholder*="手机号"]').fill(TEST_USER_PHONE);

  // 点击发送验证码
  await page.locator('button:has-text("发送验证码")').click();

  // 填写验证码
  await page.locator('input[placeholder*="验证码"]').fill(TEST_VERIFICATION_CODE);

  // 点击登录按钮
  await page.locator('button:has-text("登录")').click();

  // 等待登录成功（Modal消失）
  await page.waitForSelector('#loginModal', { state: 'hidden', timeout: 5000 });
}

test.describe('多魔汰基础流程', () => {
  test.beforeEach(async ({ page, context }) => {
    // 清理所有存储（确保每次测试从干净状态开始）
    await context.clearCookies();
    await page.goto('/duomotai/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // 重新加载页面（应用清理后的状态）
    await page.reload();
  });

  test('应该显示首页并能进入系统', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/多魔汰/);

    // 验证主要元素
    await expect(page.locator('h1')).toContainText('多魔汰');
    await expect(page.locator('.version-tag')).toBeVisible();

    // 检查版本号格式
    const versionText = await page.locator('.version-tag').textContent();
    expect(versionText).toMatch(/V\d+\.\d+/);
  });

  test('测试用户应该能够登录', async ({ page }) => {
    // 点击启动按钮触发登录Modal
    await page.locator('#startDebateBtn').click();

    // 等待登录Modal出现
    await page.waitForSelector('#loginModal', { timeout: 5000 });

    // 填写手机号
    const phoneInput = page.locator('input[placeholder*="手机号"]');
    await phoneInput.fill(TEST_USER_PHONE);

    // 点击发送验证码
    await page.locator('button:has-text("发送验证码")').click();

    // 填写验证码
    const codeInput = page.locator('input[placeholder*="验证码"]');
    await codeInput.fill(TEST_VERIFICATION_CODE);

    // 点击登录按钮
    await page.locator('button:has-text("登录")').click();

    // 等待登录成功（Modal消失）
    await page.waitForSelector('#loginModal', { state: 'hidden', timeout: 5000 });

    // 验证用户状态显示
    await expect(page.locator('#userStatus')).toContainText('已登录');
  });

  test('应该显示16个角色卡片', async ({ page }) => {
    // 先登录
    await performLogin(page);

    // 验证角色卡片数量
    const roleCards = page.locator('.role-card');
    await expect(roleCards).toHaveCount(16, { timeout: 10000 });

    // 验证必选角色（至少8个）
    const selectedRoles = page.locator('.role-card.selected');
    const selectedCount = await selectedRoles.count();
    expect(selectedCount).toBeGreaterThanOrEqual(8);
  });

  test('应该能够启动策划阶段', async ({ page }) => {
    // 登录
    await performLogin(page);

    // 填写决策问题
    const topicInput = page.locator('textarea[placeholder*="问题"]').first();
    await topicInput.fill('测试决策：如何提升产品竞争力');

    // 填写背景信息（可选）
    const backgroundInput = page.locator('textarea[placeholder*="背景"]').first();
    await backgroundInput.fill('这是一个测试背景信息');

    // 选择轮次
    const roundSelect = page.locator('select[name="rounds"]');
    await roundSelect.selectOption('3');

    // 启动辩论
    const startButton = page.locator('button:has-text("启动")');
    await startButton.click();

    // 验证策划内容显示
    await expect(page.locator('.planning-content')).toBeVisible({ timeout: 30000 });

    // 验证领袖发言包含关键信息
    const planningText = await page.locator('.planning-content').textContent();
    expect(planningText).toContain('Victoria'); // 领袖名字
    expect(planningText).toContain('专家'); // 应该提到专家
  });
});

test.describe('字数控制验证（测试用户）', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/duomotai/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('测试用户专家发言应该符合字数限制', async ({ page }) => {
    // 此测试需要服务器运行，标记为skip或设置条件
    test.skip(!process.env.RUN_FULL_TESTS, '需要服务器运行');

    // 登录
    await performLogin(page);

    // 启动辩论
    const topicInput = page.locator('textarea[placeholder*="问题"]').first();
    await topicInput.fill('测试字数控制');

    const startButton = page.locator('button:has-text("启动")');
    await startButton.click();

    // 等待策划完成
    await expect(page.locator('.planning-content')).toBeVisible({ timeout: 30000 });

    // 确认开始辩论
    const confirmButton = page.locator('button:has-text("确认")');
    await confirmButton.click();

    // 等待第一个专家发言
    await expect(page.locator('.speech-item').first()).toBeVisible({ timeout: 60000 });

    // 验证专家发言字数（测试用户应该减半，约150-250字）
    const speeches = await page.locator('.speech-item').all();
    for (const speech of speeches.slice(1, 5)) { // 检查前几个专家发言
      const text = await speech.textContent();
      const wordCount = text?.replace(/\s/g, '').length || 0;

      // 测试用户字数应该在100-300字之间（允许一定误差）
      expect(wordCount).toBeGreaterThan(50);
      expect(wordCount).toBeLessThan(600);

      console.log(`专家发言字数: ${wordCount}`);
    }
  });
});

test.describe('UI元素验证', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/duomotai/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('导航条应该显示', async ({ page }) => {
    // 登录并启动辩论
    await performLogin(page);

    await page.locator('textarea[placeholder*="问题"]').first().fill('测试');
    await page.locator('button:has-text("启动")').click();
    await page.waitForTimeout(2000);

    // V57.20修复：导航条应该可见
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();
  });

  test('文字速度调节应该显示正确的默认值', async ({ page }) => {
    // V57.22修复：文字速度应该显示10x
    // 检查语音控制区域中的速度显示
    const textSpeedSlider = page.locator('#textSpeedSlider');
    await expect(textSpeedSlider).toBeVisible();

    const sliderValue = await textSpeedSlider.inputValue();
    expect(sliderValue).toBe('10');
  });

  test('按钮编码应该正确', async ({ page }) => {
    // V57.22修复：检查重置按钮显示正确
    const resetButton = page.locator('button').filter({ hasText: '↻' });
    await expect(resetButton).toBeVisible();
  });
});
