# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🤖 Custom Agent Configuration

**Progress Recorder Agent** - 项目记忆与上下文持续性管理

本项目使用自定义 agent 进行项目记忆管理。详细规则见：
- **记忆规则配置**: `my_main_agent.md`
- **Agent 定义**: `.claude/agents/progress-recorder.md`
- **进度记录**: `progress.md`（活跃记忆）
- **历史归档**: `progress.archive.md`（冷存储）

**触发关键词：**
- `>>recap` - 项目回顾总结
- `>>record` - 增量记录当前进度
- `>>archive` - 归档历史记录
- `>>wrap-up` - 会话收尾（准备关机时使用）

**⚠️ 强制触发规则（Claude Code 必须遵守）：**

当对话中出现以下关键词时，**必须立即调用 Task tool 启动 progress-recorder agent**，而不是手动编辑 progress.md：

1. **决策完成**：用户说"我决定"/"确定"/"选用"/"将采用" → 立即调用 agent 记录决策 → 更新 progress.md Decisions
2. **任务完成**：出现"已完成"/"完成了"/"已实现"/"修复了" → 立即调用 agent 更新 Done
3. **新任务产生**：出现"需要"/"应该"/"待办"/"TODO" → 立即调用 agent 添加 TODO
4. **需求变更**：出现"需求更新"/"架构调整"/"变更"/"重构"/"请长期记忆" → 立即调用 agent 更新 progress.md **和 CLAUDE.md**，并在 CLAUDE.md 末尾添加时间戳
5. **会话收尾**：用户输入 `>>wrap-up` 或说"准备关机" → 立即调用 agent 总结会话，更新 progress.md，确认可安全关机
6. **用户明确要求**：用户输入 >>record 或 >>recap 或 >>archive → 立即调用 agent

**禁止行为：**
- ❌ 禁止直接手动编辑 progress.md（除非是修复格式错误）
- ❌ 禁止绕过 agent 直接使用 Edit/Write tool 修改 progress.md
- ❌ 禁止在需求变更时忘记同步更新 CLAUDE.md
- ✅ 必须通过 Task tool 调用 progress-recorder agent 来更新项目记忆
- ✅ 需求变更时必须同时更新 progress.md 和 CLAUDE.md

---

## 项目概述

**RRXS.XYZ** - 个人品牌自媒体网站，包含两大核心模块：
- **百问自测系统**：100题自媒体商业化能力评估工具
- **多魔汰辩论系统**：多角色AI辩论决策支持系统

## 核心命令

### 启动开发环境

**推荐方式（完整功能）：**
```bash
# 双击运行启动脚本，选择 [3] Full Stack
启动本地服务器-更新版.bat
```

**手动启动：**
```bash
# 前端服务器（Python，端口8080）
python -m http.server 8080

# 后端API服务器（Node.js，端口3000）
cd server
npm install  # 仅首次运行
npm run dev
```

### 访问地址
- 首页：http://localhost:8080/
- 百问自测：http://localhost:8080/baiwen.html
- 多魔汰：http://localhost:8080/duomotai/
- 后端API：http://localhost:3000/

### 测试
```bash
# 测试邮件服务
cd server
node test-email.js

# 健康检查
curl http://localhost:3000/health
```

## 架构设计

### 前端架构

**静态页面（Vanilla JS + HTML）：**
- `index.html` - 主页（含Coze AI聊天）
- `baiwen.html` - 百问自测入口页
- `Projects.html` - 项目展示页

**React项目：**
```
html/projects/
├── media-assessment-v1/     # 百问V1 - 深度思考版
├── media-assessment-v2/     # 百问V2 - 选项版
├── media-assessment-v4.html # 百问V4 - 单文件最终版（主要使用）
└── duomotai/               # 多魔汰系统（独立HTML+模块）
```

