const helper = require('../duomotai/src/modules/acceptEditsHelper');
console.log('readAcceptEditsStatus ->', helper.readAcceptEditsStatus());
const ok = helper.appendAudit({ actor: 'test', note: 'test append from smoke' });
console.log('appendAudit ->', ok);
