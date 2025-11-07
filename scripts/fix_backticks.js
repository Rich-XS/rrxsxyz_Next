const fs = require('fs');
const p = 'd:/_100W/rrxsxyz_next/duomotai/src/modules/debateEngine.js';
let s = fs.readFileSync(p,'utf8');
const before = (s.match(/\\`/g)||[]).length;
console.log('found escaped backticks:', before);
s = s.replace(/\\`/g, '`');
fs.writeFileSync(p,s,'utf8');
console.log('replaced. new count:', (s.match(/\\`/g)||[]).length);
