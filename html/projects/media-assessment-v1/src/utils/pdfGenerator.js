// PDF生成工具
export const generatePDFReport = (reportData) => {
  const { scores, level, suggestions, actionPlan } = reportData;
  
  // 创建PDF内容
  const pdfContent = `
# 自媒体创作者商业化准备度报告

## 报告概览
- **总体得分**: ${scores.total}/100
- **等级**: ${level.label}级创作者
- **生成时间**: ${new Date().toLocaleString('zh-CN')}

## 五大支柱得分

### 1. 定位 (Purpose): ${scores.purpose}/100
品牌定位和价值主张的清晰度

### 2. 用户 (People): ${scores.people}/100
目标用户理解的深度

### 3. 产品 (Product): ${scores.product}/100
产品价值和体系化程度

### 4. 流量 (Platform): ${scores.platform}/100
流量策略和执行力

### 5. 体系 (Process): ${scores.process}/100
系统化和可规模化水平

## 个性化建议

${suggestions.map((suggestion, index) => `
### ${index + 1}. ${suggestion.title}
${suggestion.description}
**优先级**: ${suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
`).join('')}

## 行动计划

${actionPlan.map((plan, index) => `
### ${plan.period}
${plan.tasks.map((task, taskIndex) => `${taskIndex + 1}. ${task}`).join('\n')}
`).join('')}

## 避坑指南

### 新手创作者三大致命错误
1. **过早多元化**: 在一个核心产品和核心受众站稳脚跟之前，不要试图推出多个产品
2. **定位宽泛模糊**: 如果你想为所有人服务，最终你将无法为任何人服务
3. **忽视私域建设**: 只关注公域平台的虚荣指标，没有构建稳固的微信生态系统

### 中国自媒体生态特点
- **平台算法**: 了解抖音、小红书、微信的算法规则
- **内容合规**: 遵守广告法和平台规范
- **用户习惯**: 适应中国用户的消费和社交习惯

## 被动收入路径

### 价值阶梯模型
1. **流量磁石** (免费): 电子书、清单、白皮书
2. **绊脚石产品** (1-99元): 迷你课程、付费资料
3. **核心产品** (499-1999元): 体系化课程、付费社群
4. **后端产品** (5000元以上): 训练营、一对一咨询

### 变现公式
- **基础模型**: 1,000位粉丝 × 1,000元/年 = 1,000,000元
- **高客单价**: 200位客户 × 5,000元 = 1,000,000元
- **低价高量**: 10,000位客户 × 100元 = 1,000,000元

---

*本报告基于您的回答生成，建议定期重新评估以跟踪进展。*
`;

  // 使用浏览器的打印功能生成PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>自媒体创作者商业化准备度报告</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Microsoft YaHei', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 30px;
        }
        h3 {
          color: #1e3a8a;
          margin-top: 20px;
        }
        .score {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
        .suggestion {
          background: #fef3c7;
          padding: 15px;
          border-radius: 5px;
          margin: 10px 0;
          border-left: 4px solid #f59e0b;
        }
        .action-plan {
          background: #ecfdf5;
          padding: 15px;
          border-radius: 5px;
          margin: 10px 0;
          border-left: 4px solid #10b981;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${pdfContent.replace(/\n/g, '<br>').replace(/### /g, '<h3>').replace(/## /g, '<h2>').replace(/# /g, '<h1>')}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // 延迟执行打印，确保内容加载完成
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// 简化版PDF下载（使用浏览器下载）
export const downloadReportAsText = (reportData) => {
  const { scores, level, suggestions, actionPlan } = reportData;
  
  const content = `自媒体创作者商业化准备度报告

总体得分: ${scores.total}/100
等级: ${level.label}级创作者
生成时间: ${new Date().toLocaleString('zh-CN')}

五大支柱得分:
- 定位: ${scores.purpose}/100
- 用户: ${scores.people}/100  
- 产品: ${scores.product}/100
- 流量: ${scores.platform}/100
- 体系: ${scores.process}/100

个性化建议:
${suggestions.map((s, i) => `${i+1}. ${s.title}\n   ${s.description}`).join('\n')}

行动计划:
${actionPlan.map(p => `${p.period}:\n${p.tasks.map((t, i) => `  ${i+1}. ${t}`).join('\n')}`).join('\n\n')}

---
本报告由自媒体百问系统生成
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `自媒体商业化报告_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

