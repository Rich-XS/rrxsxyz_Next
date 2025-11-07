# 🔄 重启后操作检查清单

**创建时间**: 2025-10-29 23:45
**目的**: 验证 phantom 文件是否已清除，恢复 OneDrive 同步

---

## ✅ 步骤1：验证 Phantom 文件（重启后立即执行）

**打开 PowerShell**，运行：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\verify_nul_files.ps1"
```

**预期结果（成功）**:
```
Real files: 0
Phantom files (index cache): 0

✅ All clear! No phantom files found.
```

**如果仍有问题（失败）**:
```
Real files: 0
Phantom files (index cache): 2620 (或其他数字)
```

---

## ✅ 步骤2：根据验证结果采取行动

### 情况A：Phantom 文件 = 0（成功！）

**立即恢复 OneDrive**:
1. 点击任务栏 OneDrive 图标
2. 点击"恢复同步"（Resume sync）
3. 观察同步状态：
   - ✅ 如果正常同步 → **问题彻底解决！**
   - ⚠️ 如果再次提示重命名 → 见"情况C"

---

### 情况B：Phantom 文件显著减少（< 100 个）

**可以尝试恢复 OneDrive**:
1. 恢复 OneDrive 同步
2. 如果提示重命名错误：
   - 选择"跳过"或"忽略"
   - OneDrive 可能会自动放弃这些文件

---

### 情况C：Phantom 文件仍然很多（> 500 个）

**执行方案B - 重置 OneDrive**:

```powershell
# 1. 关闭 OneDrive
taskkill /F /IM OneDrive.exe

# 2. 重置 OneDrive（不会删除文件）
%localappdata%\Microsoft\OneDrive\onedrive.exe /reset

# 3. 等待 OneDrive 自动重启（约 30 秒）

# 4. 重新登录并配置同步文件夹
```

---

## ✅ 步骤3：最终验证

**OneDrive 恢复后，检查以下项目**:

1. **同步状态**:
   ```
   OneDrive 图标显示绿色对勾 ✓
   没有错误提示
   ```

2. **文件完整性**:
   ```powershell
   # 检查项目文件是否正常
   dir "D:\_100W\rrxsxyz_next" | findstr "duomotai server scripts"
   ```

3. **Claude 配置大小**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\check_claude_size.ps1"

   # 预期: < 5MB（正常）
   ```

---

## 📞 如果还有问题

**运行完整诊断**:

```powershell
# 1. 检查 Windows Search 状态
Get-Service -Name "WSearch" | Select-Object Status, StartType

# 2. 检查 Phantom 文件
powershell -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\verify_nul_files.ps1"

# 3. 检查 Claude 配置大小
powershell -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\check_claude_size.ps1"
```

**把上述三个命令的输出结果告诉 Claude，我会提供下一步方案。**

---

## 🎯 成功标准

| 检查项 | 成功标准 | 当前状态 |
|--------|---------|---------|
| Phantom 文件 | = 0 | 待验证 |
| OneDrive 同步 | 无错误 | 待验证 |
| Claude 配置 | < 5MB | ✅ 1.64MB |
| Windows Search | Disabled | ✅ 已禁用 |

---

## ⏰ 预计完成时间

- 验证 Phantom 文件: **1 分钟**
- 恢复 OneDrive: **1 分钟**
- 最终验证: **2 分钟**

**总计: 约 4 分钟** 🚀

---

**祝顺利！重启后见！** 🎉