**多魔汰系统模块化设计：**
```
duomotai/
├── index.html              # 主入口（单文件，包含所有逻辑）
├── src/
│   ├── config/
│   │   └── roles.js        # 16个辩论角色配置
│   ├── modules/
│   │   └── debateEngine.js # 辩论引擎核心逻辑
│   ├── components/         # UI组件
│   └── utils/              # 工具函数
└── public/                 # 静态资源
```

### 后端架构

```
server/
├── server.js               # Express主服务器
├── services/
│   ├── aiService.js        # AI模型调用（Qwen/DeepSeek/OpenAI容错）
│   ├── emailService.js     # 邮件服务（QQ邮箱/SendGrid）
│   ├── userDataService.js  # 用户数据管理（JSON存储）
│   └── userAuthService.js  # 用户认证（验证码）
└── .env                    # 环境配置（需手动创建）
```

### 关键技术栈

**前端：**
- React 18 + Vite（百问V1/V2项目）
- TailwindCSS + Shadcn/UI（组件库）
- Recharts（数据可视化）
- 单文件HTML（V4和多魔汰 - 简化部署）

**后端：**
- Node.js 18+ + Express
- AI服务：Qwen API（主）→ DeepSeek → OpenAI（降级）
- 邮件：Nodemailer（QQ邮箱免费方案）
- 数据：JSON文件存储 + LocalStorage

## 重要设计决策

### 1. 多魔汰辩论系统 - 5阶段流程

**核心流程：**
```
准备阶段 → 策划阶段 → 确认阶段 → 辩论阶段 → 交付阶段
   ↓         ↓         ↓         ↓         ↓
用户输入  领袖规划  用户确认  多轮辩论  总结报告
话题背景  初步方案  补充信息  N轮对话  委托人点评
```

**16个角色分组：**
- **必选角色（6个）**：杠精、行业专家、用户金主、第一性原理、风险管理师、资源整合者
- **可选角色（9个）**：时间穿越者、竞争对手、机会猎手、财务顾问、心理咨询师、法律顾问、技术极客、营销大师、哲学家
- **系统角色（1个）**：领袖（自动分配，组织辩论）

**文件位置：** `duomotai/src/config/roles.js`

### 2. 百问自测 - 三版本演进

- **V1**（`media-assessment-v1/`）：100个纯开放题，React项目，重思考
- **V2**（`media-assessment-v2/`）：混合题型（单选+文本），优化体验
- **V4**（`media-assessment-v4.html`）：**主要使用版本**，单文件部署，包含完整功能

**V4核心功能：**
- 用户信息采集 + 新老用户判断
- 100题五大维度答题（定位/用户/产品/流量/体系）
- 答题质量实时检测
- AI分析报告生成（多模型容错）
- 邮件发送报告
- 数据持久化（LocalStorage + 后端JSON）

### 3. AI服务多模型容错机制

**降级策略（server/services/aiService.js）：**
```
Qwen API → DeepSeek API → OpenAI API → 备用静态报告
```

**调用示例：**
```javascript
POST /api/ai/analyze
{
  "prompt": "分析内容",
  "model": "qwen"  // 可选，默认qwen
}
```

### 4. 环境配置要求

**必需配置（server/.env）：**
```env
# AI服务（至少配置一个）
QWEN_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key

# 邮件服务（推荐QQ邮箱免费方案）
EMAIL_SERVICE=qq
EMAIL_USER=your_qq_email@qq.com
EMAIL_PASS=your_authorization_code  # 注意：是授权码，不是QQ密码

# 服务端口
PORT=3000
```

### 5. 多魔汰 v3 - DeepSeek AI 集成与交互优化（2025-10-02）

**AI 服务策略：**
- **主调用模型**：DeepSeek API（利用免费额度，成本优化）
- **容错降级链**：DeepSeek → Qwen → OpenAI → JS fallback（基于 roles.js 模板）
- **成本控制**：10轮辩论目标 tokens < 5000

