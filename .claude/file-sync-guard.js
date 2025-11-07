#!/usr/bin/env node

/**
 * File Sync Guard - 文件同步监控脚本
 * 
 * 功能：监控 CLAUDE.md 和 progress.md 两个文件的修改时间差
 * 目的：确保项目记忆文件保持同步，避免手动编辑导致的不一致问题
 * 
 * 监控机制：
 * - 每 10 分钟检查一次文件修改时间
 * - 如果两文件时间差超过 5 分钟，记录警告日志
 * - 日志输出到 .claude/sync-guard.log
 * 
 * 触发场景：
 * - 手动编辑 CLAUDE.md 或 progress.md 但未同步更新另一文件
 * - Agent 操作失败导致只更新了一个文件
 * - 文件写入过程中意外中断
 * 
 * 使用方法：
 * - 直接运行：node .claude/file-sync-guard.js
 * - VSCode 任务：Ctrl+Shift+P → Tasks: Run Task → Check File Sync
 * 
 * 配置参数：
 * - CHECK_INTERVAL：检查间隔（毫秒）
 * - ALERT_THRESHOLD：报警阈值（毫秒）
 * 
 * @version 1.0.0
 * @author RRXS Group
 * @date 2025-10-03
 */

const fs = require('fs');
const path = require('path');

// ===== 配置参数 =====
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 分钟检查间隔（可调整）
const ALERT_THRESHOLD = 30 * 60 * 1000;  // 30 分钟报警阈值（增加到30分钟）
const LOG_FILE = path.join(__dirname, 'sync-guard.log');

// ===== 文件路径配置 =====
const PROJECT_ROOT = path.dirname(__dirname);
const CLAUDE_FILE = path.join(PROJECT_ROOT, 'CLAUDE.md');
const PROGRESS_FILE = path.join(PROJECT_ROOT, 'progress.md');

// ===== 工具函数 =====

/**
 * 格式化时间戳
 * @param {Date} date - 时间对象
 * @returns {string} 格式化的时间字符串
 */
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 格式化时间差
 * @param {number} diffMs - 时间差（毫秒）
 * @returns {string} 人类可读的时间差
 */
function formatTimeDiff(diffMs) {
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}天${hours % 24}小时${minutes % 60}分钟`;
    } else if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`;
    } else {
        return `${minutes}分钟`;
    }
}

/**
 * 写入日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别 (INFO, WARNING, ERROR)
 */
function writeLog(message, level = 'INFO') {
    const timestamp = formatTime(new Date());
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    
    // 控制台输出
    if (level === 'WARNING' || level === 'ERROR') {
        console.warn(logEntry.trim());
    } else {
        console.log(logEntry.trim());
    }
    
    // 写入日志文件
    try {
        fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
    } catch (error) {
        console.error(`Failed to write log: ${error.message}`);
    }
}

/**
 * 获取文件修改时间
 * @param {string} filePath - 文件路径
 * @returns {Date|null} 文件修改时间，如果文件不存在返回 null
 */
function getFileModTime(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        return null;
    }
}

/**
 * 检查文件同步状态
 * @returns {Object} 检查结果
 */
function checkFileSync() {
    const claudeTime = getFileModTime(CLAUDE_FILE);
    const progressTime = getFileModTime(PROGRESS_FILE);
    
    // 检查文件是否存在
    if (!claudeTime) {
        writeLog(`ERROR: CLAUDE.md 文件不存在或无法访问: ${CLAUDE_FILE}`, 'ERROR');
        return { status: 'error', message: 'CLAUDE.md 文件不存在' };
    }
    
    if (!progressTime) {
        writeLog(`ERROR: progress.md 文件不存在或无法访问: ${PROGRESS_FILE}`, 'ERROR');
        return { status: 'error', message: 'progress.md 文件不存在' };
    }
    
    // 计算时间差
    const timeDiff = Math.abs(claudeTime.getTime() - progressTime.getTime());
    const claudeTimeStr = formatTime(claudeTime);
    const progressTimeStr = formatTime(progressTime);
    const diffStr = formatTimeDiff(timeDiff);
    
    // 判断是否需要报警
    if (timeDiff > ALERT_THRESHOLD) {
        const message = `⚠️ 文件不同步警告！CLAUDE.md (${claudeTimeStr}) | progress.md (${progressTimeStr}) | 时间差: ${diffStr}`;
        writeLog(message, 'WARNING');
        return { 
            status: 'warning', 
            message, 
            claudeTime, 
            progressTime, 
            timeDiff 
        };
    } else {
        const message = `✅ 文件同步正常: CLAUDE.md (${claudeTimeStr}) | progress.md (${progressTimeStr}) | 时间差: ${diffStr}`;
        writeLog(message, 'INFO');
        return { 
            status: 'ok', 
            message, 
            claudeTime, 
            progressTime, 
            timeDiff 
        };
    }
}

