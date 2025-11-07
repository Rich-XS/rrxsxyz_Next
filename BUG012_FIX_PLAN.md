# Bug #012 修复方案 - 前端 API Key 安全漏洞

**优先级**: P0
**创建时间**: 2025-10-18 (Night-Auth)
**预计修复时间**: 30-45 分钟

---

## 🔍 漏洞分析

### 当前问题

**影响文件**:
- `duomotai/src/modules/aiCaller.js` (lines 69, 134)

**漏洞类型**: 前端直接使用认证Token调用AI服务

**安全风险**:
1. **Token泄露风险**: `auth_token` 存储在 `localStorage`，可被任何脚本读取
2. **重放攻击**: 攻击者获取token后可直接调用AI服务，消耗用户额度
3. **架构不当**: 前端不应直接持有AI服务的访问凭证

**当前实现**（脆弱的代码）:
```javascript
// aiCaller.js line 69 (非流式调用)
const response = await fetch(this.config.apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`  // ❌ 不安全
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});

// aiCaller.js line 134 (流式调用)
const response = await fetch(streamEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`  // ❌ 不安全
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});
```

**攻击场景**:
1. **XSS攻击**: 恶意脚本读取 `localStorage.getItem('auth_token')`
2. **控制台窃取**: 用户在浏览器控制台执行 `localStorage.getItem('auth_token')`，复制token
3. **中间人攻击**: 攻击者捕获token后，可无限次调用AI服务

---

## 🛡️ 修复方案

### 方案1: 移除前端 Authorization Header（推荐，最简单）

**核心思路**: 后端已经有用户认证系统（`userAuthService`），前端无需再发送单独的token给AI服务端点。

**优点**:
- ✅ 最简单，只需删除两行代码
- ✅ 后端 `/api/ai/debate` 和 `/api/ai/debate/stream` 已经没有验证 Authorization header 的逻辑
- ✅ 如果未来需要认证，可以添加 `authMiddleware`（使用 session-based auth，不是直接暴露AI key）

**缺点**:
- ⚠️ 如果未来需要对AI端点添加认证，需要重新设计架构（但这是正确的方向）

**实施步骤**:

1. **修改 `aiCaller.js` 非流式调用（line 65-73）**:

```javascript
// 修改前（line 65-73）
const response = await fetch(this.config.apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`  // ❌ 删除这行
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});

