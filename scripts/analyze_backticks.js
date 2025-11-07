const fs = require('fs');
const path = 'd:/_100W/rrxsxyz_next/duomotai/src/modules/debateEngine.js';
const s = fs.readFileSync(path, 'utf8');
const lines = s.split(/\r?\n/);
let offsets = [0];
for(let i=0;i<lines.length;i++) offsets.push(offsets[i] + lines[i].length + 1);
function lineColToIndex(line,col){return offsets[line-1]+col-1}
// list backticks positions
let bpos=[];
for(let i=0;i<s.length;i++){ if(s[i]==='`') bpos.push(i); }
console.log('total backticks', bpos.length);
// show first 20 positions
console.log('first backticks:', bpos.slice(0,20));
// find line 1117 offset
let line = 1117;
let idxLineStart = offsets[line-1];
console.log('line1117 starts at', idxLineStart);
// show slice around that index +/-50
console.log('\n--- context around line 1117 start ---');
console.log(s.slice(Math.max(0, idxLineStart-100), idxLineStart+200));
// find which backtick index corresponds to the backtick in that line by searching the line for backticks
let lineText = lines[line-1];
console.log('\nline1117 text:', JSON.stringify(lineText));
// list backtick indices with line numbers
const posToLine = (pos)=>{ for(let i=0;i<offsets.length-1;i++){ if(pos>=offsets[i] && pos<offsets[i+1]) return i+1;} return offsets.length; }
console.log('\nBacktick positions with line numbers:');
for(let i=0;i<bpos.length;i++){ if(i%10===0) process.stdout.write('\n'); process.stdout.write(i+':'+bpos[i]+'(L'+posToLine(bpos[i])+') ');} 
console.log('\n\nPairs (first 30):');
for(let i=0;i<Math.min(30, bpos.length/2); i++){ let a=bpos[2*i], b=bpos[2*i+1]; console.log(i, 'pair:', a,'(L'+posToLine(a)+')','-', b,'(L'+posToLine(b)+')');}
// check for odd number
if(bpos.length%2===1) console.log('UNPAIRED BACKTICK');
else console.log('All backticks paired count OK');
