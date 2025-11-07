# 模块接口契约标准文档

**项目**: RRXS.XYZ - 多魔汰辩论系统
**版本**: v1.0 (Post D-66)
**生成时间**: 2025-10-20
**维护者**: Gemba Test Agent

---

## 📖 文档说明

本文档定义了多魔汰系统各模块之间的数据传递契约，确保跨模块调用的一致性和可维护性。

**适用场景**:
- 新功能开发时查询接口规范
- 代码审查时验证契约遵守情况
- 调试跨模块问题时定位数据流

---

## 🔐 Contract 1: userAuth ↔ localStorage

### 职责说明
- **模块**: `src/modules/userAuth.js`
- **功能**: 管理用户登录/注册状态
- **数据持久化**: 将用户信息写入 localStorage

### 写入契约

| 键名 | 数据类型 | 写入时机 | 示例值 |
|------|---------|---------|--------|
| `userPhone` | String | 登录成功后 | `"13917895758"` |
| `last_login_phone` | String | 登录成功后 | `"13917895758"` |
| `userProfile_{phone}` | JSON String | 用户配置更新时 | `{"nickname":"xxx","email":"xxx"}` |

### 实现位置
- **userAuth.js:95-96** (登录时写入)
  ```javascript
  localStorage.setItem('last_login_phone', phone);
  localStorage.setItem('userPhone', phone);
  ```

### 验证规则
- ✅ 必须在登录成功回调中写入
- ✅ 两个键必须同时写入
- ✅ 数据必须为非空字符串

---

## 🔍 Contract 2: localStorage ↔ init.js

### 职责说明
- **模块**: `init.js`
- **功能**: 初始化角色选择、话题背景填充
- **数据来源**: 从 localStorage 读取用户状态

### 读取契约

| 键名 | 读取位置 | 默认值 | 用途 |
|------|---------|--------|------|
| `userPhone` | init.js:14, 178, 267 | `null` | 判断用户登录状态 |
| `last_login_phone` | init.js:418 | `""` | 自动填充登录手机号 |
| `debateTopic_{phone}` | init.js (推断) | `""` | 恢复历史话题 |
| `debateBackground_{phone}` | init.js (推断) | `""` | 恢复历史背景 |

### 实现位置
- **init.js:14-20** (获取当前用户)
  ```javascript
  const userPhone = localStorage.getItem('userPhone');
  const isTestUser = userPhone === '13917895758';
  ```

### 验证规则
- ✅ 读取前必须检查 `null` 或空字符串
- ✅ 测试账号 `13917895758` 必须特殊处理
- ✅ 未登录时不应读取用户相关数据

---

## 🔄 Contract 3: userAuth → init (initializeUser)

### 职责说明
- **触发模块**: `userAuth.js`
- **执行模块**: `init.js`
- **功能**: 登录后刷新话题/背景显示

### 方法契约

**方法签名**:
```javascript
async initializeUser(phone: string): Promise<void>
```

**调用时机**:
- 用户登录成功后（userAuth.js:101-107）
- 页面首次加载时（如已登录）

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `phone` | String | ✅ | 用户手机号 |

**返回值**: 无（Promise<void>）

### 实现位置
- **userAuth.js:101-107** (调用方)
  ```javascript
  if (window.initManager && typeof window.initManager.initializeUser === 'function') {
      await window.initManager.initializeUser(phone);
  }
  ```

- **init.js (推断)** (实现方)
  ```javascript
  async initializeUser(phone) {
      // 从localStorage恢复话题/背景
      const topic = localStorage.getItem(`debateTopic_${phone}`);
      const background = localStorage.getItem(`debateBackground_${phone}`);
      // 填充到输入框
  }
  ```

### 验证规则
- ✅ 必须检查 `window.initManager` 是否存在
- ✅ 必须使用 `try-catch` 捕获错误
- ✅ 失败时不应阻塞登录流程

---

## 💾 Contract 4: userProfile 数据持久化

### 职责说明
- **模块**: `src/modules/userProfile.js`
- **功能**: 管理用户配置的本地/远程同步
- **重试机制**: 失败时写入重试队列

