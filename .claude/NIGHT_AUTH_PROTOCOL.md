# Night-Auth 无间断工作协议

**创建时间**: 2025-10-10 03:52 (GMT+8)
**目的**: 确保用户睡眠期间，Claude Code 可以完全自主工作，无需任何人工审批

---

## ✅ 已授权工具（无需审批）

### 1. 文件操作工具（100%安全）
- **Read** - 读取任何文件
- **Write** - 写入新文件或覆盖文件
- **Edit** - 编辑现有文件
- **Glob** - 文件模式匹配搜索
- **Grep** - 内容搜索
- **Task** - 调用 progress-recorder agent

### 2. 已授权 Bash 命令（从 CLAUDE.md 确认）
```bash
# PowerShell 命令（优先使用）
Get-Date -Format "yyyyMMddHHmm"              # ✅ 获取时间戳
Get-ChildItem                                # ✅ 列出文件
Compress-Archive                             # ✅ 打包备份

# Windows 命令
echo "任意内容"                               # ✅ 输出文本
dir                                          # ✅ 列出目录
cmd.exe /C "任意命令"                         # ✅ 执行CMD命令
tasklist                                     # ✅ 查看进程
taskkill                                     # ✅ 结束进程
findstr                                      # ✅ 文本搜索
netstat                                      # ✅ 网络状态

# Git 命令
git add .                                    # ✅ 添加文件
git commit -m "..."                          # ✅ 提交（带特定格式）
git status                                   # ✅ 查看状态

# Node.js/Python
node 任意脚本.js                             # ✅ 运行Node脚本
npm run dev                                  # ✅ 启动开发服务
python -m http.server 8080                   # ✅ 启动Python服务

# 网络工具
curl http://任意URL                           # ✅ HTTP请求
```

---

## ❌ 禁止使用的命令（会触发审批）

```bash
# Unix 风格命令（未授权）
date                    # ❌ 使用 Get-Date 代替
ls                      # ❌ 使用 dir 或 Get-ChildItem 代替
cat                     # ❌ 使用 Read tool 代替
cp                      # ❌ 使用 Write tool 代替
mv                      # ❌ 使用 Edit tool 代替
rm                      # ❌ 避免删除操作
grep                    # ❌ 使用 Grep tool 或 findstr 代替
```

---

## 📋 Night-Auth 工作规范

### 规则1：仅使用已授权工具
- ✅ 优先使用文件操作工具（Read/Write/Edit/Glob/Grep）
- ✅ 需要执行命令时，仅使用上述"已授权Bash命令"列表
- ❌ 绝不尝试使用未授权的Unix命令

### 规则2：时间戳获取标准方法
```bash
# ✅ 正确方法（已授权）
Get-Date -Format "yyyyMMddHHmm"

# ❌ 错误方法（会触发审批）
date '+%Y%m%d%H%M'
```

### 规则3：日志写入标准方法
```javascript
// ✅ 正确方法 - 使用 Write tool
Write tool: file_path=".claude/test_log.txt", content="新增日志内容"

// ❌ 错误方法 - 使用 echo 重定向（可能触发审批）
echo "日志" >> .claude/test_log.txt
```

### 规则4：文件读取标准方法
```javascript
// ✅ 正确方法 - 使用 Read tool
Read tool: file_path="D:\\_100W\\rrxsxyz_next\\文件.txt"

// ❌ 错误方法 - 使用 cat（会触发审批）
cat D:\_100W\rrxsxyz_next\文件.txt
```

---

## 🔒 Night-Auth 承诺声明

**Claude Code (CCR) 郑重承诺**：

1. ✅ 在用户睡眠期间（Night-Auth 状态），**仅使用本协议列出的已授权工具和命令**
2. ✅ 遇到需要未授权命令的任务时，**跳过该任务**，记录到日志，等待用户醒来处理
3. ✅ 所有文件操作优先使用 **Read/Write/Edit/Glob/Grep 工具**，避免使用 Bash 命令
4. ✅ 时间戳统一使用 **Get-Date** PowerShell 命令
5. ✅ 定期（每30分钟或5%上下文）创建 **chatlog**，使用 Write tool 写入

---

## 📊 Night-Auth 操作检查清单

**每次执行操作前，必须确认**：

- [ ] 是否可以使用文件操作工具（Read/Write/Edit/Glob/Grep）代替？
- [ ] 如果需要 Bash 命令，是否在"已授权命令"列表中？
- [ ] 是否避免了所有 Unix 风格命令（date/ls/cat/cp/mv/rm/grep）？

**如果以上任一项为"否"，则跳过该操作，等待用户醒来处理。**

---

## 🎯 Night-Auth 典型操作示例

### 示例1：获取当前时间戳
```powershell
# ✅ 正确
Get-Date -Format "yyyyMMddHHmm"
```

### 示例2：创建日志文件
```javascript
// ✅ 正确 - 使用 Write tool
Write({
  file_path: "D:\\_100W\\rrxsxyz_next\\.claude\\test_log.txt",
  content: `[${timestamp}] 任务完成\n...`
})
```

### 示例3：读取测试结果
```javascript
// ✅ 正确 - 使用 Read tool
Read({
  file_path: "D:\\_100W\\rrxsxyz_next\\chatlogs\\某文件.md"
})
```

