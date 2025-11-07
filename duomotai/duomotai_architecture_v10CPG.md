附录（替换）：CPG 完全接管 — 全面执行计划（取代 CCR/Doer）
====

前言 — 变更的范围与承诺
----
用户明确要求：CPG 将作为唯一的 Doer（完全接管 CCR 的职责），独立完成 v10 相关的所有工程任务、运维动作与文档交付。当前工作阶段限制为：仅更新并完善本文件 `duomotai_architecture_v10CPG.md`；不对其它仓库文件执行任何自动化写入或远端推送，除非另外得到明确授权。文档中陈述的所有流程、脚本、分支策略与操作步骤，是 CPG 在获得必要运行凭据与授权后将执行的完整方案。

重要假设与前提（必须在执行前验证）
----
1) 凭证与权限：CPG 将需要访问代码仓库的写入/推送权限、CI 配置权限以及部署环境凭证（若要执行部署）。在未提供这些凭证前，CPG 仅能在本地/私有分支进行实现与验证。
2) 敏感信息与密钥管理：所有 API keys、邮件凭据、云存储凭证由项目 owner 或 CCR 提供并通过安全渠道（例如 Vault、GitHub Secrets）注入 CI/CD。CPG 不会把凭证硬编码到仓库。
3) 风险容忍度：CPG 独立执行时将严格遵守审计、快照与回滚流程；任何绕过审计或直接覆盖核心文件的操作必须有书面紧急授权。

一、职能替换清单（CCR -> CPG）
----
下表列出 CCR 作为 Doer 时承担的职责，以及 CPG 接管后的对应执行策略。

职责（原 CCR） -> CPG 接管策略
- 拉取/合并/推送主分支 -> CPG 在 feature 分支上开发、通过 CI 后创建 PR，若被授权则由 CPG 合并并推送；否则由项目 owner 最终合并。
- 本地/远程写入 `progress.md` / `CLAUDE.md` -> CPG 使用 pending-delta + atomicWrite 流程，生成审阅包并在获得授权后写入并备份；若拥有权限，可直接在受保护分支上执行写入并在 CI 通过后合并。
- 启用/禁用 Git hooks -> CPG 提交 `.githooks/` 内容，但只在得到允许时修改 `core.hooksPath` 配置。
- 启动/重启本地服务（node/nginx） -> CPG 在测试或生产环境执行启动脚本，需持有相应凭证与访问权限。
- 部署到生产 -> CPG 跟随 CI/CD 流程进行自动化部署；若缺乏生产凭证，则仅在 staging 环境测试。
- 紧急回滚 -> CPG 将执行快照回滚脚本并在 `.claude/emergency_log.md` 中记录操作细节与通信记录。

二、完整执行流程（CPG 全权执行版）
----
目标：提供一套从本地开发到远端合并、再到部署（可选）的完整流程，确保每一步都有审计、回滚与验证点。

步骤概览：
1) 创建受控分支：`cpg/v10/<ticket>-<ts>`。
2) preflight：生成并记录快照（`.claude/preflight_<ts>.md`），记录 HEAD、文件行数、运行进程与环境信息。
3) 开发：实现 scripts、templates、roles.json、duomotai 前端/后端改动。
4) 本地验证：在 isolated test 文件（如 `progress.test.md`）上运行 atomicWrite smoke-test，生成 `.claude/test_run_<ts>.md`。
5) 本地 commit：清晰的 commit message（含 tag `[CPG-DOER]` 与 `DO_NOT_PUSH` 标记，除非要求 push）。
6) CI 提交（可选）：如果获得远程权限，push 到远端 feature 分支触发 CI，运行 lint、unit tests、smoke-tests。
7) 合并策略：
   - 若由 CPG 获授权合并：通过保护的 CI gate（lint+tests+smoke）自动合并到 `main` 或 `release` 分支，并创建 Tag（`v10-rc1`）。
   - 若未授权：创建 Draft PR 并把审阅包通知项目 owner / CCR。
8) 部署（若授权）：在 CI 成功后触发部署 pipeline（staging -> smoke -> production），并记录部署回执到 `.claude/deploy_receipts/`。

三、分支与 CI/CD 策略（建议，供即时执行或交付）
----
- Branching Model:
  - `main` / `production`：受保护，仅在 CI 通过并经授权后合并
  - `develop`：集成分支（可选）
  - `cpg/v10/*`：CPG 的工作分支，命名规则 `cpg/v10/<task>-<ts>`