### 写入契约

| 键名 | 数据类型 | 写入时机 | 生命周期 |
|------|---------|---------|---------|
| `userProfile_retryQueue` | JSON Array | 同步失败时 | 直到同步成功 |
| `userProfile_{phone}` | JSON Object | 配置更新时 | 永久 |

### 实现位置
- **userProfile.js:489, 511** (读取重试队列)
  ```javascript
  const queue = JSON.parse(localStorage.getItem('userProfile_retryQueue') || '[]');
  ```

### 验证规则
- ✅ 必须使用 `JSON.parse()` 安全解析
- ✅ 必须提供默认值 `'[]'`
- ✅ 写入前必须验证数据结构

---

## 📋 localStorage 键名规范总览

### 标准命名规则

**格式**: `<模块前缀>_<数据类型>_<用户标识(可选)>`

**已注册键名**:

| 键名 | 所属模块 | 数据类型 | 用户隔离 | 说明 |
|------|---------|---------|---------|------|
| `userPhone` | userAuth | String | ❌ | 当前登录用户手机号 |
| `last_login_phone` | userAuth | String | ❌ | 上次登录手机号（自动填充） |
| `userProfile_{phone}` | userProfile | JSON | ✅ | 用户配置数据 |
| `userProfile_retryQueue` | userProfile | JSON Array | ❌ | 同步失败重试队列 |
| `debateTopic_{phone}` | init | String | ✅ | 辩论话题（推断） |
| `debateBackground_{phone}` | init | String | ✅ | 辩论背景（推断） |

### 新键名注册流程

1. **检查命名规范**: 必须符合 `<模块前缀>_<数据类型>_<用户标识>` 格式
2. **冲突检查**: 查询本表确认无重名
3. **更新本文档**: 在表格中新增条目
4. **代码实现**: 在对应模块中实现读写逻辑
5. **单元测试**: 编写测试验证读写正确性

---

## 🔧 开发指南

### 如何添加新的跨模块数据传递

**示例**: 新增"用户偏好语言"功能

1. **定义契约**:
   - 键名: `userPreferences_language`
   - 写入模块: userProfile.js
   - 读取模块: init.js, aiCaller.js

2. **实现写入** (userProfile.js):
   ```javascript
   localStorage.setItem('userPreferences_language', 'zh-CN');
   ```

3. **实现读取** (init.js):
   ```javascript
   const userLang = localStorage.getItem('userPreferences_language') || 'zh-CN';
   ```

4. **更新本文档**: 在"已注册键名"表格中新增条目

5. **测试验证**:
   - 单元测试: 验证读写正确性
   - 集成测试: 验证跨模块数据传递

---

## ⚠️ 常见陷阱与规避方法

### 陷阱1: 读取未初始化的数据

**错误示例**:
```javascript
const userPhone = localStorage.getItem('userPhone');
// 直接使用 userPhone.length 可能报错（null.length）
```

**正确做法**:
```javascript
const userPhone = localStorage.getItem('userPhone');
if (userPhone && userPhone.length > 0) {
    // 安全使用
}
```

---

### 陷阱2: JSON 数据未安全解析

**错误示例**:
```javascript
const data = JSON.parse(localStorage.getItem('someKey'));
// localStorage为空时报错
```

**正确做法**:
```javascript
const data = JSON.parse(localStorage.getItem('someKey') || '{}');
```

---

### 陷阱3: 忘记用户隔离

**错误示例**:
```javascript
localStorage.setItem('debateTopic', topic); // 所有用户共享同一个话题
```

**正确做法**:
```javascript
const userPhone = localStorage.getItem('userPhone');
localStorage.setItem(`debateTopic_${userPhone}`, topic);
```

---

## 📊 契约遵守情况检查清单

开发新功能时，请对照以下清单验证：

