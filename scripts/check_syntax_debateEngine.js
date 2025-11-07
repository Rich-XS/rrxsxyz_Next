const fs = require('fs');
const vm = require('vm');
const path = require('path');
const file = path.resolve('duomotai/src/modules/debateEngine.js');
const code = fs.readFileSync(file, 'utf8');
try {
  new vm.Script(code, {filename: file});
  console.log('OK: syntax valid');
} catch (e) {
  console.error('SYNTAX ERROR:', e.message);
  if (e.stack) console.error(e.stack.split('\n').slice(0,2).join('\n'));
  process.exit(2);
}
