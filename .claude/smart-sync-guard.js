#!/usr/bin/env node

/**
 * Smart File Sync Guard v3.0
 * 智能文件同步监控 - 专为 CLAUDE.md 和 progress.md 设计
 * 
 * 核心功能：
 * - 定期检查文件时间差
 * - 超阈值时自动同步时间戳（不改内容）
 * - 实时显示同步状态
 * - 智能阈值调整
 * - 内存优化与自动GC
 * - 日志轮转与缓冲
 */

const fs = require('fs');
const path = require('path');
const { SmartLogger } = require('./logger');
const CONFIG = require('./smart-sync-guard.config');

// ===== 扩展配置 =====
CONFIG.PROJECT_ROOT = process.cwd();
CONFIG.CLAUDE_FILE = path.join(process.cwd(), 'CLAUDE.md');
CONFIG.PROGRESS_FILE = path.join(process.cwd(), 'progress.md');
CONFIG.LOG_FILE = path.join(process.cwd(), '.claude', 'smart-sync-guard.log');

// 可配置的最大堆使用（MB），超过此值将触发内存回收或退出
CONFIG.MAX_HEAP_MB = CONFIG.MAX_HEAP_MB || 1024; // 1GB 默认阈值
// 内存检测间隔（分钟）
CONFIG.MEM_CHECK_INTERVAL_MIN = CONFIG.MEM_CHECK_INTERVAL_MIN || 5;

// 确保日志目录存在
const logDir = path.dirname(CONFIG.LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 打开一个持久写入流，避免每次 appendFileSync 打开/关闭文件并减小阻塞
let logStream;
try {
    logStream = fs.createWriteStream(CONFIG.LOG_FILE, { flags: 'a', encoding: 'utf8', highWaterMark: 64 * 1024 });
} catch (err) {
    console.error('无法创建日志写入流:', err.message);
    logStream = null;
}

// ===== 工具函数 =====
function formatTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function formatTimeDiff(diffMs) {
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else {
        return `${minutes}分钟`;
    }
}

function writeLog(message, level = 'INFO') {
    const timestamp = formatTime(new Date());
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    
    // 输出到控制台（彩色）
    const colors = {
        'INFO': '\x1b[36m',    // 青色
        'WARNING': '\x1b[33m', // 黄色
        'ERROR': '\x1b[31m',   // 红色
        'SUCCESS': '\x1b[32m'  // 绿色
    };
    const resetColor = '\x1b[0m';
    const color = colors[level] || '\x1b[37m';
    
    console.log(`${color}${logEntry}${resetColor}`);
    
    // 写入日志文件
    try {
        if (logStream && !logStream.destroyed) {
            // 若流背压较大，暂不阻塞主线程，仅记录到控制台
            const ok = logStream.write(logEntry + '\n', 'utf8');
            if (!ok) {
                // 背压：让流消化一会儿
                logStream.once('drain', () => {});
            }
        } else {
            // 回退到异步追加，避免同步 IO
            fs.appendFile(CONFIG.LOG_FILE, logEntry + '\n', 'utf8', (err) => {
                if (err) console.error('Failed to write log async:', err.message);
            });
        }
    } catch (error) {
        console.error(`Failed to write log: ${error.message}`);
    }
}

function getFileModTime(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        return null;
    }
}

function syncFileTime(fromFile, toFile) {
    try {
        const fromTime = getFileModTime(fromFile);
        if (!fromTime) return false;
        
        fs.utimesSync(toFile, fromTime, fromTime);
        return true;
    } catch (error) {
        writeLog(`时间同步失败: ${error.message}`, 'ERROR');
        return false;
    }
}

function checkAndSync() {
    try {
        // 防御性保护，避免单次抛出导致整个定时器停止
        
    const claudeTime = getFileModTime(CONFIG.CLAUDE_FILE);
    const progressTime = getFileModTime(CONFIG.PROGRESS_FILE);
    
    // 检查文件是否存在
    if (!claudeTime) {
        writeLog('CLAUDE.md 文件不存在或无法访问', 'ERROR');
        return;
    }
    
    if (!progressTime) {
        writeLog('progress.md 文件不存在或无法访问', 'ERROR');
        return;
    }
    
    // 计算时间差
    const timeDiff = Math.abs(claudeTime.getTime() - progressTime.getTime());
    const diffMinutes = Math.floor(timeDiff / (60 * 1000));
    const thresholdMs = CONFIG.ALERT_THRESHOLD_MIN * 60 * 1000;
    
    const claudeTimeStr = formatTime(claudeTime);
    const progressTimeStr = formatTime(progressTime);
    const diffStr = formatTimeDiff(timeDiff);
    
    // 状态显示
    const statusMsg = `📊 检查结果: CLAUDE.md (${claudeTimeStr}) | progress.md (${progressTimeStr}) | 时间差: ${diffStr}`;
    
    if (timeDiff <= thresholdMs) {
        // 正常状态
        writeLog(`✅ ${statusMsg} (正常)`);
    } else {
        // 超过阈值
        writeLog(`⚠️ ${statusMsg} (超过阈值 ${CONFIG.ALERT_THRESHOLD_MIN}分钟)`, 'WARNING');
        
        if (CONFIG.AUTO_SYNC) {
            // 自动同步到较新的时间
            if (claudeTime > progressTime) {
                if (syncFileTime(CONFIG.CLAUDE_FILE, CONFIG.PROGRESS_FILE)) {
                    writeLog(`🔄 自动同步: progress.md 时间已同步到 CLAUDE.md`, 'SUCCESS');
                }
            } else {
                if (syncFileTime(CONFIG.PROGRESS_FILE, CONFIG.CLAUDE_FILE)) {
                    writeLog(`🔄 自动同步: CLAUDE.md 时间已同步到 progress.md`, 'SUCCESS');
                }
            }
        }
    }
    
    } catch (error) {
        writeLog(`checkAndSync 异常: ${error && error.message}`, 'ERROR');
        return { timeDiff: Infinity, diffMinutes: Infinity, synced: false };
    }
    return { timeDiff, diffMinutes, synced: timeDiff <= thresholdMs };
}

