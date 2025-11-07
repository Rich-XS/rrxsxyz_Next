# Architecture Guide

**RRXS.XYZ** - 个人品牌自媒体网站项目架构指�?

---

## 项目概述

**RRXS.XYZ** - 个人品牌自媒体网站，包含两大核心模块�?
- **百问自测系统**�?00题自媒体商业化能力评估工�?
- **多魔汰辩论系�?*：多角色AI辩论决策支持系统

---

## 核心命令

### 启动开发环�?

**推荐方式（完整功能）�?*
```bash
# 双击运行启动脚本，选择 [3] Full Stack
启动本地服务�?更新�?bat
```

**手动启动�?*
```bash
# 前端服务器（Python，端�?080�?
python -m http.server 8080

# 后端API服务器（Node.js，端�?000�?
cd server
npm install  # 仅首次运�?
npm run dev
```

### 访问地址
- 首页：http://localhost:8080/
- 百问自测：http://localhost:8080/baiwen.html
- 多魔汰：http://localhost:8080/duomotai/
- 后端API：http://localhost:3001/

### 测试
```bash
# 测试邮件服务
cd server
node test-email.js

# 健康检�?
curl http://localhost:3001/health
```

---

## 架构设计

### 前端架构

**静态页面（Vanilla JS + HTML）：**
- `index.html` - 主页（含Coze AI聊天�?
- `baiwen.html` - 百问自测入口�?
- `Projects.html` - 项目展示�?

**React项目�?*
```
html/projects/
├── media-assessment-v1/     # 百问V1 - 深度思考版
├── media-assessment-v2/     # 百问V2 - 选项�?
├── media-assessment-v4.html # 百问V4 - 单文件最终版（主要使用）
└── duomotai/               # 多魔汰系统（独立HTML+模块�?
```

**多魔汰系统模块化设计�?*
```
duomotai/
├── index.html              # 主入口（单文件，包含所有逻辑�?
├── src/
�?  ├── config/
�?  �?  └── roles.js        # 16个辩论角色配�?
�?  ├── modules/
�?  �?  └── debateEngine.js # 辩论引擎核心逻辑
�?  ├── components/         # UI组件
�?  └── utils/              # 工具函数
└── public/                 # 静态资�?
```

### 后端架构

```
server/
├── server.js               # Express主服务器
├── services/
�?  ├── aiService.js        # AI模型调用（Qwen/DeepSeek/OpenAI容错�?
�?  ├── emailService.js     # 邮件服务（QQ邮箱/SendGrid�?
�?  ├── userDataService.js  # 用户数据管理（JSON存储�?
�?  └── userAuthService.js  # 用户认证（验证码�?
└── .env                    # 环境配置（需手动创建�?
```

### 关键技术栈

**前端�?*
- React 18 + Vite（百问V1/V2项目�?
- TailwindCSS + Shadcn/UI（组件库�?
- Recharts（数据可视化�?
- 单文件HTML（V4和多魔汰 - 简化部署）

**后端�?*
- Node.js 18+ + Express
- AI服务：Qwen API（主）→ DeepSeek �?OpenAI（降级）
- 邮件：Nodemailer（QQ邮箱免费方案�?
- 数据：JSON文件存储 + LocalStorage

---

## 重要设计决策

### 1. 多魔汰辩论系�?- 5阶段流程

**核心流程�?*
```
准备阶段 �?策划阶段 �?确认阶段 �?辩论阶段 �?交付阶段
   �?        �?        �?        �?        �?
用户输入  领袖规划  用户确认  多轮辩论  总结报告
话题背景  初步方案  补充信息  N轮对�? 委托人点�?
```

**16个角色分组：**
- **必选角色（6个）**：杠精、行业专家、买单客户、第一性原理、风险管理师、资源整合�?
- **可选角色（9个）**：时间穿越者、竞争对手、机会猎手、财务顾问、心理咨询师、法律顾问、技术极客、营销大师、哲学家
- **系统角色�?个）**：领袖（自动分配，组织辩论）

**文件位置�?* `duomotai/src/config/roles.js`

### 2. 百问自测 - 三版本演�?

- **V1**（`media-assessment-v1/`）：100个纯开放题，React项目，重思�?
- **V2**（`media-assessment-v2/`）：混合题型（单�?文本），优化体验
- **V4**（`media-assessment-v4.html`）：**主要使用版本**，单文件部署，包含完整功�?

**V4核心功能�?*
- 用户信息采集 + 新老用户判�?
- 100题五大维度答题（定位/用户/产品/流量/体系�?
- 答题质量实时检�?
- AI分析报告生成（多模型容错�?
- 邮件发送报�?
- 数据持久化（LocalStorage + 后端JSON�?

### 3. AI服务多模型容错机�?