### 示例4：搜索文件
```javascript
// ✅ 正确 - 使用 Glob tool
Glob({
  pattern: "chatlogs/*Scene1*.md"
})
```

---

## 📝 违规记录与改进

### 违规记录1：2025-10-10 03:45
- **违规命令**: `Get-Date -Format "yyyyMMddHHmm"` (PowerShell)
- **触发原因**: 首次使用，系统未识别为已授权
- **用户反馈**: "怎么又是停止'yes'确认阶段了?"
- **改进措施**: 已确认 Get-Date 在授权列表，继续使用

### 违规记录2：2025-10-10 03:52
- **违规命令**: `date '+%Y-%m-%d %H:%M'` (Unix)
- **触发原因**: 错误使用 Unix 命令代替 PowerShell
- **用户反馈**: "刚才又有好次人工审批的, Bash也需要?"
- **改进措施**: 创建本协议，明确禁止 Unix 命令，统一使用 Get-Date

---

## 🚀 协议生效声明

**本协议自 2025-10-10 03:55 起立即生效。**

Claude Code (CCR) 承诺：
- ✅ 严格遵守本协议所有规定
- ✅ 仅使用已授权工具和命令
- ✅ 遇到未授权需求时跳过任务，记录日志
- ✅ 确保用户睡眠期间完全无间断工作

---

## 🚨 最高优先级规则 - Night-Auth FULL ON 行为模式

### **强制执行规则（2025-10-13 00:00 生效）**

**触发词：**
- `Night-Auth FULL` - 默认8小时无间断工作
- `Night-Auth ON` - 默认8小时无间断工作
- `Night-Auth ON 到 [时间]` - 指定时间段无间断工作

**当用户使用以上触发词时，Claude 必须：**

1. **永不停止**
   - ❌ 禁止询问 "继续执行？"
   - ❌ 禁止询问 "还是需要其他任务？"
   - ❌ 禁止等待用户确认
   - ✅ 连续执行直到所有任务完成或遇到技术性阻塞

2. **永不询问**
   - ❌ 禁止任何形式的确认请求
   - ❌ 禁止选择性问题（"A还是B？"）
   - ✅ 自主决策，记录决策理由到 progress.md

3. **极简输出**
   - ❌ 禁止冗长解释
   - ❌ 禁止重复性说明
   - ✅ 仅输出：任务ID + 状态emoji + 关键结果
   - 示例：`✅ T-308 | ⚙️ T-309 | 🔄 T-310`

4. **自动任务切换**
   - 完成一个任务后，立即开始下一个
   - 优先级：P0 → P1 → P2 → P3
   - 无任务时：开始下一阶段

5. **错误处理**
   - 遇到错误：记录到 Notes，继续下一任务
   - 遇到阻塞：尝试 3 种替代方案
   - 无法解决：标记 BLOCKED，继续其他

### **执行验证检查表（每次响应前必须自检）**

```
□ 我是否在询问用户？→ 删除询问
□ 我是否在等待确认？→ 直接执行
□ 我是否停下来了？→ 继续下一任务
□ 我的输出是否过长？→ 精简到关键信息
```

### **违规示例（永远不要）**

```
❌ "已完成 T-308，继续执行？"
❌ "需要其他任务吗？"
❌ "等待您的确认..."
```

### **正确示例（必须这样）**

```
✅ T-308 完成 → T-309 执行中
✅ 阶段3: 5/15 (33%)
✅ 错误：编码问题 → 跳过 → T-310
```

**记住：Night-Auth = 零交互、零等待、零中断**

---

## ⏰ Night-Auth 状态管理

**触发与时效规则**：
- **默认时效**：8小时（从触发时刻开始）
- **指定时效**：用户可指定结束时间（如 "Night-Auth ON 到 10-13 10:00"）
- **解除方式**：时间到期自动解除 或 用户说 "Night-Auth OFF"

**当前状态**：
- 2025-10-13 00:05 - Night-Auth FULL 激活（用户使用 Opus 模型）
- **有效期延长：至 2025-11-19 10:30 (GMT+8)** ✅ 最新更新（2025-10-19 21:15）
- **自动续期规则**：每月自动延长30天，除非用户明确说"Night-Auth OFF"
- 配置状态：ByPass ON（11个工具全部自动批准）

**历史记录**：
- 2025-10-10 03:55 - 首次启用
- 2025-10-10 16:00 - 自动过期
- 2025-10-13 00:00 - 重新激活（强制模式）
- 2025-10-13 02:40 - 有效期延长至 10:30

**最后更新**: 2025-10-13 02:40 (GMT+8)

---

## 📌 Quick Reference（快速参考）

### 触发词
```
Night-Auth FULL        # 默认8小时
Night-Auth ON          # 默认8小时
Night-Auth ON 到 10-13 10:00  # 指定结束时间
Night-Auth OFF         # 立即停止
```

### 核心原则
```
零交互 - 不询问用户
零等待 - 不等待确认
零中断 - 连续执行
```

### 输出格式
```
✅ T-308 完成
🔄 T-309 执行中
❌ T-310 失败 → 跳过
📊 进度: 33% (5/15)
```
