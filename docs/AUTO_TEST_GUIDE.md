# 多魔汰系统自动化测试使用文档

**创建时间**: 2025-10-16
**版本**: v1.0
**状�?*: �?可用

---

## 📋 概述

本自动化测试系统用于快速验证多魔汰系统的核心功能，无需手动操作浏览器，基于 HTTP 请求自动化测试�?
### 特点

- �?**轻量�?*：无需安装额外依赖（Puppeteer/Playwright�?- �?**快�?*：基�?HTTP 请求，测试速度�?- �?**自动�?*：一键运行，自动生成报告
- �?**跨平�?*：Windows/Mac/Linux 兼容
- �?**易扩�?*：基�?TestCase 类，易于添加新测�?
---

## 🚀 快速开�?
### 1. 启动服务�?
**方法1：使用启动脚本（推荐�?*
```bash
# 双击运行，选择 [3] Full Stack
启动本地服务�?更新�?bat
```

**方法2：手动启�?*
```bash
# 前端服务器（Python，端�?080�?python -m http.server 8080

# 后端服务器（Node.js，端�?000�? 新开一个终�?cd server
npm run dev
```

### 2. 运行测试

```bash
# 方法1：使�?npm script（推荐）
npm test

# 方法2：直接运行脚�?node scripts/auto_test.js
```

### 3. 查看结果

测试完成后会�?- �?在终端显示测试结果（带颜色标记）
- �?生成 JSON 格式测试报告（保存在 `test_reports/` 目录�?
---

## 📊 测试用例

### 当前测试套件（v1.0�?
| 测试名称 | 描述 | 测试内容 |
|---------|------|---------|
| 前端服务健康检�?| 检查前端服务器是否正常运行 | HTTP GET / �?200 OK |
| 后端API健康检�?| 检查后端API服务器是否正常运�?| HTTP GET /health �?{"status":"ok"} |
| 多魔汰页面可访问�?| 检查多魔汰系统页面是否可访�?| HTTP GET /duomotai/ �?包含关键元素 |
| 发送验证码API测试 | 测试验证码发送功�?| HTTP POST /api/send-verify-code |

### 测试账号

- **手机�?*: 13917895758（测试账号）
- **验证�?*: 888888（固定验证码�?
---

## 📝 测试报告

### 终端输出示例

```
================================================================================
🧪 多魔汰系统自动化测试
================================================================================
开始时�? 2025-10-16 15:30:00

▶️  运行测试: 前端服务健康检�?   检查前端服务器是否正常运行
�?通过 (125ms)

▶️  运行测试: 后端API健康检�?   检查后端API服务器是否正常运�?�?通过 (85ms)

...

================================================================================
📊 测试报告
================================================================================

总计: 4 个测�?�?通过: 4 �?�?失败: 0 �?⏭️  跳过: 0 �?⏱️  总耗时: 523ms

详细结果:
  �?[1] 前端服务健康检�?(125ms)
  �?[2] 后端API健康检�?(85ms)
  �?[3] 多魔汰页面可访问�?(215ms)
  �?[4] 发送验证码API测试 (98ms)

📄 测试报告已保�? D:\_100W\rrxsxyz_next\test_reports\auto_test_1697457890123.json

================================================================================
结束时间: 2025-10-16 15:30:05
================================================================================

🎉 所有测试通过�?```

### JSON 报告格式

测试报告保存�?`test_reports/auto_test_<timestamp>.json`，格式如下：

```json
{
  "total": 4,
  "passed": 4,
  "failed": 0,
  "skipped": 0,
  "tests": [
    {
      "name": "前端服务健康检�?,
      "description": "检查前端服务器是否正常运行",
      "result": "passed",
      "error": null,
      "duration": 125
    }
    // ...
  ],
  "startTime": "2025-10-16T07:30:00.000Z",
  "endTime": "2025-10-16T07:30:05.523Z",
  "timestamp": "2025-10-16T07:30:05.523Z",
  "config": {
    // 测试配置
  }
}
```

---

## 🔧 扩展测试

### 添加新测试用�?
1. �?`scripts/auto_test.js` 中创建新的测试类�?
```javascript
class MyNewTest extends TestCase {
    constructor() {
        super('测试名称', '测试描述');
    }

    async execute() {
        // 实现测试逻辑
        const response = await httpRequest({
            protocol: 'http',
            hostname: 'localhost',
            port: 8080,
            path: '/my-page',
            method: 'GET'
        });

        if (response.statusCode !== 200) {
            throw new Error('测试失败');
        }
    }
}
```

2. 将新测试添加到测试套件：

```javascript
const testSuite = [
    new FrontendHealthTest(),
    new BackendHealthTest(),
    new DuomotaiPageTest(),
    new SendVerifyCodeTest(),
    new MyNewTest()  // 添加新测�?];
```

---

## ⚠️ 故障排查

### 常见问题

**Q1: 测试失败，提�?连接被拒�?**

A: 检查服务器是否已启动：
```bash
# 检查前端服�?curl http://localhost:8080/

# 检查后端服�?curl http://localhost:3000/health
```

**Q2: 测试超时**

A: 默认超时时间�?10 秒，可以�?`CONFIG` 中调整：
```javascript
const CONFIG = {
    timeout: 20000  // 修改�?20 �?};
```

**Q3: 测试报告保存失败**

A: 确保 `test_reports/` 目录存在且有写入权限�?
---

## 📚 最佳实�?
### 开发阶�?
- 📅 **每日测试**：每天至少运行一�?`npm test`
- 🔄 **代码变更后测�?*：修改关键代码后立即测试
- 📊 **保存测试报告**：保留历史测试报告用于趋势分�?
### 集成到工作流

```bash
# 开发前：检查环�?npm run monitor
npm test

# 开发中：修改代码后测试
npm test

# 开发后：清理和备份
npm run cleanup
npm run backup
```

---

## 🚧 未来扩展（P2 任务�?
以下功能可在阶段4-5实现�?
- [ ] 浏览器自动化测试（Puppeteer/Playwright�?- [ ] 完整的登录→策划→辩论→报告流程测试
- [ ] 性能测试（响应时间、并发）
- [ ] 集成�?CI/CD 流程
- [ ] 测试覆盖率统�?- [ ] 可视化测试报告（HTML�?
---

## 📞 支持

如有问题，请检查：
1. `scripts/auto_test.js` - 测试脚本源码
2. `test_reports/` - 测试报告目录
3. `progress.md` - 项目进度记录

---

**最后更�?*: 2025-10-16 15:30 (GMT+8)
