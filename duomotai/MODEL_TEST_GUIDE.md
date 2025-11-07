# 多魔汰系统 - AI 模型测试指南

## 📋 当前配置的模型（按优先级）

### 第1选项：DeepSeek（默认）
- **模型**: deepseek-chat
- **特点**: 成本低，中文原生支持
- **API**: https://api.deepseek.com
- **当前状态**: ✅ 默认启用

### 第2选项：AnyRouter-Balance (ARB)
- **模型**: claude-haiku-4-5-20251001
- **特点**: Claude 品质，中文支持良好
- **API**: http://3.0.55.179:6600
- **Token**: sk-BaiWen_RRXS
- **价格**: $1.00/1M (输入) + $5.00/1M (输出)

### 第3选项：Gemini-Balance
- **模型**: gemini-2.5-pro
- **特点**: Google 最新模型，多模态支持
- **API**: http://3.0.55.179:8000
- **Token**: sk-BaiWen_RRXS
- **价格**: $1.25/1M (输入) + $10.00/1M (输出)

---

## 🧪 测试方法

### 方法1：临时切换（推荐测试用）

修改 `duomotai/src/modules/aiCaller.js` 第 18 行：

```javascript
// 测试 DeepSeek（第1选项 - 默认）
model: config.model || 'deepseek',

// 测试 AnyRouter（第2选项）
model: config.model || 'anyrouter',

// 测试 Gemini（第3选项）
model: config.model || 'gemini',
```

### 方法2：动态切换（高级）

在浏览器控制台执行：

```javascript
// 切换到 AnyRouter
window.debateEngine.aiCaller.config.model = 'anyrouter';

// 切换到 Gemini
window.debateEngine.aiCaller.config.model = 'gemini';

// 切回 DeepSeek
window.debateEngine.aiCaller.config.model = 'deepseek';
```

### 方法3：URL参数（未来功能）

```
http://localhost:8080/duomotai/?model=anyrouter
http://localhost:8080/duomotai/?model=gemini
```

---

## 📊 测试要点

### 内容质量对比
- [ ] 逻辑连贯性
- [ ] 中文表达自然度
- [ ] 专业性和深度
- [ ] 响应长度（是否截断）

### 性能对比
- [ ] 首字响应时间
- [ ] 流式输出流畅度
- [ ] 完整响应时间
- [ ] 错误率

### 成本对比
- 查看控制台 Token 消耗日志
- DeepSeek: 最便宜
- AnyRouter: 中等价格，Claude 品质
- Gemini: 较贵，Google 最新技术

---

## 🔍 调试日志

所有模型调用都有详细日志，在浏览器控制台查看：

```
✅ [DeepSeek] 调用成功，内容长度: XXX 字符
✅ [AnyRouter] Claude Haiku 响应成功，内容长度: XXX 字符
✅ [Gemini] Gemini 2.5 Pro 响应成功，内容长度: XXX 字符
```

---

## 🎯 降级链

如果主模型失败，系统会自动降级：

```
DeepSeek → AnyRouter → Gemini → Qwen → OpenAI
```

---

## 📝 测试记录

### DeepSeek 测试结果
- 时间：
- 内容质量：
- 性能：
- 问题：

### AnyRouter (Claude Haiku) 测试结果
- 时间：
- 内容质量：
- 性能：
- 问题：

### Gemini 2.5 Pro 测试结果
- 时间：
- 内容质量：
- 性能：
- 问题：

---

## 💡 快速切换脚本

保存为书签，点击即可切换：

```javascript
// 书签1：切换到 AnyRouter
javascript:window.debateEngine.aiCaller.config.model='anyrouter';alert('已切换到 AnyRouter (Claude Haiku)');

// 书签2：切换到 Gemini
javascript:window.debateEngine.aiCaller.config.model='gemini';alert('已切换到 Gemini 2.5 Pro');

// 书签3：切回 DeepSeek
javascript:window.debateEngine.aiCaller.config.model='deepseek';alert('已切换到 DeepSeek');
```

---

最后更新：2025-10-18 21:35