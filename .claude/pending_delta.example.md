# pending_delta 示例（metadata + patch blocks）

---
metadata:
  author: "agent-or-doer"
  timestamp: "2025-10-08T04:00:00Z"
  section: "A.2 / 16-role-grid"
  target_file: "D:\\_100W\\rrxsxyz_next\\progress.md"
  mode: "merge"   # append|merge|replace
  id: "delta-20251008-001"

---
# Description
简要说明本次 delta 的目的与影响范围（1-2 行）

---
# Patch (可包含多个 block)
## block-1: insert_after: "## 📋 TODO（待办任务）"
```patch
+ ### A.2 页面索引（新增）
+ - Header: 页面标题 + 版本号 + 最后更新
+ - 问题 / 困境
+ - 背景
+ - 16 角色卡 (grid 4x4) ...
```

## Acceptance (CCR 必须核对)
- [ ] 展示完整 patch 内容（已读）
- [ ] 核对 target_file 最后 20 行
- [ ] 回复精确短语： 同意写入（author: CCR，reason: task switch review）
