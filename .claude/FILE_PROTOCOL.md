# File Management Protocol

## 规则：谁可以写哪些文件

### 🤖 AI (Claude Code) 只能通过 Agent 写入：
- ❌ **禁止直接写入**：progress.md, CLAUDE.md
- ✅ **允许直接写入**：代码文件 (.js, .html, .css)
- ✅ **允许读取**：所有文件

### 👤 User (你) 只能手动编辑：
- ✅ **允许编辑**：任何文件
- ⚠️ **建议避免**：progress.md, CLAUDE.md（由 agent 维护）

### 🔧 Agent (progress-recorder) 负责维护：
- ✅ **自动更新**：progress.md, CLAUDE.md
- ✅ **原子操作**：每次只修改一个文件
- ✅ **时间戳同步**：确保两个文件时间戳接近

---

## 冲突避免机制

### 场景 1: 你正在看文件，Agent 修改了
**系统行为：**
1. VSCode 检测到外部修改
2. 弹出提示："文件已被外部修改，重新加载？"
3. 你点击"重新加载" → 看到最新内容

**建议：**
- 启用 VSCode 自动重新加载：`"files.autoSave": "afterDelay"`

### 场景 2: 你正在编辑文件，Agent 同时修改
**系统行为：**
1. VSCode 检测到冲突
2. 弹出提示："文件内容冲突，保留哪个版本？"
3. 你选择：保留你的 / 保留外部 / 比较差异

**避免方法：**
- ✅ **分工明确**：progress.md 由 agent 维护，你不手动编辑
- ✅ **协作模式**：需要补充内容时，用 `>> record` 告诉 agent

### 场景 3: Agent 修改失败
**系统行为：**
1. Agent 报错（如文件被锁定）
2. Claude Code 显示错误信息
3. 我会告诉你"文件更新失败，请手动检查"

---

## VSCode 配置建议

```json
// .vscode/settings.json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true
  },

  // 文件修改提示
  "files.hotExit": "onExitAndWindowClose",
  "files.enableTrash": true,

  // Git 冲突标记
  "merge-conflict.autoNavigateNextConflict.enabled": true
}
```

---

## 最佳实践

### ✅ 推荐工作流

**需求变更场景：**
```
1. 你提出"重大更新"
2. 我识别到触发词
3. 我调用 progress-recorder agent
4. Agent 更新 progress.md + CLAUDE.md
5. VSCode 提示你"文件已修改，重新加载？"
6. 你点击"重新加载"
7. 继续工作
```

**日常开发场景：**
```
1. 我写代码（userProfile.js, index.html）
2. 你随时查看文件
3. 互不干扰
```

### ❌ 避免行为

1. **不要同时编辑 progress.md**：
   - Agent 可能正在更新 → 冲突
   - 建议：需要补充时用 `>> record "你的内容"`

2. **不要关闭 VSCode 自动重新加载**：
   - 否则你看到的可能是旧内容

3. **不要在 Agent 运行时强制保存文件**：
   - 可能覆盖 Agent 的修改
