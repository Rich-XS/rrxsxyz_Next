# 交接：CPG2CCA issue 与回滚到 V54（2025-10-23）

> **✅ 硬编码路径修复完成（2025-10-23）**: 本文档建议的硬编码路径修复已全面完成。9个关键脚本已修复为使用动态相对路径，剩余12个低频脚本可使用批量修复工具 `scripts/fix_hardcoded_paths.ps1`。详见 [PATH_NOTICE.md](./PATH_NOTICE.md)。

## 一、概述
- 时间：2025-10-23
- 背景：项目在运行若干自动任务（截图/备份等）时出现 Node.js V8 内存错误："FATAL ERROR: Reached heap limit / Allocation failed - JavaScript heap out of memory"，并且备份脚本在生成临时 PowerShell 脚本时出现解析错误导致备份失败。
- 本次操作目标：分析并修复导致内存溢出的代码、修正备份脚本以便成功创建回滚后的快照，并将仓库回滚到指定历史 zip 版本 `rrxsxyz_next_20251020_2251_V54_V54_ExpertSpeech300to400.zip`。

## 二、关键问题与根因
1. 内存溢出（OOM）
   - 根因：长期持有 Puppeteer Page 对象和其他大对象，导致 V8 堆内存无法及时回收。
   - 触发场景：长时间生成大量截图或持续任务时。部分脚本也使用了 sync/拼接大量数据的方式，增加峰值内存使用。

2. 备份失败
   - 根因：备份逻辑生成的临时 PowerShell 脚本在无 BOM / 非 CRLF 行结束条件下，部分情况下被 PowerShell 解析器报错（unexpected token '}'）。
   - 影响：`npm run backup` 失败，无法生成快照备份。

3. 硬编码路径风险
   - 在多个脚本/文档中存在绝对路径 `D:\_100W\rrxsxyz_next` 等，若 OneDrive 父目录从 `100W` 改为 `_100W` 等变动，会导致脚本/示例命令失效或混淆。

## 三、已实施的修复与操作记录
1. Puppeteer 修复
   - 文件：`scripts/imageGenerator.js`（修改：不再复用同一 page，改为每次任务创建 page 并在任务结束时关闭）
   - 新增：`scripts/puppeteer_stress_test.js`（循环 newPage()/close() 并输出 memoryUsage）
   - 验证：压力测试运行中 RSS/heapUsed 未出现持续增长，未复现 OOM。

2. 备份脚本修复
   - 文件：`scripts/backup_project.js`
     - 修改：写入临时 PowerShell 脚本时添加 UTF-8 BOM（\uFEFF）并将换行规范为 CRLF；在失败时保留临时脚本以便排查，成功时删除。
   - 文件：`scripts/autoBackup.js`（改为生成临时 ps1，并使用 Compress-Archive -LiteralPath 执行）
   - 验证：运行 `npm run backup` 成功生成备份文件（见下），并写入 `scripts/backup.log`。

3. 回滚操作
   - 回滚目标 ZIP（已定位）：
     - `D:\_100W\rrxsxyz_next_20251020_2251_V54_V54_ExpertSpeech300to400.zip`（大小约 11.86 MB，时间 2025-10-20 23:05:16）
   - 操作流程：
     1. 将目标 zip 解压到临时目录（示例：`%TEMP%\rrxsxyz_rollback_temp`）。
     2. 使用 `robocopy`（先 /L dry-run，再实际 /MIR），排除 `.git`、`Backup`、`backups`，将内容镜像到项目根。
   - 验证结果：
     - 临时解压文件计数：1976 文件，约 27.1 MB
     - 回滚后项目统计：2556 文件，约 29.23 MB
     - 比较结果：OnlyInTmp=0（临时目录所有文件已复制），OnlyInProj=580（多为 .git 和被排除项），冗余非排除项 = 0。

4. 生成回滚后备份
   - 备份文件：`D:\_100W\rrxsxyz_next-202510232055.zip`
   - 生成时间：2025-10-23 20:55:57
   - 文件大小：9.45 MB
   - 记录：已追加到 `D:\_100W\rrxsxyz_next\scripts\backup.log`

5. 硬编码路径扫描
   - 已搜索到多个文件使用 `D:\_100W\rrxsxyz_next` 或类似绝对路径，重点见：
     - `scripts/backup_project.js`（已修复为使用常量但建议改为相对/配置化）
     - `temp_backup.ps1`, `temp_find_large_files.ps1`
     - 文档：`ideas.md`, `progress.md`, `TEST_BASELINE.md`, `team/*` 等

## 四、修改的文件清单（快照）
- 修改：
  - `scripts/backup_project.js` (修复临时 ps1 写入与执行逻辑)
  - `scripts/autoBackup.js` (改为生成临时 ps1 执行)
  - `scripts/imageGenerator.js` (Puppeteer 生命周期修复)
- 新增：
  - `scripts/puppeteer_stress_test.js`
- 生成的备份：
  - `D:\_100W\rrxsxyz_next-202510232055.zip`

## 五、待办（建议优先级）
1. 立即（高）
   - 将脚本中硬编码路径替换为“环境变量优先，回退相对路径”（方案 C），范围：`scripts/*.js`、`*.ps1`。
   - 将这些变更逐一提交到新分支，运行 smoke 测试（`npm run backup`、`scripts/puppeteer_stress_test.js`）。

2. 近期（中）
   - 在 CI 或日常任务中加入 memory 回归监控（周期运行 stress test 并记录）
   - 建议安装 7-Zip 并让脚本优先使用 7z，以减小备份文件和加快压缩速度。

3. 可选（低）
   - 增加自动 heap snapshot 在 OOM 时采集（便于深度分析）
   - 把 docs 中的绝对路径改为相对或在文档顶端说明“示例路径”以免误用

## 六、如何验证变更是否正确（验收步骤）
1. 运行备份并确认 zip 生成（成功时会在 `scripts/backup.log` 打一条记录）：
```powershell
npm run backup
``` 
2. 运行压力测试并观察 memoryUsage：
```powershell
node --trace-gc --max-old-space-size=8192 scripts/puppeteer_stress_test.js
``` 
3. 运行快速截图脚本（检查 imageGenerator 行为）：
```powershell
node scripts/testScreenshot.js
```

## 七、回滚与回退策略
- 如果新修改引入问题：可通过 git revert 对单个 commit 回退，或解压先前生成的备份 zip 并用 robocopy /MIR 恢复（注意排除 .git / backups）。

## 八、联系方式/接手提示
- 本次变更的关键点在 `scripts/backup_project.js` 与 `scripts/imageGenerator.js`，接手人只需关注这两处并按步骤运行 smoke tests。
- 若需要我继续将硬编码路径替换为配置化实现，请回复：
  - 选项 A（只改脚本，采用方案 C）
  - 选项 B（脚本 + 文档）
  - 选项 C（全部替换）

---
> 记录人：自动化助理（根据会话编辑），生成时间：2025-10-23 20:56:00
