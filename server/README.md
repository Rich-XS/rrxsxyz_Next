# 后端服务器部署和使用指南

## 📋 目录结构
```
server/
├── package.json           # 项目依赖
├── server.js             # 主服务器文件
├── .env.example          # 环境变量模板
├── .env                  # 实际环境变量（需要创建）
├── services/
│   ├── aiService.js      # AI模型调用服务
│   └── emailService.js   # 邮件发送服务
└── README.md            # 本文件
```

## 🚀 快速开始

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入真实的配置信息
```

### 3. 配置邮件服务（推荐免费方案）

#### 方案一：QQ邮箱（推荐，免费）
1. 登录QQ邮箱，进入设置 -> 账户
2. 开启IMAP/SMTP服务
3. 生成授权码（不是QQ密码）
4. 在.env中配置：
```env
EMAIL_SERVICE=qq
EMAIL_USER=your_qq_email@qq.com
EMAIL_PASS=your_authorization_code
```

#### 方案二：163邮箱（免费替代）
1. 登录163邮箱，进入设置
2. 开启IMAP/SMTP服务
3. 设置客户端授权密码
4. 在.env中配置：
```env
EMAIL_SERVICE=163
EMAIL_USER=your_163_email@163.com
EMAIL_PASS=your_client_password
```

#### 方案三：SendGrid（付费但稳定）
1. 注册SendGrid账户
2. 创建API Key
3. 验证发件人邮箱
4. 在.env中配置：
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

### 4. 配置AI服务密钥
在.env中填入您的API密钥：
```env
QWEN_API_KEY=your_qwen_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 5. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 📡 API接口文档

### 健康检查
```http
GET /health
```

### AI分析接口
```http
POST /api/ai/analyze
Content-Type: application/json

{
  "prompt": "分析提示词",
  "userInfo": {
    "name": "用户名",
    "age": "年龄段",
    "gender": "性别"
  },
  "model": "qwen" // 可选：qwen, deepseek, openai
}
```

### 邮件发送接口
```http
POST /api/email/send-report
Content-Type: application/json

{
  "to": "user@example.com",
  "userName": "用户名",
  "reportContent": "报告内容",
  "userInfo": {
    "name": "用户名",
    "age": "年龄段",
    "gender": "性别"
  }
}
```

### 一键处理接口（推荐）
```http
POST /api/process-assessment
Content-Type: application/json

{
  "userInfo": {
    "name": "用户名",
    "age": "年龄段",
    "gender": "性别",
    "phone": "手机号",
    "email": "邮箱地址"
  },
  "answers": {
    "0": "第1题答案",
    "1": "第2题答案",
    // ... 更多答案
  },
  "email": "user@example.com",
  "model": "qwen"
}
```

## 🔧 前端集成

### 替换原有的AI调用
将前端的直接API调用替换为：
```javascript
async function callAIAnalysis() {
    const response = await fetch('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: buildAnalysisPrompt(),
            userInfo: currentUser,
            model: 'qwen'
        })
    });

    const data = await response.json();
    if (data.success) {
        return data.data.analysis;
    } else {
        throw new Error(data.message);
    }
}
```

### 替换邮件发送
```javascript
async function sendReportByEmail() {
    const analysisResult = localStorage.getItem(`analysis_${currentUser.phone}`);

    const response = await fetch('http://localhost:3000/api/email/send-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: currentUser.email,
            userName: currentUser.name,
            reportContent: analysisResult,
            userInfo: currentUser
        })
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message);
    }

    return data.data;
}
```

### 使用一键处理接口（推荐）
```javascript
async function processAssessmentComplete() {
    const response = await fetch('http://localhost:3000/api/process-assessment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userInfo: currentUser,
            answers: answers,
            email: currentUser.email,
            model: 'qwen'
        })
    });

    const data = await response.json();
    if (data.success) {
        console.log('处理成功:', data.data);
        return data.data;
    } else {
        throw new Error(data.message);
    }
}
```

## 🛡️ 安全特性

- CORS跨域保护
- 请求速率限制
- 输入验证和清理
- Helmet安全头设置
- 错误信息脱敏

## 🔄 容错机制

- AI模型自动降级（DeepSeek → Qwen → GLM → Gemini-Balance → 备用报告）
- 邮件发送重试机制
- 详细的错误日志记录

## 📊 监控和日志

服务器会输出详细的运行日志：
- API请求记录
- AI模型调用状态
- 邮件发送结果
- 错误详情

## 🚀 生产部署建议

1. 使用PM2或Docker进行进程管理
2. 配置Nginx反向代理
3. 启用HTTPS
4. 设置环境变量而非硬编码密钥
5. 定期备份用户数据
6. 监控服务器性能和API调用次数

## ❓ 常见问题

### Q: 邮件发送失败怎么办？
A: 检查邮箱服务配置，确保使用授权码而非密码，检查防火墙设置。

### Q: AI分析失败怎么办？
A: 服务有自动降级机制，会尝试其他模型，最终提供备用报告。

### Q: 如何测试邮件服务？
A: 访问 `POST /api/email/test` 接口进行邮件服务测试。

### Q: 可以同时使用多个AI模型吗？
A: 是的，服务支持DeepSeek、Qwen、GLM、Gemini-Balance多个模型，有自动容错机制。