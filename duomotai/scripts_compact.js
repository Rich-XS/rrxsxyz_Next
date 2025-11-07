// 精简 index.html 脚本（移除注释、console.log、多余空行）
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'index.html');
const backupFile = path.join(__dirname, `index.html.backup_${Date.now()}`);

// 读取文件
let content = fs.readFileSync(inputFile, 'utf8');
const originalLines = content.split('\n').length;

console.log(`原始行数: ${originalLines}`);

// 1. 移除HTML注释（保留关键注释）
content = content.replace(/<!--[\s\S]*?-->/g, (match) => {
    // 保留包含 "FIX" "BUG" "Task" 的关键注释
    if (match.includes('FIX') || match.includes('BUG') || match.includes('Task') || match.includes('✅')) {
        return match;
    }
    return '';
});

// 2. 移除所有console.log（包括多行）
content = content.replace(/console\.log\([^)]*\);?/g, '');
content = content.replace(/console\.warn\([^)]*\);?/g, '');
content = content.replace(/console\.error\([^)]*\);?/g, '');

// 3. 移除多余空行（保留最多1个连续空行）
content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');

// 4. 移除行尾空格
content = content.split('\n').map(line => line.trimEnd()).join('\n');

const newLines = content.split('\n').length;
console.log(`精简后行数: ${newLines}`);
console.log(`减少行数: ${originalLines - newLines}`);
console.log(`减少比例: ${((originalLines - newLines) / originalLines * 100).toFixed(1)}%`);

// 备份原文件
fs.copyFileSync(inputFile, backupFile);
console.log(`备份文件: ${backupFile}`);

// 写入精简后的文件
fs.writeFileSync(outputFile, content, 'utf8');
console.log(`✅ 精简完成！`);
