const fs=require('fs');
const path='d:/_100W/rrxsxyz_next/duomotai/src/modules/debateEngine.js';
const s=fs.readFileSync(path,'utf8');
const lines=s.split(/\r?\n/);
const bad=[];
for(let i=0;i<lines.length;i++){
  const c = (lines[i].match(/`/g)||[]).length;
  if(c%2===1) bad.push({line:i+1,count:c, text: lines[i].slice(0,200)});
}
console.log('FOUND', bad.length, 'lines with odd backtick counts');
console.log(JSON.stringify(bad.slice(0,50),null,2));
