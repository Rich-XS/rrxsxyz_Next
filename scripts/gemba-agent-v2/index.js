/**
 * Gemba Agent 2.0 - 主控制器
 * 整合感知层、决策层、执行层，实现自主进化
 */

const PerceptionLayer = require('./perception-layer');
const DecisionLayer = require('./decision-layer');
const ExecutionLayer = require('./execution-layer');
const EventEmitter = require('events');
const fs = require('fs').promises;

class GembaAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            name: config.name || 'Gemba Agent 2.0',
            baseUrl: config.baseUrl || 'http://localhost:8080',
            watchPaths: config.watchPaths || ['./duomotai', './server'],
            autoMode: config.autoMode !== false, // 默认自动模式
            learningEnabled: config.learningEnabled !== false,
            reportInterval: config.reportInterval || 60000, // 1分钟
            ...config
        };

        // 初始化三层
        this.perception = new PerceptionLayer(this.config);
        this.decision = new DecisionLayer(this.config);
        this.execution = new ExecutionLayer(this.config);

        // 运行统计
        this.stats = {
            startTime: null,
            cyclesCompleted: 0,
            errorsDetected: 0,
            decisionsM

ade: 0,
            actionsExecuted: 0,
            improvements: []
        };

        // 学习循环
        this.learningCycle = null;
        this.reportingCycle = null;
    }

    /**
     * 启动Agent
     */
    async start() {
        console.log(`
╔══════════════════════════════════════════════╗
║           🚀 Gemba Agent 2.0 Starting        ║
║                                              ║
║  👁️  Perception Layer: Initializing...       ║
║  🧠 Decision Layer: Initializing...         ║
║  🦾 Execution Layer: Initializing...        ║
╚══════════════════════════════════════════════╝
        `);

        this.stats.startTime = new Date();

        // 初始化各层
        await this.perception.initialize();
        await this.decision.initialize();
        await this.execution.initialize();

        // 连接层间通信
        this.connectLayers();

        // 启动自主循环
        if (this.config.autoMode) {
            this.startAutonomousCycle();
        }

        // 启动学习循环
        if (this.config.learningEnabled) {
            this.startLearningCycle();
        }

        // 启动报告循环
        this.startReportingCycle();

        console.log(`
╔══════════════════════════════════════════════╗
║         ✅ Gemba Agent 2.0 Running          ║
║                                              ║
║  Mode: ${this.config.autoMode ? 'Autonomous' : 'Manual'}                          ║
║  Learning: ${this.config.learningEnabled ? 'Enabled' : 'Disabled'}                      ║
║  Watching: ${this.config.watchPaths.join(', ')}    ║
╚══════════════════════════════════════════════╝
        `);

        // 导航到测试页面
        if (this.perception.page) {
            await this.perception.page.goto(this.config.baseUrl);
            await this.perception.trackUserBehavior();
        }
    }

    /**
     * 连接三层通信
     */
    connectLayers() {
        // 感知层 → 决策层
        this.perception.on('error-detected', async (error) => {
            this.stats.errorsDetected++;
            if (this.config.autoMode) {
                const decisions = await this.decision.processPerceptionData({
                    errors: [error]
                });
                this.handleDecisions(decisions);
            }
        });

        this.perception.on('performance-degradation', async (degradation) => {
            console.log(`⚠️ Performance degradation detected: ${degradation.metric}`);
            if (this.config.autoMode) {
                const decisions = await this.decision.processPerceptionData({
                    performance: [degradation]
                });
                this.handleDecisions(decisions);
            }
        });

        this.perception.on('key-file-changed', async (change) => {
            console.log(`🔑 Key file changed: ${change.path}`);
            if (this.config.autoMode) {
                const decisions = await this.decision.processPerceptionData({
                    fileChanges: [change]
                });
                this.handleDecisions(decisions);
            }
        });

        this.perception.on('visual-regression', async (regression) => {
            console.log(`👁️ Visual regression detected: ${regression.difference}`);
            // 触发视觉测试
        });

        // 决策层 → 执行层
        this.decision.on('decisions-ready', async (decisions) => {
            this.stats.decisionsMade += decisions.length;
            await this.execution.executeDecisions(decisions);
        });

        this.decision.on('experiment-started', (experiment) => {
            console.log(`🧪 Experiment started: ${experiment.name}`);
        });

        this.decision.on('experiment-concluded', (experiment) => {
            console.log(`✅ Experiment concluded: ${experiment.name} - Winner: ${experiment.winner.variant}`);
            this.stats.improvements.push({
                type: 'experiment',
                name: experiment.name,
                improvement: experiment.winner.improvement
            });
        });

        this.decision.on('pattern-identified', (pattern) => {
            console.log(`🔍 Pattern identified: ${JSON.stringify(pattern.features)}`);
        });

        // 执行层 → 决策层（反馈）
        this.execution.on('execution-complete', async (result) => {
            this.stats.actionsExecuted++;

            // 记录结果用于学习
            if (this.config.learningEnabled) {
                this.decision.recordDecisionOutcome(
                    result.decision.id,
                    { success: true, result: result.result }
                );
            }

            // 触发后续测试
            if (result.decision.type === 'auto-fix') {
                await this.verifyFix(result);
            }
        });

        this.execution.on('execution-failed', async (failure) => {
            console.error(`❌ Execution failed: ${failure.error}`);

            // 记录失败用于学习
            if (this.config.learningEnabled) {
                this.decision.recordDecisionOutcome(
                    failure.decision.id,
                    { success: false, error: failure.error }
                );
            }

            // 触发备用方案
            if (failure.decision.fallbackPlan) {
                await this.executeFallbackPlan(failure.decision.fallbackPlan);
            }
        });
    }

    /**
     * 自主循环 - 持续感知和响应
     */
    startAutonomousCycle() {
        console.log('🔄 Starting autonomous cycle...');

        setInterval(async () => {
            try {
                // 收集感知数据
                const perceptionReport = this.perception.generatePerceptionReport();

                // 如果有问题需要处理
                if (this.shouldTakeAction(perceptionReport)) {
                    const decisions = await this.decision.processPerceptionData(perceptionReport);
                    await this.handleDecisions(decisions);
                }

                this.stats.cyclesCompleted++;

            } catch (error) {
                console.error('Error in autonomous cycle:', error);
            }
        }, 10000); // 每10秒一个循环
    }

    shouldTakeAction(report) {
        return (
            report.summary.totalErrors > 0 ||
            report.performanceTrend === 'degrading' ||
            report.recommendations.length > 0
        );
    }

    async handleDecisions(decisions) {
        if (decisions.length === 0) return;

        console.log(`📋 Processing ${decisions.length} decisions...`);

        // 高风险决策需要确认
        const highRiskDecisions = decisions.filter(d => d.risk?.level === 'high');
        const normalDecisions = decisions.filter(d => d.risk?.level !== 'high');

        // 执行正常决策
        if (normalDecisions.length > 0) {
            await this.execution.executeDecisions(normalDecisions);
        }

        // 高风险决策记录但不自动执行
        if (highRiskDecisions.length > 0) {
            console.log(`⚠️ ${highRiskDecisions.length} high-risk decisions require approval`);
            await this.logHighRiskDecisions(highRiskDecisions);
        }
    }

    /**
     * 学习循环 - 持续优化
     */
    startLearningCycle() {
        console.log('📚 Starting learning cycle...');

        this.learningCycle = setInterval(async () => {
            // 分析历史数据
            const decisionReport = this.decision.generateDecisionReport();

            // 识别改进机会
            if (decisionReport.summary.successRate < 0.7) {
                console.log('📈 Success rate below 70%, adjusting strategies...');

                // 创建A/B测试
                this.createOptimizationExperiment();
            }

            // 清理过时的模式
            this.cleanupOldPatterns();

            // 保存学习成果
            await this.saveLearningProgress();

        }, 300000); // 每5分钟
    }

    createOptimizationExperiment() {
        // 创建优化实验
        const experiment = this.decision.createExperiment('optimization-strategy', [
            { variant: 'control', strategy: 'current' },
            { variant: 'aggressive', strategy: 'aggressive-fix' },
            { variant: 'conservative', strategy: 'conservative-fix' }
        ]);

        // 运行实验
        this.runExperiment(experiment);
    }

    async runExperiment(experiment) {
        // 模拟运行实验的不同变体
        for (const variant of experiment.variants) {
            // 运行变体策略
            const result = await this.executeVariantStrategy(variant);

            // 记录结果
            this.decision.recordExperimentResult(
                experiment.name,
                variant.variant,
                result
            );
        }
    }

    async executeVariantStrategy(variant) {
        // 根据策略执行
        // 这里是模拟，实际应该执行真实的策略
        return {
            success: Math.random() > 0.3,
            metric: Math.random() * 100
        };
    }

    cleanupOldPatterns() {
        // 清理30天前的模式
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // TODO: 实现清理逻辑
    }

    /**
     * 报告循环 - 定期汇报
     */
    startReportingCycle() {
        console.log('📊 Starting reporting cycle...');

        this.reportingCycle = setInterval(async () => {
            const report = await this.generateFullReport();
            await this.saveReport(report);
            this.displayReport(report);
        }, this.config.reportInterval);

        // 立即生成一份报告
        this.generateFullReport().then(report => {
            this.displayReport(report);
        });
    }

    async generateFullReport() {
        const uptime = new Date() - this.stats.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);

        return {
            agent: {
                name: this.config.name,
                version: '2.0',
                mode: this.config.autoMode ? 'Autonomous' : 'Manual',
                uptime: `${hours}h ${minutes}m`
            },
            stats: {
                ...this.stats,
                errorsPerHour: (this.stats.errorsDetected / (uptime / 3600000)).toFixed(1),
                decisionsPerHour: (this.stats.decisionsMade / (uptime / 3600000)).toFixed(1),
                actionsPerHour: (this.stats.actionsExecuted / (uptime / 3600000)).toFixed(1)
            },
            perception: this.perception.generatePerceptionReport(),
            decision: this.decision.generateDecisionReport(),
            execution: this.execution.generateExecutionReport(),
            improvements: this.stats.improvements,
            timestamp: new Date().toISOString()
        };
    }

    displayReport(report) {
        console.log(`
╔══════════════════════════════════════════════════════════╗
║                  📊 Gemba Agent Report                   ║
╠══════════════════════════════════════════════════════════╣
║ Uptime: ${report.agent.uptime.padEnd(49)}║
║ Cycles: ${String(report.stats.cyclesCompleted).padEnd(49)}║
║ Errors Detected: ${String(report.stats.errorsDetected).padEnd(40)}║
║ Decisions Made: ${String(report.stats.decisionsMade).padEnd(41)}║
║ Actions Executed: ${String(report.stats.actionsExecuted).padEnd(39)}║
╠══════════════════════════════════════════════════════════╣
║ Success Rate: ${report.execution.successRate.padEnd(43)}║
║ Learning Confidence: ${report.decision.learningProgress.confidence.padEnd(36)}║
║ Performance Trend: ${report.perception.performanceTrend.padEnd(38)}║
╠══════════════════════════════════════════════════════════╣
║ Improvements: ${String(report.improvements.length).padEnd(43)}║
╚══════════════════════════════════════════════════════════╝
        `);

        // 显示关键改进
        if (report.improvements.length > 0) {
            console.log('\n🎯 Recent Improvements:');
            report.improvements.slice(-3).forEach(imp => {
                console.log(`  • ${imp.type}: ${imp.improvement}`);
            });
        }

        // 显示推荐
        if (report.perception.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.perception.recommendations.slice(0, 3).forEach(rec => {
                console.log(`  • [${rec.priority}] ${rec.message}`);
            });
        }
    }

    async saveReport(report) {
        const reportPath = `./gemba-reports/report_${Date.now()}.json`;
        await fs.mkdir('./gemba-reports', { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    }

    /**
     * 辅助方法
     */
    async verifyFix(executionResult) {
        // 验证修复是否成功
        console.log(`🔍 Verifying fix for: ${executionResult.decision.target}`);

        // 重新运行测试
        const testDecision = {
            type: 'run-tests',
            priority: 'P0',
            target: executionResult.result.file,
            action: {
                tests: [executionResult.result.file.replace('.js', '.test.js')],
                coverage: 'focused'
            }
        };

        await this.execution.executeDecisions([testDecision]);
    }

    async executeFallbackPlan(plan) {
        console.log(`🔄 Executing fallback plan...`);

        for (const action of plan.actions) {
            console.log(`  • ${action}`);
            // TODO: 实际执行备用方案
        }
    }

    async logHighRiskDecisions(decisions) {
        const logPath = './gemba-high-risk-decisions.json';
        let existingDecisions = [];

        try {
            const content = await fs.readFile(logPath, 'utf-8');
            existingDecisions = JSON.parse(content);
        } catch {
            // 文件不存在
        }

        existingDecisions.push({
            timestamp: new Date().toISOString(),
            decisions: decisions
        });

        await fs.writeFile(logPath, JSON.stringify(existingDecisions, null, 2));
    }

    async saveLearningProgress() {
        await this.decision.saveLearningHistory();
        await this.decision.saveKnowledgeBase();
        await this.perception.savePatterns();
    }

    /**
     * 停止Agent
     */
    async stop() {
        console.log('\n🛑 Stopping Gemba Agent...');

        // 停止循环
        if (this.learningCycle) {
            clearInterval(this.learningCycle);
        }
        if (this.reportingCycle) {
            clearInterval(this.reportingCycle);
        }

        // 生成最终报告
        const finalReport = await this.generateFullReport();
        await this.saveReport(finalReport);

        console.log('\n📊 Final Report:');
        this.displayReport(finalReport);

        // 清理资源
        await this.perception.cleanup();
        await this.decision.cleanup();
        await this.execution.cleanup();

        console.log('\n👋 Gemba Agent stopped successfully');
    }

    /**
     * 手动触发
     */
    async runManualTest(testName) {
        console.log(`🧪 Running manual test: ${testName}`);

        // 导航到测试页面
        if (this.perception.page) {
            await this.perception.page.goto(`${this.config.baseUrl}/${testName}`);

            // 捕获状态
            await this.perception.captureVisualState(testName);

            // 收集性能数据
            const metrics = await this.perception.page.evaluate(() => {
                return performance.getEntriesByType('navigation')[0];
            });

            console.log('Performance metrics:', metrics);
        }
    }

    async triggerOptimization(target) {
        console.log(`⚡ Manually triggering optimization for: ${target}`);

        const decision = {
            type: 'performance-optimization',
            priority: 'P1',
            target: target,
            action: {
                optimization: 'auto-detect',
                expectedImprovement: 'TBD'
            }
        };

        const decisions = await this.decision.assessRisks([decision]);
        await this.execution.executeDecisions(decisions);
    }
}

// 主入口
async function main() {
    const agent = new GembaAgent({
        name: 'RRXSXYZ Gemba Agent',
        baseUrl: 'http://localhost:8080',
        watchPaths: ['./duomotai', './server'],
        autoMode: true,
        learningEnabled: true,
        reportInterval: 60000 // 1分钟报告一次
    });

    // 优雅退出
    process.on('SIGINT', async () => {
        await agent.stop();
        process.exit(0);
    });

    // 启动Agent
    await agent.start();
}

// 如果直接运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GembaAgent;