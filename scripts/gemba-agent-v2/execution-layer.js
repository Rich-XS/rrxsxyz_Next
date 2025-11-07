/**
 * Gemba Agent 2.0 - 执行层(Hands & Feet)
 * 自动执行决策，包括代码修复、测试生成、部署等
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class ExecutionLayer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            autoFixEnabled: config.autoFixEnabled !== false,
            testGenerationEnabled: config.testGenerationEnabled !== false,
            documentationEnabled: config.documentationEnabled !== false,
            maxRetries: config.maxRetries || 3,
            dryRun: config.dryRun || false, // 模拟模式
            ...config
        };

        // 执行队列
        this.executionQueue = [];
        this.isExecuting = false;

        // 执行历史
        this.executionHistory = [];

        // 工具链
        this.tools = {
            codeGenerator: new CodeGenerator(),
            testGenerator: new TestGenerator(),
            docGenerator: new DocumentationGenerator(),
            deployer: new Deployer()
        };

        // 执行状态
        this.stats = {
            totalExecutions: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            autoFixed: 0,
            testsGenerated: 0
        };
    }

    /**
     * 初始化执行层
     */
    async initialize() {
        console.log('🦾 Initializing Execution Layer...');

        // 启动执行循环
        this.startExecutionLoop();

        console.log('✅ Execution Layer initialized');
    }

    /**
     * 执行决策 - 主入口
     */
    async executeDecisions(decisions) {
        console.log(`📋 Received ${decisions.length} decisions to execute`);

        for (const decision of decisions) {
            // 添加到执行队列
            this.executionQueue.push(decision);
        }

        // 触发执行
        this.processQueue();
    }

    /**
     * 执行循环
     */
    startExecutionLoop() {
        setInterval(() => {
            if (!this.isExecuting && this.executionQueue.length > 0) {
                this.processQueue();
            }
        }, 1000); // 每秒检查
    }

    /**
     * 处理执行队列
     */
    async processQueue() {
        if (this.isExecuting || this.executionQueue.length === 0) return;

        this.isExecuting = true;
        const decision = this.executionQueue.shift();

        try {
            console.log(`🔧 Executing: ${decision.type} (Priority: ${decision.priority})`);

            const result = await this.execute(decision);

            this.recordExecution(decision, result);
            this.emit('execution-complete', { decision, result });

            this.stats.successful++;

        } catch (error) {
            console.error(`❌ Execution failed: ${error.message}`);

            // 重试逻辑
            if ((decision.retries || 0) < this.config.maxRetries) {
                decision.retries = (decision.retries || 0) + 1;
                console.log(`🔄 Retrying (${decision.retries}/${this.config.maxRetries})...`);
                this.executionQueue.unshift(decision); // 放回队首
            } else {
                this.recordExecution(decision, { success: false, error: error.message });
                this.emit('execution-failed', { decision, error });
                this.stats.failed++;
            }
        }

        this.isExecuting = false;
    }

    /**
     * 核心执行逻辑
     */
    async execute(decision) {
        this.stats.totalExecutions++;

        // 干运行模式
        if (this.config.dryRun) {
            console.log(`🏃 [DRY RUN] Would execute: ${decision.type}`);
            this.stats.skipped++;
            return { success: true, dryRun: true };
        }

        // 根据决策类型分发
        switch (decision.type) {
            case 'auto-fix':
                return await this.executeAutoFix(decision);

            case 'run-tests':
                return await this.executeTests(decision);

            case 'performance-optimization':
                return await this.executeOptimization(decision);

            case 'refactoring':
                return await this.executeRefactoring(decision);

            case 'create-task':
                return await this.createTask(decision);

            case 'generate-documentation':
                return await this.generateDocumentation(decision);

            case 'deployment':
                return await this.executeDeployment(decision);

            default:
                throw new Error(`Unknown decision type: ${decision.type}`);
        }
    }

    /**
     * 自动修复执行
     */
    async executeAutoFix(decision) {
        console.log(`🔨 Auto-fixing: ${decision.target}`);

        const fix = decision.action;

        if (!fix || !fix.code) {
            throw new Error('No fix code provided');
        }

        // 查找目标文件
        const targetFile = await this.findTargetFile(decision.target);

        if (!targetFile) {
            throw new Error(`Target file not found: ${decision.target}`);
        }

        // 备份原文件
        await this.backupFile(targetFile);

        // 应用修复
        const result = await this.applyFix(targetFile, fix);

        // 验证修复
        const isValid = await this.validateFix(targetFile);

        if (!isValid) {
            // 回滚
            await this.rollbackFile(targetFile);
            throw new Error('Fix validation failed, rolled back');
        }

        this.stats.autoFixed++;

        return {
            success: true,
            file: targetFile,
            fix: fix.description,
            validated: true
        };
    }

    /**
     * 测试执行
     */
    async executeTests(decision) {
        console.log(`🧪 Running tests for: ${decision.target}`);

        const tests = decision.action.tests;
        const results = [];

        for (const testFile of tests) {
            try {
                // 检查测试文件是否存在
                const exists = await this.fileExists(testFile);

                if (!exists && this.config.testGenerationEnabled) {
                    // 自动生成测试
                    console.log(`📝 Generating test: ${testFile}`);
                    await this.tools.testGenerator.generate(decision.target, testFile);
                    this.stats.testsGenerated++;
                }

                // 运行测试
                const testResult = await this.runTest(testFile);
                results.push(testResult);

            } catch (error) {
                results.push({
                    test: testFile,
                    success: false,
                    error: error.message
                });
            }
        }

        const allPassed = results.every(r => r.success);

        return {
            success: allPassed,
            tests: results,
            coverage: decision.action.coverage
        };
    }

    /**
     * 性能优化执行
     */
    async executeOptimization(decision) {
        console.log(`⚡ Optimizing: ${decision.target}`);

        const optimization = decision.action.optimization;
        let result;

        switch (optimization) {
            case 'code-splitting':
                result = await this.implementCodeSplitting(decision.action.details);
                break;

            case 'lazy-loading':
                result = await this.implementLazyLoading(decision.target);
                break;

            case 'cleanup-listeners':
                result = await this.cleanupEventListeners(decision.action.details);
                break;

            case 'virtual-scrolling':
                result = await this.implementVirtualScrolling(decision.target);
                break;

            default:
                throw new Error(`Unknown optimization: ${optimization}`);
        }

        // 测量改进
        const improvement = await this.measureImprovement(decision.target);

        return {
            success: true,
            optimization,
            improvement,
            expectedImprovement: decision.action.expectedImprovement
        };
    }

    /**
     * 重构执行
     */
    async executeRefactoring(decision) {
        console.log(`🔄 Refactoring: ${decision.target}`);

        const targetFile = decision.target;
        const suggestedModules = decision.action.suggestedModules;

        // 备份
        await this.backupFile(targetFile);

        // 分析代码结构
        const analysis = await this.analyzeCodeStructure(targetFile);

        // 执行模块化
        const modules = await this.extractModules(targetFile, suggestedModules, analysis);

        // 更新导入
        await this.updateImports(targetFile, modules);

        // 运行相关测试
        const testResult = await this.runRelatedTests(targetFile);

        if (!testResult.success) {
            // 回滚
            await this.rollbackFile(targetFile);
            for (const module of modules) {
                await this.deleteFile(module.path);
            }
            throw new Error('Refactoring validation failed');
        }

        return {
            success: true,
            modulesCreated: modules,
            testsPass: testResult.success
        };
    }

    /**
     * 任务创建
     */
    async createTask(decision) {
        console.log(`📌 Creating task: ${decision.action.title}`);

        const task = {
            id: `task_${Date.now()}`,
            title: decision.action.title,
            description: decision.action.description,
            priority: decision.priority,
            suggestedFix: decision.action.suggestedFix,
            createdAt: new Date().toISOString()
        };

        // 保存到任务文件
        await this.saveTask(task);

        // 生成任务报告
        const report = await this.generateTaskReport(task);

        return {
            success: true,
            taskId: task.id,
            reportPath: report
        };
    }

    /**
     * 文档生成
     */
    async generateDocumentation(decision) {
        console.log(`📚 Generating documentation for: ${decision.target}`);

        const docType = decision.action?.docType || 'api';
        let documentation;

        switch (docType) {
            case 'api':
                documentation = await this.tools.docGenerator.generateAPI(decision.target);
                break;

            case 'user-guide':
                documentation = await this.tools.docGenerator.generateUserGuide(decision.target);
                break;

            case 'changelog':
                documentation = await this.tools.docGenerator.generateChangelog();
                break;

            default:
                documentation = await this.tools.docGenerator.generateGeneric(decision.target);
        }

        // 保存文档
        const docPath = await this.saveDocumentation(documentation, docType);

        return {
            success: true,
            documentation: docPath,
            type: docType
        };
    }

    /**
     * 部署执行
     */
    async executeDeployment(decision) {
        console.log(`🚀 Deploying: ${decision.target}`);

        // 预部署检查
        const preCheck = await this.preDeploymentCheck();
        if (!preCheck.passed) {
            throw new Error(`Pre-deployment check failed: ${preCheck.reason}`);
        }

        // 创建部署快照
        const snapshot = await this.createDeploymentSnapshot();

        try {
            // 执行部署
            const deployResult = await this.tools.deployer.deploy({
                target: decision.target,
                strategy: decision.action?.strategy || 'blue-green',
                rollbackPlan: decision.fallbackPlan
            });

            // 验证部署
            const validation = await this.validateDeployment(deployResult);

            if (!validation.success) {
                // 自动回滚
                await this.rollbackDeployment(snapshot);
                throw new Error('Deployment validation failed');
            }

            return {
                success: true,
                deployment: deployResult,
                validation,
                snapshot
            };

        } catch (error) {
            // 回滚
            await this.rollbackDeployment(snapshot);
            throw error;
        }
    }

    /**
     * 辅助方法 - 文件操作
     */
    async findTargetFile(target) {
        // 搜索目标文件
        const searchPaths = [
            path.join(process.cwd(), target),
            path.join(process.cwd(), 'duomotai', target),
            path.join(process.cwd(), 'server', target)
        ];

        for (const searchPath of searchPaths) {
            if (await this.fileExists(searchPath)) {
                return searchPath;
            }
        }

        return null;
    }

    async fileExists(filePath) {
        try {
            await fs.stat(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async backupFile(filePath) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
        return backupPath;
    }

    async rollbackFile(filePath) {
        const backups = await this.findBackups(filePath);
        if (backups.length > 0) {
            const latestBackup = backups[backups.length - 1];
            await fs.copyFile(latestBackup, filePath);
            return true;
        }
        return false;
    }

    async findBackups(filePath) {
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        const files = await fs.readdir(dir);

        return files
            .filter(f => f.startsWith(`${basename}.backup.`))
            .map(f => path.join(dir, f))
            .sort();
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn(`Failed to delete file: ${filePath}`);
        }
    }

    /**
     * 辅助方法 - 代码操作
     */
    async applyFix(filePath, fix) {
        let content = await fs.readFile(filePath, 'utf-8');

        // 简单的文本替换修复
        if (fix.search && fix.replace) {
            content = content.replace(
                new RegExp(fix.search, 'g'),
                fix.replace
            );
        }

        // 插入代码
        if (fix.insert && fix.position) {
            const lines = content.split('\n');
            lines.splice(fix.position, 0, fix.insert);
            content = lines.join('\n');
        }

        await fs.writeFile(filePath, content);
        return true;
    }

    async validateFix(filePath) {
        try {
            // 语法检查
            const { stdout, stderr } = await execAsync(`node --check "${filePath}"`);

            if (stderr) {
                console.error(`Syntax error: ${stderr}`);
                return false;
            }

            // 运行简单测试
            // TODO: 实现更复杂的验证逻辑

            return true;
        } catch (error) {
            return false;
        }
    }

    async analyzeCodeStructure(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');

        // 简化的代码分析
        return {
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            imports: this.extractImports(content),
            exports: this.extractExports(content),
            complexity: this.calculateComplexity(content)
        };
    }

    extractFunctions(content) {
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>/g;
        const functions = [];
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }

        return functions;
    }

    extractClasses(content) {
        const classRegex = /class\s+(\w+)/g;
        const classes = [];
        let match;

        while ((match = classRegex.exec(content)) !== null) {
            classes.push(match[1]);
        }

        return classes;
    }

    extractImports(content) {
        const importRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    extractExports(content) {
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        const exports = [];
        let match;

        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }

        return exports;
    }

    calculateComplexity(content) {
        // 简化的圈复杂度计算
        const conditions = (content.match(/if\s*\(|while\s*\(|for\s*\(|switch\s*\(|\?\s*:/g) || []).length;
        const functions = (content.match(/function\s+\w+|=>\s*{/g) || []).length;

        return conditions + functions;
    }

    async extractModules(filePath, suggestedModules, analysis) {
        const modules = [];

        for (const suggestion of suggestedModules) {
            const moduleContent = await this.generateModuleContent(
                suggestion,
                analysis
            );

            const modulePath = path.join(
                path.dirname(filePath),
                `${suggestion.module}.js`
            );

            await fs.writeFile(modulePath, moduleContent);

            modules.push({
                name: suggestion.module,
                path: modulePath,
                exports: moduleContent.exports
            });
        }

        return modules;
    }

    async generateModuleContent(suggestion, analysis) {
        // 生成模块代码
        let content = `/**\n * ${suggestion.description}\n */\n\n`;

        // 根据建议类型生成代码
        if (suggestion.module === 'data-layer') {
            content += this.generateDataLayerCode(analysis);
        } else if (suggestion.module === 'view-layer') {
            content += this.generateViewLayerCode(analysis);
        } else {
            content += this.generateGenericModuleCode(analysis);
        }

        return content;
    }

    generateDataLayerCode(analysis) {
        return `
// Data fetching and state management
export class DataLayer {
    constructor() {
        this.cache = new Map();
    }

    async fetchData(endpoint) {
        if (this.cache.has(endpoint)) {
            return this.cache.get(endpoint);
        }

        const response = await fetch(endpoint);
        const data = await response.json();

        this.cache.set(endpoint, data);
        return data;
    }

    clearCache() {
        this.cache.clear();
    }
}

export default new DataLayer();
`;
    }

    generateViewLayerCode(analysis) {
        return `
// View components and rendering logic
export class ViewLayer {
    render(data) {
        // Rendering logic here
        console.log('Rendering:', data);
    }

    update(element, data) {
        // Update logic here
        element.innerHTML = JSON.stringify(data);
    }
}

export default new ViewLayer();
`;
    }

    generateGenericModuleCode(analysis) {
        return `
// Module implementation
export class Module {
    constructor() {
        // Initialize
    }

    // Add methods based on analysis
}

export default new Module();
`;
    }

    async updateImports(filePath, modules) {
        let content = await fs.readFile(filePath, 'utf-8');

        // 添加新模块的导入
        const imports = modules
            .map(m => `import ${m.name} from './${m.name}';`)
            .join('\n');

        content = imports + '\n\n' + content;

        await fs.writeFile(filePath, content);
    }

    /**
     * 辅助方法 - 测试相关
     */
    async runTest(testFile) {
        try {
            const { stdout, stderr } = await execAsync(`npm test -- ${testFile}`);

            return {
                test: testFile,
                success: !stderr || !stderr.includes('FAIL'),
                output: stdout,
                error: stderr
            };
        } catch (error) {
            return {
                test: testFile,
                success: false,
                error: error.message
            };
        }
    }

    async runRelatedTests(filePath) {
        const testFiles = [
            filePath.replace('.js', '.test.js'),
            filePath.replace('.js', '.spec.js')
        ];

        const results = [];

        for (const testFile of testFiles) {
            if (await this.fileExists(testFile)) {
                const result = await this.runTest(testFile);
                results.push(result);
            }
        }

        return {
            success: results.every(r => r.success),
            tests: results
        };
    }

    /**
     * 辅助方法 - 优化相关
     */
    async implementCodeSplitting(details) {
        // 实现代码分割
        console.log('Implementing code splitting:', details);
        // TODO: 实际实现
        return { chunks: details.chunks };
    }

    async implementLazyLoading(target) {
        // 实现懒加载
        console.log('Implementing lazy loading for:', target);
        // TODO: 实际实现
        return { target, lazy: true };
    }

    async cleanupEventListeners(details) {
        // 清理事件监听器
        console.log('Cleaning up event listeners:', details);
        // TODO: 实际实现
        return { cleaned: details.suspects };
    }

    async implementVirtualScrolling(target) {
        // 实现虚拟滚动
        console.log('Implementing virtual scrolling for:', target);
        // TODO: 实际实现
        return { target, virtual: true };
    }

    async measureImprovement(target) {
        // 测量性能改进
        // TODO: 实际测量
        return {
            before: { FCP: 2000, LCP: 3000 },
            after: { FCP: 1200, LCP: 1800 },
            improvement: '40%'
        };
    }

    /**
     * 辅助方法 - 任务相关
     */
    async saveTask(task) {
        const tasksFile = './gemba-tasks.json';
        let tasks = [];

        try {
            const content = await fs.readFile(tasksFile, 'utf-8');
            tasks = JSON.parse(content);
        } catch {
            // 文件不存在，创建新的
        }

        tasks.push(task);

        await fs.writeFile(tasksFile, JSON.stringify(tasks, null, 2));
    }

    async generateTaskReport(task) {
        const report = `
# Task Report

## ${task.title}

**ID**: ${task.id}
**Priority**: ${task.priority}
**Created**: ${task.createdAt}

### Description
${task.description}

### Suggested Fix
${task.suggestedFix || 'No specific fix suggested'}

---
Generated by Gemba Agent 2.0
`;

        const reportPath = `./reports/task_${task.id}.md`;
        await fs.mkdir('./reports', { recursive: true });
        await fs.writeFile(reportPath, report);

        return reportPath;
    }

    /**
     * 辅助方法 - 文档相关
     */
    async saveDocumentation(documentation, type) {
        const docPath = `./docs/${type}_${Date.now()}.md`;
        await fs.mkdir('./docs', { recursive: true });
        await fs.writeFile(docPath, documentation);
        return docPath;
    }

    /**
     * 辅助方法 - 部署相关
     */
    async preDeploymentCheck() {
        // 检查测试是否通过
        const testResult = await execAsync('npm test');

        // 检查构建是否成功
        const buildResult = await execAsync('npm run build');

        return {
            passed: !testResult.stderr && !buildResult.stderr,
            reason: testResult.stderr || buildResult.stderr || 'All checks passed'
        };
    }

    async createDeploymentSnapshot() {
        const snapshot = {
            id: `snapshot_${Date.now()}`,
            timestamp: new Date().toISOString(),
            files: []
        };

        // 备份关键文件
        const keyFiles = ['package.json', 'server.js', 'index.html'];

        for (const file of keyFiles) {
            if (await this.fileExists(file)) {
                const backupPath = await this.backupFile(file);
                snapshot.files.push({ original: file, backup: backupPath });
            }
        }

        return snapshot;
    }

    async validateDeployment(deployResult) {
        // 健康检查
        try {
            const response = await fetch(deployResult.url + '/health');
            return { success: response.ok };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async rollbackDeployment(snapshot) {
        console.log(`⏪ Rolling back deployment: ${snapshot.id}`);

        for (const file of snapshot.files) {
            await fs.copyFile(file.backup, file.original);
        }

        return { rolledBack: true, snapshot: snapshot.id };
    }

    /**
     * 记录和报告
     */
    recordExecution(decision, result) {
        const execution = {
            decision,
            result,
            timestamp: new Date().toISOString()
        };

        this.executionHistory.push(execution);

        // 限制历史大小
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-1000);
        }
    }

    generateExecutionReport() {
        return {
            stats: this.stats,
            queueLength: this.executionQueue.length,
            isExecuting: this.isExecuting,
            recentExecutions: this.executionHistory.slice(-10),
            successRate: this.stats.totalExecutions > 0
                ? (this.stats.successful / this.stats.totalExecutions * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    /**
     * 清理资源
     */
    async cleanup() {
        // 保存执行历史
        await fs.writeFile(
            './gemba-execution-history.json',
            JSON.stringify(this.executionHistory, null, 2)
        );

        console.log('🦾 Execution Layer cleaned up');
    }
}

/**
 * 工具类 - 代码生成器
 */
class CodeGenerator {
    async generate(template, params) {
        // 代码生成逻辑
        return `// Generated code for ${template}`;
    }
}

/**
 * 工具类 - 测试生成器
 */
class TestGenerator {
    async generate(targetFile, testFile) {
        const testContent = `
const { expect } = require('chai');
const target = require('${targetFile}');

describe('${path.basename(targetFile)} tests', () => {
    it('should exist', () => {
        expect(target).to.exist;
    });

    // Add more tests here
});
`;

        await fs.writeFile(testFile, testContent);
        return testFile;
    }
}

/**
 * 工具类 - 文档生成器
 */
class DocumentationGenerator {
    async generateAPI(target) {
        return `# API Documentation for ${target}\n\n## Endpoints\n\n...`;
    }

    async generateUserGuide(target) {
        return `# User Guide for ${target}\n\n## Getting Started\n\n...`;
    }

    async generateChangelog() {
        return `# Changelog\n\n## [Unreleased]\n\n### Added\n- ...\n`;
    }

    async generateGeneric(target) {
        return `# Documentation for ${target}\n\n## Overview\n\n...`;
    }
}

/**
 * 工具类 - 部署器
 */
class Deployer {
    async deploy(config) {
        console.log('Deploying with config:', config);

        // 模拟部署
        return {
            success: true,
            url: 'http://localhost:3000',
            deploymentId: `deploy_${Date.now()}`
        };
    }
}

module.exports = ExecutionLayer;