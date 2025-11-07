// Helper to read AcceptEdits status and append audit entries locally
const fs = (typeof require !== 'undefined') ? require('fs') : null;
const path = (typeof require !== 'undefined') ? require('path') : null;

function readAcceptEditsStatus() {
  // Priority: browser localStorage (if present) -> .claude/acceptEdits.status file -> OFF
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const v = localStorage.getItem('acceptEdits_status');
      if (v) return v;
    }
  } catch (e) {
    // ignore
  }

  try {
    if (fs && path) {
      const statusFile = path.resolve(process.cwd(), '.claude', 'acceptEdits.status');
      if (fs.existsSync(statusFile)) {
        const content = fs.readFileSync(statusFile, 'utf8').trim();
        if (content) return content;
      }
    }
  } catch (e) {
    // ignore
  }

  return 'OFF';
}

function appendAudit(entry) {
  try {
    if (!fs || !path) return false;
    const auditDir = path.resolve(process.cwd(), '.claude');
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
    const auditFile = path.join(auditDir, 'audit.log');
    const line = JSON.stringify(Object.assign({ timestamp: new Date().toISOString() }, entry)) + '\n';
    fs.appendFileSync(auditFile, line, 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  readAcceptEditsStatus,
  appendAudit
};