**角色可视化设计：**
- **三层颜色编码**：
  - 核心层（蓝 #007BFF）：第一性原理、上帝视角、时间穿越者
  - 外部层（红 #FF4500）：竞争友商、杠精、风险管理师
  - 价值层（绿 #28A745）：用户金主、落地执行者、资源整合者
- **必选8角色流线**：第一性→穿越→上帝→杠精→用户→竞争→执行→领袖（箭头动画引导）
- **波特五力轮盘**：竞争/威胁/供应/上帝/时间/风险，含大厂子项可视化

**5阶段交互流程：**
1. **准备阶段**：用户输入话题/背景，选择角色+轮数（默认10轮，8+角色）
2. **策划阶段**：领袖（ID16）调用 DeepSeek 生成初步辩论策略（每轮话题角度+建议）
3. **确认阶段**：领袖开场介绍，委托人补充/点评（实时文本框），确认进入辩论
4. **辩论阶段**：N轮按必选顺序组织，每轮：领袖主持→委托人可选干预→角色顺序输出（DeepSeek 基于 prompt 模板）→领袖总结
5. **交付阶段**：最后一轮聚焦执行方案，感谢弹窗+反馈表单，生成报告（JSON/PDF：要点/计划/迭代建议）

**文件位置：**
- 辩论引擎：`duomotai/src/modules/debateEngine.js`
- 角色配置：`duomotai/src/config/roles.js`
- AI 服务：`server/services/aiService.js`
- 主界面：`duomotai/index.html`

### 6. 多魔汰 v5 - 用户调研与个性化系统（2025-10-03）

**核心更新：登录后用户画像调研**

**用户调研流程：**
1. **前页登录**：落地页（duomotai-landing-v5.html）点击"开始你的旅程"
2. **登录方式**：手机号 + 验证码/密码双模式（测试账号 13917895758 固定验证码 888888）
3. **重定向主页**：登录成功后跳转 `duomotai/index.html`
4. **画像检查**：主页加载时检查用户基本信息（年龄段/性别/昵称/邮箱）
5. **调研弹窗**：信息不完整时弹出苹果风格模态框
6. **数据存储**：保存到 sessionStorage + 后端 `/api/user/profile`
7. **AI 优化**：调研数据融入 DeepSeek 提示词（e.g., "针对{年龄段}用户..."）

**调研表单字段：**
- **年龄段**（必填）：下拉选择（18-25/26-35/36-45/46-55/56+）
- **性别**（必填）：单选（男/女/其他）
- **昵称**（必填）：文本输入（最多20字）
- **邮箱**（必填）：邮箱验证
- **进度条**：实时显示填写进度（0-100%）

**集成 rrxs.xyz 整体用户系统：**
- **共享认证**：复用百问自测的 `userAuth.js`
- **统一数据库**：用户画像跨模块通用（百问/多魔汰）
- **密码登录**：新增 `loginWithPassword(phone, password)` 方法
- **测试模式**：手机号 13917895758 自动识别为测试用户

**UI 设计规范（苹果风格）：**
- **颜色方案**：核心蓝 #007AFF、外部红 #FF3B30、价值绿 #34C759
- **模态框**：暖米白背景 #FFFAF0、圆角 16px、柔和阴影
- **角色卡片**：图标替代 emoji、必选角色金边（4px border）
- **响应式**：TailwindCSS + SF字体、Material Design 卡片动画
- **加载优化**：目标 < 2秒

**文件结构（v5 新增/更新）：**
```
duomotai/
├── src/
│   └── modules/
│       ├── userProfile.js          # v5 新增 - 用户画像模块（398行）
│       ├── userAuth.js             # v5 更新 - 增加密码登录
│       └── debateEngine.js         # v5 更新 - 集成用户画像到 AI 提示
├── index.html                      # v5 更新 - 添加画像检查逻辑
└── Backup/
    ├── index_v4_20251002.html      # v4 备份
    ├── debateEngine_v4_20251002.js # v4 备份
    └── roles_v4_20251002.js        # v4 备份
```