- CI Gates (必需在合并前通过): lint -> unit tests -> smoke-tests (atomicWrite + pre-commit simulation) -> integration tests (if any)
- Secrets: CI 使用 GitHub Actions Secrets 或项目提供的 Vault；CPG 将提供 `.github/workflows/ci-smoke.yml` 模板以便 Owner 配置。

四、凭证与密钥管理（安全要求）
----
1) 不把任何凭证写入仓库；所有敏感值应通过 CI secret 或运维 Vault 注入。
2) 在本地测试时使用占位符或本地环境变量文件 `.env.local`（加入 `.gitignore`）并记录示例为 `.env.example`。
3) 任何需要生产凭证的操作需书面授权并由项目 owner 提供一次性或长期凭证。

五、审批替代策略（CPG 的决策授权规则）
----
为保证项目不被阻塞且仍保持可审计性，CPG 将采用分级授权规则：
- Level 0（无需授权）: 文档、脚本样例、roles.json 等非核心写入；CPG 可直接在 feature 分支提交并生成审阅包。
- Level 1（需要 Owner 同意）: 修改 `progress.md` / `CLAUDE.md` 的 non-critical 更新（例如添加说明、append notes） — CPG 创建 Draft PR 并在 PR 描述中加入完整审计条目，等待 Owner 或 CCR 在 72 小时内审批；若超时且问题为安全/可用性修复，按紧急流程推进。
- Level 2（需要 Owner 明确书面授权）: 覆盖性修改、敏感配置变更、启用 hooksPath、生产部署、自动 push 权限。CPG 必须在 `.claude/emergency_authorization.md` 中记录并获得书面授权（电子邮件或聊天记录）才可执行。

六、审计、备份与回滚（必执行）
----
每次对核心文件或生产环境的改动，CPG 必须执行：
1) 写前快照到 `.claude/snapshots/`。
2) atomicWrite（或等价原子操作）并记录 `.claude/audit.log`（JSON 单行）。
3) 执行备份脚本 `scripts/TaskDone_BackUp_Exclude.ps1` 并记录 `BACKUP_DONE` 回执。
4) 触发 CI（若已配置），并在 `.claude/deploy_receipts/` 中记录部署日志与回滚命令。
5) 若发生异常，立即回滚到最近 snapshot 并在 `.claude/emergency_log.md` 记录完整回退步骤与通信记录。

