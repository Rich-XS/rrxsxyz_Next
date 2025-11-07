# progress-recorder.md - Draft update (for CCR review)

说明：此文档为建议性的 agent 写入协议更新草稿，用于在 CCR-Doer 完成当前编辑后合并。

主要变更点：

1) 写入协议（强制）

- Acquire lock: 调用 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Acquire -Name "progress-md-lock" -Timeout 30`
- Prepare content: 根据 agent 解析结果生成最终 Markdown 内容（包含 `Last Updated: YYYY-MM-DD HH:mm:ss`）
- Atomic write: 调用 Node atomicWrite 工具
  - `node scripts/atomicWrite.js --path "progress.md" --author "<agent-or-user>" --reason "<reason>" --content-file "<tmpfile>"`
- Release lock: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Release -Name "progress-md-lock"`
- Backup (optional but recommended): 调用 `scripts/TaskDone_BackUp_Exclude.ps1 -Keyword "<kw>" -TaskId "<id>" -Execute`

2) 回执与审计

- atomicWrite 将在 `.claude/audit.log` 写入：`[ISO_TIMESTAMP] WRITE <path> by <author> reason:<reason>`
- backup 脚本返回 `BACKUP_DONE:<YYYYMMDDHHmm>` 与 `SIZE:<bytes>`，agent 必须把回执写入 `progress.md` 的 `Notes` 区块并在 audit.log 记录一行摘要。

3) 必填参数约定

- 每次 agent 写入必须包含 `author`（string）, `reason`（short text）, `taskId`（若适用）。

4) 失败/回退策略

- 若 Acquire lock 超时（exit code 2），agent 应记录错误到 Notes 并提醒人工介入；
- 若 atomicWrite 失败，agent 应把变更内容保存到本地临时目录并记录路径与错误信息到 Notes；
- 若 backup 失败，则记录错误并继续返回 write 回执（若 write 成功）。

5) 迁移计划

- 初期：把此草稿放入 `.claude/drafts/` 供 CCR 审核；不启用任何 hook；所有脚本以可调用状态放入 `scripts/`。
- 审核通过后：把草稿合并回 `.claude/agents/progress-recorder.md` 的触发说明部分，并在 agent 实现中调用脚本。

---

提交人: Viber 共鸣协作者（草稿）
日期: 2025-10-08
