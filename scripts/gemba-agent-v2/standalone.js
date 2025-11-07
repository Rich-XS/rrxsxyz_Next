/**
 * Gemba Agent 2.0 - Standalone Version
 * 无需外部依赖的独立版本
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

class GembaAgentStandalone {
    constructor(config = {}) {
        this.config = {
            name: 'Gemba Agent 2.0 Standalone',
            baseUrl: config.baseUrl || 'http://localhost:8080',
            checkInterval: config.checkInterval || 5000,
            ...config
        };

        this.stats = {
            startTime: new Date(),
            checksPerformed: 0,
            errorsFound: 0,
            successfulChecks: 0
        };

        console.log(`
╔══════════════════════════════════════════════╗
║      🚀 Gemba Agent 2.0 - Standalone        ║
║                                              ║
║  Simplified version without external deps    ║
╚══════════════════════════════════════════════╝
        `);
    }

    /**
     * 启动Agent
     */
    async start() {
        console.log(`✅ Starting Gemba Agent...`);
        console.log(`📍 Monitoring: ${this.config.baseUrl}`);
        console.log(`⏱️  Check interval: ${this.config.checkInterval}ms\n`);

        // 启动监控循环
        this.startMonitoring();

        // 启动文件监控
        this.startFileWatching();

        // 定期报告
        this.startReporting();
    }

    /**
     * HTTP健康检查
     */
    checkHealth(url) {
        return new Promise((resolve) => {
            const urlParts = new URL(url);

            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port || 80,
                path: urlParts.pathname,
                method: 'GET',
                timeout: 3000
            };

            const req = http.request(options, (res) => {
                this.stats.checksPerformed++;

                if (res.statusCode === 200) {
                    this.stats.successfulChecks++;
                    console.log(`✅ [${new Date().toLocaleTimeString()}] Health check OK - Status: ${res.statusCode}`);
                    resolve({ success: true, statusCode: res.statusCode });
                } else {
                    this.stats.errorsFound++;
                    console.log(`⚠️  [${new Date().toLocaleTimeString()}] Health check warning - Status: ${res.statusCode}`);
                    resolve({ success: false, statusCode: res.statusCode });
                }
            });

            req.on('error', (err) => {
                this.stats.checksPerformed++;
                this.stats.errorsFound++;
                console.log(`❌ [${new Date().toLocaleTimeString()}] Health check failed: ${err.message}`);
                resolve({ success: false, error: err.message });
            });

            req.on('timeout', () => {
                this.stats.checksPerformed++;
                this.stats.errorsFound++;
                console.log(`⏱️  [${new Date().toLocaleTimeString()}] Health check timeout`);
                req.destroy();
                resolve({ success: false, error: 'timeout' });
            });

            req.end();
        });
    }

    /**
     * 启动监控
     */
    startMonitoring() {
        setInterval(async () => {
            await this.checkHealth(this.config.baseUrl);

            // 简单的决策逻辑
            if (this.stats.errorsFound > 3) {
                console.log(`\n🔧 Attempting auto-recovery...`);
                this.attemptRecovery();
            }
        }, this.config.checkInterval);

        // 立即执行一次
        this.checkHealth(this.config.baseUrl);
    }

    /**
     * 文件监控（简化版）
     */
    startFileWatching() {
        const watchPath = path.join(process.cwd(), 'duomotai');

        if (!fs.existsSync(watchPath)) {
            console.log(`📁 Watch path not found: ${watchPath}`);
            return;
        }

        console.log(`👁️  Watching files in: ${watchPath}`);

        // 简单的文件变化检测
        let lastModified = {};

        setInterval(() => {
            try {
                const files = fs.readdirSync(watchPath);

                files.forEach(file => {
                    const filePath = path.join(watchPath, file);
                    const stats = fs.statSync(filePath);

                    if (lastModified[file] && lastModified[file] < stats.mtime) {
                        console.log(`📝 File changed: ${file}`);
                        this.onFileChange(filePath);
                    }

                    lastModified[file] = stats.mtime;
                });
            } catch (err) {
                // 静默处理错误
            }
        }, 10000); // 每10秒检查一次
    }

    /**
     * 文件变更处理
     */
    onFileChange(filePath) {
        console.log(`🔄 Processing change in: ${path.basename(filePath)}`);

        // 简单的响应逻辑
        if (filePath.endsWith('.js')) {
            console.log(`  → JavaScript file changed, consider running tests`);
        } else if (filePath.endsWith('.html')) {
            console.log(`  → HTML file changed, refreshing browser recommended`);
        }
    }

    /**
     * 尝试恢复
     */
    attemptRecovery() {
        console.log(`🔄 Attempting to restart service...`);

        // 这里可以添加重启服务的逻辑
        // 例如：重启Node服务器、清理缓存等

        setTimeout(() => {
            console.log(`✅ Recovery attempt completed`);
            this.stats.errorsFound = 0; // 重置错误计数
        }, 2000);
    }

    /**
     * 定期报告
     */
    startReporting() {
        setInterval(() => {
            const uptime = new Date() - this.stats.startTime;
            const minutes = Math.floor(uptime / 60000);
            const successRate = this.stats.checksPerformed > 0
                ? (this.stats.successfulChecks / this.stats.checksPerformed * 100).toFixed(1)
                : 0;

            console.log(`
╔══════════════════════════════════════════════╗
║           📊 Gemba Agent Report             ║
╠══════════════════════════════════════════════╣
║  Uptime: ${minutes} minutes                 ║
║  Checks: ${this.stats.checksPerformed}      ║
║  Success Rate: ${successRate}%              ║
║  Errors Found: ${this.stats.errorsFound}    ║
╚══════════════════════════════════════════════╝
            `);
        }, 60000); // 每分钟报告一次
    }

    /**
     * 运行测试
     */
    async runTest(testName) {
        console.log(`\n🧪 Running test: ${testName}`);

        return new Promise((resolve) => {
            const npmTest = spawn('npm', ['test'], {
                shell: true,
                cwd: process.cwd()
            });

            npmTest.stdout.on('data', (data) => {
                console.log(`  ${data.toString().trim()}`);
            });

            npmTest.stderr.on('data', (data) => {
                console.error(`  ⚠️  ${data.toString().trim()}`);
            });

            npmTest.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Test completed successfully`);
                    resolve(true);
                } else {
                    console.log(`❌ Test failed with code ${code}`);
                    resolve(false);
                }
            });

            npmTest.on('error', (err) => {
                console.log(`❌ Failed to run test: ${err.message}`);
                resolve(false);
            });
        });
    }

    /**
     * 停止Agent
     */
    stop() {
        console.log(`\n🛑 Stopping Gemba Agent...`);
        console.log(`Final stats:`, this.stats);
        process.exit(0);
    }
}

// 主程序
async function main() {
    const agent = new GembaAgentStandalone({
        baseUrl: 'http://localhost:8080',
        checkInterval: 5000 // 5秒检查一次
    });

    // 优雅退出
    process.on('SIGINT', () => {
        agent.stop();
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // 启动Agent
    await agent.start();

    console.log(`\n💡 Tips:`);
    console.log(`  - Press Ctrl+C to stop`);
    console.log(`  - Make sure your app is running on ${agent.config.baseUrl}`);
    console.log(`  - Agent will auto-detect issues and suggest fixes`);
}

// 如果直接运行
if (require.main === module) {
    main().catch(err => {
        console.error('Failed to start:', err);
        process.exit(1);
    });
}

module.exports = GembaAgentStandalone;