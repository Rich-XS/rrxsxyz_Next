const fs = require('fs');
const path = require('path');

// 配置阈值（单位：KB）
const THRESHOLDS = {
    // 核心文件阈值
    'progress.md': 15,  // 当前 9.36 KB
    'CLAUDE.md': 20,    // 当前 14.96 KB
    'ideas.md': 30,     // 当前 25.45 KB
    'progress.archive.md': 50,  // 当前 34.64 KB
    'duomotai/index.html': 15,  // 当前 9.12 KB

    // 目录阈值
    'test_reports/': 150,  // 当前 116.62 KB
    '.claude/snapshots/': 50,  // 快照目录
    '.claude/chat_logs/': 100, // 对话日志目录
};

// 行数阈值
const LINE_THRESHOLDS = {
    'progress.md': 250,  // 当前 206 行
    'CLAUDE.md': 400,    // 当前 346 行
    'ideas.md': 400,     // 当前 310 行
    'duomotai/duomotai_architecture_v10.md': 1300,  // 当前 1123 行
};

// 使用环境变量 PROJECT_ROOT（如果设置），否则使用脚本相对路径
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');

console.log('🔍 文件大小监控和预警系统\n');
console.log('='.repeat(80));

let warnings = [];
let criticals = [];

// 1. 检查核心文件大小
console.log('\n📁 检查核心文件大小...\n');

for (const [file, threshold] of Object.entries(THRESHOLDS)) {
    if (file.endsWith('/')) continue; // 跳过目录

    const filePath = path.join(rootDir, file);

    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeKB = stats.size / 1024;
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;

            const percentage = (sizeKB / threshold * 100).toFixed(1);
            const lineThreshold = LINE_THRESHOLDS[file];
            const linePercentage = lineThreshold ? (lines / lineThreshold * 100).toFixed(1) : null;

            // 判断警告级别
            let status = '✅';
            if (sizeKB > threshold) {
                status = '🚨 超出阈值';
                criticals.push(`${file}: ${sizeKB.toFixed(2)} KB (阈值: ${threshold} KB, 超出 ${percentage}%)`);
            } else if (sizeKB > threshold * 0.8) {
                status = '⚠️  接近阈值';
                warnings.push(`${file}: ${sizeKB.toFixed(2)} KB (阈值: ${threshold} KB, 已达 ${percentage}%)`);
            }

            console.log(`${status.padEnd(15)} ${file.padEnd(35)} ${sizeKB.toFixed(2).padStart(8)} KB / ${threshold} KB (${percentage}%)`);

            // 检查行数阈值
            if (lineThreshold && lines > lineThreshold) {
                console.log(`           ${''.padEnd(35)} 🚨 行数超出: ${lines} / ${lineThreshold} (${linePercentage}%)`);
                criticals.push(`${file}: ${lines} 行 (阈值: ${lineThreshold} 行)`);
            } else if (lineThreshold && lines > lineThreshold * 0.8) {
                console.log(`           ${''.padEnd(35)} ⚠️  行数接近: ${lines} / ${lineThreshold} (${linePercentage}%)`);
            }
        } else {
            console.log(`⏭️  跳过        ${file.padEnd(35)} 文件不存在`);
        }
    } catch (err) {
        console.log(`❌ 错误        ${file.padEnd(35)} ${err.message}`);
    }
}

// 2. 检查目录大小
console.log('\n📁 检查目录大小...\n');

for (const [dir, threshold] of Object.entries(THRESHOLDS)) {
    if (!dir.endsWith('/')) continue; // 只检查目录

    const dirPath = path.join(rootDir, dir.slice(0, -1));

    try {
        if (fs.existsSync(dirPath)) {
            let totalSize = 0;
            let fileCount = 0;

            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            files.forEach(f => {
                if (f.isFile()) {
                    const filePath = path.join(dirPath, f.name);
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    fileCount++;
                } else if (f.isDirectory() && !f.name.startsWith('archive')) {
                    // 递归计算子目录（排除 archive 目录）
                    const subDirPath = path.join(dirPath, f.name);
                    const subFiles = fs.readdirSync(subDirPath, { withFileTypes: true })
                        .filter(sf => sf.isFile());
                    subFiles.forEach(sf => {
                        const filePath = path.join(subDirPath, sf.name);
                        const stats = fs.statSync(filePath);
                        totalSize += stats.size;
                        fileCount++;
                    });
                }
            });

            const sizeKB = totalSize / 1024;
            const percentage = (sizeKB / threshold * 100).toFixed(1);

            // 判断警告级别
            let status = '✅';
            if (sizeKB > threshold) {
                status = '🚨 超出阈值';
                criticals.push(`${dir}: ${sizeKB.toFixed(2)} KB (阈值: ${threshold} KB)`);
            } else if (sizeKB > threshold * 0.8) {
                status = '⚠️  接近阈值';
                warnings.push(`${dir}: ${sizeKB.toFixed(2)} KB (阈值: ${threshold} KB, 已达 ${percentage}%)`);
            }

            console.log(`${status.padEnd(15)} ${dir.padEnd(35)} ${sizeKB.toFixed(2).padStart(8)} KB / ${threshold} KB (${percentage}%) [${fileCount} 个文件]`);
        } else {
            console.log(`⏭️  跳过        ${dir.padEnd(35)} 目录不存在`);
        }
    } catch (err) {
        console.log(`❌ 错误        ${dir.padEnd(35)} ${err.message}`);
    }
}

// 3. 总结和建议
console.log('\n' + '='.repeat(80));

if (criticals.length === 0 && warnings.length === 0) {
    console.log('✅ 所有文件和目录大小都在正常范围内');
} else {
    if (criticals.length > 0) {
        console.log(`\n🚨 严重警告 (${criticals.length} 项):\n`);
        criticals.forEach(c => console.log(`  - ${c}`));
        console.log('\n建议操作:');
        console.log('  1. 立即执行 `node scripts/cleanup_and_archive.js` 清理和归档');
        console.log('  2. 检查并精简超出阈值的文件内容');
        console.log('  3. 将历史数据移至归档目录');
    }

    if (warnings.length > 0) {
        console.log(`\n⚠️  警告 (${warnings.length} 项):\n`);
        warnings.forEach(w => console.log(`  - ${w}`));
        console.log('\n建议操作:');
        console.log('  1. 计划在未来1-2天内进行清理和归档');
        console.log('  2. 关注文件增长趋势');
    }
}

console.log('\n💡 自动化建议:');
console.log('  - 将此脚本添加到 package.json scripts: "monitor": "node scripts/file_size_monitor.js"');
console.log('  - 建议每天运行一次: npm run monitor');
console.log('  - 考虑添加到 Git pre-commit hook 中');

console.log('\n📅 下次检查建议: ' + new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'));
