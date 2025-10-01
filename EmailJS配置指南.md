# EmailJS 配置指南

EmailJS是一个免费的前端邮件发送服务，无需后端服务器，免费账户每月可发送200封邮件。

## 🚀 快速配置步骤

### 1. 注册EmailJS账户
1. 访问 https://www.emailjs.com/
2. 点击 "Sign Up" 注册免费账户
3. 验证邮箱并登录

### 2. 创建邮件服务 (Email Service)
1. 进入 Dashboard → Email Services
2. 点击 "Add New Service"
3. 选择邮件服务商：
   - **Gmail** (推荐) - 使用你的Gmail账户
   - **Outlook** - 使用Outlook邮箱
   - **Yahoo** - 使用雅虎邮箱
4. 按照提示配置并测试连接
5. 记住生成的 **Service ID**

### 3. 创建邮件模板 (Email Template)
1. 进入 Dashboard → Email Templates
2. 点击 "Create New Template"
3. 配置模板内容：

**模板配置示例：**
```
Subject: {{subject}}
From Name: {{from_name}}
To Name: {{to_name}}
To Email: {{to_email}}
```

**模板内容 (HTML格式)：**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: white; }
        .user-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .report { margin: 20px 0; white-space: pre-wrap; }
        .footer { text-align: center; padding: 15px; background: #f8f9fa; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 百万被动收入之路</h1>
        <h2>专业分析报告</h2>
    </div>

    <div class="content">
        <p>亲爱的 {{to_name}}，</p>

        <p>恭喜您完成了百万被动收入之路的深度自测！您的专业分析报告已生成完毕。</p>

        <div class="user-info">
            <h3>👤 用户信息</h3>
            <p><strong>姓名：</strong>{{user_name}}</p>
            <p><strong>年龄段：</strong>{{user_age}}</p>
            <p><strong>性别：</strong>{{user_gender}}</p>
            <p><strong>手机号：</strong>{{user_phone}}</p>
            <p><strong>生成时间：</strong>{{report_time}}</p>
        </div>

        <div class="report">
            <h3>📊 详细分析报告</h3>
            {{report_content}}
        </div>

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>💡 温馨提示</h4>
            <ul>
                <li>本报告基于您的答题情况生成，建议结合实际情况执行</li>
                <li>如有疑问，请关注我们的公众号获取更多资讯</li>
                <li>祝您早日实现财务自由的目标！</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>此邮件由 <strong>{{from_name}}</strong> 自动发送</p>
        <p>© 2024 RRXS.xyz - 专注自媒体商业化咨询</p>
    </div>
</body>
</html>
```

4. 保存模板，记住生成的 **Template ID**

### 4. 获取Public Key
1. 进入 Account → General
2. 找到 "Public Key"
3. 复制 **Public Key**

### 5. 配置HTML文件
在 `media-assessment-v4.html` 中找到EmailJS配置部分，取消注释并填入你的配置：

```javascript
// 取消注释并填入你的配置信息
emailjs.init('YOUR_PUBLIC_KEY'); // 填入步骤4的Public Key

window.EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID',     // 填入步骤2的Service ID
    templateId: 'YOUR_TEMPLATE_ID',   // 填入步骤3的Template ID
    publicKey: 'YOUR_PUBLIC_KEY'      // 填入步骤4的Public Key
};
```

## 📧 配置示例

假设你的配置信息如下：
- Service ID: `service_abc123`
- Template ID: `template_xyz789`
- Public Key: `user_def456`

则配置应该是：
```javascript
emailjs.init('user_def456');

window.EMAILJS_CONFIG = {
    serviceId: 'service_abc123',
    templateId: 'template_xyz789',
    publicKey: 'user_def456'
};
```

## 🧪 测试配置

配置完成后：
1. 上传HTML文件到服务器
2. 打开网页，完成一次测试
3. 查看浏览器控制台，确认配置状态
4. 检查收件箱是否收到邮件

## 🔍 故障排除

### 常见问题：

1. **邮件没收到**
   - 检查垃圾邮件文件夹
   - 确认邮件服务配置正确
   - 查看EmailJS dashboard的发送日志

2. **配置无效**
   - 检查Service ID、Template ID、Public Key是否正确
   - 确认模板中的变量名与代码中一致
   - 查看浏览器控制台错误信息

3. **发送限制**
   - 免费账户每月200封限制
   - 可升级付费计划获得更多额度

## 💰 免费额度说明

EmailJS免费计划包括：
- ✅ 每月200封邮件
- ✅ 2个邮件服务
- ✅ 10个邮件模板
- ✅ 基础统计

对于中小型项目完全够用！

## 🔄 备用方案

如果不配置EmailJS，系统会自动使用备用方案：
1. 邮件内容会复制到剪贴板
2. 弹出提示要求手动发送
3. 提供报告文件下载功能

这样确保用户无论如何都能获得分析报告！