七、验收标准与交付里程碑（CPG 完整交付）
----
交付包（CPG 完整交付时包含）：
- scripts/atomicWrite.js（注释、参数说明、使用范例）
- scripts/lock.ps1（Acquire/Release/Status/Timeout）
- .githooks/pre-commit（示例与启用说明）
- .claude/pending_delta/*.md（待写入 delta）
- duomotai/src/data/roles.json + roles.schema.json
- .claude/test_run_<ts>.md（smoke-test 输出）
- .claude/preflight_<ts>.md（初始化快照）
- .claude/audit.log 条目与 .claude/snapshots

交付验收条件：
1) 所有脚本在本地 smoke-test 通过（atomicWrite、lock、diff-checker）。
2) 审阅包包含完整快照、审计与回滚说明。
3) 若 CPG 持有合并权限：CI green 且部署验证通过后，PR 可合并并 Tag 发布；若无权限：提交 Draft PR 并通知 owner。

八、操作示例（命令片段，供复制执行）
----
注：以下命令为 Windows PowerShell 风格，供 CPG 在本地或 CI 里使用（仅示例，当前阶段不要直接在主分支执行）。

```powershell
# 创建工作分支
git checkout -b cpg/v10-add-atomicWrite-20251009

# 生成 preflight 快照
mkdir -Force .claude/preflight_snapshots
Get-Content progress.md | Measure-Object -Line | Out-File .claude/preflight_snapshots/progress_lines.txt
git rev-parse HEAD > .claude/preflight_snapshots/HEAD.txt

# Acquire lock
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Acquire -Name "progress-md-write" -Timeout 30

# 执行 atomic write （示例）
node scripts/atomicWrite.js --path progress.test.md --content-file .claude/pending_delta/test-20251009.md --author "CPG" --reason "smoke test"

# Release lock
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lock.ps1 -Release -Name "progress-md-write"

# 生成审阅包
Compress-Archive -Path .claude/pending_delta/*.md, scripts/*, duomotai/src/data/* -DestinationPath .claude/review/cpg_review_20251009.zip
```

九、时间表（示例，CPG 全权接管时）
----
- Day 0（准备）: preflight 快照、分支创建（1-2 小时）
- Day 0-1（实现）: 实现 scripts、roles.json、pending_delta 模板（3-6 小时）
- Day 1（自测）: 运行 smoke-tests 并修复失败（1-4 小时）
- Day 1-2（审阅）: 生成审阅包，若获授权则由 CPG 合并并触发 CI（0.5-2 小时）

十、风险与缓解（重申并补充）
----
- 风险：权限滥用导致重要历史被覆盖。缓解：写前快照、阈值校验、审计日志、分级授权。
- 风险：凭证泄露或 misconfig。缓解：不在 repo 提供密钥，使用 CI secrets/Vault。
- 风险：自动化合并引入回归。缓解：CI gate 必须包含 smoke-tests 与回滚脚本。

十一、沟通与回执（操作后务必完成）
----
每次关键操作后（如写入核心文件、合并 PR、生产部署），CPG 必须：
1) 在 `.claude/audit.log` 写入 JSON 回执条目
2) 在 `.claude/deploy_receipts/` 或 `.claude/review/` 放置审阅包与回滚说明
3) 通过项目既定的通知渠道（邮件/IM）把回执与审阅包发送给 owner 与维护组

十二、当前阶段限定（再次明确用户要求）
----
当前阶段，CPG 仅对 `duomotai_architecture_v10CPG.md` 进行内容完善与计划更新；不会对仓库其它文件或远端仓库执行写入、push 或部署操作，直到得到明确的额外授权。

—— End of CPG 完全接管方案 —

附加：阶段 I — Lite 本地可跑通版本（目标：在本地完整跑通写入/备份/审计全流程）
====

目标说明
----
本阶段 I（Lite）为最快可交付的本地端完整流程演示：CPG 在本地分支创建和运行最小脚本集，使用测试目标文件（`progress.test.md`）执行从 pending-delta -> Acquire Lock -> Atomic Write -> Snapshot -> Audit -> Backup（可选）-> Release 的全流程，产生可供审阅的回执与审阅包。整个流程不涉及远端 push、CI 或生产凭证，适合在 1-2 小时内完成并交付审阅包。

前置条件（本地准备）
- 在 Windows 环境，已安装 Node.js（18+）、npm，PowerShell 可用。
- 当前工作区为仓库根目录（`d:\_100W\rrxsxyz_next`）。
- 当前无须 CCR 授权（仅本地演示），但所有提交须在 feature 分支并标注 DO_NOT_PUSH。

要创建/检查的最小文件清单（CPG 在本地分支上创建）
- `scripts/atomicWrite.js` — 最简 Node 实现（本文档前文已有草稿）。
- `scripts/lock.ps1` — PowerShell 文件锁脚本（前文已有草稿）。
- `.claude/pending_delta/test_pending_delta.md` — 示例 delta（append 模式）。
- `progress.test.md` — 测试目标文件（复制 `progress.md` 内容或简短示例）。
- `.claude/test_run_<ts>.md` — smoke-test 输出记录（由 CPG 生成）。
- `.claude/audit.log` — 审计日志（atomicWrite 会追加）。
- `.claude/snapshots/` — 写前快照目录（atomicWrite/CPG 脚本会产出快照）。

阶段 I Lite 执行步骤（逐步、可复制）
----
建议先在 PowerShell 中执行以下步骤（示例命令，替换 `<ts>` 和路径中的反斜杠）：

1) 创建本地工作分支（仅本地，不 push）

```powershell
git checkout -b cpg/phase1-lite-$(Get-Date -Format "yyyyMMddHHmm")
```

2) 准备测试文件与 pending-delta（示例）

```powershell
mkdir -Force .claude\pending_delta
Set-Content -Path .claude\pending_delta\test_pending_delta.md -Value "# Pending Delta Test`nappend: 测试用条目，由 CPG-Lite 写入" -Encoding UTF8
# 准备 progress.test.md（测试目标）
Set-Content -Path progress.test.md -Value "# progress.test.md\nTest content: initial state" -Encoding UTF8
```

3) Acquire Lock

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\lock.ps1 -Acquire -Name "progress-md-write-test" -Timeout 30
```

4) 快照（写前备份）

```powershell
mkdir -Force .claude\snapshots
Copy-Item -Path progress.test.md -Destination ".claude\snapshots\progress.test.md.$((Get-Date).ToString('yyyyMMddHHmmss')).bak" -Force
```

5) 执行原子写入（把 pending_delta 的内容写入 progress.test.md）

```powershell
node scripts\atomicWrite.js --path progress.test.md --content-file .claude\pending_delta\test_pending_delta.md --author "CPG-Lite" --reason "phase1-lite smoke test"
```

预期输出：控制台应显示 "WRITE_DONE <path>"，并在 `.claude/audit.log` 追加一行 JSON。

6)（可选）触发本地备份脚本（若存在并愿意执行）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\TaskDone_BackUp_Exclude.ps1 -Keyword "phase1-lite" -TaskId "phase1-lite" -Execute
```

7) Release Lock

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\lock.ps1 -Release -Name "progress-md-write-test"
```

8) 记录测试回执

将本次运行的关键输出写入 `.claude/test_run_<ts>.md`，示例内容包括：锁获取 result、atomicWrite 输出、`.claude/audit.log` 的最新行、备份回执（若执行）。

示例 `.claude/test_run_<ts>.md` 内容要点：
- ts: 2025-10-09T12:34:00Z
- lock_acquire: PASS
- atomic_write: WRITE_DONE: progress.test.md
- audit_log_entry: { ... 最新 JSON ... }
- snapshot: .claude/snapshots/progress.test.md.20251009123456.bak
- backup: BACKUP_DONE:202510091240 SIZE:xxxxx (若执行)
- result: SUCCESS

验证点（验收）
----
1) `progress.test.md` 包含 pending delta 的新增内容（append 或替换视 mergeStrategy）。
2) `.claude/audit.log` 新增一条记录，记录中包含 author、reason、file 与时间戳。
3) `.claude/snapshots/` 有备份文件存在。
4) `.claude/test_run_<ts>.md` 存在并记录 PASS/FAIL 结果。

回滚（若 atomicWrite 出错）
----
1) 如果写入失败且 `progress.test.md` 状态异常，使用最近的快照恢复：

```powershell
Copy-Item -Path .claude\snapshots\progress.test.md.<ts>.bak -Destination progress.test.md -Force
```

2) 在 `.claude/last_write_receipt_failed.md` 中记录失败原因、日志与操作人。

交付產物（本地）
----
- `.claude/review/cpg_review_phase1_lite_<ts>.zip` — 包含 `scripts/`、`.claude/pending_delta/test_pending_delta.md`、`progress.test.md`、`.claude/test_run_<ts>.md`、`.claude/audit.log`。

時間估算
----
- 預計 30–90 分鐘可完成（取決於環境與網絡），包含腳本放置、測試執行與審閱包打包。

注意與限制（必須重申）
----
- 本階段為本地演示：**不 push 不合併** 到遠端主分支；任何遠端操作需事先得到書面授權。
- 若 Smart File Sync Guard 或其它守護進程與寫入操作衝突，請在非高峰時段運行並記錄可能的干擾。

結束語
----
階段 I Lite 的目的是在最短時間內，以最低風險把完整寫入/審計/快照/備份流程跑通並產出可供審閱的交付包。完成後，你將擁有：可執行腳本、驗證回執、審計日誌與回滾步驟，足以讓項目 owner 或 CCR 在複核後決定是否授權 CPG 進行下一步（遠端 PR 或合併）。

End of Phase I Lite Addition

Usage:
  - Acquire: powershell -File scripts\lock.ps1 -Acquire -Name "progress-md-write" -Timeout 30
  - Release: powershell -File scripts\lock.ps1 -Release -Name "progress-md-write"
#>
param(
  [switch]$Acquire,
  [switch]$Release,
  [string]$Name = 'progress-md-lock',
  [int]$Timeout = 30
)

$lockFile = Join-Path $env:TEMP ($Name + '.lock')
if ($Acquire) {
  $sw = Get-Date
  while (Test-Path $lockFile) {
    Start-Sleep -Seconds 1
    if ((Get-Date) - $sw -gt (New-TimeSpan -Seconds $Timeout)) {
      Write-Error "Lock timeout"
      exit 2
    }
  }
  '' | Out-File -FilePath $lockFile -Encoding utf8
  Write-Output "LOCK_ACQUIRED:$lockFile"
  exit 0
}
if ($Release) {
  if (Test-Path $lockFile) { Remove-Item $lockFile -ErrorAction SilentlyContinue }
  Write-Output "LOCK_RELEASED"
  exit 0
}

Write-Output "Usage: -Acquire|-Release -Name <name> [-Timeout <sec>]"


3) .githooks/pre-commit（示例 shell 脚本，默认不启用）
----
#!/bin/sh
# 如果修改了 CLAUDE.md 或 progress.md，则两者必须同时被修改或提供理由
STAGED=$(git diff --cached --name-only)
if echo "$STAGED" | grep -qE '^CLAUDE.md$|^progress.md$'; then
  echo "$STAGED" | grep -q '^CLAUDE.md$' && CLAUDE=1 || CLAUDE=0
  echo "$STAGED" | grep -q '^progress.md$' && PROG=1 || PROG=0
  if [ "$CLAUDE" -ne "$PROG" ]; then
    echo "Error: CLAUDE.md and progress.md must be updated together. If intentional, please add a signed reason file in .claude/" >&2
    exit 1
  fi
fi
exit 0


五、pending-delta 模板与示例
----
文件：`.claude/pending_delta.example.md`

---
id: pd-20251009-001
author: agent-v1
timestamp: 2025-10-09T10:00:00Z
reason: 更新 T1 atomic write 脚本说明文档
targetFile: progress.md
mergeStrategy: append
preview:
  - "@@ context before"
  - "+ 新增: atomicWrite.js 脚本说明"
  - "@@ context after"
---

变更内容示例（后续为实际追加内容）


六、duomotai 专属工程项（角色卡与辩论引擎）
----
1) 角色卡 JSON Schema（建议放在 `duomotai/src/data/roles.schema.json`）
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {"type":"string"},
    "name": {"type":"string"},
    "type": {"type":"string","enum":["core","external","value"]},
    "summary": {"type":"string"},
    "goals": {"type":"array","items":{"type":"string"}},
    "persona": {"type":"string"},
    "example_prompt": {"type":"string"},
    "ui": {"type":"object"},
    "priority": {"type":"integer","minimum":1,"maximum":5}
  },
  "required": ["id","name","type","summary","persona","example_prompt","ui"]
}

2) 前端集成（MVP）要点
- 把角色数据放在 `duomotai/public/data/roles.json`，并在首页展示卡片网格。
- 每张卡应展示 name / summary / priority / avatar；点击弹出 persona 与 example_prompt。

3) 辩论引擎接口（简易协议）
- POST /api/debate/start {sessionId, participants: [roleId...], topic, initiator}
- POST /api/debate/round {sessionId, roundIndex, actions: [{roleId, action, content}...]}
- GET /api/debate/state?sessionId=xxx

七、验证用例（Smoke tests & Acceptance tests）
----
Smoke Test 1: atomic write 全流程
1) 准备：创建 `.claude/pending_delta_test.md` 包含简单 append 文本。
2) Acquire lock：`powershell -File scripts/lock.ps1 -Acquire -Name progress-md-write -Timeout 10`。
3) 执行 atomic write：`node scripts/atomicWrite.js --path progress.md --content-file .\\claude\\pending_delta_test.md --author cpg --reason smoke-test`
4) 验证：`.claude/audit.log` 包含最近一条 WRITE，`.claude/snapshots` 包含快照，备份脚本返回 BACKUP_DONE（如已集成）。

Acceptance Test 1: pre-commit 验证
1) 在测试分支上启用 hooksPath：`git config core.hooksPath .githooks`
2) 模拟只修改 CLAUDE.md：`git add CLAUDE.md && git commit -m "test"` 应被阻止。

辩论引擎测试
- 启动后端 stub，POST /api/debate/start -> 返回 sessionId -> 调用 /api/debate/round 多轮，保证状态可查询与导出 JSON 报告。

八、CI / 部署 & 运行建议
----
- CI（建议 GitHub Actions 示例）
  - job: lint & test
  - job: smoke-tests（运行 atomicWrite smoke test 与 pre-commit hook 测试）
  - job: build & deploy（由 CCR 人工触发或需 review 批准）

- 部署
  - 后端使用 PM2 或 node process manager；前端静态文件放 nginx 或静态主机。
  - 环境变量：把 AI keys、mail creds 等放在 `.env`（不要提交）并提供 `.env.example`。

九、风险评估与缓解
----
- 风险 1：自动写入误覆盖历史
  - 缓解：写前快照 + 阈值校验 + 人工批准（默认不开自动 push）。
- 风险 2：锁失效或死锁
  - 缓解：锁加超时控制，失败回退并通知。
- 风险 3：AI 调用失败影响功能链
  - 缓解：实现模型降级和本地缓存策略，并在 server 中记录失败次数与报警。

十、待决问题（需要 CCR 指示）
----
1) 是否允许 agent 提交后自动创建并 push git commit？（建议：否）
2) 备份文件的远端存储（S3/云盘）策略与保留周期是多少？
3) 是否在仓库内启用 `.githooks` 为默认 hooksPath？

十一、交付清单（CPG 提供）
----
- scripts/atomicWrite.js（草稿）
- scripts/lock.ps1（草稿）
- .githooks/pre-commit（示例）
- .claude/pending_delta.example.md
- duomotai/src/data/roles.schema.json
- smoke test 文档 `.claude/test_run_<ts>.md`

十二、下一步建议（我 CP G 的执行选项）
----
请选择其中之一：
- 开始执行：我将把上列脚本写入 `scripts/` 并本地 commit（不 push），并运行 smoke-test，生成回执到 `.claude/test_run_<ts>.md`。
- 只给脚本：我把脚本内容直接贴到回复，你手动部署并运行验证。
- 先看草稿：我仅生成 `\.claude/pending_delta.example.md` 与脚本清单供你审阅，不改仓库。

----

附录：CPG 作为独立 Doer（无 CCR 参与）—— 前期工作、文件框架与逐步执行计划
====

说明（范围限定）
- 本节专门说明当 CPG 作为“独立 Doer”承担全部实现工作时的前期准备、文件布局、执行约束与逐步操作清单。当前阶段仅用于规划与文档落地：CPG 仅更新 `duomotai_architecture_v10CPG.md`（此文件），不对仓库其它文件或进程做任何直接操作，除非得到明确指令。该说明的目标是：当 CCR 不可用或授权 CPG 独立完成任务时，提供一套可执行、安全、可审计的操作手册。

一、为什么需要“CPG 作为独立 Doer”的计划？
- 背景：仓库中许多流程与触发假定 CCR（终端运行者/Claude-Code）会参与审阅或批准，但在 CCR 无法参与时，项目不能停滞。CPG 需要在不越权、不破坏历史审计、并可回滚的前提下独立交付 P0/P1 项目需求。
- 目标：定义 CPG 在独立执行时的边界（哪些可做、哪些必须等待 CCR）、前期稽核步骤、文件与目录布局、变更记录格式与审批替代策略。

二、权限与边界（必须严格遵守）
- CPG 可独立完成（无需 CCR 实时参与）的操作：
  - 在本地仓库分支上创建与修改脚本、模板、文档（如 `scripts/atomicWrite.js`、`.githooks/pre-commit`、`.claude/pending_delta.example.md`、`duomotai/src/data/roles.schema.json`）。
  - 运行本地 smoke-tests 并生成测试回执文件（写入 `.claude/test_run_<ts>.md`）。
  - 提交本地 commit（必须使用私有分支，默认不 push 远端）。

- CPG 不得在未获 CCR 或项目所有者明确授权下执行的操作（必须等待人工授权）：
  - 直接覆盖 `progress.md` 或 `CLAUDE.md` 的主分支写入与 push。
  - 在主分支启用或强制生效 Git hooksPath（`git config core.hooksPath`）。
  - 自动化推送（push）或创建带关键变更的远程 PR（除非事先沟通并授权）。

三、前期检查清单（Pre-flight audit）
（CPG 在开始编码/撰写脚本前必须完成以下核查并把结果记录到此文档或 `.claude/preflight_<ts>.md`）

1) 仓库状态确认
  - 确认当前分支（建议使用 `ccr/test-enable-hooks` 或另建 `cpg/<feature>-<date>`）。
  - 列出未提交变更：`git status --porcelain`（确保 workspace 干净，或把需要的改动放到临时 stash）。
  - 获取 `progress.md` 与 `CLAUDE.md` 的最新 HEAD（保存为快照以便记录）。

2) 运行时/进程敏感性评估
  - 确认本地运行的守护进程（如 Smart File Sync Guard）不会与写入脚本冲突；若存在，记录风险并选择非高峰时段执行本地 smoke test。

3) 环境准备
  - Node、npm、PowerShell 可用并在 PATH 中。
  - 在本地创建工作分支：`git checkout -b cpg/v10-scripts-<ts>`。

4) 记录审计基线
  - 复制当前 `progress.md` 与 `CLAUDE.md` 到 `.claude/preflight_snapshots/` 并在文档中记录文件大小、行数、最后更新时间。

四、文件框架（CPG 建议默认布局）
（CPG 独立实施时按下列布局放置所有生成或修改的文件，便于 CCR 审核）

根目录（推荐）
- scripts/                — CPG 提交的所有工具脚本（atomicWrite.js、lock.ps1、diff-checker.js）
- .githooks/              — pre-commit 示例（默认不启用）
- .claude/                — agent 与审计文件夹（audit.log、pending_delta.example.md、snapshots/、test_run_*.md）
- duomotai/src/data/      — 角色卡、schema、静态 role JSON
- duomotai/duomotai_architecture_v10CPG.md  — 本文件（CPG 变更记录）

细节说明：
- `.claude/snapshots/`：写前快照（按 ISO 时间戳命名），用于回滚与审计索引。
- `.claude/audit.log`：每次自动写入与手动关键事件均以单行 JSON 记录。
- `.claude/pending_delta/`：存放 CPG 为自动 agent 或 CCR 审阅准备的 pending delta 文件（每个 delta 有 metadata 与 preview）。

五、CPG 独立执行的详细步骤（逐条、可直接复制到操作手册）
（注意：下面步骤仅用于文档与计划，CPG 在未获得进一步明确授权前仅更新本文档）

阶段 0 — 初始化（文档/分支/快照）
1) 在本地创建工作分支：
   - git checkout -b cpg/v10-cpg-doer-<YYYYMMDDHHmm>
2) 生成 preflight 快照并写入 `.claude/preflight_<ts>.md`：
   - 记录 `git rev-parse HEAD`、`ls -la scripts`、`Get-ChildItem .claude`（PowerShell）等输出。
3) 在 `.claude/` 中建立 `pending_delta/` 子目录（如果不存在），并写入 `pending_delta.example.md` 模板供 CCR 审阅。

阶段 1 — 编写与本地提交脚本/文件（不 push）
4) 在 `scripts/` 中创建草稿脚本：`atomicWrite.js`、`lock.ps1`、`diff-checker.js`（或 Node/Powershell 两种实现）。
5) 在 `.githooks/` 中放置 `pre-commit` 示例脚本（默认不启用）。
6) 在 `duomotai/src/data/` 中放置 `roles.schema.json` 与 `roles.json`（MVP 16 角色数据）。
7) 本地执行轻量 smoke-tests（见下文），并把输出写入 `.claude/test_run_<ts>.md`。
8) 本地 commit 所有变更：
   - git add scripts/ .githooks/ .claude/ duomotai/src/data/
   - git commit -m "cpg: add atomic write, lock scripts, pending_delta template, roles schema (local commit)" 
   说明：必须明确在 commit message 中写明“local commit / do not push”。

阶段 2 — 内部自测与回执生成（CPG 内部验证）
9) 运行 smoke-test（atomic write 全流程，非主分支）：
   - Acquire lock（scripts/lock.ps1 -Acquire）
   - 生成 pending delta 文件（.claude/pending_delta/test-<ts>.md）
   - 使用 atomicWrite.js 将合并后的内容写入临时目标文件（测试目标建议为 `progress.test.md` 而不是主 `progress.md`）
   - 验证 `.claude/audit.log`、`.claude/snapshots/`、`.claude/test_run_<ts>.md` 的回执条目
10) 如果 smoke-test 失败，记录错误到 `.claude/test_run_<ts>.md` 并修正脚本后重试。

阶段 3 — 生成审阅包交付给 CCR（或管理员）
11) 生成审阅包（审阅用的 pending delta 与变更说明）：
   - 把 `.claude/pending_delta/<pd>.md`、scripts/、roles.json、test_run.md 压缩为 `cpg_review_<ts>.zip`（放在 `.claude/review/`）。
12) 在本文件末尾追加审阅摘要与回执路径（供 CCR 人工审核）。

阶段 4 — 等待授权与后续（如果 CCR 授权）
13) 若 CCR 回复精确授权短语 `同意写入（author: CCR，reason: <...>）`，则 CPG 可按增量融合流程把 pending delta 通过 atomicWrite 写入目标文件，并执行备份与审计；否则 CPG 仅把审阅包提交为 PR 或把变更放在 `.claude/review/` 中。
14) 如果 CCR 不回复，CPG 可选择把审阅包直接创建为 `draft PR`（非合并）并通知 CCR。但未经明确授权不得合并或 push 到主分支。

六、替代审批与紧急授权策略（在 CCR 无法及时响应时）
- 情境：CCR 短期无法响应，但有迫切安全或回滚需要（例如发现 data-loss 或安全漏洞），CPG 可依据下列紧急授权流程执行写入：
  1) CPG 在 `\.claude/emergency_authorization.md` 中记录事件详情、为什么需要紧急操作、影响范围与变更内容。
  2) CPG 发送电子邮件或即时消息到项目所有者与维护组（保留通信记录）。
  3) 若在 2 小时内收到 1 名以上维护者（含项目 owner）的书面同意（电子邮件或聊天记录），CPG 可执行写入并在操作完成后把所有通信记录与回执附入 `\.claude/emergency_log.md`。
 说明：该流程用于极端紧急情况，且必须保留完整审计链。

七、验证矩阵（每项变更必须至少通过其中一个验证点）

变更类型 | 本地 smoke-test | `.claude/audit.log` | snapshot 存在 | CCR 授权 | 备注
---|---:|---:|---:|---:|---
脚本/文档(非核心) | 必须 | 可选 | 可选 | 不必要 | CPG 可直接提交本地 commit
pending_delta (待写入) | 必须（在 test 文件上） | 必须 | 必须 | 推荐（正式写入前） | 为写入做准备
核心文件写入 (progress.md/CLAUDE.md) | 强制（在 test 上） | 强制 | 强制 | 必须 | 除非紧急流程得到书面授权

八、交付与验收（CPG 完成独立 Doer 所需交付）
- 交付物清单（放在 `.claude/review/<ts>/`）：
  1) scripts/atomicWrite.js（注释齐全）
  2) scripts/lock.ps1（注释齐全）
  3) .githooks/pre-commit（示例）
  4) .claude/pending_delta/*.md（待写入 delta）
  5) duomotai/src/data/roles.json + roles.schema.json
  6) .claude/test_run_<ts>.md（smoke-test 输出）
  7) .claude/preflight_<ts>.md（初始化快照与环境说明）

验收条件（由 CCR 或项目 owner 审核）
- 文件齐全且说明清楚
- smoke-test 通过（或有明确失败记录与修复计划）
- 审阅包包含回滚步骤（snapshot 路径）与审计日志条目

九、时间估算（CPG 独立执行，常规节奏）
- 阶段 0（准备）：1-3 小时
- 阶段 1（脚本与本地提交）：3-6 小时
- 阶段 2（自测与修正）：1-4 小时（视失败次数而定）
- 阶段 3（打包审阅）：0.5-1 小时
- 总计（P0 全套交付）：6-14 小时

十、示例条目与模板（便于 CCR 审阅快速理解）

1) `.claude/preflight_<ts>.md`（示例）
```
Preflight Snapshot: 2025-10-09T12:00:00Z
branch: cpg/v10-cpg-doer-202510091200
git HEAD: abcdef1234567890
files snapshot:
  - progress.md lines: 1200 size: 23456
  - CLAUDE.md lines: 868 size: 43210
processes:
  - Smart File Sync Guard: running (pid 1234)
notes: performing non-invasive local operations only. no push.
```

2) `.claude/test_run_<ts>.md`（示例）
```
Test Run: atomic write smoke-test
ts: 2025-10-09T12:30:00Z
steps:
  - lock acquire: PASS
  - atomicWrite to progress.test.md: PASS
  - audit.log appended: PASS
  - snapshot created: PASS (.claude/snapshots/progress.test.md.20251009T123000.bak)
  - backup invoked (TaskDone_BackUp_Exclude): SKIPPED (not run in local smoke)
result: SUCCESS
notes: ready for review
```

十一、文档更新与变更记录规范（写给 CCR 与未来的 CPG）
- 每次 CPG 对本文件或相关脚本做变更时，必须在文件顶部 `更新时间` 字段更新并在 `.claude/change_log.md` 中追加条目，条目包含：作者、时间、变更摘要、回滚路径。

十二、结语（仅限计划/文档更新阶段）
- 本节为 CPG 作为独立 Doer 的完整前期与执行计划草案，目的在于保证在 CCR 不可及或授权 CPG 独立推进时，仍能维持项目的审计纪律与最低风险保障。当前阶段 CP G 仅更新此规划文档（`duomotai_architecture_v10CPG.md`），不对仓库中其他文件做自动化或强制变更。

----
—— End of CPG 更新 —
