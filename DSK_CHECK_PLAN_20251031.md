# DSK 台式机检查规划（D-110）

**生成时间**: 2025-10-31 (LTP恢复完成后)
**目的**: 检查DSK系统中的nul文件残留和OneDrive状态
**现状**: \\DSKRRXS 网络路径暂时不可访问（可能原因见下）

---

## 🔴 网络连接问题诊断

### 可能原因
1. **DSK系统处于关闭/睡眠状态** ❌
   → 需要手动启动DSK台式机

2. **网络共享未启用** ❌
   → 需要在DSK上启用文件共享（Windows设置）

3. **防火墙阻止** ❌
   → 可能需要在DSK上配置防火墙规则

4. **IP地址变化** ❌
   → 需要确认DSK的当前IP地址

### 检查步骤（从LTP执行）
```cmd
# 1. 检查网络连接
ping DSKRRXS

# 2. 如果ping失败，尝试IP地址
ping 192.168.x.x  (需确认具体IP)

# 3. 检查SMB共享
net view \\DSKRRXS
```

---

## ✅ 预定检查清单（DSK在线后）

### [1] nul文件检查
```
检查范围:
  - C:\  (系统盘)
  - D:\  (数据盘)
  - E:\  (如有)

命令:
  dir C:\nul 2>CON
  dir D:\nul 2>CON

预期结果: 无nul文件（根据DSK已清理的说法）
```

### [2] OneDrive状态
```
检查项:
  - OneDrive进程状态
  - OneDrive文件位置
  - OneDrive同步状态

命令:
  tasklist | findstr onedrive
  reg query HKCU\Software\Microsoft\OneDrive
  sc query OneDrive
```

### [3] 批处理文件规范检查
```
检查对象: DSK的所有批处理文件 (*.bat)

规范: 遵循D-102（禁用 > nul，使用 2>CON）

命令:
  findstr /r ">nul\|> nul" *.bat

预期结果: 0个违规文件
```

### [4] 系统健康状态
```
检查项:
  - 磁盘空间
  - Windows Search索引服务
  - 文件系统完整性

命令:
  fsutil volume diskfree C:
  sc query WSearch
  chkdsk C: /scan
```

---

## 📋 关键信息

### DSK已知状态（根据用户说法）
- ✅ 已清理nul文件（参见 DSK_renming_nul_OK_Analysis_Solution.md）
- ✅ 批处理文件已修复（5个文件，12处语法）
- ⏳ 当前状态: 需要在线验证

### 关联文件
- `\\DSKRRXS\DSK_Share_D\OneDrive_RRXS\Onedrive\_AIGPT\__LTPnDSK_Comm\DSK_renming_nul_OK_Analysis_Solution.md`
- 记录了DSK的nul问题修复过程

---

## 🔧 解决方案

### 方案A: 启动DSK并建立网络连接
```
步骤1: 启动DSK台式机（如当前关闭）
步骤2: 在DSK上启用文件共享（Windows设置 → 高级共享选项）
步骤3: 从LTP重新ping检查: ping DSKRRXS
步骤4: 一旦连接恢复，Claude Code将自动执行完整检查
```

### 方案B: 直接在DSK上执行检查（速度更快）
```
在DSK的管理员CMD/PowerShell中执行:

# 检查nul文件
dir C:\nul 2>CON || echo 无nul
dir D:\nul 2>CON || echo 无nul

# 验证批处理规范
findstr /r ">nul" *.bat || echo 无违规文件

# 启用WSearch
net start WSearch

# 生成报告: DSK_RECOVERY_LOG_20251031.md
```

---

## ⏰ 预期时间

| 环节 | 耗时 |
|------|------|
| 启动DSK | 2-3分钟 |
| 建立网络连接 | 1-2分钟 |
| 远程检查 (方案A) | 5-10分钟 |
| 本地检查 (方案B) | 3-5分钟 |
| **总耗时** | **6-15分钟** |

---

## 🎯 下一步

**若DSK在线**: Claude Code 将执行以下操作
1. 远程扫描nul文件
2. 验证批处理规范
3. 检查OneDrive状态
4. 生成DSK恢复报告

**若DSK离线**:
1. 等待用户启动DSK
2. 重新执行网络连接检查
3. 一旦连接恢复，自动开始检查

---

**状态**: ⏳ 等待DSK在线 | 📍 准备就绪 | ⏱️ 时间充足

**附注**: LTP本机的恢复工作已100%完成，用户可以安心重启！DSK的检查可以在DSK启动后进行。
