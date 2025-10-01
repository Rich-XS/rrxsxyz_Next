        // 邮件发送配置 - 使用EmailJS
        async function sendReportByEmail() {
            try {
                // 获取分析结果
                const analysisResult = localStorage.getItem(`analysis_${currentUser.phone}`);

                if (!analysisResult) {
                    throw new Error('没有找到分析结果');
                }

                console.log('准备发送报告到邮箱:', currentUser.email);

                // 使用EmailJS发送邮件（推荐免费方案）
                // 需要在HTML中引入EmailJS SDK: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>

                if (typeof emailjs !== 'undefined') {
                    // EmailJS配置（需要你注册EmailJS账户）
                    const emailData = {
                        to_email: currentUser.email,
                        to_name: currentUser.name,
                        subject: `${currentUser.name}的百万被动收入之路分析报告`,
                        message: analysisResult,
                        report_time: new Date().toLocaleString('zh-CN'),
                        user_info: `姓名：${currentUser.name}，年龄：${currentUser.age}，性别：${currentUser.gender}`
                    };

                    await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailData);
                    console.log('邮件通过EmailJS发送成功');

                } else {
                    // 备用方案：使用Node.js后端服务
                    console.log('EmailJS未加载，尝试后端服务...');
                    await sendEmailViaBackend();
                }

                // 保存邮件发送记录
                localStorage.setItem(`emailSent_${currentUser.phone}`, new Date().toISOString());

                return Promise.resolve();

            } catch (error) {
                console.error('邮件发送失败:', error);

                // 最终备用方案：下载报告文件
                console.log('邮件发送失败，提供报告下载');
                downloadReport();

                return Promise.resolve(); // 不抛出错误，继续流程
            }
        }

        // 使用后端服务发送邮件
        async function sendEmailViaBackend() {
            const BACKEND_URL = 'http://localhost:3000'; // 本地测试
            // const BACKEND_URL = 'https://api.rrxs.xyz'; // 生产环境

            const analysisResult = localStorage.getItem(`analysis_${currentUser.phone}`);

            const response = await fetch(`${BACKEND_URL}/api/email/send-report`, {
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

            if (!response.ok) {
                throw new Error('后端邮件服务不可用');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || '后端邮件发送失败');
            }
        }

        // 备用方案：下载报告文件
        function downloadReport() {
            const analysisResult = localStorage.getItem(`analysis_${currentUser.phone}`);
            if (!analysisResult) return;

            // 创建下载链接
            const reportContent = `
# ${currentUser.name}的百万被动收入之路分析报告

生成时间：${new Date().toLocaleString('zh-CN')}

${analysisResult}

---
报告由 RRXS.xyz 生成
            `;

            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentUser.name}_分析报告_${new Date().getTime()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('报告文件已下载到本地');
        }