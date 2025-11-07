const fs = require('fs');

const filePath = 'D:\\_100W\\rrxsxyz_next\\progress.md';
let content = fs.readFileSync(filePath, 'utf8');

// Update Last Updated description - using exact Chinese characters
const oldText = 'V57.13版本完成记录 + 标准化备份';
const newText = 'V57.14版本完成记录 + 标准化备份';

content = content.split(oldText).join(newText);

fs.writeFileSync(filePath, content, 'utf8');

// Verify
const updatedContent = fs.readFileSync(filePath, 'utf8');
const found = updatedContent.includes(newText);

console.log('✅ Last Updated description updated to V57.14');
console.log('Verification:', found ? 'SUCCESS' : 'FAILED');
