# 🚀 OneDrive安全模式清理 - 快速参考卡片

## ⚡ 超快速版（只需4步）

### 步骤1：进入安全模式
```
开始菜单 → 电源 → 按住Shift + 点"重启"
→ 疑难解答 → 启动设置 → 重启
→ 等待黑屏显示"安全模式"
```

### 步骤2：打开管理员PowerShell
```
Ctrl + Shift + Esc → 任务管理器
文件 → "运行新任务（管理员）"
输入：powershell → 勾选管理员 → OK
```

### 步骤3：运行清理脚本
```powershell
cd D:\_100W\rrxsxyz_next\scripts
.\safe_mode_cleanup.bat
```

### 步骤4：重启回到正常模式
```
脚本完成后 → 开始 → 电源 → 重启
```

---

## 🎯 关键提示

| 要点 | 说明 |
|------|------|
| **F8不行？** | 用开始菜单 → 电源 → Shift+重启方式 |
| **PowerShell不行？** | 安全模式中直接打开D:\路径找到脚本，双击运行 |
| **脚本报错？** | 这是正常的，只要显示"已删除 ✓"就成功了 |
| **黑屏多久？** | 2-3分钟等待是正常的，不要中途关机 |
| **验证成功？** | 重启后运行：`Get-ChildItem -Path 'D:\_100W\rrxsxyz_next' -Recurse -Filter 'nul' \| Measure-Object` 应显示0 |

---

## ✅ 成功指标

完成后，你会看到：
```
LocalAppData OneDrive: 已删除 ✓
ProgramFiles OneDrive: 已删除 ✓
nul文件数: 0
```

然后：
1. ✅ 重启回到正常Windows
2. ✅ OneDrive目录完全消失
3. ✅ nul文件全部清除
4. ✅ 准备好启动VSCodium开发

---

## 📱 打不开？用这个

如果在安全模式中找不到脚本或PowerShell：

1. **按Windows键 + E** → 文件管理器
2. **地址栏输入：** `D:\_100W\rrxsxyz_next\scripts`
3. **找到 `safe_mode_cleanup.bat`**
4. **双击运行**
5. **黑色窗口弹出，等待完成**

---

## 🆘 真的卡住了？

**强制关机重启：**
```
按住电源键 10 秒钟
→ 电脑会强制关机
→ 松开，再按一下电源键启动
→ 应该会进入自动修复
→ 选"继续使用Windows"
```

---

**准备好了吗？开始吧！** 💪
