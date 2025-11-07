/**
 * 报告生成器模块 - 处理辩论报告的生成和导出
 *
 * 功能：
 * - 生成结构化辩论报告
 * - 导出JSON格式
 * - 导出PDF格式
 * - 提取章节和列表项
 *
 * @version v1.0
 * @date 2025-10-13
 */

class ReportGenerator {
  constructor() {
    this.reportData = null;
  }

  /**
   * 生成辩论报告
   */
  async generateReport(state, aiCaller, facilitator) {
    console.log('📄 生成辩论报告...');

    const report = {
      metadata: {
        topic: state.topic,
        background: state.background,
        roles: state.selectedRoles.length,
        rounds: state.rounds,
        startTime: state.debateHistory[0]?.speeches[0]?.timestamp,
        endTime: new Date().toISOString(),
        delegateInputsCount: state.delegateInputs.length
      },
      summary: '',
      keyInsights: [],
      actionPlan: [],
      iterationSuggestions: [],
      fullTranscript: state.debateHistory
    };

    try {
      // 调用 AI 生成结构化报告
      const summaryPrompt = this.buildReportSummaryPrompt(state);

      const summaryResponse = await aiCaller.call({
        role: facilitator,
        prompt: summaryPrompt,
        temperature: 0.5,
        maxTokens: 1000
      });

      const summaryContent = summaryResponse.content || summaryResponse;

      // 解析 AI 输出
      report.summary = this.extractSection(summaryContent, '总结') || summaryContent.substring(0, 500);
      report.keyInsights = this.extractListItems(summaryContent, '核心洞察') || [];
      report.actionPlan = this.extractListItems(summaryContent, '行动计划') || [];
      report.iterationSuggestions = this.extractListItems(summaryContent, '迭代建议') || [];

    } catch (error) {
      console.warn('⚠️ 报告生成失败，使用基础模板：', error);
      report.summary = `本次辩论围绕"${state.topic}"展开了${state.rounds}轮深度讨论，共有${state.selectedRoles.length}位专家参与。`;
    }

    this.reportData = report;
    return report;
  }

  /**
   * 构建报告总结提示词
   */
  buildReportSummaryPrompt(state) {
    const transcript = state.debateHistory
      .map(round => {
        const speeches = round.speeches
          .filter(s => s.type !== 'summary')
          .map(s => `  - ${s.roleName}：${s.content.substring(0, 80)}...`)
          .join('\n');
        return `第${round.round}轮：${round.topic}\n${speeches}`;
      })
      .join('\n\n');

    return `你是【领袖(委托代理)】，请为本次辩论生成结构化报告：

⚠️ **严禁使用"作为领袖"等角色表述**，直接以领袖身份总结即可。

**主议题**：${state.topic}

**辩论记录**（摘要）：
${transcript}

请按以下格式输出：

## 总结
（整体辩论的最终结论，**必须包含一个88/100的综合评分及评分依据**。同时，总结决策是如何体现对**委托人核心诉求**和**个体创作者商业化**的关注，并明确指出最终的**行动计划**的关键里程碑。250字内。）

## 核心洞察
1. ...
2. ...
3. ...

## 行动计划
1. ...
2. ...
3. ...

## 迭代建议
1. ...
2. ...

总字数800字内。`;
  }

  /**
   * 从文本中提取章节
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0].replace(/##\s*\w+/, '').trim() : null;
  }

  /**
   * 从文本中提取列表项
   */
  extractListItems(text, sectionName) {
    const section = this.extractSection(text, sectionName);
    if (!section) return [];

    const items = section.match(/\d+\.\s*(.+?)(?=\d+\.|$)/gs);
    return items ? items.map(item => item.replace(/^\d+\.\s*/, '').trim()) : [];
  }

  /**
   * 导出报告为JSON
   */
  exportAsJSON(state) {
    if (!this.reportData) {
      throw new Error('报告尚未生成');
    }

    const json = JSON.stringify(this.reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `多魔汰辩论报告_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    console.log('✅ 报告已导出为 JSON');
  }

  /**
   * 导出报告为PDF
   */
  exportAsPDF(state) {
    if (!this.reportData) {
      throw new Error('报告尚未生成');
    }

    const reportTitle = state.topic.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Report_${reportTitle}_${Date.now()}.pdf`;

    // Target the rendered report section for capture
    const reportElement = document.querySelector('.report-section');
    if (!reportElement) {
      console.error('❌ 无法找到报告主体区域 (.report-section) 进行截图');
      alert('PDF导出失败：找不到报告渲染区域。');
      return;
    }

    // Canvas Generation
    window.html2canvas(reportElement, {
      scale: 2, // 提高分辨率
      useCORS: true,
      logging: false
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');

      // PDF Generation
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        console.error('❌ jsPDF 库未加载。');
        alert('PDF导出失败：jsPDF库未加载。');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // Margin 10mm on each side
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multi-page if necessary
      while (heightLeft >= 0) {
        position = position + pdfHeight - 10; // top margin for next page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(filename);
      console.log(`✅ 报告已导出为 PDF: ${filename}`);
    }).catch(error => {
      console.error('❌ HTML2Canvas 截图或 PDF 生成失败:', error);
      alert('PDF导出失败，请检查控制台错误信息。');
    });
  }
}

// 导出（Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportGenerator;
}

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.ReportGenerator = ReportGenerator;
}

console.log('✅ reportGenerator.js 已加载');