#!/usr/bin/env node
/**
 * scripts/atomicWrite.js
 * Minimal atomic write utility + CLI wrapper for Windows/Node (NTFS atomic rename)
 * Usage (Node):
 *   node scripts/atomicWrite.js --path "progress.md" --author "agent" --reason "update" --content-file "tmp.txt"
 * Or pass content via stdin (pipe) when --content-file omitted.
 */
const fs = require('fs');
const path = require('path');

function atomicWrite(targetPath, content, auditInfo = {}) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tmp = path.join(dir, `.${base}.tmp.${Date.now()}`);

  // ensure dir exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // write temp file
  fs.writeFileSync(tmp, content, { encoding: 'utf8' });

  // rename is atomic on NTFS
  fs.renameSync(tmp, targetPath);

  // append audit
  const auditDir = path.join(process.cwd(), '.claude');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
  const auditFile = path.join(auditDir, 'audit.log');
  const line = `[${new Date().toISOString()}] WRITE ${targetPath} by ${auditInfo.author || 'agent'} reason:${auditInfo.reason || ''}\n`;
  fs.appendFileSync(auditFile, line, { encoding: 'utf8' });
  return { path: targetPath, audit: line };
}

// Export for programmatic use
module.exports = { atomicWrite };

// CLI (simple parser to avoid external deps)
if (require.main === module) {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else if (a.startsWith('-')) {
      const key = a.slice(1);
      const next = argv[i + 1];
      args[key] = next && !next.startsWith('-') ? next : true;
      if (args[key] !== true) i++;
    }
  }

  const target = args.path || args.p;
  const author = args.author || args.a || 'agent';
  const reason = args.reason || args.r || '';
  const contentFile = args['content-file'] || args.c;

  if (!target) {
    console.error('Usage: node scripts/atomicWrite.js --path <targetPath> [--content-file <file>] [--author NAME] [--reason TEXT]');
    process.exit(2);
  }

  let content = '';
  if (contentFile) {
    content = fs.readFileSync(contentFile, 'utf8');
  } else {
    // read stdin if piped
    try {
      const stat = fs.fstatSync(0);
      if (stat && stat.size > 0) {
        content = fs.readFileSync(0, 'utf8');
      }
    } catch (e) {
      // no stdin
    }
  }

  if (!content) {
    console.error('Error: no content provided. Use --content-file or pipe content to stdin.');
    process.exit(3);
  }

  try {
    const res = atomicWrite(path.resolve(target), content, { author, reason });
    console.log('WRITE_DONE:', res.path);
    process.exit(0);
  } catch (err) {
    console.error('WRITE_FAILED:', err && err.message);
    process.exit(1);
  }
}