- [ ] 新增 localStorage 键名已注册到本文档
- [ ] 读取前检查了 `null` 或空字符串
- [ ] JSON 数据使用了安全解析（提供默认值）
- [ ] 需要用户隔离的数据已加入 `{phone}` 后缀
- [ ] 跨模块调用前检查了方法/对象是否存在
- [ ] 失败情况有 fallback 处理（不阻塞主流程）
- [ ] 编写了单元测试验证数据传递正确性

---

## 🔍 调试指南

### 问题: 数据写入但读取为 `null`

**排查步骤**:
1. 检查键名是否一致（拼写/大小写）
2. 检查是否在不同作用域（如 iframe）
3. 使用浏览器 DevTools → Application → Local Storage 确认数据存在

---

### 问题: 跨模块方法调用失败

**排查步骤**:
1. 检查方法是否挂载到 `window` 对象
2. 检查调用时机（是否在模块加载完成后）
3. 检查是否使用了 `try-catch` 捕获错误

---

### 问题: 测试用户数据被普通用户覆盖

**排查步骤**:
1. 检查是否正确使用了 `{phone}` 后缀
2. 检查是否在登录/注销时清理了旧数据
3. 使用 `localStorage.clear()` 清空后重新测试

---

## 📝 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2025-10-20 11:10 | v1.1 | D-66完全实施版：详细补充userPhone关键流程、renderRoles时序、话题自动保存 | Claude Night-Auth |
| 2025-10-20 | v1.0 | 初始版本（基于 D-66 验证） | Gemba Test Agent |

---

## 🎯 D-66 决策实施细节（v1.1更新）

### 核心修复：userPhone 的初始化时序

**问题根源**: 在D-66实施初期，renderRoles()执行时userPhone仍为null，导致测试用户逻辑失效

**解决方案**: 严格规定初始化顺序，确保userPhone在renderRoles()前已设置

#### 关键初始化顺序（必须遵守）

```
1️⃣ 页面加载
   ↓
2️⃣ UserAuth.init()
   ├─ 读取 localStorage['auth_token']
   ├─ 读取 localStorage['user_info']
   └─ 设置 localStorage['userPhone'] ← 【关键】恢复旧登录

3️⃣ InitManager.renderRoles()
   ├─ 读取 userPhone ← 【必须已设置】
   ├─ 检测 userPhone === '13917895758' (测试用户)
   └─ 选中角色 [1, 2] (仅测试用户)

4️⃣ InitManager.initializeUser(userPhone)
   ├─ 读取 duomotai_topic_{userPhone}
   └─ 读取 duomotai_background_{userPhone}

5️⃣ 页面完全就绪
```

#### D-66 修复清单

- ✅ **R1**: userAuth.js init()中设置userPhone（恢复旧登录）
- ✅ **R2**: userAuth.js login()中设置userPhone（新登录）
- ✅ **R3**: login()成功后立即调用renderRoles()（刷新角色选择）
- ✅ **R4**: 话题/背景使用键名格式 `duomotai_topic_${phone}` 和 `duomotai_background_${phone}`
- ✅ **R5**: 话题/背景输入防抖保存（1000ms延迟，避免频繁写入）
- ✅ **R6**: textRateController初始化时currentLevelIndex=9（10x=20字/秒）

### 测试用户特殊处理

**Phone**: `13917895758`

**行为差异**：

| 功能 | 测试用户 | 普通用户 |
|------|---------|---------|
| 角色选择 | 只显示2个 [1,2] | 显示8个+ |
| 默认文字速度 | 10x（20字/秒） | 10x（20字/秒） |
| 取消必选角色 | ❌ 不允许 | ❌ 不允许 |
| 话题/背景保存 | ✅ 用户隔离 | ✅ 用户隔离 |

#### 代码实现位置

- **检测**: init.js:178 `const isTestUser = userPhone === '13917895758'`
- **角色**: init.js:217-225 `if (isTestUser) { [1, 2].forEach(...) }`
- **保护**: init.js:286-289 `if (isTestUser && testUserRequiredRoles.includes(roleId))`
- **登录钩子**: userAuth.js:106-109 `renderRoles()` 调用

---

**维护建议**: 每次新增跨模块数据传递时，必须更新本文档的"已注册键名"表格和对应契约定义。
