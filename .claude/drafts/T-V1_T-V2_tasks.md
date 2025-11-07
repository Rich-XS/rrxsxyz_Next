# T-V1 & T-V2 任务草稿（供 CCR 审核）

目标：把 P0 中的两个最重要任务（T-V1 atomicWrite 与 T-V2 lock）以最小可审阅形式写清楚，便于 CCR-Doer 在任务切换时验证并执行。

一、T-V1 — atomicWrite (原子写入)
- 描述：实现 Node 脚本 `scripts/atomicWrite.js`，保证对 `progress.md` / `CLAUDE.md` 的原子替换（temp -> rename）并写审计日志 `.claude/audit.log`。
- 触发时机：在进度记录需要写回核心文件时（agent 执行 >>record、!需求变更、>>wrap-up 等）或人工确认的写入环节。
- 操作示例（agent -> CCR 审核流程）：
  1. agent 生成更新内容保存到临时文件 `tmp.md`
  2. agent 调用 lock（T-V2）取得锁
  3. agent 调用 `node scripts/atomicWrite.js --path progress.md --content-file tmp.md --author "progress-recorder" --reason "delta merge"`
  4. agent 调用 lock release
  5. agent 把 `WRITE_DONE:<path>` 回执写回 `progress.md` Notes 并在 audit.log 保留条目
- 给 CCR 的简短提示词：
  - "请在任务切换后检查 `progress.md` 的最新 delta 并确认——若无异议，回复 '同意写入'，agent 将执行原子写入并记录审计。"

二、T-V2 — lock (短期文件锁)
- 描述：PowerShell 脚本 `scripts/lock.ps1`，用于在 agent 写入前短期 acquire 锁并在完成后释放；避免 agent 并发写入冲突。
- 触发时机：在 agent 写入前自动调用；也可由人工在写入前手动 acquire（极少数情况下）
- 操作示例：
  - Acquire: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Acquire -Name "progress-md-lock" -Timeout 30`
  - Release: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Release -Name "progress-md-lock"`
- 给 CCR 的简短提示词：
  - "Agent 将在写入前自动获取锁；如需人工介入，请在开始前执行 Acquire 并在完成后执行 Release（或告知 agent 取消）。"

三、合并/执行建议与时机
- 最合适的触发点：当 CCR-Doer 在控制台完成当前任务并切换到下一个任务（task switch）时，CCR 可在切换后快速审阅 `progress.md` 的 pending delta，若无异议则发出简短回复触发 agent 写入（示例如上）。
- 我可以把 `scripts/atomicWrite.js`、`scripts/lock.ps1` 与本草稿一起放入仓库 drafts（已完成），并在你确认后把草稿段合并回 `.claude/agents/progress-recorder.md`。

四、风险提示
- 这些变更为非侵入性脚本与文档，默认不启用任何 git hook 或强制项；启用前请在 dev 环境进行一次 dry-run。

五、下步（我可以替你做）
- 写入合适位置（把该草稿合并到 `.claude/agents/progress-recorder.md` 的触发说明部分）→ 回复“写入合并”
- 我可以在 CCR 切换任务的时间点提供一次简短通知模板，CCR 回复后 agent 执行写入 → 回复“准备触发通知”我会提供一条可直接发送的提示词
