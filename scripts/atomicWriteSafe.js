#!/usr/bin/env node
/**
 * scripts/atomicWriteSafe.js
 * Safe wrapper around atomicWrite.js
 * - auto-acquires/releases lock (scripts/lock.ps1)
 * - snapshots target to .claude/snapshots
 * - default mode: append (conservative)
 * - replace mode: requires new lines >= threshold (default 0.7)
 * - calls backup script scripts/TaskDone_BackUp_Exclude.ps1 after write
 * Usage:
 *   node scripts/atomicWriteSafe.js --path progress.md --content-file .claude/to_write.md --mode append --author CCR --reason "..."
 * Or pass content via stdin (pipe) when --content-file omitted.
 */

const fs = require('fs');
const path = require('path');
const child = require('child_process');

const { atomicWrite } = require('./atomicWrite.js');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) { args[k] = true; }
      else { args[k] = next; i++; }
    }
  }
  return args;
}

function runPowershellScript(argsArray) {
  // argsArray: array of strings for powershell -File <script> <args>
  const cmd = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ...argsArray];
  const res = child.spawnSync('powershell', cmd, { encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function acquireLock(name, timeoutSec) {
  const script = path.join('scripts', 'lock.ps1');
  const res = runPowershellScript([script, '-Acquire', '-Name', name, '-Timeout', String(timeoutSec || 10)]);
  return res;
}

function releaseLock(name) {
  const script = path.join('scripts', 'lock.ps1');
  const res = runPowershellScript([script, '-Release', '-Name', name]);
  return res;
}

function snapshotTarget(targetPath) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const claudeDir = path.join(process.cwd(), '.claude');
  const snapDir = path.join(claudeDir, 'snapshots');
  if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
  const base = path.basename(targetPath);
  const dest = path.join(snapDir, `${ts}__${base}`);
  try {
    if (fs.existsSync(targetPath)) fs.copyFileSync(targetPath, dest);
    else fs.writeFileSync(dest, '', { encoding: 'utf8' });
    return dest;
  } catch (e) {
    throw new Error('Snapshot failed: ' + e.message);
  }
}

function runBackup(keyword, taskId) {
  const script = path.join('scripts', 'TaskDone_BackUp_Exclude.ps1');
  const args = [script, '-Keyword', keyword || 'atomicSafe', '-TaskId', taskId || 'auto', '-Execute'];
  return runPowershellScript(args);
}

if (require.main === module) {
  const argv = parseArgs(process.argv.slice(2));
  const target = argv.path || argv.p;
  const contentFile = argv['content-file'] || argv.c;
  const mode = (argv.mode || 'append').toLowerCase(); // append|merge|replace
  const author = argv.author || 'agent';
  const reason = argv.reason || '';
  const lockName = argv['lock-name'] || 'progress-md-write';
  const timeout = parseInt(argv.timeout || '10', 10);

  if (!target) { console.error('Missing --path'); process.exit(2); }
  if (!contentFile) { console.error('Missing --content-file'); process.exit(3); }

  const targetPath = path.resolve(target);
  let content = '';
  try { content = fs.readFileSync(contentFile, 'utf8'); } catch (e) { console.error('Failed to read content-file:', e.message); process.exit(4); }

  // Acquire lock
  const acq = acquireLock(lockName, timeout);
  if (acq.status !== 0 || !acq.stdout.includes('LOCK_ACQUIRED')) {
    console.error('LOCK_FAILED:', acq.stderr || acq.stdout);
    process.exit(5);
  }
  console.log(acq.stdout.trim());

  try {
    // snapshot
    const snap = snapshotTarget(targetPath);
    console.log('SNAPSHOT:', snap);

    let original = '';
    try { original = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : ''; } catch (e) { original = ''; }
    const origLines = original ? original.split(/\r?\n/).length : 0;
    const newLines = content ? content.split(/\r?\n/).length : 0;

    if (mode === 'replace') {
      const ratio = origLines === 0 ? 1 : (newLines / origLines);
  // Updated default replace threshold to 0.9 (more conservative)
      const threshold = parseFloat(argv['replace-threshold'] || '0.9');
      if (origLines > 0 && ratio < threshold) {
        console.error(`REPLACE_REFUSED: new lines ${newLines} is < ${Math.round(threshold*100)}% of original ${origLines}.`);
        // leave lock held so caller can inspect; but we will release below in finally
        process.exitCode = 6;
        return;
      }
      // perform replace
      var finalContent = content;
    } else {
      // append/merge -> conservative append
      const separator = original && !original.endsWith('\n') ? '\n' : '';
      var finalContent = original + separator + content;
    }

    // call atomicWrite
    try {
      const res = atomicWrite(targetPath, finalContent, { author, reason });
      console.log('SAFE_WRITE_DONE:', res.path);
      // generate receipt: last line number and timestamps
      try {
        const written = fs.readFileSync(targetPath, 'utf8');
        const lines = written.split(/\r?\n/);
        const lastLineNum = lines.length;
        const stat = fs.statSync(targetPath);
        const receiptDir = path.join(process.cwd(), '.claude', 'receipts');
        if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });
        const receipt = {
          file: targetPath,
          lastLine: lastLineNum,
          lastWriteTime: stat.mtime.toISOString(),
          lastWriteTimeUtc: stat.mtime.toUTCString(),
          author: author,
          reason: reason,
          generatedAt: new Date().toISOString()
        };
        const rid = new Date().toISOString().replace(/[:.]/g, '-') + '__' + path.basename(targetPath) + '.json';
        const rpath = path.join(receiptDir, rid);
        fs.writeFileSync(rpath, JSON.stringify(receipt, null, 2), 'utf8');
        console.log('RECEIPT:', rpath);
      } catch (e) {
        console.error('RECEIPT_FAILED:', e && e.message);
      }
    } catch (e) {
      console.error('SAFE_WRITE_FAILED:', e.message);
      process.exit(7);
    }

    // trigger backup
    const bk = runBackup('AtomicSafe', `${author}_${mode}`);
    if (bk.stdout) console.log(bk.stdout.trim());
    if (bk.stderr) console.error(bk.stderr.trim());

  } finally {
    const rel = releaseLock(lockName);
    if (rel.stdout) console.log(rel.stdout.trim());
    if (rel.stderr) console.error(rel.stderr.trim());
  }
}