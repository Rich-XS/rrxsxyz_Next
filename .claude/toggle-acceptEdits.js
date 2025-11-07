#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const settingsPath = path.join(__dirname, 'settings.json');
const projectRoot = path.join(__dirname, '..');
const logPath = path.join(__dirname, 'sync-guard.log');
const statusPath = path.join(__dirname, 'acceptEdits.status');
const progressPath = path.join(projectRoot, 'progress.md');

function readSettings() {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read settings.json:', e.message);
    process.exit(2);
  }
}

function writeSettings(obj) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write settings.json:', e.message);
    process.exit(2);
  }
}

function appendLog(message) {
  const ts = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${ts}] ${message}\n`, 'utf8');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function sanitizeKeywords(raw) {
  if (!raw) return '';
  // keep alnum and dash, replace others with '-'
  return raw.toLowerCase().replace(/[,\s]+/g, '-').replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function getProjectMeta() {
  let version = 'noversion';
  let sha = null;
  let msg = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    if (pkg.version) version = String(pkg.version).replace(/\s+/g, '');
  } catch (e) {
    // ignore
  }
  try {
    sha = execSync(`git -C "${projectRoot}" rev-parse --short HEAD`).toString().trim();
    msg = execSync(`git -C "${projectRoot}" log -1 --pretty=%s`).toString().trim();
  } catch (e) {
    // not a git repo or git not available
  }
  return { version, sha, msg };
}

function appendBackupToProgress(dest, meta) {
  try {
    let content = fs.readFileSync(progressPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const headingIdx = lines.findIndex(l => l.includes('### 本地打包备份'));
    const humanSize = (fs.existsSync(dest) ? `${(fs.statSync(dest).size/1024/1024).toFixed(2)} MB` : 'unknown');
  const entry = `- \`${path.basename(dest)}\` — \`${dest}\`; ${humanSize}; ${meta.ts}`;
    if (headingIdx !== -1) {
      // insert right after heading (after blank line if exists)
      let insertAt = headingIdx + 1;
      // skip possible blank line
      if (lines[insertAt] && lines[insertAt].trim() === '') insertAt++;
      lines.splice(insertAt, 0, entry);
    } else {
      // append at end
      lines.push('\n### 本地打包备份 (D:\\_100W)');
      lines.push(entry);
    }
    fs.writeFileSync(progressPath, lines.join('\n'), 'utf8');
  } catch (e) {
    appendLog(`ERROR: failed to append backup to progress.md: ${e.message}`);
  }
}

