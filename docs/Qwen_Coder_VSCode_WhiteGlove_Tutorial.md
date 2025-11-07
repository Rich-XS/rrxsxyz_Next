# 📘 VS Code 通义灵码(Qwen Coder)完整小白教程

**难度级别**: ⭐ 极简
**预计时间**: 20分钟（完全上手）
**目标**: 让你在VS Code中使用通义灵码的AI功能

**中文优势**: 通义灵码对中文代码/注释的理解比Cursor更好！

---

## 你已经做对的事✅

根据你的截图，你已经：
- ✅ 在VS Code中安装了通义灵码插件
- ✅ 看到了账户配置界面（账户：rrxs1）
- ✅ 插件已激活（能看到配置菜单）

**现在要做的**：登录账户，然后使用。

---

## 第1步：登录阿里云账号（3分钟）

### 查找登录按钮

根据你的截图，VS Code已经显示了配置菜单。你需要：

1. **在VS Code左下角**，找到 **通义灵码图标**（阿里云logo）
2. **点击这个图标**，会展开菜单
3. **选择 "设置"** 或 **"登录"**

### 或者从命令面板登录

1. **按 `Ctrl+Shift+P`**（打开命令面板）
2. **搜索 "通义灵码"** 或 **"Qwen"**
3. **看到选项**：
   ```
   • Qwen Coder: Login
   • Qwen Coder: Settings
   • Qwen Coder: Open Chat
   ```
4. **点击 "Qwen Coder: Login"**

### 登录步骤

你会看到选择登录方式：

```
方式1: 支付宝账号登录（推荐，最快）
  ↓
  浏览器打开 → 支付宝登录 → 回到VS Code ✅

方式2: 淘宝账号登录
  ↓
  浏览器打开 → 淘宝登录 → 回到VS Code ✅

方式3: 手机号登录
  ↓
  输入手机号 → 输入验证码 → 登录 ✅
```

**选择支付宝（最快，30秒完成）**

### 预期结果

登录成功后，VS Code会显示：

```
❌ VS Code 左下角状态栏
┌─────────────────────────────┐
│ 🔧 (设置icon) 通义灵码     │
│ ✅ 已登录: rrxs1            │
│ 配额: 剩余 XXXX 次          │
└─────────────────────────────┘
```

---

## 第2步：打开项目（1分钟）

打开你的项目：
```
File → Open Folder
↓
D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next
↓
点击 Select Folder
```

---

## 第3步：使用通义灵码的4种方式

### 方式1️⃣：快捷键 Ctrl+Alt+Space（最常用）

这是通义灵码在VS Code中的主要快捷键：

**步骤**：
1. **打开一个代码文件**（比如 `duomotai/index.html`）
2. **光标放在你想要的位置**（或选中一些代码）
3. **按 `Ctrl+Alt+Space`**
4. **屏幕右侧会出现通义灵码的建议**：

```
┌──────────────────────────────┐
│  通义灵码建议                 │
│                              │
│  根据你的代码context生成建议  │
│                              │
│  [接受] [拒绝] [修改]        │
└──────────────────────────────┘
```

**工作流示例**：
```
你的代码：
  const users = data.filter(u => u.age > 18)

你想继续写，按 Ctrl+Alt+Space

通义灵码建议：
  .map(u => ({name: u.name, age: u.age}))

你可以：
✅ 接受这个建议
❌ 拒绝，用自己的代码
🔧 修改建议
```

### 方式2️⃣：右键菜单 → 生成代码

**步骤**：
1. **选中一段代码** 或 **把光标放在想要生成代码的位置**
2. **右键点击**
3. **看到菜单**：
   ```
   • 通义灵码：生成代码
   • 通义灵码：解释代码
   • 通义灵码：优化代码
   • 通义灵码：单元测试
   ```
4. **选择你需要的操作**

**具体例子**：
```
你的代码：
function getUserData(userId) {
  // 获取用户信息和订单列表

右键 → "通义灵码：生成代码"

通义灵码自动填充：
  const user = await db.user.findById(userId);
  const orders = await db.order.find({userId});
  return {user, orders};
}
```

### 方式3️⃣：打开AI对话框（Ctrl+Alt+I）

如果要进行更复杂的交互：

**步骤**：
1. **按 `Ctrl+Alt+I`**（打开Chat窗口）
2. **在对话框输入你的需求**（支持中文！）
3. **通义灵码会回答并建议代码**

**对话示例**：

