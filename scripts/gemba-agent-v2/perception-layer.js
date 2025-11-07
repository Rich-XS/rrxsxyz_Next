/**
 * Gemba Agent 2.0 - 感知层(Eyes)
 * 全方位感知项目状态，实时采集多维度数据
 */

const { chromium } = require('playwright');
const chokidar = require('chokidar');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class PerceptionLayer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            baseUrl: config.baseUrl || 'http://localhost:8080',
            watchPaths: config.watchPaths || ['./duomotai', './server'],
            screenshotDir: config.screenshotDir || './gemba-snapshots',
            metricsInterval: config.metricsInterval || 5000, // 5秒
            ...config
        };

        this.browser = null;
        this.context = null;
        this.page = null;
        this.fileWatcher = null;
        this.metrics = {
            performance: [],
            errors: [],
            userActions: [],
            fileChanges: [],
            systemHealth: []
        };

        this.patterns = {
            errorPatterns: new Map(),
            performanceBaseline: null,
            userBehaviorModel: null
        };
    }

    /**
     * 初始化感知层
     */
    async initialize() {
        console.log('🚀 Initializing Perception Layer...');

        // 1. 启动浏览器
        await this.initBrowser();

        // 2. 启动文件监控
        await this.initFileWatcher();

        // 3. 启动性能监控
        await this.initPerformanceMonitor();

        // 4. 启动错误监控
        await this.initErrorMonitor();

        // 5. 加载历史模式
        await this.loadPatterns();

        console.log('✅ Perception Layer initialized');
    }

    /**
     * 浏览器初始化 - 视觉感知
     */
    async initBrowser() {
        this.browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            recordVideo: {
                dir: './gemba-videos',
                size: { width: 1920, height: 1080 }
            }
        });

        this.page = await this.context.newPage();

        // 监听Console消息
        this.page.on('console', msg => {
            const log = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                url: this.page.url()
            };

            if (msg.type() === 'error') {
                this.metrics.errors.push(log);
                this.emit('error-detected', log);
                this.analyzeError(log);
            }
        });

        // 监听网络请求
        this.page.on('response', response => {
            if (response.status() >= 400) {
                const error = {
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                };
                this.metrics.errors.push(error);
                this.emit('network-error', error);
            }
        });

        // 监听页面崩溃
        this.page.on('crash', () => {
            this.emit('page-crash', { timestamp: new Date().toISOString() });
        });
    }

    /**
     * 文件系统监控 - 代码感知
     */
    async initFileWatcher() {
        this.fileWatcher = chokidar.watch(this.config.watchPaths, {
            persistent: true,
            ignoreInitial: true,
            ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        });

        this.fileWatcher
            .on('add', path => this.handleFileChange('add', path))
            .on('change', path => this.handleFileChange('change', path))
            .on('unlink', path => this.handleFileChange('delete', path));
    }

    handleFileChange(event, filePath) {
        const change = {
            event,
            path: filePath,
            timestamp: new Date().toISOString()
        };

        this.metrics.fileChanges.push(change);
        this.emit('file-change', change);

        // 智能分析：如果是关键文件变更，触发重新测试
        if (this.isKeyFile(filePath)) {
            this.emit('key-file-changed', change);
        }
    }

    isKeyFile(filePath) {
        const keyPatterns = [
            /debateEngine\.js$/,
            /init\.js$/,
            /index\.html$/,
            /server\.js$/
        ];
        return keyPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * 性能监控 - 实时指标
     */
    async initPerformanceMonitor() {
        setInterval(async () => {
            if (!this.page) return;

            try {
                // 收集性能指标
                const metrics = await this.page.evaluate(() => {
                    const perf = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');

                    return {
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        // 核心Web指标
                        FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                        LCP: perf.loadEventEnd - perf.fetchStart,
                        TTI: perf.domInteractive - perf.fetchStart,
                        // 内存使用
                        memory: performance.memory ? {
                            usedJSHeapSize: performance.memory.usedJSHeapSize,
                            totalJSHeapSize: performance.memory.totalJSHeapSize,
                            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                        } : null,
                        // DOM复杂度
                        domNodes: document.getElementsByTagName('*').length,
                        // 资源加载
                        resources: performance.getEntriesByType('resource').length
                    };
                });

                this.metrics.performance.push(metrics);
                this.emit('performance-metrics', metrics);

                // 智能分析：检测性能退化
                this.detectPerformanceDegradation(metrics);

            } catch (error) {
                console.error('Performance monitoring error:', error);
            }
        }, this.config.metricsInterval);
    }

    /**
     * 错误模式分析 - 智能识别
     */
    analyzeError(error) {
        const errorKey = this.generateErrorKey(error);

        if (this.patterns.errorPatterns.has(errorKey)) {
            const pattern = this.patterns.errorPatterns.get(errorKey);
            pattern.count++;
            pattern.lastSeen = new Date().toISOString();

            // 频繁错误警报
            if (pattern.count > 5) {
                this.emit('frequent-error', {
                    pattern,
                    error,
                    severity: this.calculateSeverity(pattern)
                });
            }
        } else {
            this.patterns.errorPatterns.set(errorKey, {
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                count: 1,
                sample: error
            });
        }
    }

    generateErrorKey(error) {
        // 生成错误特征码
        return `${error.type || error.status}_${error.text?.slice(0, 50) || error.url}`;
    }

    calculateSeverity(pattern) {
        // P0: 频繁出现且影响核心功能
        // P1: 偶尔出现但影响用户体验
        // P2: 罕见或影响较小
        if (pattern.count > 10) return 'P0';
        if (pattern.count > 5) return 'P1';
        return 'P2';
    }

    /**
     * 性能退化检测 - 趋势分析
     */
    detectPerformanceDegradation(currentMetrics) {
        if (this.metrics.performance.length < 10) return;

        // 获取最近10次的平均值
        const recent = this.metrics.performance.slice(-10);
        const avgFCP = recent.reduce((sum, m) => sum + m.FCP, 0) / recent.length;
        const avgLCP = recent.reduce((sum, m) => sum + m.LCP, 0) / recent.length;

        // 对比基线
        if (this.patterns.performanceBaseline) {
            const fcpDegradation = (currentMetrics.FCP - this.patterns.performanceBaseline.FCP) / this.patterns.performanceBaseline.FCP;
            const lcpDegradation = (currentMetrics.LCP - this.patterns.performanceBaseline.LCP) / this.patterns.performanceBaseline.LCP;

            if (fcpDegradation > 0.2) { // 退化超过20%
                this.emit('performance-degradation', {
                    metric: 'FCP',
                    baseline: this.patterns.performanceBaseline.FCP,
                    current: currentMetrics.FCP,
                    degradation: `${(fcpDegradation * 100).toFixed(1)}%`
                });
            }

            if (lcpDegradation > 0.2) {
                this.emit('performance-degradation', {
                    metric: 'LCP',
                    baseline: this.patterns.performanceBaseline.LCP,
                    current: currentMetrics.LCP,
                    degradation: `${(lcpDegradation * 100).toFixed(1)}%`
                });
            }
        } else {
            // 建立基线
            this.patterns.performanceBaseline = {
                FCP: avgFCP,
                LCP: avgLCP,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 视觉回归测试 - 截图对比
     */
    async captureVisualState(pageName) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const screenshotPath = path.join(
            this.config.screenshotDir,
            `${pageName}_${timestamp}.png`
        );

        await this.page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        // 对比历史截图
        const previousScreenshot = await this.findPreviousScreenshot(pageName);
        if (previousScreenshot) {
            const diff = await this.compareScreenshots(previousScreenshot, screenshotPath);
            if (diff > 0.1) { // 差异超过10%
                this.emit('visual-regression', {
                    page: pageName,
                    difference: `${(diff * 100).toFixed(1)}%`,
                    current: screenshotPath,
                    previous: previousScreenshot
                });
            }
        }

        return screenshotPath;
    }

    async compareScreenshots(path1, path2) {
        // 简化版：实际应使用图像对比库如 pixelmatch
        // 这里返回模拟值
        return Math.random() * 0.2; // 0-20%的差异
    }

    async findPreviousScreenshot(pageName) {
        // 查找最近的同名截图
        try {
            const files = await fs.readdir(this.config.screenshotDir);
            const matches = files.filter(f => f.startsWith(pageName)).sort().reverse();
            return matches.length > 1 ? path.join(this.config.screenshotDir, matches[1]) : null;
        } catch {
            return null;
        }
    }

    /**
     * 用户行为追踪 - 智能建模
     */
    async trackUserBehavior() {
        await this.page.evaluate(() => {
            // 注入行为追踪代码
            let actions = [];

            document.addEventListener('click', (e) => {
                actions.push({
                    type: 'click',
                    target: e.target.tagName,
                    id: e.target.id,
                    class: e.target.className,
                    text: e.target.innerText?.slice(0, 50),
                    timestamp: Date.now()
                });
            });

            document.addEventListener('input', (e) => {
                actions.push({
                    type: 'input',
                    target: e.target.tagName,
                    id: e.target.id,
                    timestamp: Date.now()
                });
            });

            // 定期上报
            setInterval(() => {
                if (actions.length > 0) {
                    window.__gembaActions = actions;
                    actions = [];
                }
            }, 5000);
        });
    }

    /**
     * 加载历史模式 - 持续学习
     */
    async loadPatterns() {
        try {
            const patternsPath = './gemba-patterns.json';
            const data = await fs.readFile(patternsPath, 'utf-8');
            const saved = JSON.parse(data);

            // 恢复错误模式
            if (saved.errorPatterns) {
                this.patterns.errorPatterns = new Map(saved.errorPatterns);
            }

            // 恢复性能基线
            if (saved.performanceBaseline) {
                this.patterns.performanceBaseline = saved.performanceBaseline;
            }

            console.log('📚 Loaded historical patterns');
        } catch (error) {
            console.log('📝 No historical patterns found, starting fresh');
        }
    }

    /**
     * 保存学习成果 - 知识沉淀
     */
    async savePatterns() {
        const patterns = {
            errorPatterns: Array.from(this.patterns.errorPatterns.entries()),
            performanceBaseline: this.patterns.performanceBaseline,
            timestamp: new Date().toISOString()
        };

        await fs.writeFile(
            './gemba-patterns.json',
            JSON.stringify(patterns, null, 2)
        );
    }

    /**
     * 生成感知报告 - 全景视图
     */
    generatePerceptionReport() {
        return {
            summary: {
                totalErrors: this.metrics.errors.length,
                performanceChecks: this.metrics.performance.length,
                fileChanges: this.metrics.fileChanges.length,
                errorPatterns: this.patterns.errorPatterns.size
            },
            topErrors: Array.from(this.patterns.errorPatterns.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5),
            performanceTrend: this.calculatePerformanceTrend(),
            recommendations: this.generateRecommendations()
        };
    }

    calculatePerformanceTrend() {
        if (this.metrics.performance.length < 2) return 'insufficient data';

        const recent = this.metrics.performance.slice(-10);
        const older = this.metrics.performance.slice(-20, -10);

        if (older.length === 0) return 'insufficient data';

        const recentAvgFCP = recent.reduce((sum, m) => sum + m.FCP, 0) / recent.length;
        const olderAvgFCP = older.reduce((sum, m) => sum + m.FCP, 0) / older.length;

        const trend = (recentAvgFCP - olderAvgFCP) / olderAvgFCP;

        if (Math.abs(trend) < 0.05) return 'stable';
        if (trend > 0) return `degrading (${(trend * 100).toFixed(1)}%)`;
        return `improving (${(Math.abs(trend) * 100).toFixed(1)}%)`;
    }

    generateRecommendations() {
        const recommendations = [];

        // 基于错误模式
        if (this.patterns.errorPatterns.size > 10) {
            recommendations.push({
                type: 'error-handling',
                priority: 'P0',
                message: 'High error rate detected, implement comprehensive error handling'
            });
        }

        // 基于性能
        if (this.patterns.performanceBaseline && this.metrics.performance.length > 0) {
            const latest = this.metrics.performance[this.metrics.performance.length - 1];
            if (latest.FCP > 2000) {
                recommendations.push({
                    type: 'performance',
                    priority: 'P1',
                    message: 'FCP > 2s, consider code splitting and lazy loading'
                });
            }
        }

        // 基于文件变更
        const hotFiles = this.identifyHotspots();
        if (hotFiles.length > 0) {
            recommendations.push({
                type: 'refactoring',
                priority: 'P2',
                message: `Files changing frequently: ${hotFiles.join(', ')}. Consider refactoring.`
            });
        }

        return recommendations;
    }

    identifyHotspots() {
        const fileChangeCount = {};
        this.metrics.fileChanges.forEach(change => {
            fileChangeCount[change.path] = (fileChangeCount[change.path] || 0) + 1;
        });

        return Object.entries(fileChangeCount)
            .filter(([_, count]) => count > 5)
            .map(([file, _]) => path.basename(file));
    }

    /**
     * 清理资源
     */
    async cleanup() {
        await this.savePatterns();

        if (this.fileWatcher) {
            await this.fileWatcher.close();
        }

        if (this.browser) {
            await this.browser.close();
        }

        console.log('👋 Perception Layer cleaned up');
    }
}

module.exports = PerceptionLayer;