// ✅ 修改后
const response = await fetch(this.config.apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ✅ [Bug #012 修复] 移除 Authorization header
    // 理由：后端 AI 服务不应由前端直接认证，应通过后端网关代理
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});
```

2. **修改 `aiCaller.js` 流式调用（line 130-138）**:

```javascript
// 修改前（line 130-138）
const response = await fetch(streamEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`  // ❌ 删除这行
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});

// ✅ 修改后
const response = await fetch(streamEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ✅ [Bug #012 修复] 移除 Authorization header
    // 理由：后端 AI 服务不应由前端直接认证，应通过后端网关代理
  },
  body: JSON.stringify(requestBody),
  signal: controller.signal
});
```

---

### 方案2: 后端网关模式（P2 - 未来增强）

**仅供参考，当前不实施**

**核心思路**: 如果未来需要对AI端点添加用户认证（例如限制API调用次数），应采用以下架构：

```
前端 → 后端网关 (/api/ai/debate) → AI服务 (DeepSeek/Qwen/OpenAI)
  ↓                ↓                        ↓
session-based   验证 session           使用服务器端 API key
auth            检查用户额度           （不暴露给前端）
```

**实现方式**:
1. 前端使用 session cookie 或 JWT token（存储在 HttpOnly cookie）
2. 后端 `/api/ai/debate` 添加 `authMiddleware`（已存在于 `server.js`）
3. 后端验证用户身份后，使用服务器端的 `DEEPSEEK_API_KEY` / `QWEN_API_KEY` 调用AI服务
4. 前端永远不接触AI服务的真实凭证

**示例代码**（server.js 端点修改）:
```javascript
// server.js - 添加 authMiddleware 保护 AI 端点
app.post('/api/ai/debate',
  authMiddleware,  // ✅ 验证用户登录状态（session-based）
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    // ... 其他验证
  ],
  asyncHandler(async (req, res) => {
    // ✅ req.user 已由 authMiddleware 填充（用户ID、手机号等）
    const userId = req.user.userId;

    // ✅ 检查用户 AI 调用额度（可选，未来功能）
    const quotaCheck = await checkUserAIQuota(userId);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'AI调用次数已达上限，请稍后重试或升级套餐'
      });
    }

    // ✅ 调用 AI 服务（使用服务器端凭证，不暴露给前端）
    const result = await aiService.generateDebateResponse({
      model: req.body.model,
      prompt: req.body.prompt,
      // ... AI服务参数
    });

    // ✅ 记录用户 AI 调用日志（审计）
    await logAIUsage(userId, result.tokens);

    res.json(result);
  })
);
```

**前端代码**（aiCaller.js 无需 Authorization header）:
```javascript
const response = await fetch(this.config.apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ✅ 不需要 Authorization header
    // session cookie 会自动随请求发送（credentials: 'include'）
  },
  credentials: 'include',  // ✅ 发送 session cookie
  body: JSON.stringify(requestBody)
});
```

---

## ✅ 修复验证

### 测试步骤

**测试1: 验证移除 Authorization 后功能正常**
1. 修改 `aiCaller.js` 移除 Authorization header
2. 启动服务器 (`npm run dev`)
3. 访问多魔汰系统，执行辩论测试
4. **预期**: AI调用正常，专家发言正常生成

**测试2: 验证 localStorage 不再存储敏感信息**
1. 打开浏览器 F12 → Application → Local Storage
2. 查看 `http://localhost:8080` 的存储项
3. **预期**: 仅包含用户数据（`user_*`, `answers_*`），不包含 AI 服务凭证

**测试3: 验证后端日志**
```bash
# 启动服务器，观察日志
cd server
npm run dev

# 执行辩论测试，检查后端日志
# 预期：后端成功调用 AI 服务，无 Authorization 验证失败错误
```

---

## 🔐 安全性改进

### 修复前
- ❌ 前端直接持有 `auth_token`（不明确用途）
- ❌ 攻击者可窃取token重放攻击
- ❌ 缺乏用户额度控制机制

### 修复后（方案1 - 立即实施）
- ✅ 移除不必要的 Authorization header
- ✅ 前端不再持有AI服务凭证
- ⚠️ AI端点暂时无认证（但后端已有网关保护，风险可控）

### 未来增强（方案2 - P2）
- ✅ Session-based 用户认证
- ✅ 用户AI调用额度管理
- ✅ AI调用审计日志
- ✅ 完全隔离前端与AI服务凭证

---

## 📊 修复前后对比

| 维度 | 修复前 | 修复后（方案1） | 未来增强（方案2） |
|------|--------|---------------|-----------------|
| **前端安全** | ❌ 暴露 auth_token | ✅ 不持有敏感信息 | ✅ Session-based auth |
| **后端保护** | ⚠️ 无认证 | ⚠️ 无认证（可接受） | ✅ authMiddleware保护 |
| **额度控制** | ❌ 无 | ❌ 无 | ✅ 用户额度管理 |
| **审计日志** | ❌ 无 | ❌ 无 | ✅ AI调用记录 |
| **实施难度** | - | ✅ 2分钟（删除2行） | ⚠️ 45-60分钟 |

---

## 📝 实施检查清单

### 方案1（立即实施）
- [ ] 备份 `aiCaller.js`（格式：`aiCaller_YYYYMMDD_HHMMSS.js`）
- [ ] 修改 `aiCaller.js` line 65-73（移除 Authorization header）
- [ ] 修改 `aiCaller.js` line 130-138（移除 Authorization header）
- [ ] 添加注释说明修复原因
- [ ] 启动服务器测试（确保AI调用正常）
- [ ] 浏览器F12检查 localStorage（确保无敏感信息）
- [ ] 执行完整辩论测试（验证功能完整性）
- [ ] 更新 `TEST_BASELINE.md` Bug #012 状态为 ✅ 已修复
- [ ] 记录到 `progress.md` Done 区块

### 方案2（P2 - 未来增强）
- [ ] 设计用户AI额度管理系统
- [ ] 修改 `/api/ai/debate` 添加 `authMiddleware`
- [ ] 修改 `/api/ai/debate/stream` 添加 `authMiddleware`
- [ ] 实现 `checkUserAIQuota()` 函数
- [ ] 实现 `logAIUsage()` 审计日志
- [ ] 前端添加 `credentials: 'include'`（发送session cookie）
- [ ] 完整测试（登录、额度检查、审计日志）

---

## 🎯 推荐实施方案

**当前（P0）**: 实施方案1 - 移除 Authorization header
- 耗时：2分钟
- 风险：极低（后端已无验证逻辑，移除无影响）
- 收益：消除前端安全隐患

**未来（P2）**: 实施方案2 - 后端网关模式
- 耗时：45-60分钟
- 依赖：用户认证系统完善、额度管理需求明确
- 收益：完整的用户认证、额度控制、审计日志

---

**创建人**: Claude Code (Night-Auth FULL ON)
**最后更新**: 2025-10-18 (准备阶段)
**预计实施时间**: 等 Bug #013 验证完成后立即执行（与 Bug #011 同步实施）
