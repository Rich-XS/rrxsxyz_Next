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
  console.error(e.stack);
  process.exit(2);
}
