# 🚀 RRXS.XYZ 项目启动指南

## 📋 快速开始

### 统一启动方式（推荐）

**从项目根目录运行主启动脚本：**

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File start.ps1
```

**交互式菜单：**
```
╔════════════════════════════════════════╗
║     RRXS.XYZ 项目启动管理器           ║
╚════════════════════════════════════════╝

请选择启动方式:

  [1] 仅启动前端 (端口 8080)
  [2] 仅启动后端 (端口 3001)
  [3] 启动全栈 (前端 + 后端)
  [4] 查看端口状态
  [5] 清理端口进程
  [0] 退出
```

---

## 🎯 启动选项详解

### 选项1：仅启动前端

```powershell
# 直接运行前端脚本
powershell -ExecutionPolicy Bypass -File start_frontend.ps1
```

**功能：**
- 启动Python HTTP服务器
- 端口：8080
- 提供静态文件服务

**访问地址：**
- 首页：http://localhost:8080/
- 多魔汰：http://localhost:8080/duomotai/
- 百问自测：http://localhost:8080/baiwen.html

**适用场景：**
- 前端开发调试
- 静态页面测试
- 不需要后端API功能

---

### 选项2：仅启动后端

```powershell
# 直接运行后端脚本
powershell -ExecutionPolicy Bypass -File start_backend.ps1
```

**功能：**
- 启动Node.js Express服务器
- 端口：3001
- 提供API服务

**访问地址：**
- API根路径：http://localhost:3001/
- 健康检查：http://localhost:3001/health

**适用场景：**
- 后端开发调试
- API测试
- 不需要前端界面

---

### 选项3：启动全栈（推荐）

**功能：**
- 同时启动前端（8080）和后端（3001）
- 前端在当前窗口运行（前台）
- 后端在新窗口运行（后台）

**停止服务：**
- 前端：按 `Ctrl+C` 或关闭窗口
- 后端：关闭后端窗口或在窗口中按 `Ctrl+C`

**适用场景：**
- 完整功能测试
- 用户验收测试
- 演示展示

---

### 选项4：查看端口状态

**显示信息：**
```
📡 端口 8080 (前端):
   TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    12345

📡 端口 3001 (后端):
   TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    67890
```

**用途：**
- 检查服务是否正在运行
- 查找进程ID（PID）
- 诊断端口占用问题

---

### 选项5：清理端口进程

**警告：⚠️ 此操作将终止占用端口的进程**

**安全机制：**
- 使用 `safe_port_cleanup.ps1`（D-68规则）
- 仅清理本项目端口（8080, 3001）
- 保护其他项目进程

**适用场景：**
- 服务异常退出导致端口占用
- 需要重启服务
- 端口冲突解决

---

## 🛠️ 脚本功能详解

### start_frontend.ps1

**自动检查：**
- ✅ 当前目录是否为项目根目录
- ✅ 端口8080占用情况
- ✅ Python环境（要求3.7+）
- ✅ 关键文件存在性（index.html, duomotai/index.html, baiwen.html）

**智能处理：**
- 端口占用 → 提示清理旧进程
- Python未安装 → 提供下载链接
- 关键文件缺失 → 警告并询问是否继续

---

### start_backend.ps1

**自动检查：**
- ✅ 当前目录是否为项目根目录
- ✅ 端口3001占用情况
- ✅ Node.js环境
- ✅ npm依赖安装状态
- ✅ .env环境配置文件

**智能处理：**
- 端口占用 → 调用安全清理脚本（D-68）
- Node.js未安装 → 提供下载链接
- 依赖未安装 → 自动运行 `npm install`
- .env缺失 → 警告但继续启动

---

### start.ps1（主脚本）

**菜单驱动：**
- 交互式选择启动方式
- 递归菜单设计（返回主菜单）
- 友好的错误提示

**全栈模式特性：**
- 后端启动在独立窗口（不阻塞）
- 前端启动在当前窗口（方便查看日志）
- 3秒延迟确保后端先启动

---

## 📝 使用场景示例

### 场景1：开发测试

```powershell
# 开发者A：前端开发
powershell -ExecutionPolicy Bypass -File start_frontend.ps1

