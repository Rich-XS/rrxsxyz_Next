const emailService = require('./services/emailService');

async function testEmailService() {
    console.log('🧪 开始测试邮件服务...');

    try {
        // 等待邮件服务初始化
        await new Promise(resolve => setTimeout(resolve, 2000));

        const testResult = await emailService.sendTestEmail('rrxs@qq.com');

        console.log('✅ 邮件发送成功!');
        console.log('📧 Message ID:', testResult.messageId);
        console.log('✉️ 请检查您的邮箱收件箱');

    } catch (error) {
        console.error('❌ 邮件发送失败:', error.message);

        // 提供详细的错误诊断
        if (error.message.includes('Invalid login')) {
            console.log('💡 可能的解决方案:');
            console.log('   1. 检查QQ邮箱是否开启了IMAP/SMTP服务');
            console.log('   2. 确认授权码是否正确');
            console.log('   3. 尝试重新生成授权码');
        }

        if (error.message.includes('timeout')) {
            console.log('💡 网络连接问题，请检查防火墙设置');
        }
    }

    process.exit(0);
}

testEmailService();