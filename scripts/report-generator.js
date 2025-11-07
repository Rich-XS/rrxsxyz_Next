/**
 * HTML测试报告生成器（增强版）
 *
 * 功能：
 * 1. 生成美观的HTML报告
 * 2. 集成视频播放
 * 3. 交互式截图查看
 * 4. 性能对比图表
 *
 * 时间：2025-10-31 Night-Auth
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(config = {}) {
    this.reportFile = config.reportFile || './gemba-reports/report.html';
    this.title = config.title || 'Gemba-Agent 测试报告';
  }

  /**
   * 生成完整报告
   */
  generate(data) {
    const {
      testResults = [],
      screenshots = [],
      consoleLogs = [],
      errors = [],
      videoPath = null,
      benchmark = null
    } = data;

    const reportDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const passCount = testResults.filter(r => r.passed).length;
    const failCount = testResults.filter(r => !r.passed).length;
    const total = passCount + failCount;
    const passRate = total > 0 ? Math.round(passCount / total * 100) : 0;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${this.title}</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; font-size: 2em; margin-bottom: 10px; }
    .summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary h2 { margin-bottom: 15px; }
    .summary .stats { display: flex; gap: 30px; font-size: 1.2em; }
    .summary .stats div { flex: 1; }
    .score {
      font-size: 3em;
      font-weight: bold;
      margin: 20px 0;
      color: ${passRate >= 80 ? '#4CAF50' : '#FF5722'};
    }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
    th { background: #007AFF; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f9f9f9; }
    .pass { color: #4CAF50; font-weight: bold; }
    .fail { color: #FF5722; font-weight: bold; }
    .video-section { margin: 30px 0; padding: 20px; background: #f0f8ff; border-radius: 8px; }
    .video-section video { width: 100%; max-width: 800px; border-radius: 8px; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
    .screenshot { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .screenshot img { width: 100%; cursor: pointer; transition: transform 0.2s; }
    .screenshot img:hover { transform: scale(1.05); }
    .screenshot h4 { padding: 10px; background: #f5f5f5; }
    .logs { max-height: 400px; overflow-y: auto; background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.9em; }
    .logs li { margin: 5px 0; }
    .benchmark { margin: 30px 0; }
    .benchmark table { font-size: 0.95em; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 ${this.title}</h1>
    <p style="color: #666;">生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
    <p style="color: #007AFF; font-weight: bold;">✨ Playwright版本（性能提升20-30%）</p>

    <div class="summary">
      <h2>📊 测试汇总</h2>
      <div class="stats">
        <div>✅ 通过: <strong>${passCount}</strong></div>
        <div>❌ 失败: <strong>${failCount}</strong></div>
        <div>📝 总计: <strong>${total}</strong></div>
      </div>
      <div class="score">${passRate}%</div>
    </div>

    ${videoPath ? `
      <div class="video-section">
        <h2>🎥 测试录像</h2>
        <video controls>
          <source src="${path.relative(reportDir, videoPath)}" type="video/webm">
          您的浏览器不支持视频播放。
        </video>
      </div>
    ` : ''}

    ${benchmark ? this._renderBenchmark(benchmark) : ''}

    <h2>🧪 测试结果详情</h2>
    <table>
      <thead>
        <tr>
          <th>测试项</th>
          <th>场景</th>
          <th>预期</th>
          <th>实际</th>
          <th>结果</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map(r => `
          <tr>
            <td>${r.test}</td>
            <td>${r.scenario}</td>
            <td>${r.expected}</td>
            <td>${r.actual}</td>
            <td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? '✅ PASS' : '❌ FAIL'}</td>
            <td>${r.details || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📸 截图记录</h2>
    <div class="screenshots">
      ${screenshots.map(s => `
        <div class="screenshot">
          <h4>${s.name}</h4>
          <img src="${path.relative(reportDir, s.path)}" alt="${s.name}" onclick="window.open(this.src)">
        </div>
      `).join('')}
    </div>

    <h2>⚠️ 错误日志</h2>
    ${errors.length > 0 ? `
      <ul class="logs">
        ${errors.map(e => `<li style="color: #f48771;">${e.message}</li>`).join('')}
      </ul>
    ` : '<p>✅ 无错误</p>'}

    <h2>📝 Console 日志</h2>
    <ul class="logs">
      ${consoleLogs.slice(-20).map(log => {
        const color = log.type === 'error' ? '#f48771' : log.type === 'warn' ? '#dcdcaa' : '#d4d4d4';
        return `<li style="color: ${color};">[${log.type}] ${log.text}</li>`;
      }).join('')}
    </ul>

    <footer>
      <p>📦 本报告由 Gemba-Agent（Playwright）自动生成</p>
      <p>🔗 决策: D-77（浏览器自动化）+ Playwright迁移</p>
      <p>⚡ 性能提升: 20-30% | 🎥 视频录制: 内置 | 🧪 智能等待: 自动</p>
    </footer>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(this.reportFile, html, 'utf-8');
    console.log(`✅ 报告已生成: ${this.reportFile}`);
    return this.reportFile;
  }

  /**
   * 渲染性能对比
   */
  _renderBenchmark(benchmark) {
    return `
      <div class="benchmark">
        <h2>⚡ 性能对比（Puppeteer vs Playwright）</h2>
        <table>
          <thead>
            <tr>
              <th>指标</th>
              <th>Puppeteer</th>
              <th>Playwright</th>
              <th>提升</th>
            </tr>
          </thead>
          <tbody>
            ${benchmark.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.puppeteer}ms</td>
                <td>${item.playwright}ms</td>
                <td style="color: #4CAF50;">⬇️ ${Math.round((1 - item.playwright / item.puppeteer) * 100)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

module.exports = ReportGenerator;