**降级策略（server/services/aiService.js）：**
```
Qwen API �?DeepSeek API �?OpenAI API �?备用静态报�?
```

**调用示例�?*
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

# 邮件服务（推荐QQ邮箱免费方案�?
EMAIL_SERVICE=qq
EMAIL_USER=your_qq_email@qq.com
EMAIL_PASS=your_authorization_code  # 注意：是授权码，不是QQ密码

# 服务端口
PORT=3001
```

### 5. 多魔�?v3 - DeepSeek AI 集成与交互优化（2025-10-02�?

**AI 服务策略�?*
- **主调用模�?*：DeepSeek API（利用免费额度，成本优化�?
- **容错降级�?*：DeepSeek �?Qwen �?OpenAI �?JS fallback（基�?roles.js 模板�?
- **成本控制**�?0轮辩论目�?tokens < 5000

**角色可视化设计（v5.1 更新 - 8-3-5 分组方案 + ID 重新编排）：**
- **三层颜色编码�?6角色分组�?*�?
  - **核心�?�?*（蓝 #007AFF）：ID1第一性原理、ID2行业专家、ID3杠精专家、ID4买单客户、ID5上帝视角、ID6时间穿越、ID9潜在威胁、ID10供应体系
  - **外部�?�?*（紫 #AF52DE）：ID7 VC投资人、ID8竞争友商、ID11风险管理
  - **价值层5�?*（绿 #34C759）：ID12性能追求者、ID13情绪追求者、ID14社会认同者、ID15落地执行者、ID16领袖代理�?
- **必�?角色流线**：第一�?1)→时间穿�?6)→上帝视�?5)→杠�?3)→买单客�?4)→竞争友�?8)→落地执�?15)→领�?16)（箭头动画引导）
- **ID 编排原则**：按分组重新编排（核�?-6, 9-10、外�?-8, 11、价�?2-16），保持逻辑一致性和可维护�?
- **颜色优化**：外部层从橙�?#FF9500 改为 iOS Accent 紫色 #AF52DE，提升视觉美�?
- **核心层扩展原�?*：上帝视角和时间穿越具有战略分析核心价值，从外部层调整到核心层；潜在威胁和供应体系也因其对核心战略决策的重要性被纳入核心层（Task #066 调整），强化其在决策中的基础地位
- **波特五力轮盘**：竞�?威胁/供应/上帝/时间/风险，含大厂子项可视�?

**5阶段交互流程�?025-10-03 v5.2 更新 - 策划阶段交互优化）：**

1. **准备阶段（用户输入）**�?
   - 用户输入话题/背景
   - 选择角色�?个必选角色自动选中（金边标识），默认选中5个推荐可选角色（ID2行业专家/ID7 VC投资�?ID11风险管理/ID12性能追求�?ID13情绪追求者）
   - 选择轮数：默�?0轮（可调整）

2. **策划阶段（领袖规划初步方�?+ 委托人确认循环）**�?
   - **领袖规划**：领袖（ID16）调�?DeepSeek API 生成初步辩论策略
   - **策略内容**�?
     - 嵌入 RRXS 5P 方法论（Purpose/People/Product/Platform/Process�?
     - 10轮规划示例：定调→评估→用户→产品→流量→体系→AI赋能→变现→风险→行�?
     - 明确委托人互动节点：�?轮开场前、第5轮结束、第10轮总结�?
     - 字数限制�?00字（扩展�?00字）
   - **UI 显示**：策略内容优先显示（紧凑格式，移�?markdown 字样和多余空行）
   - **委托人交�?*�?
     - 策略内容显示后，弹出补充信息�?
     - 两个按钮�?
       - "�?确认，开始风暴辩�?（绿色渐变）�?直接进入辩论阶段
       - "提交补充意见"（橙色渐变）�?AI 重新规划策略 �?再次展示策略 �?委托人再次确认（支持循环�?
   - **技术实�?*�?
     - `adjustStrategy(feedback)` 方法 - 支持策略调整
     - `confirmAndStartDebate()` 函数 - 确认进入辩论
     - 领袖 System Prompt 完整重写（debateEngine.js �?65-213�?

3. **确认阶段（用户确认）**�?
   - 领袖开场介�?
   - 委托人根据策略给出补充信息或点评
   - 确认进入辩论阶段

4. **辩论阶段（N轮多角色辩论�?*�?
   - **每轮结构**�?
     a. 领袖主持（开场介绍本轮议题）
     b. 角色顺序发言（按必选流线顺序：ID1�?�?�?�?�?�?5�?6�?
     c. **委托人点评（总结前）** - 新增：委托人可在每轮总结前给予评论和补充
     d. 领袖总结（整合本轮要点）
   - 委托人可中途中�?
   - DeepSeek API 基于 prompt 模板生成角色发言

5. **交付阶段（总结报告�?*�?
   - 最后一轮聚焦执行方�?
   - 感谢弹窗 + 反馈表单
   - 生成报告（JSON/PDF：要点总结/行动计划/迭代建议�?
   - 委托人点�?+ 优化建议 + 后续计划

6. **模型迭代（待实现 - 任务 #076�?*�?
   - 根据辩论过程和委托人点评优化模型
   - 基于 DeepSeek API 調整參數（如 temperature、top_p�?
   - 记录迭代历史，支持行业细�?

**文件位置�?*
- 辩论引擎：`duomotai/src/modules/debateEngine.js`
- 角色配置：`duomotai/src/config/roles.js`
- AI 服务：`server/services/aiService.js`
- 主界面：`duomotai/index.html`

### 6. 多魔�?v5 - 用户调研与个性化系统�?025-10-03�?

**核心更新：登录后用户画像调研**

**用户调研流程�?*
1. **前页登录**：落地页（duomotai-landing-v5.html）点�?开始你的旅�?
2. **登录方式**：手机号 + 验证�?密码双模式（测试账号 13917895758 固定验证�?888888�?
3. **重定向主�?*：登录成功后跳转 `duomotai/index.html`
4. **画像检�?*：主页加载时检查用户基本信息（年龄�?性别/昵称/邮箱�?
5. **调研弹窗**：信息不完整时弹出苹果风格模态框
6. **数据存储**：保存到 sessionStorage + 后端 `/api/user/profile`
7. **AI 优化**：调研数据融�?DeepSeek 提示词（e.g., "针对{年龄段}用户..."�?

**调研表单字段�?*
- **年龄�?*（必填）：下拉选择�?8-25/26-35/36-45/46-55/56+�?
- **性别**（必填）：单选（�?�?其他�?
- **昵称**（必填）：文本输入（最�?0字）
- **邮箱**（必填）：邮箱验�?
- **进度�?*：实时显示填写进度（0-100%�?

**集成 rrxs.xyz 整体用户系统�?*
- **共享认证**：复用百问自测的 `userAuth.js`
- **统一数据�?*：用户画像跨模块通用（百�?多魔汰）
- **密码登录**：新�?`loginWithPassword(phone, password)` 方法
- **测试模式**：手机号 13917895758 自动识别为测试用�?

**UI 设计规范（苹果风格）�?*
- **颜色方案**：核心蓝 #007AFF、外部红 #FF3B30、价值绿 #34C759
- **模态框**：暖米白背景 #FFFAF0、圆�?16px、柔和阴�?
- **角色卡片**：图标替�?emoji、必选角色金边（4px border�?
- **响应�?*：TailwindCSS + SF字体、Material Design 卡片动画
- **加载优化**：目�?< 2�?

**文件结构（v5 新增/更新）：**
```
duomotai/
├── src/
�?  └── modules/
�?      ├── userProfile.js          # v5 新增 - 用户画像模块�?98行）
�?      ├── userAuth.js             # v5 更新 - 增加密码登录
�?      └── debateEngine.js         # v5 更新 - 集成用户画像�?AI 提示
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