function doBackup(keywordsRaw) {
  const keywords = sanitizeKeywords(keywordsRaw || '');
  // Use parent directory (D:\_100W) as backup destination
  const parentDir = path.resolve(path.join(projectRoot, '..'));
  const backupDir = parentDir; // store zip directly under D:\_100W

  // Timestamp YYMMDDHHmm
  const now = new Date();
  const YY = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ts = `${YY}${MM}${DD}${hh}${mm}`;

  const projectName = path.basename(projectRoot);
  const meta = getProjectMeta();
  // build filename: project-YYMMDDHHmm[-vVersion][-sha][-keywords].zip
  const parts = [`${projectName}-${ts}`];
  if (meta.version) parts.push(`v${meta.version}`);
  if (meta.sha) parts.push(meta.sha);
  if (keywords) parts.push(keywords);
  const zipName = parts.join('-') + '.zip';
  const dest = path.join(backupDir, zipName);

  console.log('Starting backup to', dest);
  // Create a temp directory, copy project files excluding certain patterns, then zip the temp dir
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rrxsxyz-'));
  const tempCopy = path.join(tmp, path.basename(projectRoot));
  fs.mkdirSync(tempCopy);

  // Recursive copy with exclusions
  function copyRecursive(src, dest) {
    for (const name of fs.readdirSync(src)) {
      const full = path.join(src, name);
      const rel = path.relative(projectRoot, full);
      // exclusions
      if (rel.startsWith('Backup') || rel.includes('\\.git\\') || rel.includes('node_modules') || rel.includes('\\.claude\\Backup\\')) continue;
      if (fs.statSync(full).isDirectory()) {
        fs.mkdirSync(path.join(dest, name));
        copyRecursive(full, path.join(dest, name));
      } else {
        // skip zip files
        if (path.extname(full) === '.zip') continue;
        fs.copyFileSync(full, path.join(dest, name));
      }
    }
  }

  try {
    // write metadata into temp copy so it becomes part of the zip
    copyRecursive(projectRoot, tempCopy);
    const metaFile = path.join(tempCopy, 'backup-meta.json');
    const metaContent = {
      project: projectName,
      ts,
      version: meta.version,
      gitSha: meta.sha,
      gitMsg: meta.msg,
      keywords: keywords || null
    };
    fs.writeFileSync(metaFile, JSON.stringify(metaContent, null, 2), 'utf8');
    // Compress tempCopy contents
    const ps2 = `Set-Location -Path '${tmp.replace(/'/g, "''")}'; Compress-Archive -Path '${path.basename(tempCopy)}\\*' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`;
    execSync(`powershell -NoProfile -Command "${ps2.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    appendLog(`INFO: Backup created ${dest}`);
    console.log('Backup completed:', dest);
    // append to progress.md
    appendBackupToProgress(dest, { ts: `${now.getFullYear()}-${MM}-${DD} ${hh}:${mm}`, version: meta.version, sha: meta.sha, keywords: keywords });
  } catch (e) {
    appendLog(`ERROR: Backup failed: ${e.message}`);
    console.error('Backup failed:', e.message);
  } finally {
    // clean up temp
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { }
  }
}

function writeStatusFile(state) {
  try {
    fs.writeFileSync(statusPath, state, 'utf8');
  } catch (e) {
    console.error('Failed to write status file:', e.message);
  }
}

function updateProgressStatus(state) {
  try {
    let content = fs.readFileSync(progressPath, 'utf8');
    const lines = content.split(/\r?\n/);
    // Find the line with '**最后更新**' and update/insert the AcceptEdits line after it
    let idx = lines.findIndex(l => l.trim().startsWith('**最后更新**'));
    if (idx === -1) {
      // fallback: insert after first 5 lines
      idx = Math.min(5, lines.length - 1);
    }
    const statusLine = `**AcceptEdits**: ${state}`;
    if (lines[idx+1] && lines[idx+1].trim().startsWith('**AcceptEdits**:')) {
      lines[idx+1] = statusLine;
    } else {
      lines.splice(idx+1, 0, statusLine);
    }
    fs.writeFileSync(progressPath, lines.join('\n'), 'utf8');
  } catch (e) {
    console.error('Failed to update progress.md with status:', e.message);
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function autoBackup(taskName, taskId) {
  const meta = getProjectMeta();
  const now = new Date();
  const timestamp = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const sanitizedTaskName = sanitizeKeywords(taskName);
  const backupName = `rrxsxyz_next-${timestamp}-${taskId}${sanitizedTaskName}.zip`;
  const backupPath = path.join('D:/_100W', backupName);

  try {
    execSync(`powershell Compress-Archive -Path ${projectRoot} -DestinationPath ${backupPath}`);
    appendBackupToProgress(backupPath, { ts: new Date().toISOString(), ...meta });
    appendLog(`Backup created: ${backupPath}`);
  } catch (e) {
    appendLog(`Backup failed: ${e.message}`);
  }
}

function executeTask(taskName, taskFunction) {
  try {
    taskFunction();
    autoBackup(taskName);
  } catch (e) {
    appendLog(`Task ${taskName} failed: ${e.message}`);
  }
}

function backupOnTaskCompletion(taskId, taskName) {
  if (!taskId || !taskName) {
    console.error('Task ID and Task Name are required for backup.');
    return;
  }
  console.log(`Triggering backup for completed task: ${taskId} - ${taskName}`);
  autoBackup(taskName, taskId);
}

// Example usage when a task is completed
function markTaskAsCompleted(taskId, taskName) {
  console.log(`Marking task ${taskId} as completed.`);
  // ...existing logic to mark task as completed...
  backupOnTaskCompletion(taskId, taskName);
}

function setStatus(state) {
  try {
    fs.writeFileSync(statusPath, state, 'utf8');
    console.log(`AcceptEdits status set to: ${state}`);
  } catch (e) {
    console.error('Failed to write status file:', e.message);
  }
}

function getStatus() {
  try {
    const status = fs.readFileSync(statusPath, 'utf8').trim();
    console.log(`Current AcceptEdits status: ${status}`);
    return status;
  } catch (e) {
    console.error('Failed to read status file:', e.message);
    return 'UNKNOWN';
  }
}

const mode = process.argv[2]?.toUpperCase();
switch (mode) {
  case 'ON':
  case 'FULL':
  case 'TASK':
    setStatus(mode);
    if (mode === 'FULL') {
      console.log('FULL mode activated: All tasks will run uninterrupted.');
    } else if (mode === 'TASK') {
      console.log('TASK mode activated: Interruptions only between numbered tasks.');
    }
    break;
  case 'OFF':
    setStatus('OFF');
    break;
  case 'STATUS':
    getStatus();
    break;
  default:
    console.log('Usage: node toggle-acceptEdits.js [ON|OFF|FULL|TASK|STATUS]');
}

// Example usage:
executeTask('UI16角色卡', () => {
  console.log('Executing task: UI16角色卡');
  // Task logic here
});