**后端 API 要求（待实现）：**
- `GET /api/user/profile?phone={phone}` - 获取用户画像
- `POST /api/user/profile` - 保存用户画像
- `POST /api/auth/login-password` - 密码登录接口

**调研数据在 AI 提示中的应用示例：**
```javascript
// debateEngine.js 构建提示词时
buildRoleSpeechPrompt(role, roundNumber, roundData) {
  const userProfileText = this.userProfile?.getProfileText() || '';

  return `${role.systemPrompt}

**当前辩论情况**：
- 主议题：${this.state.topic}
- ${userProfileText}  // v5 新增：融入用户画像
- 当前轮次：第 ${roundNumber}/${this.state.rounds} 轮
...
`;
}
```

**测试要点：**
1. 测试账号 13917895758 登录，验证码 888888
2. 调研模态弹出，填写完整信息
3. 启动辩论，检查 AI 输出是否包含个性化内容
4. 验证数据持久化（刷新页面不再弹出调研）
5. 总耗时 < 90秒

### 7. 文件同步监控机制（2025-10-03）

**背景问题（Root Cause Analysis）：**

今天发生了一个重要问题：v5 重大需求变更时，开发者（Claude Code）直接手动编辑了 CLAUDE.md，没有调用 progress-recorder agent，导致 progress.md 没有同步更新。这暴露了两个根本原因：

1. **Root Cause #1: 缺乏强制机制**
   - 问题：依赖 AI 自觉遵守规则 = 不可靠
   - 现象：CLAUDE.md 规定"需求变更必须调用 agent"，但被违反
   - 原因：没有系统级强制检查机制

2. **Root Cause #2: 文件冲突风险**
   - 问题：用户在 IDE 查看文件时，Agent 可能同时修改文件
   - 担忧：VSCode 编辑冲突、缓冲区不一致

**三层防护机制（Long-term Counter-Measure）：**

为解决这些根本原因，建立了三层防护体系：

**L1 - AI 自觉层（最快但不可靠）：**
- 依赖 CLAUDE.md 中的规则说明
- 优点：零延迟响应
- 缺点：容易被 AI 忘记或误判
- 适用场景：作为第一道防线提醒

**L2 - 系统监控层（推荐，自动报警）：**
- 工具：`.claude/file-sync-guard.js` 守护脚本
- 原理：每 10 分钟检查 CLAUDE.md 和 progress.md 修改时间
- 触发条件：两个文件时间差超过 5 分钟 → 报警
- 日志输出：`.claude/sync-guard.log`
- 启动方式：`node .claude/file-sync-guard.js`
- 优点：自动化、低成本、非侵入式
- 缺点：有延迟（最多 10 分钟）

**L3 - Git 强制层（最强制但需要 Git）：**
- 工具：Git pre-commit hook
- 原理：提交前检查 CLAUDE.md 和 progress.md 是否同步修改
- 适用场景：已启用 Git 的项目
- 优点：100% 阻止不同步提交
- 缺点：需要 Git 仓库，本项目暂未使用

**文件管理协议（FILE_PROTOCOL.md）：**

为避免文件冲突，制定了以下协作规则：

1. **AI 行为规范：**
   - ❌ 禁止直接使用 Edit/Write tool 修改 progress.md 和 CLAUDE.md
   - ✅ 必须通过 Task tool 调用 progress-recorder agent
   - ✅ Agent 负责原子操作，确保文件一致性

2. **User 行为规范：**
   - ✅ 可随时查看所有文件（IDE 只读）
   - ⚠️ 建议避免手动编辑 progress.md 和 CLAUDE.md
   - ✅ 如需修改，建议先暂停 AI 操作，或使用 `>> record` 命令同步

3. **冲突避免机制：**
   - VSCode 自动重新加载（检测到文件变化时提示）
   - Agent 使用原子写入（Read → Edit → Write 单次完成）
   - 分工明确（AI 不直接写，User 少手动改）

