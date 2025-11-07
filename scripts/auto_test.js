/**
 * 多魔汰系统自动化测试脚本
 * 测试范围：API健康检查、后端服务、前端页面可访问性
 * 无需浏览器，基于 HTTP 请求
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    frontend: {
        host: 'localhost',
        port: 8080,
        protocol: 'http'
    },
    backend: {
        host: 'localhost',
        port: 3000,
        protocol: 'http'
    },
    testUser: {
        phone: '13917895758',  // 测试账号
        verifyCode: '888888'     // 固定验证码
    },
    timeout: 10000  // 10秒超时
};

// 测试结果收集
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
    startTime: null,
    endTime: null
};

// 颜色输出（Windows 兼容）
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求工具
function httpRequest(options) {
    return new Promise((resolve, reject) => {
        const client = options.protocol === 'https' ? https : http;

        // 移除 protocol 字段，因为 http.request() 不支持该字段
        const requestOptions = { ...options };
        delete requestOptions.protocol;

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(options.timeout || CONFIG.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.data) {
            req.write(JSON.stringify(options.data));
        }
        req.end();
    });
}

// 测试用例基类
class TestCase {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.result = null;
        this.error = null;
        this.duration = 0;
    }

    async run() {
        testResults.total++;
        const startTime = Date.now();

        try {
            log(`\n▶️  运行测试: ${this.name}`, 'blue');
            log(`   ${this.description}`, 'gray');

            await this.execute();

            this.duration = Date.now() - startTime;
            this.result = 'passed';
            testResults.passed++;
            log(`✅ 通过 (${this.duration}ms)`, 'green');

        } catch (error) {
            this.duration = Date.now() - startTime;
            this.result = 'failed';
            this.error = error.message;
            testResults.failed++;
            log(`❌ 失败: ${error.message} (${this.duration}ms)`, 'red');
        }

        testResults.tests.push({
            name: this.name,
            description: this.description,
            result: this.result,
            error: this.error,
            duration: this.duration
        });
    }

    async execute() {
        throw new Error('execute() must be implemented');
    }
}

// 测试用例 1: 前端服务健康检查
class FrontendHealthTest extends TestCase {
    constructor() {
        super('前端服务健康检查', '检查前端服务器是否正常运行');
    }

    async execute() {
        const response = await httpRequest({
            protocol: CONFIG.frontend.protocol,
            hostname: CONFIG.frontend.host,
            port: CONFIG.frontend.port,
            path: '/',
            method: 'GET',
            timeout: CONFIG.timeout
        });

        if (response.statusCode !== 200) {
            throw new Error(`前端服务返回状态码 ${response.statusCode}`);
        }

        if (!response.data.includes('RRXS.XYZ') && !response.data.includes('html')) {
            throw new Error('前端页面内容异常');
        }
    }
}

// 测试用例 2: 后端API健康检查
class BackendHealthTest extends TestCase {
    constructor() {
        super('后端API健康检查', '检查后端API服务器是否正常运行');
    }

    async execute() {
        const response = await httpRequest({
            protocol: CONFIG.backend.protocol,
            hostname: CONFIG.backend.host,
            port: CONFIG.backend.port,
            path: '/health',
            method: 'GET',
            timeout: CONFIG.timeout
        });

        if (response.statusCode !== 200) {
            throw new Error(`后端API返回状态码 ${response.statusCode}`);
        }

        const data = JSON.parse(response.data);
        if (data.status !== 'ok') {
            throw new Error('后端健康检查失败');
        }
    }
}

// 测试用例 3: 多魔汰页面可访问性
class DuomotaiPageTest extends TestCase {
    constructor() {
        super('多魔汰页面可访问性', '检查多魔汰系统页面是否可访问');
    }

    async execute() {
        const response = await httpRequest({
            protocol: CONFIG.frontend.protocol,
            hostname: CONFIG.frontend.host,
            port: CONFIG.frontend.port,
            path: '/duomotai/',
            method: 'GET',
            timeout: CONFIG.timeout
        });

        if (response.statusCode !== 200) {
            throw new Error(`多魔汰页面返回状态码 ${response.statusCode}`);
        }

        // 检查关键元素
        const requiredElements = ['多魔汰', 'duomotai', 'login', 'debate'];
        const hasRequiredElements = requiredElements.some(element =>
            response.data.toLowerCase().includes(element.toLowerCase())
        );

        if (!hasRequiredElements) {
            throw new Error('多魔汰页面内容异常，缺少关键元素');
        }
    }
}

// 测试用例 4: 后端验证码发送API
class SendVerifyCodeTest extends TestCase {
    constructor() {
        super('发送验证码API测试', '测试验证码发送功能');
    }

    async execute() {
        const response = await httpRequest({
            protocol: CONFIG.backend.protocol,
            hostname: CONFIG.backend.host,
            port: CONFIG.backend.port,
            path: '/api/auth/send-code',  // ✅ [FIX] 修复API路径：/api/send-verify-code → /api/auth/send-code
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                phone: CONFIG.testUser.phone
            },
            timeout: CONFIG.timeout
        });

        if (response.statusCode !== 200 && response.statusCode !== 201) {
            throw new Error(`发送验证码API返回状态码 ${response.statusCode}`);
        }

        const data = JSON.parse(response.data);
        if (!data.success && !data.message) {
            throw new Error('发送验证码API响应格式异常');
        }
    }
}

// 生成测试报告
function generateReport() {
    testResults.endTime = new Date();
    const duration = testResults.endTime - testResults.startTime;

    log('\n' + '='.repeat(80), 'blue');
    log('📊 测试报告', 'blue');
    log('='.repeat(80), 'blue');

    log(`\n总计: ${testResults.total} 个测试`, 'blue');
    log(`✅ 通过: ${testResults.passed} 个`, 'green');
    log(`❌ 失败: ${testResults.failed} 个`, testResults.failed > 0 ? 'red' : 'gray');
    log(`⏭️  跳过: ${testResults.skipped} 个`, 'gray');
    log(`⏱️  总耗时: ${duration}ms\n`);

    // 详细结果
    if (testResults.tests.length > 0) {
        log('详细结果:', 'blue');
        testResults.tests.forEach((test, index) => {
            const icon = test.result === 'passed' ? '✅' : '❌';
            const color = test.result === 'passed' ? 'green' : 'red';
            log(`  ${icon} [${index + 1}] ${test.name} (${test.duration}ms)`, color);
            if (test.error) {
                log(`      错误: ${test.error}`, 'red');
            }
        });
    }

    // 保存到文件
    const reportPath = path.join(__dirname, '..', 'test_reports', `auto_test_${Date.now()}.json`);
    try {
        fs.writeFileSync(reportPath, JSON.stringify({
            ...testResults,
            timestamp: new Date().toISOString(),
            config: CONFIG
        }, null, 2));
        log(`\n📄 测试报告已保存: ${reportPath}`, 'blue');
    } catch (err) {
        log(`\n⚠️  保存测试报告失败: ${err.message}`, 'yellow');
    }

    // 返回退出码
    return testResults.failed > 0 ? 1 : 0;
}

// 主测试流程
async function runTests() {
    log('='.repeat(80), 'blue');
    log('🧪 多魔汰系统自动化测试', 'blue');
    log('='.repeat(80), 'blue');
    log(`开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, 'gray');

    testResults.startTime = new Date();

    // 定义测试套件
    const testSuite = [
        new FrontendHealthTest(),
        new BackendHealthTest(),
        new DuomotaiPageTest(),
        new SendVerifyCodeTest()
    ];

    // 执行所有测试
    for (const test of testSuite) {
        await test.run();
    }

    // 生成报告
    const exitCode = generateReport();

    log('\n' + '='.repeat(80), 'blue');
    log(`结束时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, 'gray');
    log('='.repeat(80), 'blue');

    if (exitCode === 0) {
        log('\n🎉 所有测试通过！', 'green');
    } else {
        log('\n⚠️  部分测试失败，请查看详细报告', 'yellow');
    }

    process.exit(exitCode);
}

// 启动测试
if (require.main === module) {
    runTests().catch(error => {
        log(`\n❌ 测试执行异常: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { runTests, TestCase };