```
你输入：
"帮我写一个函数，检查用户是否有管理员权限"

通义灵码回答：
"我推荐以下实现方案：

function isAdmin(user) {
  return user.role === 'admin' || user.permissions?.includes('admin');
}

解释：
1. 首先检查user.role是否为'admin'
2. 如果不是，检查permissions数组中是否包含'admin'
3. 使用?.操作符避免null检查

你还需要什么帮助吗？"
```

### 方式4️⃣：代码补全（智能提示）

这是最自动化的方式——通义灵码自动给出建议：

**工作流**：
1. **你在写代码，输入一部分**
2. **VS Code会显示灰色的补全建议**
3. **按 `Tab` 接受**，或 `Esc` 拒绝

**例子**：
```
你输入：
  const handleSubmit = async () => {

VS Code自动建议：
  try {
    const response = await fetch('/api/submit', {...})
    const data = await response.json()
    ...
  }

按Tab接受，或Esc拒绝
```

---

## 第4步：通义灵码 vs Cursor 对比

### 优势对比表

| 维度 | 通义灵码 | Cursor | 赢家 |
|------|---------|--------|------|
| **中文支持** | ⭐⭐⭐⭐⭐ 完美 | ⭐⭐⭐ 一般 | 🏆 通义灵码 |
| **在VS Code中** | ⭐⭐⭐⭐ 插件 | ❌ 需要替换编辑器 | 🏆 通义灵码 |
| **成本** | 📊 个人免费！ | 📊 个人免费！ | 平手 |
| **响应速度** | 0.7秒（国内快） | 0.5秒 | Cursor稍快 |
| **免费额度** | 100K token/月 | 500次/月 | 🏆 通义灵码 |
| **UI友好度** | 🇨🇳 中文优先 | 英文优先 | 🏆 通义灵码|
| **跨IDE** | 仅VS Code等 | 独立编辑器 | 平手 |

### 何时选择通义灵码

✅ **推荐用通义灵码**：
- 你更习惯在VS Code中工作（不想换编辑器）
- 你写很多中文注释和中文变量名
- 你要处理中文业务逻辑
- 你不想额外安装Cursor
- 你想节省硬盘空间

✅ **推荐用Cursor**：
- 你想要独立的AI IDE体验
- 你需要Cursor特有的Codebase理解功能
- 你计划长期投资AI编程（可能升级Pro）
- 你要同时处理多个项目

### 最终建议

**组合使用最优**：
- **主力**：VS Code + 通义灵码（日常开发）
- **专项**：Cursor（需要快速生成大量代码时）

---

## 第5步：快捷键速查表

```
┌──────────────────────┬─────────────────────────────┐
│     快捷键           │         功能                │
├──────────────────────┼─────────────────────────────┤
│ Ctrl+Alt+Space       │ 代码补全（最常用！）        │
│ Ctrl+Alt+I           │ 打开AI对话框                │
│ Ctrl+Alt+E           │ 解释选中的代码              │
│ Ctrl+Alt+O           │ 优化代码                    │
│ Ctrl+Alt+T           │ 生成单元测试                │
│ Ctrl+Shift+P → Qwen  │ 搜索通义灵码命令            │
│ Tab                  │ 接受代码补全                │
│ Esc                  │ 拒绝代码补全                │
└──────────────────────┴─────────────────────────────┘
```

**核心快捷键**（2个就够用）：
- `Ctrl+Alt+Space` - 代码补全
- `Ctrl+Alt+I` - AI对话

---

## 第6步：实战示例（最有用！）

### 示例1：快速生成API接口

**场景**：你要为rrxsxyz_next项目添加一个用户反馈API

**步骤**：

1. **打开 `server/routes.js`**

2. **输入基础框架**：
   ```javascript
   app.post('/api/feedback', async (req, res) => {
     //
   })
   ```

3. **光标放在注释处，按 `Ctrl+Alt+Space`**

4. **通义灵码自动建议**：
   ```javascript
   const {email, message, rating} = req.body;

   if (!email || !message || !rating) {
     return res.status(400).json({error: 'Missing fields'});
   }

   // 保存到数据库
   const feedback = await db.feedback.create({
     email, message, rating, createdAt: new Date()
   });

   res.json({success: true, id: feedback.id});
   ```

5. **你审视代码，按 `Tab` 接受或修改**

6. **完成！2分钟搞定，纯手工要10分钟**

### 示例2：中文注释的超强优势

**场景**：你用中文写注释，通义灵码自动理解

