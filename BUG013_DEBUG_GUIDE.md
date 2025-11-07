# Bug #013 调试指引（用户测试版）

**创建时间**: 2025-10-18 01:35 (GMT+8)
**状态**: 已添加详细诊断日志，等待用户测试

---

## 🔍 当前状态

### 已完成的工作

1. ✅ **Bug #013 修复代码已实现** (StringDecoder UTF-8边界处理)
   - 文件: `server/services/aiService.js` (3个流式方法全部修复)
   - 修复方式: 使用 Node.js `StringDecoder` 自动缓冲不完整的多字节序列
   - 位置: `streamDeepSeekAPI`, `streamQwenAPI`, `streamOpenAIAPI`

2. ✅ **添加了详细诊断日志** (追踪乱码发生位置)
   - **前端**: `duomotai/src/modules/aiCaller.js`
     - 第124行: `🔥🔥🔥 [Bug #013 DEBUG] callStreaming() 被调用`
     - 第183行: `🔥🔥🔥 [Bug #013 DEBUG] 收到chunk (前50字符)`
   - **后端**: `server/server.js`
     - 第309行: `🔥🔥🔥 [Bug #013 DEBUG - Backend] aiService返回chunk (前50字符)`

3. ✅ **修复了 Bug #014** (用户输入验证 - dataValidator.js)

---

## 🚨 问题症状

**用户测试反馈**（2次）：
- 专家发言显示乱码：
  ```
  "作为则将从出发，效率\n\n媒体\n\n2有限是提升：方案\n\n5张。"
  "作为则将从出发，1质化国价值报告与3用户求单聚焦容形式营建议户0众"
  ```

**理论分析**：
- StringDecoder 修复代码存在（已验证9处）
- 服务器已重启
- 但乱码依然出现

**可能原因**：
1. **流式端点未被调用** → 使用了非流式端点 `/api/ai/debate`（没有修复）
2. **后端 SSE 发送 JSON 时再次产生边界问题** → `res.write(JSON.stringify(...))`
3. **Qwen API 配置问题** → 特定于 Qwen 模型的流式配置错误

---

## 📋 测试步骤（用户操作）

### 1. 启动服务器

**方式A（推荐）- 使用启动脚本**:
```bash
双击运行: D:\_100W\rrxsxyz_next\server\start_debug.bat
```

**方式B - 手动启动**:
```bash
cd D:\_100W\rrxsxyz_next\server
node server.js
```

**确认启动成功**:
- 看到: `🚀 Server running on port 3001`
- 健康检查: 浏览器访问 http://localhost:3001/health

---

### 2. 打开浏览器Console

1. **Chrome无痕模式**（推荐，避免缓存）
2. 访问: http://localhost:8080/duomotai/
3. **F12 打开开发者工具 → Console标签**

---

### 3. 执行测试辩论

1. 登录测试账号: `13917895758` / 验证码: `888888`
2. 填写默认内容（自动填充）
3. 输入话题（任意，< 100字符）
4. 点击"开始辩论"

---

### 4. 观察Console日志（关键！）

**期望看到的日志顺序**:

```
🔥🔥🔥 [Bug #013 DEBUG] callStreaming() 被调用！角色: 林峰, 端点: http://localhost:3001/api/ai/debate/stream, 模型: qwen
🔥🔥🔥 [Bug #013 DEBUG] 收到chunk (前50字符): "作为商业模式架构师，我需要从以下几个维度深入分析..."
🔥🔥🔥 [Bug #013 DEBUG] 收到chunk (前50字符): "贵公司的商业模式。\n\n首先，从价值主张来看，..."
...
```

**如果看到**:
- ✅ **callStreaming() 被调用** → 流式端点正常使用
- ✅ **收到的chunk是正常中文** → StringDecoder修复生效
- ❌ **收到的chunk是乱码** → 说明后端还有问题（可能是res.write或Qwen API）
- ❌ **没有看到 callStreaming() 日志** → 说明流式端点未被调用（非常重要！）

---

### 5. 检查专家发言显示

- **页面上的专家发言是否正常？**
- 如果console中chunk正常，但页面显示乱码 → 前端TextDecoder问题
- 如果console中chunk已经乱码 → 后端问题

---

## 📊 诊断矩阵

| Console日志 | 页面显示 | 结论 | 下一步 |
|------------|---------|------|--------|
| ✅ callStreaming被调用 + ✅ chunk正常 | ✅ 正常 | **修复成功！** | 继续修复Bug #011 |
| ✅ callStreaming被调用 + ✅ chunk正常 | ❌ 乱码 | 前端TextDecoder问题 | 修复前端显示逻辑 |
| ✅ callStreaming被调用 + ❌ chunk乱码 | ❌ 乱码 | 后端问题（res.write或Qwen API） | 修复后端SSE发送逻辑 |
| ❌ 没有callStreaming日志 | ❌ 乱码 | **流式端点未被调用** | 检查aiCaller配置或debateEngine调用 |

---

## 🛠️ 如果问题依然存在（给Claude Code的建议）

### 场景1: 流式端点未被调用

**检查项**:
1. `duomotai/src/config/aiConfig.js` 中的 `apiEndpoint` 配置
2. `aiCaller.call()` 是否正确判断 `streaming && onChunk`
3. `debateEngine` 是否传递了 `streaming: true`

**修复方向**:
- 强制使用流式端点（移除streaming参数判断）
- 或修复非流式端点 `/api/ai/debate` 也添加StringDecoder

---

### 场景2: 后端SSE发送JSON时产生边界问题

**问题位置**: `server/server.js` 第312-316行
```javascript
res.write(`data: ${JSON.stringify({
  type: 'chunk',
  content: chunk,  // 这里可能包含中文字符
  timestamp: new Date().toISOString()
})}\n\n`);
```

**修复方案**:
```javascript
// 使用Buffer确保原子性发送
const jsonData = JSON.stringify({
  type: 'chunk',
  content: chunk,
  timestamp: new Date().toISOString()
});
res.write(`data: ${jsonData}\n\n`, 'utf8');
```

---

### 场景3: Qwen API 流式配置错误

**检查项** (`server/services/aiService.js` 第797-895行):
1. `X-DashScope-SSE': 'enable'` 是否正确设置
2. `incremental_output: true` 是否启用
3. Qwen API URL 是否正确

---

## 📝 测试报告模板

请用户填写以下信息:

```
=== Bug #013 测试报告 ===

测试时间: ________

1. Console日志:
   [ ] 看到 "callStreaming() 被调用"
   [ ] 看到 "收到chunk" 日志
   [ ] chunk内容正常/乱码（请贴出前50字符）

2. 页面显示:
   [ ] 专家发言正常显示
   [ ] 专家发言显示乱码

3. 乱码样本（如有）:
   贴出console或页面的乱码内容

4. 其他观察:
   （任何异常现象）
```

---

## 📞 联系方式

测试完成后，请将测试报告和Console截图告诉Claude Code，我会根据诊断结果进一步修复。

---

**最后更新**: 2025-10-18 01:35 (GMT+8) by Claude Code (Night-Auth FULL ON)
