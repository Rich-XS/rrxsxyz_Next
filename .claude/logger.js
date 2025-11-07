const fs = require('fs');
const path = require('path');
const { createRotatingLogStream } = require('./logRotator');

class SmartLogger {
    constructor(logPath, config) {
        this.logPath = logPath;
        this.config = config;
        this.logStream = null;
        this.pendingWrites = [];
        this.setupLogger();
    }

    setupLogger() {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logStream = createRotatingLogStream({
            filename: this.logPath,
            maxSize: this.config.MAX_LOG_SIZE_MB * 1024 * 1024,
            maxFiles: this.config.LOG_ROTATION_COUNT
        });

        this.logStream.on('error', err => {
            console.error('日志流错误:', err);
            this.fallbackToConsole();
        });

        // 定期刷新缓冲区
        this.flushInterval = setInterval(() => this.flush(), 1000);
    }

    write(message, level = 'INFO') {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = `[${timestamp}] ${level}: ${message}\n`;

        // 控制台输出
        const colors = {
            'INFO': '\x1b[36m',
            'WARNING': '\x1b[33m',
            'ERROR': '\x1b[31m',
            'SUCCESS': '\x1b[32m'
        };
        console.log(`${colors[level] || '\x1b[37m'}${logEntry}\x1b[0m`);

        // 添加到缓冲区
        this.pendingWrites.push(logEntry);
        
        // 如果缓冲区过大，立即刷新
        if (this.getPendingSize() > this.config.LOG_BUFFER_SIZE) {
            this.flush();
        }
    }

    getPendingSize() {
        return this.pendingWrites.reduce((size, entry) => size + entry.length, 0);
    }

    flush() {
        if (this.pendingWrites.length === 0) return;

        const chunk = this.pendingWrites.join('');
        this.pendingWrites = [];

        if (this.logStream && !this.logStream.destroyed) {
            const ok = this.logStream.write(chunk);
            if (!ok) {
                this.logStream.once('drain', () => this.flush());
            }
        }
    }

    fallbackToConsole() {
        if (this.logStream && !this.logStream.destroyed) {
            this.logStream.end();
        }
        this.logStream = null;
    }

    close() {
        this.flush();
        clearInterval(this.flushInterval);
        if (this.logStream && !this.logStream.destroyed) {
            this.logStream.end();
        }
    }
}

module.exports = { SmartLogger };