// ===== 主程序 =====
function main() {
    writeLog('🚀 Smart File Sync Guard 启动');
    writeLog(`📁 监控文件: ${path.basename(CONFIG.CLAUDE_FILE)}, ${path.basename(CONFIG.PROGRESS_FILE)}`);
    writeLog(`⏰ 检查间隔: ${CONFIG.CHECK_INTERVAL_MIN} 分钟`);
    writeLog(`🎯 报警阈值: ${CONFIG.ALERT_THRESHOLD_MIN} 分钟`);
    writeLog(`🔧 自动同步: ${CONFIG.AUTO_SYNC ? '开启' : '关闭'}`);
    writeLog(`📋 日志文件: ${CONFIG.LOG_FILE}`);
    writeLog('🔄 监控进程运行中... (按 Ctrl+C 退出)');
    
    // 立即检查一次
    checkAndSync();
    
    // 定期检查
    const intervalMs = CONFIG.CHECK_INTERVAL_MIN * 60 * 1000;
    const checkInterval = setInterval(() => {
        try {
            checkAndSync();
        } catch (err) {
            writeLog(`定时检查发生错误: ${err && err.message}`, 'ERROR');
        }
    }, intervalMs);

    // 内存监控：定期查看堆使用并在超阈值时尝试回收或退出
    const memIntervalMs = CONFIG.MEM_CHECK_INTERVAL_MIN * 60 * 1000;
    const memMonitor = setInterval(() => {
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        writeLog(`内存监控: heapUsed=${heapUsedMB}MB heapTotal=${heapTotalMB}MB rss=${Math.round(mem.rss/1024/1024)}MB`);

        if (heapUsedMB > CONFIG.MAX_HEAP_MB) {
            writeLog(`内存使用超过阈值 ${CONFIG.MAX_HEAP_MB}MB，尝试触发 GC 或优雅退出`, 'WARNING');
            if (typeof global.gc === 'function') {
                try {
                    global.gc();
                    writeLog('手动触发 GC 已执行', 'INFO');
                } catch (gcErr) {
                    writeLog(`触发 GC 失败: ${gcErr && gcErr.message}`, 'ERROR');
                }
            } else {
                writeLog('未启用 --expose-gc，无法手动触发 GC。建议以 --expose-gc 启动或重启进程', 'WARNING');
            }

            // 如果 GC 后仍然内存过高，优雅退出，交由外部重启（例如 pm2 或任务）
            const postMem = process.memoryUsage();
            const postHeapMB = Math.round(postMem.heapUsed / 1024 / 1024);
            if (postHeapMB > CONFIG.MAX_HEAP_MB) {
                writeLog(`GC 后内存仍高 (${postHeapMB}MB)，进程将退出以避免不稳定状态`, 'ERROR');
                // 清理并退出
                clearInterval(checkInterval);
                clearInterval(memMonitor);
                if (logStream && !logStream.destroyed) {
                    logStream.end(() => process.exit(1));
                } else {
                    process.exit(1);
                }
            }
        }
    }, memIntervalMs);
}

// 优雅退出处理
process.on('SIGINT', () => {
    writeLog('� Smart File Sync Guard 正在退出... (SIGINT)');
    if (logStream && !logStream.destroyed) {
        logStream.end(() => process.exit(0));
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    writeLog('� Smart File Sync Guard 被终止 (SIGTERM)');
    if (logStream && !logStream.destroyed) {
        logStream.end(() => process.exit(0));
    } else {
        process.exit(0);
    }
});

process.on('exit', () => {
    writeLog('📴 Smart File Sync Guard 已退出');
    try {
        if (logStream && !logStream.destroyed) logStream.end();
    } catch (err) { /* ignore */ }
});

// 错误处理
process.on('uncaughtException', (error) => {
    writeLog(`未捕获的异常: ${error.message}`, 'ERROR');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    writeLog(`未处理的 Promise 拒绝: ${reason}`, 'ERROR');
});

// 启动程序
if (require.main === module) {
    main();
}