/**
 * 启动监控守护进程
 */
function startGuard() {
    writeLog('🚀 文件同步监控启动', 'INFO');
    writeLog(`📁 监控文件: ${CLAUDE_FILE}`, 'INFO');
    writeLog(`📁 监控文件: ${PROGRESS_FILE}`, 'INFO');
    writeLog(`⏰ 检查间隔: ${CHECK_INTERVAL / 1000 / 60} 分钟`, 'INFO');
    writeLog(`⚠️ 报警阈值: ${ALERT_THRESHOLD / 1000 / 60} 分钟`, 'INFO');
    writeLog(`📋 日志文件: ${LOG_FILE}`, 'INFO');
    writeLog('--- 开始监控 ---', 'INFO');
    
    // 立即执行一次检查
    checkFileSync();
    
    // 设置定时检查
    const intervalId = setInterval(() => {
        checkFileSync();
    }, CHECK_INTERVAL);
    
    // 处理进程退出
    process.on('SIGINT', () => {
        writeLog('📴 收到退出信号，停止监控...', 'INFO');
        clearInterval(intervalId);
        writeLog('✅ 文件同步监控已停止', 'INFO');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        writeLog('📴 收到终止信号，停止监控...', 'INFO');
        clearInterval(intervalId);
        writeLog('✅ 文件同步监控已停止', 'INFO');
        process.exit(0);
    });
    
    // 保持进程运行
    writeLog('🔄 监控进程运行中... (按 Ctrl+C 退出)', 'INFO');
}

/**
 * 单次检查模式（用于测试）
 */
function runOnce() {
    writeLog('🔍 执行单次文件同步检查', 'INFO');
    const result = checkFileSync();
    
    if (result.status === 'error') {
        process.exit(1);
    } else if (result.status === 'warning') {
        writeLog('建议：使用 ">> record" 命令同步文件', 'INFO');
        process.exit(2);
    } else {
        writeLog('📋 检查完成，文件同步正常', 'INFO');
        process.exit(0);
    }
}

// ===== 主程序入口 =====

/**
 * 显示使用帮助
 */
function showHelp() {
    console.log(`
文件同步监控脚本 (File Sync Guard)

用法:
  node file-sync-guard.js [选项]

选项:
  --once, -o     执行单次检查后退出
  --help, -h     显示此帮助信息
  --version, -v  显示版本信息

示例:
  node file-sync-guard.js         # 启动守护进程（默认）
  node file-sync-guard.js --once  # 执行单次检查
  node file-sync-guard.js --help  # 显示帮助

守护进程模式:
  - 每 ${CHECK_INTERVAL / 1000 / 60} 分钟检查一次文件同步状态
  - 超过 ${ALERT_THRESHOLD / 1000 / 60} 分钟时间差将记录警告
  - 按 Ctrl+C 停止监控

监控文件:
  - ${CLAUDE_FILE}
  - ${PROGRESS_FILE}

日志文件:
  - ${LOG_FILE}
`);
}

/**
 * 显示版本信息
 */
function showVersion() {
    console.log('File Sync Guard v1.0.0');
    console.log('RRXS Group - rrxs.xyz Project');
    console.log('Created: 2025-10-03');
}

// 解析命令行参数
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
}

if (args.includes('--once') || args.includes('-o')) {
    runOnce();
} else {
    startGuard();
}