```javascript
// 验证用户是否是管理员，检查role字段和permissions数组

Ctrl+Alt+Space

通义灵码自动生成：
function isAdmin(user) {
  return user.role === 'admin' ||
         (user.permissions && user.permissions.includes('admin'));
}
```

**Cursor可能会生成错误的代码**（因为对中文理解不够），**但通义灵码完美理解**！

### 示例3：快速生成测试代码

```javascript
// 要测试的函数
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

右键 → "通义灵码：单元测试"

自动生成：
describe('calculateTotal', () => {
  it('should return sum of price * qty', () => {
    const items = [{price: 10, qty: 2}, {price: 20, qty: 1}];
    expect(calculateTotal(items)).toBe(40);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

---

## 第7步：设置和优化

### 打开设置

1. **命令面板**：`Ctrl+Shift+P`
2. **搜索**：`Qwen Settings`
3. **调整偏好设置**：

```
常用设置：
✅ 启用代码补全 - 推荐开启
✅ 启用代码高亮 - 推荐开启
✅ 自动补全延迟 - 默认500ms
❌ 发送诊断数据 - 可选关闭（隐私考虑）
```

### 配置快捷键

如果默认快捷键冲突，可以自定义：

1. **File → Preferences → Keyboard Shortcuts**
2. **搜索 "qwen"**
3. **修改快捷键**

---

## 第8步：常见问题

### Q1: 100K token/月是什么意思？

**A**: 相当于大约100份代码生成请求。
```
短代码生成（<10行）= 100-500 token
中等代码生成（10-50行）= 500-2000 token
大型代码生成（50+行）= 2000+ token

100K token = 约50-100个中等代码生成请求
```

个人开发者通常足够。如果不够，可升级到企业版。

### Q2: 通义灵码可以离线工作吗？

**A**: 不行，需要连接阿里云服务器。

### Q3: 我的代码会被保存吗？

**A**: 你的代码不会被保存。通义灵码只在当前session使用你的代码作为context，然后丢弃。

### Q4: 如何关闭代码补全建议？

**A**:
- 临时关闭：在补全出现时按 `Esc`
- 永久关闭：设置里禁用"启用代码补全"

### Q5: 支持哪些编程语言？

**A**: Python, JavaScript, TypeScript, Java, Go, C++, C#, Rust, PHP, SQL, HTML, CSS等50+语言

---

## 第9步：推荐的日常工作流

### 最高效的组合（vs纯手工快5倍）

```
场景：开发一个新的后端API

步骤1: 打开 server/routes.js
步骤2: 输入API框架：
       app.post('/api/new-feature', async (req, res) => {})

步骤3: Ctrl+Alt+Space → 通义灵码自动补全逻辑
步骤4: 审视代码，做小改动
步骤5: Ctrl+Alt+T → 自动生成测试
步骤6: npm test 验证
步骤7: 完成！

耗时: 5分钟（纯手工25分钟）
```

---

## 第10步：通义灵码 vs Claude Code CLI 的关系

### 关系说明

```
Claude Code CLI
  ↓ 是什么
  Anthropic的命令行工具（在终端中使用）
  ↓ 特点
  超强的200K上下文、Agent能力
  ↓ 适合
  大型重构、复杂算法设计

通义灵码（在VS Code中）
  ↓ 是什么
  阿里巴巴的VS Code插件（在编辑器中使用）
  ↓ 特点
  快速、中文优化、免费无限额度
  ↓ 适合
  日常代码补全、中文项目

推荐：两个都装，各用各的！
├─ 日常开发 → 通义灵码（快）
└─ 大型任务 → Claude Code CLI（强）
```

---

## 📞 快速参考卡

```
┌────────────────────────────────────┐
│    通义灵码快速参考卡              │
├────────────────────────────────────┤
│ 登录: Ctrl+Shift+P → Qwen Login    │
│ 快捷键: Ctrl+Alt+Space (补全)      │
│ 对话: Ctrl+Alt+I                   │
│ 成本: 个人免费100K token/月         │
│                                    │
│ 优势: 中文支持最好 + 在VS Code中   │
│ 最适合: 日常代码补全和中文项目     │
│                                    │
│ 搭配使用:                          │
│ ✅ 通义灵码（日常）+ Cursor（快）  │
│ ✅ 通义灵码 + Claude Code CLI      │
└────────────────────────────────────┘
```

---

**准备好了吗？现在就用通义灵码试试吧！🚀**

