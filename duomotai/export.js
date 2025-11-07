/**
 * 导出模块 - 处理辩论报告的导出功能
 *
 * 功能：
 * - 导出JSON格式
 * - 导出PDF格式
 * - 支持自定义文件名
 * - 浏览器环境专用
 *
 * @version v1.0
 * @date 2025-10-13
 */

class ExportManager {
  constructor() {
    this.reportData = null;
  }

  /**
   * 设置报告数据（供外部调用）
   */
  setReportData(data) {
    this.reportData = data;
  }

  /**
   * 导出报告为JSON
   * @param {Object} options - 导出选项
   * @param {Object} options.reportData - 报告数据（可选，如果未设置则使用 this.reportData）
   * @param {string} options.filename - 自定义文件名（可选）
   */
  exportAsJSON(options = {}) {
    const reportData = options.reportData || this.reportData;

    if (!reportData) {
      throw new Error('报告数据尚未设置，无法导出 JSON');
    }

    // 生成文件名
    const timestamp = Date.now();
    const defaultFilename = `多魔汰辩论报告_${timestamp}.json`;
    const filename = options.filename || defaultFilename;

    // 创建 JSON 数据
    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ [Export] JSON 报告已导出: ${filename}`);
    return { success: true, filename, size: blob.size };
  }

  /**
   * 导出报告为PDF
   * @param {Object} options - 导出选项
   * @param {Object} options.reportData - 报告数据（可选，用于文件名生成）
   * @param {string} options.filename - 自定义文件名（可选）
   * @param {string} options.targetSelector - 目标元素选择器（默认 '.report-section'）
   * @param {number} options.scale - 分辨率缩放（默认 2）
   */
  async exportAsPDF(options = {}) {
    const reportData = options.reportData || this.reportData;

    // 生成文件名
    const timestamp = Date.now();
    let defaultFilename = `多魔汰辩论报告_${timestamp}.pdf`;

    if (reportData && reportData.metadata && reportData.metadata.topic) {
      const topicSlug = reportData.metadata.topic
        .substring(0, 20)
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      defaultFilename = `Report_${topicSlug}_${timestamp}.pdf`;
    }

    const filename = options.filename || defaultFilename;
    const targetSelector = options.targetSelector || '.report-section';
    const scale = options.scale || 2;

    // 查找目标元素
    const reportElement = document.querySelector(targetSelector);
    if (!reportElement) {
      const errorMsg = `无法找到目标元素 (${targetSelector}) 进行 PDF 导出`;
      console.error(`❌ [Export] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // 检查依赖库
    if (typeof window.html2canvas === 'undefined') {
      const errorMsg = 'html2canvas 库未加载，无法导出 PDF';
      console.error(`❌ [Export] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      const errorMsg = 'jsPDF 库未加载，无法导出 PDF';
      console.error(`❌ [Export] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      console.log(`📄 [Export] 开始生成 PDF: ${filename}`);

      // 使用 html2canvas 转换为图片
      const canvas = await window.html2canvas(reportElement, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // 初始化 jsPDF（兼容两种导入方式）
      const { jsPDF } = window.jspdf || {};
      const PDF = jsPDF || window.jsPDF;

      if (!PDF) {
        throw new Error('jsPDF 构造函数未找到');
      }

      // 创建 PDF 文档（A4 纸张）
      const pdf = new PDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 计算图片在 PDF 中的尺寸（保持宽高比，左右各留 10mm 边距）
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 顶部边距 10mm

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); // 减去顶部和底部边距

      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        pdf.addPage();
        position = -(pdfHeight - 20) * (Math.ceil((imgHeight - heightLeft) / (pdfHeight - 20)) - 1) + 10;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // 保存 PDF
      pdf.save(filename);

      console.log(`✅ [Export] PDF 报告已导出: ${filename}`);
      return { success: true, filename, pages: pdf.internal.getNumberOfPages() };

    } catch (error) {
      console.error('❌ [Export] PDF 生成失败:', error);
      throw new Error(`PDF 导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为多种格式（批量导出）
   * @param {Object} options - 导出选项
   * @param {Array<string>} options.formats - 导出格式数组，如 ['json', 'pdf']
   */
  async exportMultiple(options = {}) {
    const formats = options.formats || ['json', 'pdf'];
    const results = [];

    for (const format of formats) {
      try {
        if (format === 'json') {
          const result = this.exportAsJSON(options);
          results.push({ format: 'json', ...result });
        } else if (format === 'pdf') {
          const result = await this.exportAsPDF(options);
          results.push({ format: 'pdf', ...result });
        } else {
          console.warn(`⚠️ [Export] 不支持的格式: ${format}`);
        }
      } catch (error) {
        console.error(`❌ [Export] ${format.toUpperCase()} 导出失败:`, error);
        results.push({ format, success: false, error: error.message });
      }
    }

    return results;
  }
}

// 导出单例（浏览器环境）
if (typeof window !== 'undefined') {
  window.ExportManager = ExportManager;

  // 创建全局单例实例
  window.exportManager = new ExportManager();

  console.log('✅ export.js 已加载');
}

// Node.js 环境导出（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportManager;
}