**使用方法：**

```bash
# 方法1：直接运行守护脚本（推荐开发时使用）
node .claude/file-sync-guard.js

# 方法2：通过 VSCode Task（已配置）
# Ctrl+Shift+P → Tasks: Run Task → Check File Sync

# 方法3：手动触发 progress-recorder
>> record  # 立即同步当前进度
```

**监控日志示例：**

```
[2025-10-03 10:15:30] ✅ Files in sync: CLAUDE.md (05:30) | progress.md (05:35) | Diff: 5 minutes
[2025-10-03 10:25:30] ⚠️ WARNING: Files out of sync! CLAUDE.md (05:30) | progress.md (04:20) | Diff: 70 minutes
[2025-10-03 10:35:30] ✅ Files in sync: CLAUDE.md (10:30) | progress.md (10:32) | Diff: 2 minutes
```

**最佳实践建议：**

1. **开发时启动监控**：每次打开项目，先运行 `node .claude/file-sync-guard.js`（后台运行）
2. **新增触发词**：用户说"请长期记忆"时，AI 应识别为需求变更，调用 agent
3. **定期检查日志**：每天查看 `.claude/sync-guard.log`，确保无报警
4. **Git 集成（可选）**：如果项目启用 Git，配置 pre-commit hook 作为最后防线

**重要文件位置：**
- 监控脚本：`.claude/file-sync-guard.js`
- 协议文档：`.claude/FILE_PROTOCOL.md`
- 日志文件：`.claude/sync-guard.log`
- VSCode 任务配置：`.vscode/tasks.json`

**调整建议（用户反馈）：**
- 用户建议将检查间隔从 5 分钟调整为 10 分钟（或其他值）
- 可通过修改 `file-sync-guard.js` 中的 `CHECK_INTERVAL` 常量实现

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
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"测试","model":"qwen"}'
```

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
   # 文件命名格式：原文件名_YYYYMMDD_HHMMSS.扩展名
   # 示例：userAuth_20251001_011435.js
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
- `http://localhost:3000`
- `file://` 协议（本地HTML直接访问）
- 生产环境需配置 `ALLOWED_ORIGINS` 环境变量

## 重要文档参考

- **本地开发指南：** `本地开发启动指南.md`
- **详细执行计划：** `网站更新百问和多魔汰模块的框架及执行.md`
- **后端API文档：** `server/README.md`
- **项目进度跟踪：** `progress.md`
- **更新日志：** `UPDATE_LOG.md`

## 安全注意事项

1. **永远不要提交 `.env` 文件到版本控制**
2. **API密钥通过环境变量配置，不要硬编码**
3. **后端已配置速率限制（15分钟100请求）和Helmet安全头**
4. **生产环境需启用CSP（当前开发环境已禁用）**

## 部署架构

**当前（本地开发）：**
- 前端：Python HTTP Server (:8080)
- 后端：Node.js Express (:3000)
- 数据：本地JSON文件 + OneDrive同步

**生产环境建议：**
- 域名：rrxs.xyz
- 服务器：腾讯云轻量（2核4G，￥112/年）
- 反向代理：Nginx + Let's Encrypt SSL
- CDN：腾讯云CDN（静态资源加速）
- 进程管理：PM2
- 备份：OneDrive + Syncthing + GitHub私有仓库

## 性能优化目标

- 首屏加载时间 < 2秒
- Lighthouse评分 > 90
- 移动端适配优先（响应式设计）
- 懒加载图片和组件
- Service Worker离线缓存（待实现）

## 联系与资源

- **网站主页：** rrxs.xyz
- **问题反馈：** 通过网站"论坛&留言"提交
- **项目维护者：** 百问学长-RRXS

---

**Last Updated**: 2025-10-03 10:45 (v5 用户调研系统集成 + 文件同步监控机制)
