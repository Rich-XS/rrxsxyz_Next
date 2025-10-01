#!/usr/bin/env node

/**
 * File Sync Guard - 文件同步守护者
 *
 * 功能：监控 CLAUDE.md 和 progress.md 的修改时间
 * 规则：如果 CLAUDE.md 被修改，progress.md 必须在 5 分钟内同步更新
 *
 * 用法：
 *   node .claude/file-sync-guard.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  claudeMdPath: path.join(__dirname, '..', 'CLAUDE.md'),
  progressMdPath: path.join(__dirname, '..', 'progress.md'),
  checkIntervalMs: 10 * 60 * 1000, // 10分钟检查一次（用户建议：性能优化）
  maxTimeDiffMs: 5 * 60 * 1000, // 5分钟容差
  logPath: path.join(__dirname, 'sync-guard.log')
};

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  console.log(logMessage.trim());

  fs.appendFileSync(CONFIG.logPath, logMessage, 'utf8');
}

// 获取文件最后修改时间
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtimeMs;
  } catch (error) {
    log(`无法读取文件 ${filePath}: ${error.message}`, 'ERROR');
    return null;
  }
}

// 检查文件同步状态
function checkFileSync() {
  const claudeModTime = getFileModTime(CONFIG.claudeMdPath);
  const progressModTime = getFileModTime(CONFIG.progressMdPath);

  if (claudeModTime === null || progressModTime === null) {
    return;
  }

  const timeDiff = Math.abs(claudeModTime - progressModTime);

  if (timeDiff > CONFIG.maxTimeDiffMs) {
    const claudeDate = new Date(claudeModTime).toLocaleString('zh-CN');
    const progressDate = new Date(progressModTime).toLocaleString('zh-CN');

    log(`⚠️  警告：文件修改时间不一致！`, 'WARN');
    log(`   CLAUDE.md:   ${claudeDate}`, 'WARN');
    log(`   progress.md: ${progressDate}`, 'WARN');
    log(`   时间差：${Math.round(timeDiff / 60000)} 分钟`, 'WARN');
    log(`   建议：使用 >> record 命令同步更新`, 'WARN');

    // 可选：发送系统通知（Windows）
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`msg * "警告：CLAUDE.md 和 progress.md 不同步！时间差 ${Math.round(timeDiff / 60000)} 分钟"`);
    }
  } else {
    log(`✅ 文件同步正常（时间差 ${Math.round(timeDiff / 1000)} 秒）`);
  }
}

// 启动守护进程
function startGuard() {
  log('========================================');
  log('File Sync Guard 启动');
  log(`监控文件：CLAUDE.md, progress.md`);
  log(`检查间隔：${CONFIG.checkIntervalMs / 1000} 秒`);
  log(`最大时间差：${CONFIG.maxTimeDiffMs / 60000} 分钟`);
  log('========================================');

  // 首次检查
  checkFileSync();

  // 定期检查
  setInterval(checkFileSync, CONFIG.checkIntervalMs);
}

// 主程序
if (require.main === module) {
  startGuard();
}

module.exports = { checkFileSync, getFileModTime };
