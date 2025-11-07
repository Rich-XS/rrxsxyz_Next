# TRIGGER_COMMAND_MAPPING - XYZN (RRXSXYZ_Next) 项目版

**项目**: RRXSXYZ_Next (简称: XYZN / XYZNx)
**路径**: `D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next`
**设备**: LTP (Master: LOA)
**版本**: 1.0
**部署日期**: 2025-11-01 21:40 UTC+8
**来源**: GLOBAL_TRIGGER_COMMAND_MAPPING (DSK v1.0 + LTP同步)

---

## 📋 全局触发词 (Global Trigger Commands - 15个)

**适用范围**: XYZN项目可使用所有全局触发词

| # | 前缀 | 触发词 | 功能描述 | 执行Agent |
|---|:---:|--------|---------|-----------|
| 1 | `>>` | dualFsync | 双文件同步 (ideas.md + progress.md + __ideas_Global.md) | Progress-Recorder |
| 2 | `>>` | dualDsync | 双设备全量同步 (LTP↔DSK配置) | Master_Agent |
| 3 | `>>` | 3LayerSync | 三层架构同步 (U+G+L) | Master_Agent |
| 4 | `>>` | status | 系统状态检查 (进程/服务/端口) | System-Monitor |
| 5 | `>>` | wrap-up | 会话收尾处理 (生成日志+备份) | Logger |
| 6 | `>>` | RCCM | 根因分析 (10Why方法论) | Analyzer |
| 7 | `>>` | verify | 代码验证 (语法/功能/回归) | Verifier |
| 8 | `>>` | gemba | 现场实测 (API响应/数据流) | Tester |
| 9 | `>>` | archive | 项目归档 (完成文件+版本索引) | Archiver |
| 10 | `>>` | confgDsync | 配置双同步 (LTP-DSK一致性) | Config-Manager |
| 11 | `>>` | backupIncr | 增量备份 (变更文件快速同步) | Backup-Manager |
| 12 | `>>` | record | 增量记录 (当前会话追踪) | Logger |
| 13 | `>>` | recap | 生成阶段总结 (时间轴+里程碑) | Summarizer |
| 14 | `>>` | zipVE | 版本排除备份 (排除大文件) | Archiver |
| 15 | `>>` | chatlog | 保存对话记录 (ChatLogs目录) | Logger |

---

## 📌 项目专属触发词 (Project-Specific)

XYZN项目可定义自己的触发词，但需要在本文件中记录。

**定义规则**:
- 前缀: `>>xyzn-` (与全局区分)
- 示例: `>>xyzn-deploy`, `>>xyzn-sync-db`
- 需要在下方表格中登记

| # | 触发词 | 功能描述 | 执行Agent | 状态 |
|---|--------|---------|-----------|------|
| 101 | xyzn-deploy | XYZN项目部署流程 | XYZN_Agent | ⏳ 待定义 |
| 102 | xyzn-sync-db | 数据库同步 | XYZN_Agent | ⏳ 待定义 |

---

## 🔗 关联文件

- **源文件**: `D:\OneDrive_RRXS\OneDrive\_AIDesk\AGENT_COMMAND_TRIGGER_LIST.md` (DSK v1.0)
- **全局注册表**: `D:\OneDrive_RRXS\OneDrive\_AIGPT\__LTPnDSK_Comm\GLOBAL_PROJECT_REGISTRY.md`
- **UGL实现架构**: `D:\OneDrive_RRXS\OneDrive\_AIGPT\__LTPnDSK_Comm\UGL_Implementation_Architecture.md`

---

## ✅ 同步确认

| 检查项 | 状态 | 时间 | 确认人 |
|:---:|:---:|:---:|:---:|
| 15个全局触发词已复制 | ✅ | 2025-11-01 21:40 | LOA |
| 项目编目已更新 | ✅ | 2025-11-01 21:40 | LOA |
| UGL架构已文档化 | ✅ | 2025-11-01 21:40 | LOA |
| 待DOA确认接收 | ⏳ | - | DOA |

---

## 📝 使用示例

### 在XYZN项目中触发全局命令

```
用户: ">>status"
→ System-Monitor执行
→ 输出: LTP系统状态 + DSK系统状态 (如果已同步)

用户: ">>dualFsync"
→ Progress-Recorder执行
→ 同步: LTP progress.md ↔ DSK progress.md
       LTP ideas.md ↔ DSK ideas.md

用户: ">>recap"
→ Summarizer执行
→ 输出: XYZN项目当前阶段总结 (时间轴+里程碑)
```

---

**Last Updated**: 2025-11-01 21:40 UTC+8
**Status**: 🟢 Deployed to XYZN
**Lead_Master_Agent**: LOA
**Next Action**: 通知DOA同步确认
