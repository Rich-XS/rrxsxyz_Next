# Playwright 安装脚本（Windows PowerShell）
# 用途：快速安装Playwright并下载浏览器
# 时间：2025-10-31 Night-Auth
# 使用：powershell -ExecutionPolicy Bypass -File scripts/install-playwright.ps1

Write-Host "🚀 开始安装 Playwright..." -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 版本
Write-Host "📋 检查 Node.js 版本..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# 检查 npm 版本
$npmVersion = npm --version
Write-Host "  npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# 安装 Playwright 依赖
Write-Host "📦 安装 Playwright 依赖..." -ForegroundColor Yellow
npm install --save-dev playwright @playwright/test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Playwright 依赖安装成功！" -ForegroundColor Green
} else {
    Write-Host "❌ Playwright 依赖安装失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 下载 Chromium 浏览器
Write-Host "🌐 下载 Chromium 浏览器..." -ForegroundColor Yellow
npx playwright install chromium

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Chromium 浏览器下载成功！" -ForegroundColor Green
} else {
    Write-Host "❌ Chromium 浏览器下载失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "✅ Playwright 安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 可用命令：" -ForegroundColor Yellow
Write-Host "  npm run gemba:playwright       - 运行 Gemba-Agent（Playwright版本）"
Write-Host "  npm run gemba:parallel         - 运行并行测试"
Write-Host "  npm run gemba:benchmark        - 性能对比测试"
Write-Host "  npm run playwright:test        - 运行 Playwright 测试"
Write-Host ""
Write-Host "📄 文档：" -ForegroundColor Yellow
Write-Host "  docs/PLAYWRIGHT_MIGRATION_PLAN.md"
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
