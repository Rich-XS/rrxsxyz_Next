# 🚀 OneDrive 快速修复指南（5分钟）

## ⚡ 立即执行

### 步骤1: 找到修复脚本
```
打开文件管理器
导航到: D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\
找到文件: run_fix_onedrive.bat
```

### 步骤2: 双击执行
```
双击 run_fix_onedrive.bat
```

### 步骤3: 等待完成
```
PowerShell窗口会出现
自动执行所有修复步骤（1-2分钟）
看到 "按Enter键关闭" 时按Enter
```

### 步骤4: 验证成功
```
检查系统托盘（右下角时钟附近）
应该看到蓝色的 ☁️ OneDrive 图标
如果看到，说明成功！
```

---

## ❓ 如果问题未解决

### 方案A: 查看脚本输出
如果修复脚本执行后OneDrive还是未运行：
```
1. 再次双击 run_fix_onedrive.bat
2. 仔细阅读PowerShell输出的错误信息
3. 告诉Claude Code最后显示的错误
```

### 方案B: 手动启动OneDrive
```
按 Win + R
输入: OneDrive.exe /background
按Enter
```

### 方案C: Microsoft Store 安装
如果自动化失败：
```
1. 按 Win + S
2. 输入: Microsoft Store
3. 搜索: OneDrive
4. 点击 获取 或 安装
5. 等待2-3分钟
```

---

## 📊 问题诊断（如果需要）

### 检查1: OneDrive是否正在运行
```
按 Ctrl + Shift + Esc 打开任务管理器
在"进程"标签中搜索 "OneDrive"
如果列表中有 OneDrive ✅ 运行中
如果列表中无 OneDrive ❌ 未运行
```

### 检查2: 系统托盘中是否有OneDrive
```
看时钟（右下角）
应该看到这样的图标：☁️ (蓝色云)
点击它可以打开OneDrive
```

### 检查3: 文件系统检查
```
打开文件管理器
导航到: C:\Users\<你的用户名>\AppData\Local\Microsoft
应该看到 "OneDrive" 文件夹
```

---

## 🔴 D-103问题（Claude CLI循环）

**症状**: VSCode/VSCodium 中有大量Code.exe进程（9+个）

**原因**: 曾在Terminal中运行过 `claude --dangerously-skip-permissions`

**解决方案**:
```
✅ 使用IDE内置Claude扩展（右侧侧边栏）
❌ 不要在IDE中运行 claude 或 claude-code 命令
❌ 绝对禁止使用 --dangerously-skip-permissions 参数
```

---

## 💡 后续建议

1. **立即**: 执行修复脚本
2. **今天**: 检查.bat文件中是否有 `> nul`（应改为 `2>CON`）
3. **本周**: 使用IDE内置Claude（不使用CLI）
4. **长期**: 定期检查OneDrive运行状态

---

## 📞 需要帮助？

完成修复后，告诉Claude Code：
- ✅ 修复脚本已执行
- ✅ 系统托盘中看到OneDrive
- ❌ 仍未看到OneDrive

然后Claude Code会继续诊断。
