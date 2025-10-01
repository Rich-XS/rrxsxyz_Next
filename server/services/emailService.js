const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // 初始化邮件传输器
  async initializeTransporter() {
    const service = process.env.EMAIL_SERVICE;

    if (!service) {
      console.warn('⚠️ Email service not configured');
      return;
    }

    try {
      if (service.toLowerCase() === 'sendgrid') {
        // SendGrid配置（付费但稳定）
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else {
        // 使用其他邮件服务（QQ、163等免费方案）
        this.transporter = nodemailer.createTransporter({
          service: service,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // 这里是授权码，不是密码
          }
        });
      }

      // 验证配置
      await this.transporter.verify();
      console.log(`✅ Email service (${service}) configured successfully`);

    } catch (error) {
      console.error('❌ Email service configuration failed:', error.message);
      this.transporter = null;
    }
  }

  // 发送分析报告邮件
  async sendReport({ to, userName, reportContent, userInfo }) {
    if (!this.transporter) {
      throw new Error('Email service not configured or failed to initialize');
    }

    const currentTime = new Date().toLocaleString('zh-CN');

    // 创建HTML格式的邮件内容
    const htmlContent = this.generateEmailHTML(userName, reportContent, userInfo, currentTime);

    // 创建纯文本格式（备用）
    const textContent = this.generateEmailText(userName, reportContent, userInfo, currentTime);

    const mailOptions = {
      from: this.getFromEmail(),
      to: to,
      subject: `🎯 ${userName}的百万被动收入之路分析报告 - ${currentTime}`,
      text: textContent,
      html: htmlContent,
      attachments: this.generateAttachments(userName, reportContent)
    };

    try {
      console.log(`📧 Sending report email to: ${to}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully, Message ID: ${result.messageId}`);

      return {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // 获取发件人邮箱
  getFromEmail() {
    if (process.env.EMAIL_SERVICE?.toLowerCase() === 'sendgrid') {
      return process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
    }
    return process.env.EMAIL_USER || 'noreply@example.com';
  }

  // 生成HTML邮件内容
  generateEmailHTML(userName, reportContent, userInfo, currentTime) {
    // 将Markdown转换为HTML（简单版本）
    const htmlReport = this.markdownToHTML(reportContent);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userName}的分析报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .user-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .user-info h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .report-content {
            margin: 30px 0;
        }
        .report-content h1,
        .report-content h2,
        .report-content h3 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .report-content h1 {
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .report-content h2 {
            color: #667eea;
        }
        .report-content ul,
        .report-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        .report-content li {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .qr-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
        }
        .important-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .header {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 百万被动收入之路</h1>
            <p>专业自媒体商业化分析报告</p>
        </div>

        <div class="user-info">
            <h3>👤 用户信息</h3>
            <p><strong>姓名：</strong>${userName}</p>
            <p><strong>年龄段：</strong>${userInfo?.age || '未提供'}</p>
            <p><strong>性别：</strong>${userInfo?.gender || '未提供'}</p>
            <p><strong>生成时间：</strong>${currentTime}</p>
        </div>

        <div class="important-note">
            <h4>📧 重要提醒</h4>
            <p><strong>本邮件为您的专属分析报告，请妥善保存。</strong></p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>报告基于您的真实答题情况生成</li>
                <li>建议结合实际情况灵活调整执行</li>
                <li>如有疑问可关注公众号咨询</li>
            </ul>
        </div>

        <div class="report-content">
            ${htmlReport}
        </div>

        <div class="qr-section">
            <h4>📱 关注我们获取更多资源</h4>
            <p>扫码关注公众号，获取最新自媒体运营技巧</p>
            <p style="color: #666; font-size: 12px;">
                回复"百万之路"获取更多资料和一对一咨询机会
            </p>
        </div>

        <div class="footer">
            <p>本报告由 AI财经学长专业团队 提供技术支持</p>
            <p>© 2024 RRXS.xyz - 专注自媒体商业化咨询</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                如果您认为此邮件对您有帮助，欢迎分享给有需要的朋友
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // 生成纯文本邮件内容
  generateEmailText(userName, reportContent, userInfo, currentTime) {
    return `
🎯 ${userName}的百万被动收入之路分析报告

👤 用户信息：
姓名：${userName}
年龄段：${userInfo?.age || '未提供'}
性别：${userInfo?.gender || '未提供'}
生成时间：${currentTime}

📧 重要提醒：
本邮件为您的专属分析报告，请妥善保存。

========================================

${reportContent}

========================================

📱 关注我们获取更多资源
扫码关注公众号，获取最新自媒体运营技巧
回复"百万之路"获取更多资料和一对一咨询机会

本报告由 AI财经学长专业团队 提供技术支持
© 2024 RRXS.xyz - 专注自媒体商业化咨询

如果您认为此邮件对您有帮助，欢迎分享给有需要的朋友`;
  }

  // 简单的Markdown转HTML转换
  markdownToHTML(markdown) {
    if (!markdown) return '';

    return markdown
      // 标题转换
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')

      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      // 列表项
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')

      // 段落
      .split('\n\n')
      .map(paragraph => {
        // 如果不是HTML标签开头，包装成段落
        if (!paragraph.trim().startsWith('<') && paragraph.trim()) {
          // 处理列表
          if (paragraph.includes('<li>')) {
            return `<ul>\n${paragraph}\n</ul>`;
          }
          return `<p>${paragraph}</p>`;
        }
        return paragraph;
      })
      .join('\n\n')

      // 换行
      .replace(/\n/g, '<br>');
  }

  // 生成邮件附件（可选）
  generateAttachments(userName, reportContent) {
    // 可以在这里添加PDF生成逻辑
    // 或者添加其他相关资料
    return [];
  }

  // 发送测试邮件
  async sendTestEmail(to) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: this.getFromEmail(),
      to: to,
      subject: '📧 邮件服务测试成功 - RRXS.xyz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h2>🎉 邮件服务测试成功！</h2>
          </div>
          <div style="padding: 20px; background: white;">
            <p>恭喜！您的邮件服务已正确配置并成功发送。</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📊 测试信息</h3>
              <p><strong>测试时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
              <p><strong>邮件服务：</strong>${process.env.EMAIL_SERVICE?.toUpperCase() || 'Unknown'}</p>
              <p><strong>发件人：</strong>${this.getFromEmail()}</p>
            </div>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>✅ 系统状态</h3>
              <p>✓ 邮件服务器连接正常</p>
              <p>✓ 身份验证通过</p>
              <p>✓ 邮件发送成功</p>
            </div>
            <p>现在您可以正常使用百万被动收入之路系统的邮件功能了！</p>
          </div>
          <div style="text-align: center; padding: 15px; background: #f8f9fa; color: #666;">
            <p><small>此邮件由 RRXS.xyz 百万被动收入之路系统自动发送</small></p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      throw new Error(`Test email failed: ${error.message}`);
    }
  }
}

module.exports = new EmailService();