/**
 * Gemba Agent 2.0 - 决策层(Brain)
 * 基于感知数据做出智能决策，持续学习优化
 */

const EventEmitter = require('events');
const fs = require('fs').promises;

class DecisionLayer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            decisionThreshold: config.decisionThreshold || 0.7,
            learningRate: config.learningRate || 0.1,
            historySize: config.historySize || 1000,
            ...config
        };

        // 决策树
        this.decisionTree = {
            errorHandling: new Map(),
            performanceOptimization: new Map(),
            testStrategy: new Map(),
            deploymentRisk: new Map()
        };

        // 学习历史
        this.learningHistory = {
            decisions: [],
            outcomes: [],
            patterns: new Map()
        };

        // 知识库
        this.knowledgeBase = {
            bestPractices: [],
            antiPatterns: [],
            solutions: new Map()
        };

        // A/B测试管理
        this.experiments = new Map();

        // 决策权重
        this.weights = {
            errorSeverity: 0.3,
            performanceImpact: 0.25,
            userImpact: 0.25,
            codeComplexity: 0.1,
            historicalSuccess: 0.1
        };
    }

    /**
     * 初始化决策层
     */
    async initialize() {
        console.log('🧠 Initializing Decision Layer...');

        // 加载历史决策
        await this.loadLearningHistory();

        // 加载知识库
        await this.loadKnowledgeBase();

        // 初始化决策规则
        this.initializeDecisionRules();

        console.log('✅ Decision Layer initialized');
    }

    /**
     * 处理感知层数据 - 主决策入口
     */
    async processPerceptionData(perceptionData) {
        const decisions = [];

        // 1. 分析错误
        if (perceptionData.errors && perceptionData.errors.length > 0) {
            const errorDecisions = await this.analyzeErrors(perceptionData.errors);
            decisions.push(...errorDecisions);
        }

        // 2. 分析性能
        if (perceptionData.performance) {
            const perfDecisions = await this.analyzePerformance(perceptionData.performance);
            decisions.push(...perfDecisions);
        }

        // 3. 分析文件变更
        if (perceptionData.fileChanges) {
            const changeDecisions = await this.analyzeFileChanges(perceptionData.fileChanges);
            decisions.push(...changeDecisions);
        }

        // 4. 优先级排序
        const prioritizedDecisions = this.prioritizeDecisions(decisions);

        // 5. 风险评估
        const assessedDecisions = await this.assessRisks(prioritizedDecisions);

        // 6. 记录决策
        this.recordDecisions(assessedDecisions);

        // 7. 触发执行
        this.emit('decisions-ready', assessedDecisions);

        return assessedDecisions;
    }

    /**
     * 错误分析决策
     */
    async analyzeErrors(errors) {
        const decisions = [];
        const errorGroups = this.groupErrors(errors);

        for (const [pattern, group] of errorGroups) {
            const severity = this.calculateErrorSeverity(group);

            if (severity === 'P0') {
                // 紧急修复
                decisions.push({
                    type: 'auto-fix',
                    priority: 'P0',
                    target: pattern,
                    action: await this.generateErrorFix(group[0]),
                    confidence: this.calculateConfidence('error-fix', pattern),
                    reason: `Critical error occurring ${group.length} times`
                });
            } else if (severity === 'P1') {
                // 创建修复任务
                decisions.push({
                    type: 'create-task',
                    priority: 'P1',
                    target: pattern,
                    action: {
                        title: `Fix recurring error: ${pattern}`,
                        description: this.generateErrorDescription(group),
                        suggestedFix: await this.suggestErrorFix(group[0])
                    },
                    confidence: this.calculateConfidence('error-task', pattern),
                    reason: `Error pattern detected ${group.length} times`
                });
            }
        }

        return decisions;
    }

    /**
     * 性能分析决策
     */
    async analyzePerformance(performanceData) {
        const decisions = [];
        const trends = this.calculatePerformanceTrends(performanceData);

        // FCP优化
        if (trends.FCP.degradation > 0.2) {
            decisions.push({
                type: 'performance-optimization',
                priority: 'P1',
                target: 'FCP',
                action: {
                    optimization: 'code-splitting',
                    details: await this.generateCodeSplitStrategy(),
                    expectedImprovement: '30-40%'
                },
                confidence: 0.8,
                reason: `FCP degraded by ${(trends.FCP.degradation * 100).toFixed(1)}%`
            });
        }

        // 内存优化
        if (trends.memory && trends.memory.leak) {
            decisions.push({
                type: 'memory-optimization',
                priority: 'P0',
                target: 'memory-leak',
                action: {
                    optimization: 'cleanup-listeners',
                    details: await this.identifyMemoryLeaks(performanceData),
                    expectedImprovement: '50-60%'
                },
                confidence: 0.9,
                reason: 'Memory leak detected'
            });
        }

        // DOM优化
        if (trends.domComplexity > 1500) {
            decisions.push({
                type: 'dom-optimization',
                priority: 'P2',
                target: 'dom-complexity',
                action: {
                    optimization: 'virtual-scrolling',
                    details: 'Implement virtual scrolling for large lists',
                    expectedImprovement: '60-70%'
                },
                confidence: 0.7,
                reason: `DOM nodes exceed 1500 (current: ${trends.domComplexity})`
            });
        }

        return decisions;
    }

    /**
     * 文件变更分析决策
     */
    async analyzeFileChanges(fileChanges) {
        const decisions = [];
        const hotspots = this.identifyCodeHotspots(fileChanges);

        for (const hotspot of hotspots) {
            if (hotspot.changeFrequency > 10) {
                decisions.push({
                    type: 'refactoring',
                    priority: 'P2',
                    target: hotspot.file,
                    action: {
                        refactoring: 'extract-module',
                        details: `File ${hotspot.file} changed ${hotspot.changeFrequency} times`,
                        suggestedModules: await this.suggestModularization(hotspot.file)
                    },
                    confidence: 0.6,
                    reason: 'High change frequency indicates unstable code'
                });
            }

            // 触发相关测试
            decisions.push({
                type: 'run-tests',
                priority: 'P1',
                target: hotspot.file,
                action: {
                    tests: await this.identifyRelatedTests(hotspot.file),
                    coverage: 'focused'
                },
                confidence: 0.95,
                reason: `File changed: ${hotspot.file}`
            });
        }

        return decisions;
    }

    /**
     * 决策优先级排序
     */
    prioritizeDecisions(decisions) {
        return decisions.sort((a, b) => {
            // 优先级权重
            const priorityWeight = { P0: 3, P1: 2, P2: 1 };
            const aPriority = priorityWeight[a.priority] || 0;
            const bPriority = priorityWeight[b.priority] || 0;

            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            // 置信度次之
            return b.confidence - a.confidence;
        });
    }

    /**
     * 风险评估
     */
    async assessRisks(decisions) {
        return decisions.map(decision => {
            const risk = this.calculateRisk(decision);

            // 基于风险调整决策
            if (risk.level === 'high') {
                decision.requiresApproval = true;
                decision.fallbackPlan = this.generateFallbackPlan(decision);
            }

            decision.risk = risk;
            return decision;
        });
    }

    calculateRisk(decision) {
        let riskScore = 0;

        // 基于决策类型
        const riskByType = {
            'auto-fix': 0.3,
            'performance-optimization': 0.4,
            'refactoring': 0.5,
            'deployment': 0.7
        };
        riskScore += riskByType[decision.type] || 0.2;

        // 基于历史成功率
        const historicalSuccess = this.getHistoricalSuccessRate(decision.type);
        riskScore *= (1 - historicalSuccess);

        // 基于置信度
        riskScore *= (1 - decision.confidence);

        return {
            score: riskScore,
            level: riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
            factors: {
                type: decision.type,
                historicalSuccess,
                confidence: decision.confidence
            }
        };
    }

    /**
     * 生成错误修复方案
     */
    async generateErrorFix(error) {
        // 查找知识库中的解决方案
        const knownSolution = this.knowledgeBase.solutions.get(error.type);
        if (knownSolution) {
            return knownSolution;
        }

        // 基于错误类型生成修复
        const fixes = {
            'TypeError': {
                code: `if (typeof variable !== 'undefined') { /* use variable */ }`,
                description: 'Add type checking before usage'
            },
            'ReferenceError': {
                code: `// Ensure variable is declared\nlet variable = defaultValue;`,
                description: 'Declare variable before usage'
            },
            'SyntaxError': {
                code: '// Check for missing brackets, quotes, or semicolons',
                description: 'Fix syntax issues'
            }
        };

        return fixes[error.type] || {
            code: '// Manual fix required',
            description: 'Complex error requires manual intervention'
        };
    }

    /**
     * A/B测试管理
     */
    createExperiment(name, variants) {
        const experiment = {
            name,
            variants,
            startTime: new Date().toISOString(),
            results: new Map(),
            status: 'running'
        };

        this.experiments.set(name, experiment);
        this.emit('experiment-started', experiment);

        return experiment;
    }

    recordExperimentResult(experimentName, variant, result) {
        const experiment = this.experiments.get(experimentName);
        if (!experiment) return;

        if (!experiment.results.has(variant)) {
            experiment.results.set(variant, []);
        }

        experiment.results.get(variant).push(result);

        // 检查是否有统计显著性
        if (this.hasStatisticalSignificance(experiment)) {
            this.concludeExperiment(experiment);
        }
    }

    hasStatisticalSignificance(experiment) {
        // 简化版：实际应使用适当的统计测试
        const minSampleSize = 100;
        for (const [variant, results] of experiment.results) {
            if (results.length < minSampleSize) return false;
        }
        return true;
    }

    concludeExperiment(experiment) {
        const winner = this.determineWinner(experiment);

        experiment.status = 'concluded';
        experiment.winner = winner;
        experiment.endTime = new Date().toISOString();

        // 更新知识库
        this.knowledgeBase.bestPractices.push({
            type: 'experiment',
            name: experiment.name,
            winner: winner.variant,
            improvement: winner.improvement,
            confidence: winner.confidence
        });

        this.emit('experiment-concluded', experiment);
    }

    determineWinner(experiment) {
        // 计算每个变体的平均成功率
        const variantStats = [];

        for (const [variant, results] of experiment.results) {
            const successRate = results.filter(r => r.success).length / results.length;
            const avgMetric = results.reduce((sum, r) => sum + (r.metric || 0), 0) / results.length;

            variantStats.push({
                variant,
                successRate,
                avgMetric,
                sampleSize: results.length
            });
        }

        // 选择最佳变体
        variantStats.sort((a, b) => b.successRate - a.successRate);
        const winner = variantStats[0];
        const baseline = variantStats.find(v => v.variant === 'control') || variantStats[1];

        return {
            variant: winner.variant,
            improvement: ((winner.successRate - baseline.successRate) / baseline.successRate * 100).toFixed(1) + '%',
            confidence: this.calculateStatisticalConfidence(winner, baseline)
        };
    }

    calculateStatisticalConfidence(winner, baseline) {
        // 简化的置信度计算
        const difference = Math.abs(winner.successRate - baseline.successRate);
        const sampleSize = Math.min(winner.sampleSize, baseline.sampleSize);

        if (difference > 0.1 && sampleSize > 200) return 0.95;
        if (difference > 0.05 && sampleSize > 100) return 0.90;
        if (difference > 0.03 && sampleSize > 50) return 0.80;
        return 0.70;
    }

    /**
     * 持续学习机制
     */
    recordDecisionOutcome(decisionId, outcome) {
        const decision = this.learningHistory.decisions.find(d => d.id === decisionId);
        if (!decision) return;

        decision.outcome = outcome;

        // 更新决策权重
        if (outcome.success) {
            this.adjustWeights(decision.type, 1.0);
        } else {
            this.adjustWeights(decision.type, -1.0);
        }

        // 提取模式
        this.extractPattern(decision, outcome);

        // 更新知识库
        this.updateKnowledgeBase(decision, outcome);
    }

    adjustWeights(decisionType, factor) {
        const learningRate = this.config.learningRate;

        // 调整相关权重
        if (this.weights[decisionType]) {
            this.weights[decisionType] += learningRate * factor;

            // 归一化
            const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
            for (const key in this.weights) {
                this.weights[key] /= total;
            }
        }
    }

    extractPattern(decision, outcome) {
        const patternKey = `${decision.type}_${outcome.success ? 'success' : 'failure'}`;

        if (!this.learningHistory.patterns.has(patternKey)) {
            this.learningHistory.patterns.set(patternKey, {
                count: 0,
                conditions: []
            });
        }

        const pattern = this.learningHistory.patterns.get(patternKey);
        pattern.count++;
        pattern.conditions.push({
            context: decision.context,
            outcome: outcome
        });

        // 识别成功/失败的共同特征
        if (pattern.count > 10) {
            this.analyzePatternFeatures(pattern);
        }
    }

    analyzePatternFeatures(pattern) {
        // 提取共同特征
        const features = {};

        pattern.conditions.forEach(condition => {
            for (const [key, value] of Object.entries(condition.context || {})) {
                if (!features[key]) {
                    features[key] = {};
                }
                features[key][value] = (features[key][value] || 0) + 1;
            }
        });

        // 识别主导特征
        const dominantFeatures = {};
        for (const [key, values] of Object.entries(features)) {
            const sortedValues = Object.entries(values).sort((a, b) => b[1] - a[1]);
            if (sortedValues[0][1] > pattern.count * 0.6) {
                dominantFeatures[key] = sortedValues[0][0];
            }
        }

        pattern.dominantFeatures = dominantFeatures;
        this.emit('pattern-identified', { pattern, features: dominantFeatures });
    }

    /**
     * 知识库管理
     */
    updateKnowledgeBase(decision, outcome) {
        if (outcome.success) {
            // 添加到最佳实践
            this.knowledgeBase.bestPractices.push({
                type: decision.type,
                context: decision.context,
                action: decision.action,
                result: outcome.result,
                timestamp: new Date().toISOString()
            });
        } else {
            // 添加到反模式
            this.knowledgeBase.antiPatterns.push({
                type: decision.type,
                context: decision.context,
                action: decision.action,
                failure: outcome.error,
                timestamp: new Date().toISOString()
            });
        }

        // 更新解决方案映射
        if (outcome.success && decision.type === 'auto-fix') {
            this.knowledgeBase.solutions.set(
                decision.target,
                decision.action
            );
        }
    }

    /**
     * 智能建议生成
     */
    generateRecommendations(context) {
        const recommendations = [];

        // 基于最佳实践
        const relevantPractices = this.knowledgeBase.bestPractices.filter(
            practice => this.isRelevantContext(practice.context, context)
        );

        relevantPractices.forEach(practice => {
            recommendations.push({
                type: 'best-practice',
                source: practice,
                confidence: 0.8,
                description: `Apply successful pattern: ${practice.type}`
            });
        });

        // 避免反模式
        const relevantAntiPatterns = this.knowledgeBase.antiPatterns.filter(
            antiPattern => this.isRelevantContext(antiPattern.context, context)
        );

        relevantAntiPatterns.forEach(antiPattern => {
            recommendations.push({
                type: 'avoid',
                source: antiPattern,
                confidence: 0.9,
                description: `Avoid pattern that failed: ${antiPattern.type}`
            });
        });

        return recommendations;
    }

    isRelevantContext(storedContext, currentContext) {
        // 简化的相关性判断
        if (!storedContext || !currentContext) return false;

        let relevanceScore = 0;
        let totalChecks = 0;

        for (const key in currentContext) {
            if (key in storedContext) {
                totalChecks++;
                if (storedContext[key] === currentContext[key]) {
                    relevanceScore++;
                }
            }
        }

        return totalChecks > 0 && (relevanceScore / totalChecks) > 0.6;
    }

    /**
     * 辅助方法
     */
    groupErrors(errors) {
        const groups = new Map();

        errors.forEach(error => {
            const key = this.generateErrorKey(error);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(error);
        });

        return groups;
    }

    generateErrorKey(error) {
        return `${error.type || 'unknown'}_${error.message?.slice(0, 50) || ''}`;
    }

    calculateErrorSeverity(errorGroup) {
        if (errorGroup.length > 10) return 'P0';
        if (errorGroup.length > 5) return 'P1';
        return 'P2';
    }

    calculateConfidence(actionType, target) {
        // 基于历史成功率
        const historicalSuccess = this.getHistoricalSuccessRate(actionType, target);

        // 基于知识库匹配度
        const knowledgeMatch = this.knowledgeBase.solutions.has(target) ? 0.3 : 0;

        // 基于模式识别
        const patternMatch = this.learningHistory.patterns.has(`${actionType}_success`) ? 0.2 : 0;

        return Math.min(0.95, historicalSuccess * 0.5 + knowledgeMatch + patternMatch);
    }

    getHistoricalSuccessRate(actionType, target) {
        const relevantDecisions = this.learningHistory.decisions.filter(
            d => d.type === actionType && (!target || d.target === target)
        );

        if (relevantDecisions.length === 0) return 0.5; // 默认50%

        const successful = relevantDecisions.filter(d => d.outcome?.success).length;
        return successful / relevantDecisions.length;
    }

    calculatePerformanceTrends(performanceData) {
        // 简化的趋势计算
        const latest = performanceData[performanceData.length - 1];
        const average = performanceData.slice(-10).reduce((acc, p) => ({
            FCP: acc.FCP + p.FCP / 10,
            LCP: acc.LCP + p.LCP / 10,
            memory: acc.memory + (p.memory?.usedJSHeapSize || 0) / 10
        }), { FCP: 0, LCP: 0, memory: 0 });

        return {
            FCP: {
                current: latest.FCP,
                average: average.FCP,
                degradation: (latest.FCP - average.FCP) / average.FCP
            },
            memory: {
                current: latest.memory?.usedJSHeapSize,
                average: average.memory,
                leak: average.memory > 50 * 1024 * 1024 // 50MB threshold
            },
            domComplexity: latest.domNodes || 0
        };
    }

    identifyCodeHotspots(fileChanges) {
        const changeCount = {};

        fileChanges.forEach(change => {
            changeCount[change.path] = (changeCount[change.path] || 0) + 1;
        });

        return Object.entries(changeCount)
            .map(([file, count]) => ({
                file,
                changeFrequency: count
            }))
            .sort((a, b) => b.changeFrequency - a.changeFrequency)
            .slice(0, 5);
    }

    async suggestModularization(filePath) {
        // 基于文件类型和内容建议模块化
        return [
            { module: 'data-layer', description: 'Extract data fetching logic' },
            { module: 'view-layer', description: 'Separate presentation components' },
            { module: 'business-logic', description: 'Isolate business rules' }
        ];
    }

    async identifyRelatedTests(filePath) {
        // 识别相关测试文件
        const testPatterns = [
            filePath.replace('.js', '.test.js'),
            filePath.replace('.js', '.spec.js'),
            `test/${path.basename(filePath)}`
        ];

        return testPatterns;
    }

    async generateCodeSplitStrategy() {
        return {
            strategy: 'route-based',
            chunks: [
                { name: 'vendor', pattern: 'node_modules' },
                { name: 'common', pattern: 'shared components' },
                { name: 'lazy', pattern: 'heavy features' }
            ]
        };
    }

    async identifyMemoryLeaks() {
        return {
            suspects: [
                'Event listeners not removed',
                'Timers not cleared',
                'Large objects in closure'
            ],
            locations: ['debateEngine.js:L234', 'init.js:L567']
        };
    }

    generateFallbackPlan(decision) {
        return {
            trigger: 'If decision fails',
            actions: [
                'Rollback changes',
                'Log detailed error',
                'Notify developer',
                'Mark pattern as anti-pattern'
            ]
        };
    }

    recordDecisions(decisions) {
        decisions.forEach(decision => {
            decision.id = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            decision.timestamp = new Date().toISOString();
            this.learningHistory.decisions.push(decision);
        });

        // 限制历史大小
        if (this.learningHistory.decisions.length > this.config.historySize) {
            this.learningHistory.decisions = this.learningHistory.decisions.slice(-this.config.historySize);
        }
    }

    /**
     * 持久化方法
     */
    async loadLearningHistory() {
        try {
            const data = await fs.readFile('./gemba-learning-history.json', 'utf-8');
            const loaded = JSON.parse(data);

            this.learningHistory = {
                decisions: loaded.decisions || [],
                outcomes: loaded.outcomes || [],
                patterns: new Map(loaded.patterns || [])
            };

            console.log('📚 Loaded learning history');
        } catch (error) {
            console.log('📝 Starting fresh learning history');
        }
    }

    async loadKnowledgeBase() {
        try {
            const data = await fs.readFile('./gemba-knowledge-base.json', 'utf-8');
            const loaded = JSON.parse(data);

            this.knowledgeBase = {
                bestPractices: loaded.bestPractices || [],
                antiPatterns: loaded.antiPatterns || [],
                solutions: new Map(loaded.solutions || [])
            };

            console.log('📚 Loaded knowledge base');
        } catch (error) {
            console.log('📝 Starting fresh knowledge base');
        }
    }

    async saveLearningHistory() {
        const data = {
            decisions: this.learningHistory.decisions,
            outcomes: this.learningHistory.outcomes,
            patterns: Array.from(this.learningHistory.patterns.entries()),
            timestamp: new Date().toISOString()
        };

        await fs.writeFile(
            './gemba-learning-history.json',
            JSON.stringify(data, null, 2)
        );
    }

    async saveKnowledgeBase() {
        const data = {
            bestPractices: this.knowledgeBase.bestPractices,
            antiPatterns: this.knowledgeBase.antiPatterns,
            solutions: Array.from(this.knowledgeBase.solutions.entries()),
            timestamp: new Date().toISOString()
        };

        await fs.writeFile(
            './gemba-knowledge-base.json',
            JSON.stringify(data, null, 2)
        );
    }

    initializeDecisionRules() {
        // 预设决策规则
        this.decisionTree.errorHandling.set('TypeError', {
            action: 'add-type-check',
            confidence: 0.9
        });

        this.decisionTree.performanceOptimization.set('slow-FCP', {
            action: 'implement-lazy-loading',
            confidence: 0.8
        });

        this.decisionTree.testStrategy.set('critical-path', {
            action: 'prioritize-e2e-tests',
            confidence: 0.95
        });

        this.decisionTree.deploymentRisk.set('high-change-frequency', {
            action: 'incremental-rollout',
            confidence: 0.85
        });
    }

    /**
     * 生成决策报告
     */
    generateDecisionReport() {
        return {
            summary: {
                totalDecisions: this.learningHistory.decisions.length,
                successRate: this.calculateOverallSuccessRate(),
                topPatterns: Array.from(this.learningHistory.patterns.entries()).slice(0, 5),
                activeExperiments: this.experiments.size
            },
            recentDecisions: this.learningHistory.decisions.slice(-10),
            knowledgeStats: {
                bestPractices: this.knowledgeBase.bestPractices.length,
                antiPatterns: this.knowledgeBase.antiPatterns.length,
                solutions: this.knowledgeBase.solutions.size
            },
            learningProgress: {
                weights: this.weights,
                confidence: this.calculateLearningConfidence()
            }
        };
    }

    calculateOverallSuccessRate() {
        const decisionsWithOutcome = this.learningHistory.decisions.filter(d => d.outcome);
        if (decisionsWithOutcome.length === 0) return 0;

        const successful = decisionsWithOutcome.filter(d => d.outcome.success).length;
        return successful / decisionsWithOutcome.length;
    }

    calculateLearningConfidence() {
        // 基于历史数据量和成功率
        const dataPoints = this.learningHistory.decisions.length;
        const successRate = this.calculateOverallSuccessRate();

        if (dataPoints < 10) return 'low';
        if (dataPoints < 50) return 'medium';
        if (dataPoints >= 50 && successRate > 0.7) return 'high';
        return 'medium';
    }

    /**
     * 清理资源
     */
    async cleanup() {
        await this.saveLearningHistory();
        await this.saveKnowledgeBase();
        console.log('🧠 Decision Layer cleaned up');
    }
}

module.exports = DecisionLayer;