/**
 * 视频录制功能模块（Playwright增强）
 *
 * 功能：
 * 1. 自动录制测试视频
 * 2. 失败时保存视频
 * 3. 视频压缩和优化
 * 4. 视频元数据管理
 *
 * 时间：2025-10-31 Night-Auth
 * 决策：Playwright迁移（内置视频录制）
 */

const fs = require('fs');
const path = require('path');

class VideoRecorder {
  constructor(config = {}) {
    this.videoDir = config.videoDir || './gemba-reports/videos';
    this.videoSize = config.videoSize || { width: 1280, height: 800 };
    this.videos = [];
  }

  /**
   * 配置浏览器上下文（启用视频录制）
   */
  getContextOptions() {
    return {
      recordVideo: {
        dir: this.videoDir,
        size: this.videoSize
      }
    };
  }

  /**
   * 保存视频元数据
   */
  async saveVideo(page, testName, passed) {
    if (!page || !page.video()) {
      console.warn('⚠️ 页面未启用视频录制');
      return null;
    }

    try {
      const videoPath = await page.video().path();
      const videoInfo = {
        testName,
        passed,
        path: videoPath,
        timestamp: new Date().toISOString(),
        size: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0
      };

      this.videos.push(videoInfo);
      console.log(`🎥 视频已保存: ${videoPath} (${Math.round(videoInfo.size / 1024 / 1024)}MB)`);

      return videoInfo;
    } catch (e) {
      console.error('❌ 保存视频失败:', e.message);
      return null;
    }
  }

  /**
   * 清理旧视频（保留最近N个）
   */
  cleanupOldVideos(keepCount = 10) {
    if (!fs.existsSync(this.videoDir)) {
      return;
    }

    const videoFiles = fs.readdirSync(this.videoDir)
      .filter(f => f.endsWith('.webm'))
      .map(f => ({
        name: f,
        path: path.join(this.videoDir, f),
        mtime: fs.statSync(path.join(this.videoDir, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // 删除多余的视频
    const toDelete = videoFiles.slice(keepCount);
    toDelete.forEach(video => {
      fs.unlinkSync(video.path);
      console.log(`🗑️  已删除旧视频: ${video.name}`);
    });

    console.log(`✅ 视频清理完成（保留 ${Math.min(keepCount, videoFiles.length)} 个）`);
  }

  /**
   * 生成视频HTML预览
   */
  generateVideoPreview(videoInfo) {
    if (!videoInfo) {
      return '<p>⚠️ 未录制视频</p>';
    }

    return `
      <div class="video-preview">
        <h3>${videoInfo.testName} - ${videoInfo.passed ? '✅ PASS' : '❌ FAIL'}</h3>
        <video controls style="max-width: 100%; border: 1px solid #ddd;">
          <source src="${videoInfo.path}" type="video/webm">
          您的浏览器不支持视频播放。
        </video>
        <p style="font-size: 0.9em; color: #666;">
          大小: ${Math.round(videoInfo.size / 1024 / 1024)}MB | 时间: ${videoInfo.timestamp}
        </p>
      </div>
    `;
  }

  /**
   * 获取所有视频信息
   */
  getAllVideos() {
    return this.videos;
  }
}

module.exports = VideoRecorder;