# 开发者B：后端开发（另一终端）
powershell -ExecutionPolicy Bypass -File start_backend.ps1
```

### 场景2：完整测试

```powershell
# 启动主脚本，选择 [3] 启动全栈
powershell -ExecutionPolicy Bypass -File start.ps1
→ 选择 3
```

### 场景3：Playwright自动化测试

```powershell
# Terminal 1: 启动全栈服务
powershell -ExecutionPolicy Bypass -File start.ps1
→ 选择 3

# Terminal 2: 运行Playwright测试
npm run playwright:test
```

### 场景4：端口冲突解决

```powershell
# 方式1：使用主脚本清理
powershell -ExecutionPolicy Bypass -File start.ps1
→ 选择 5（清理端口进程）

# 方式2：使用安全清理脚本（D-68规则）
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1
```

---

## ⚠️ 常见问题

### Q1: PowerShell执行策略错误

**错误信息：**
```
无法加载文件 start.ps1，因为在此系统上禁止运行脚本
```

**解决方案：**
```powershell
# 临时允许（推荐）
powershell -ExecutionPolicy Bypass -File start.ps1

# 或永久修改（需要管理员权限）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q2: 端口被占用

**错误信息：**
```
⚠️  端口 8080 已被占用
```

**解决方案：**
- 选项A：脚本会提示是否清理，输入 `y` 自动清理
- 选项B：手动清理（使用主脚本选项5）
- 选项C：使用 `safe_port_cleanup.ps1`

### Q3: Python/Node.js未安装

**错误信息：**
```
❌ 错误: 未找到Python/Node.js
```

**解决方案：**
- Python: https://www.python.org/（要求3.7+）
- Node.js: https://nodejs.org/（要求18+）

### Q4: 依赖未安装

**后端依赖：**
```powershell
cd server
npm install
```

**前端依赖：**
- 无需额外安装（静态文件服务）

### Q5: .env文件缺失

**警告信息：**
```
⚠️  警告: 未找到 .env 文件
某些功能可能无法正常工作
```

**解决方案：**
```bash
# 复制模板文件
cp server/.env.example server/.env

# 编辑配置
# 参考 CLAUDE.md 中的环境变量说明
```

---

## 🔒 安全规则（D-79规则）

**重要：Claude Code不会自动启动服务器**

根据D-79决策（2025-10-25）：
- ❌ Claude Code禁止使用 `run_in_background: true` 启动服务
- ✅ 用户手动启动服务（使用本文档中的脚本）
- ✅ 工作结束前，Claude Code会关闭所有后台进程
- ✅ 关闭后通知用户："✅ 端口已释放，请手动启动服务"

**例外情况：**
- Gemba-Agent测试：仅测试期间临时启动，测试完毕立即关闭

---

## 📚 相关文档

- [项目README](./README.md)
- [CLAUDE.md - 项目配置指南](./CLAUDE.md)
- [Playwright测试指南](./tests/README.md)
- [端口保护规则（D-68）](./CLAUDE.md#rule-5)

---

## 🎯 最佳实践

### 开发流程

```
1. 启动服务
   → powershell -ExecutionPolicy Bypass -File start.ps1
   → 选择 [3] 启动全栈

2. 开发调试
   → 前端：修改代码，刷新浏览器
   → 后端：修改代码，nodemon自动重启

3. 测试验证
   → npm run playwright:test

4. 停止服务
   → 前端窗口：Ctrl+C
   → 后端窗口：Ctrl+C
```

### 版本备份流程

```
1. 测试通过后立即备份
   → >>zip&"关键词"

2. 验证备份文件
   → 检查 D:\_100W\ 目录下的 .zip 文件

3. 记录版本号
   → 更新 progress.md Backups 区块
```

---

**文档版本：** v1.0
**创建时间：** 2025-11-04 05:30 GMT+8
**维护者：** Claude Code Agent
**状态：** ✅ 统一启动脚本已配置完成
