# A.2 页面索引与 16 角色卡模板（v10 进阶）

说明：本文件为 A.2（Index）页面的修订草案，旨在为前端与策划提供一致的展示规范与字段约束。请把该草案作为 draft 审阅后再合并到主文档。

---

## 页面结构（建议，按渲染顺序）
1. Header
   - 页面标题
   - 版本号 / 作者 / 最后更新
2. 问题 / 困境（Problem）
   - 简短的一行或三行内问题陈述（1-3 行）
3. 背景（Context）
   - 关键背景、约束和目标（可列 3-5 条）
4. 16 角色卡（Grid 4x4）
   - 以 Grid 布局展示 16 个角色卡，每卡遵循下列字段模板
5. 轮次与规则（Rounds & Rules）
   - 总轮数、每轮时限、评分/判定方式、投票或共识规则
6. 底边控件（Footer Controls）
   - 开始/暂停/下一轮/导出/归档/回滚

---

## 交互与渲染注意事项
- Grid 栅格建议：4 列 x 4 行，每卡最小显示尺寸 140x140 px（缩略图 + 名称 + 关键标签）。
- 卡片可折叠，卡片展开显示详细字段与交互按钮（例如：标注、提问、标为高优先）。
- 每卡有颜色标签（colorTag）用于视觉分组（core/external/value 等）。
- 所有交互动作应触发事件并记录到 audit log（例如：`roleAction: {roleId, action, by, ts}`）。

---

## 16 角色卡字段模板（每卡必填/选填字段与约束）

- id (string) — 唯一标识（如 `role-01`）
- name (string) — 角色名称（短）
- type (enum) — one of `core|external|value`（用于权重/颜色分组）
- summary (string) — 1-2 行角色职责描述（必填）
- goals (array[string]) — 1..3 项关键目标（必填）
- constraints (array[string]) — 限制/禁止的行为（可选）
- resources (object) — 初始资源/次数，如 `{tokens:3, points:0}`（可选）
- persona (string) — 行为风格（示例 prompt 或偏好语气，必填）
- abilities (array[string]) — 特殊技能/可用次数（可选）
- actions (array[string]) — 前端可调用的动作（例如 `ask,restate,challenge`）
- ui (object) — 显示属性 `{thumb:'/assets/roles/01.png', colorTag:'#4A90E2', size:'140x140'}`
- priority (int) — 1..5 优先级（可用于排序/默认展示）
- example_prompt (string) — 给模型的示例 prompt（必填）
- notes (string) — 额外备注或测试用例（可选）

> 约束：`id`, `name`, `type`, `summary`, `goals`, `persona`, `example_prompt` 为必填字段。

---

## 示例卡片（role-01）
- id: role-01
- name: 引导者
- type: core
- summary: 负责引导讨论方向并提出关键问题
- goals: ["提出3个关键问题","促成下一轮决策"]
- constraints: ["不得直接给出最终结论"]
- resources: {"tokens":3}
- persona: "启发式、提问导向"
- abilities: ["强制重述(每轮1次)"]
- actions: ["ask","restate","highlight"]
- ui: {"thumb":"/assets/roles/guide.png","colorTag":"#4A90E2","size":"140x140"}
- priority: 4
- example_prompt: "作为'引导者'，请总结当前争点并提出一条启发性问题。"
- notes: "测试用例见 ./.claude/tests/role-guide.md"

---

## 轮次与控件（建议默认）
- 默认总轮数: 5（可配置）
- 每轮时限: 3 分钟（可配置）
- 投票/评分规则: 支持简单多数/加权评分（基于角色 priority）
- 底边控件: 开始/暂停/下一轮/导出 replay/回滚写入

---

## 实施细节与前端提示（给开发者）
1. 前端渲染：使用 CSS Grid 或 Flexbox 实现 4x4 布局，卡片在小屏幕上改为 2 列或 1 列。
2. 可访问性：为每卡提供 aria-label，缩略图需用 alt 属性。
3. 交互事件：所有按钮动作（ask/restate/...）必须通过后端 API 登记并返回 event id。
4. 数据结构：后端保持角色定义 JSON（duomotai/src/config/roles.json），前端拉取并缓存，变更需由 Agent/CCR 提交并由 atomicWrite 持久化。
5. 测试用例：为每个角色卡建立 2 个最小可复现测试（行为/被动/资源耗尽），放在 `.claude/tests/roles/`。

---

## 交接与审阅说明
- 我已把该草案保存为 `.claude/drafts/Progression_A2.update.md`。
- 请 CCR 或产品负责人审阅：确认角色卡字段满足策划/前端需要。
- 合并后我可以把 JSON 结构同步到 `duomotai/src/config/roles.js` 并生成前端示例数据。 

---

**Last Edited**: 2025-10-08 04:05:00
