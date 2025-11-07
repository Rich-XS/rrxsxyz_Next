# Developer Handbook

开发手册与常见任务指南

---

## 常见开发任务

### 修改百问自测题目
**文件：** `html/projects/media-assessment-v4.html`（搜索 `const questions =`）

### 修改多魔汰角色配置
**文件：** `duomotai/src/config/roles.js`

### 添加新的API接口
**文件：** `server/server.js`
**示例：**
```javascript
app.post('/api/your-endpoint', async (req, res) => {
  try {
    // 实现逻辑
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 修改导航栏
**文件：** `index.html`, `baiwen.html`, `Projects.html`（搜索 `<nav>`）

### 调试AI服务
```bash
# 查看后端日志
cd server
npm run dev  # 控制台会显示详细日志

# 测试AI调用
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"测试","model":"qwen"}'
```

---

## 项目特殊约定

### 用户手机号特殊处理
**手机号 `13917895758` 标记为测试账号**
- 百问自测：标记为老用户（`media-assessment-v4.html`）
- 多魔汰：测试模式，固定验证码 `888888`

### 数据存储位置
- **前端数据：** LocalStorage（键格式：`user_{phone}`, `answers_{phone}`, `analysis_{phone}`）
- **后端数据：** `server/data/` 目录（JSON文件）

### 备份策略
- 修改HTML前自动备份（格式：`filename_YYYYMMDD_HHMMSS.html`）
- 示例：`index_20250930_234301.html`

### 版本管理策略

**重要版本完成后的版本管理流程：**

1. **识别版本完成时机：**
   - 完成一个重要功能模块（如：用户认证系统、辩论引擎等）
   - 准备开始新的重大功能开发前
   - 进行架构调整或重构前

2. **执行版本备份：**
   ```bash
   # 在相应目录下创建 Backup 文件夹（如果不存在）
   mkdir Backup

   # 移动旧版本文件到 Backup 文件夹
   # 文件命名格式：`原文件名_YYYYMMDD_HHMMSS.扩展名`
   # 示例：`userAuth_20251001_011435.js`
   ```

3. **Backup 文件夹位置：**
   - `duomotai/Backup/` - 多魔汰模块备份
   - `html/projects/Backup/` - 百问自测项目备份
   - `server/Backup/` - 后端服务备份
   - 根目录 `Backup/` - 配置文件和文档备份

4. **备份命名约定：**
   - 格式：`{原文件名}_{YYYYMMDD}_{HHMMSS}.{扩展名}`
   - 示例：
     - `userAuth_20251001_011435.js`
     - `index_20250930_234301.html`
     - `网站更新百问和多魔汰模块的框架及执行_v2_20251001_002733.md`

5. **自动执行提示：**
   当 Claude Code 检测到以下关键词时，应提醒执行版本备份：
   - "版本完成"、"准备开始新功能"、"重构"、"架构调整"
   - 完成 P0/P1 优先级任务后
   - progress.md 中标记为 "版本里程碑" 的任务完成后

### CORS配置
后端默认允许：
- `http://localhost:3001`
- `file://` 协议（本地HTML直接访问）
- 生产环境需配置 `ALLOWED_ORIGINS` 环境变量

---

**Last Updated**: 2025-10-11 15:35 (GMT+8) - CLAUDE.md 模块化：开发手册模块创建