**调研数据�?AI 提示中的应用示例�?*
```javascript
// debateEngine.js 构建提示词时
buildRoleSpeechPrompt(role, roundNumber, roundData) {
  const userProfileText = this.userProfile?.getProfileText() || '';

  return `${role.systemPrompt}

**当前辩论情况**�?
- 主议题：${this.state.topic}
- ${userProfileText}  // v5 新增：融入用户画�?
- 当前轮次：第 ${roundNumber}/${this.state.rounds} �?
...
`;
}
```

**测试要点�?*
1. 测试账号 13917895758 登录，验证码 888888
2. 调研模态弹出，填写完整信息
3. 启动辩论，检�?AI 输出是否包含个性化内容
4. 验证数据持久化（刷新页面不再弹出调研�?
5. 总耗时 < 90�?

### 7. 协同工作机制简化说明（2025-10-09�?

⚠️ **注意**: 原CPG/Viber协同机制及file-sync-guard监控系统已简化并归档�?`team/viber_archive/`，保留备用�?

**当前工作模式（CCR独立模式�?*�?
- CCR (Claude Code Doer) 采用独立工作模式
- 通过 >>record / >>wrap-up / >>zip 等触发词直接管理项目记忆
- 移除了pending-delta审批流程和文件锁机制
- 保留原子写入机制以确保文件写入安全�?

**项目记忆管理**�?
- 使用 progress-recorder agent 自动更新 progress.md
- 遵循"增量融合更新原则"，保留历史记录与上下�?
- 重要变更自动同步�?CLAUDE.md

---

**Last Updated**: 2025-10-11 15:32 (GMT+8) - CLAUDE.md 模块化：架构指南模块创建


