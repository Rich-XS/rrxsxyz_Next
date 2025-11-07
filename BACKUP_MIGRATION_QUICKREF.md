# 备份目录迁移 - 快速参考卡片

**迁移日期**: 2025-11-05 | **状态**: ✅ 完成 | **Git提交**: cfb8b32

## 📍 新备份路径

```
项目根目录/backups/
├── rrxsxyz_next.zip
├── rrxsxyz_next_202510290319_V57.19_*.zip
└── ... (其他备份)
```

## 🔧 备份脚本使用

**新方式**（相对路径）:
```powershell
PowerShell -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "Test" -Execute
```

**旧方式**（已失效）:
```powershell
# ❌ 不再使用
PowerShell -ExecutionPolicy Bypass -File "D:\_100W\rrxsxyz_next\scripts\TaskDone_BackUp_Exclude.ps1"
```

## 📝 关键配置位置

| 配置项 | 文件 | 行号 |
|--------|------|------|
| 备份存储路径 | `.claude/agent_config.md` | L26 |
| 脚本输出目录 | `scripts/TaskDone_BackUp_Exclude.ps1` | L26 |
| 版本备份位置 | `CLAUDE.md` | L288 |
| Chatlog存储 | `.claude/agent_config.md` | L630 |

## ✅ 验证清单

- [x] 2个zip文件已迁入 backups/
- [x] 脚本使用相对路径
- [x] agent_config.md 已更新
- [x] CLAUDE.md 已更新
- [x] Git提交已完成

## 🚀 下次备份测试

```bash
# 方法1: 手动触发备份
>> zip&"Test"

# 方法2: 完成P0/P1任务（自动备份）

# 验证: 检查 backups/ 目录中是否有新文件
ls backups/rrxsxyz_next*.zip
```

---

**相关文档**: MIGRATION_BACKUP_DIRS_COMPLETE.md | **提交**: cfb8b32
