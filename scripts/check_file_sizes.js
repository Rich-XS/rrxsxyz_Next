const fs = require('fs');
const path = require('path');

// 关键文件列表
const files = [
    'progress.md',
    'ideas.md',
    'CLAUDE.md',
    'progress.archive.md',
    'duomotai/index.html',
    'duomotai/homepage.html',
    'index.html',
    '.claude/agent_config.md',
    '.claude/architecture_guide.md',
    '.claude/workflow_rules.md',
    '.claude/dev_handbook.md',
    '.claude/cost_optimization.md',
    '.claude/deployment_security.md',
    'duomotai/duomotai_architecture_v10.md'
];

// 使用环境变量 PROJECT_ROOT（如果设置），否则使用脚本相对路径
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');

console.log('📊 文件大小分析报告\n');
console.log('=' .repeat(80));
console.log(`${'文件名'.padEnd(50)} ${'行数'.padStart(8)} ${'大小(KB)'.padStart(12)}`);
console.log('='.repeat(80));

const results = [];

files.forEach(file => {
    const filePath = path.join(rootDir, file);

    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);

            // 读取行数
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;

            results.push({ file, lines, sizeKB: parseFloat(sizeKB), path: filePath });

            // 标记大文件
            const warning = sizeKB > 100 ? ' ⚠️ 大文件' : sizeKB > 50 ? ' ⚡ 较大' : '';
            console.log(`${file.padEnd(50)} ${lines.toString().padStart(8)} ${sizeKB.padStart(12)}${warning}`);
        } else {
            console.log(`${file.padEnd(50)} ${'不存在'.padStart(8)}`);
        }
    } catch (err) {
        console.log(`${file.padEnd(50)} ${'错误'.padStart(8)} ${err.message}`);
    }
});

console.log('='.repeat(80));

// 统计信息
const totalSize = results.reduce((sum, r) => sum + r.sizeKB, 0);
const totalLines = results.reduce((sum, r) => sum + r.lines, 0);
const largeFiles = results.filter(r => r.sizeKB > 100);
const mediumFiles = results.filter(r => r.sizeKB > 50 && r.sizeKB <= 100);

console.log('\n📈 统计信息:');
console.log(`总文件数: ${results.length}`);
console.log(`总大小: ${totalSize.toFixed(2)} KB (${(totalSize/1024).toFixed(2)} MB)`);
console.log(`总行数: ${totalLines}`);
console.log(`大文件 (>100KB): ${largeFiles.length} 个`);
console.log(`较大文件 (50-100KB): ${mediumFiles.length} 个`);

if (largeFiles.length > 0) {
    console.log('\n⚠️  需要优化的大文件:');
    largeFiles.forEach(f => {
        console.log(`  - ${f.file}: ${f.lines} 行, ${f.sizeKB} KB`);
    });
}

// 检查test_reports目录
console.log('\n📁 检查test_reports目录...');
const testReportsDir = path.join(rootDir, 'test_reports');
if (fs.existsSync(testReportsDir)) {
    const testFiles = fs.readdirSync(testReportsDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
        .map(dirent => {
            const filePath = path.join(testReportsDir, dirent.name);
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                name: dirent.name,
                sizeKB: (stats.size / 1024).toFixed(2),
                lines: content.split('\n').length
            };
        })
        .sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));

    console.log(`test_reports/ 目录: ${testFiles.length} 个文件`);
    const testTotalSize = testFiles.reduce((sum, f) => sum + parseFloat(f.sizeKB), 0);
    console.log(`总大小: ${testTotalSize.toFixed(2)} KB`);

    if (testFiles.length > 0) {
        console.log('最大的5个文件:');
        testFiles.slice(0, 5).forEach(f => {
            console.log(`  - ${f.name}: ${f.lines} 行, ${f.sizeKB} KB`);
        });
    }
}

console.log('\n✅ 分析完成');
