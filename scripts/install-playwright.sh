#!/bin/bash

# Playwright 安装脚本
# 用途：快速安装Playwright并下载浏览器
# 时间：2025-10-31 Night-Auth

echo "🚀 开始安装 Playwright..."
echo ""

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
NODE_VERSION=$(node --version)
echo "  Node.js: $NODE_VERSION"

# 检查 npm 版本
NPM_VERSION=$(npm --version)
echo "  npm: $NPM_VERSION"
echo ""

# 安装 Playwright 依赖
echo "📦 安装 Playwright 依赖..."
npm install --save-dev playwright @playwright/test

# 检查安装是否成功
if [ $? -eq 0 ]; then
  echo "✅ Playwright 依赖安装成功！"
else
  echo "❌ Playwright 依赖安装失败！"
  exit 1
fi

echo ""

# 下载 Chromium 浏览器
echo "🌐 下载 Chromium 浏览器..."
npx playwright install chromium

# 检查下载是否成功
if [ $? -eq 0 ]; then
  echo "✅ Chromium 浏览器下载成功！"
else
  echo "❌ Chromium 浏览器下载失败！"
  exit 1
fi

echo ""
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="
echo "✅ Playwright 安装完成！"
echo ""
echo "🧪 可用命令："
echo "  npm run gemba:playwright       - 运行 Gemba-Agent（Playwright版本）"
echo "  npm run gemba:parallel         - 运行并行测试"
echo "  npm run gemba:benchmark        - 性能对比测试"
echo "  npm run playwright:test        - 运行 Playwright 测试"
echo ""
echo "📄 文档："
echo "  docs/PLAYWRIGHT_MIGRATION_PLAN.md"
echo ""
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="
