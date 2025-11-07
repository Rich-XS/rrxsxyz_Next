const fs = require('fs');
const path = require('path');

// 使用环境变量 PROJECT_ROOT（如果设置），否则使用脚本相对路径
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');

console.log('🧹 开始清理和归档操作\n');
console.log('='.repeat(80));

// 1. 清理根目录的临时文件
console.log('\n📁 步骤 1: 清理根目录临时文件');
const tempFilesRoot = [
    'temp_archive_append.md',
    'temp_archive_content.md',
    'temp_latest_progress.md',
    'temp_progress_backup.md',
    '1150行）',
    '1150行）导致响应超时'
];

tempFilesRoot.forEach(file => {
    const filePath = path.join(rootDir, file);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`  ✅ 删除: ${file}`);
        } else {
            console.log(`  ⏭️  跳过（不存在）: ${file}`);
        }
    } catch (err) {
        console.log(`  ❌ 失败: ${file} - ${err.message}`);
    }
});

// 2. 清理 .claude/ 目录的临时文件
console.log('\n📁 步骤 2: 清理 .claude/ 目录临时文件');
const tempFilesClaude = [
    '.claude/tmp_progress_final.md',
    '.claude/tmp_progress_backup.md',
    '.claude/tmp_wrapup_input.md',
    '.claude/tmp_progress.md'
];

tempFilesClaude.forEach(file => {
    const filePath = path.join(rootDir, file);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`  ✅ 删除: ${file}`);
        } else {
            console.log(`  ⏭️  跳过（不存在）: ${file}`);
        }
    } catch (err) {
        console.log(`  ❌ 失败: ${file} - ${err.message}`);
    }
});

// 3. 归档 test_reports/ 目录
console.log('\n📁 步骤 3: 归档 test_reports/ 目录');
const testReportsDir = path.join(rootDir, 'test_reports');
const archiveDir = path.join(testReportsDir, 'archive_20251016');

try {
    if (!fs.existsSync(testReportsDir)) {
        console.log('  ⏭️  test_reports/ 目录不存在，跳过');
    } else {
        // 创建归档目录
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
            console.log(`  ✅ 创建归档目录: ${archiveDir}`);
        }

        // 获取所有测试报告文件
        const files = fs.readdirSync(testReportsDir)
            .filter(f => f.endsWith('.md') && !f.startsWith('test_checklist'));

        // 保留最新的 5 个文件，其他移动到归档目录
        const filesWithStats = files.map(f => {
            const filePath = path.join(testReportsDir, f);
            const stats = fs.statSync(filePath);
            return { name: f, mtime: stats.mtime };
        }).sort((a, b) => b.mtime - a.mtime);

        console.log(`  📊 找到 ${filesWithStats.length} 个测试报告文件`);
        console.log(`  📌 保留最新的 5 个文件，归档其他 ${Math.max(0, filesWithStats.length - 5)} 个文件`);

        filesWithStats.slice(5).forEach(file => {
            const srcPath = path.join(testReportsDir, file.name);
            const destPath = path.join(archiveDir, file.name);
            try {
                fs.renameSync(srcPath, destPath);
                console.log(`  ✅ 归档: ${file.name}`);
            } catch (err) {
                console.log(`  ❌ 归档失败: ${file.name} - ${err.message}`);
            }
        });
    }
} catch (err) {
    console.log(`  ❌ 归档操作失败: ${err.message}`);
}

// 4. 清理 .claude/snapshots/ 旧快照
console.log('\n📁 步骤 4: 清理 .claude/snapshots/ 旧快照（保留最近3个）');
const snapshotsDir = path.join(rootDir, '.claude', 'snapshots');

try {
    if (!fs.existsSync(snapshotsDir)) {
        console.log('  ⏭️  snapshots/ 目录不存在，跳过');
    } else {
        const items = fs.readdirSync(snapshotsDir, { withFileTypes: true })
            .filter(d => d.isDirectory() || (d.isFile() && d.name.endsWith('.md')));

        const itemsWithStats = items.map(item => {
            const itemPath = path.join(snapshotsDir, item.name);
            const stats = fs.statSync(itemPath);
            return { name: item.name, mtime: stats.mtime, isDir: item.isDirectory() };
        }).sort((a, b) => b.mtime - a.mtime);

        console.log(`  📊 找到 ${itemsWithStats.length} 个快照项`);
        console.log(`  📌 保留最新的 3 个，删除其他 ${Math.max(0, itemsWithStats.length - 3)} 个`);

        itemsWithStats.slice(3).forEach(item => {
            const itemPath = path.join(snapshotsDir, item.name);
            try {
                if (item.isDir) {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(itemPath);
                }
                console.log(`  ✅ 删除: ${item.name}`);
            } catch (err) {
                console.log(`  ❌ 删除失败: ${item.name} - ${err.message}`);
            }
        });
    }
} catch (err) {
    console.log(`  ❌ 清理快照失败: ${err.message}`);
}

// 5. 总结
console.log('\n' + '='.repeat(80));
console.log('✅ 清理和归档操作完成');
console.log('\n建议后续操作:');
console.log('  1. 运行 `node scripts/check_file_sizes.js` 验证文件大小');
console.log('  2. 提交代码变更到 Git');
console.log('  3. 重启 Claude Code 会话以清理 Context');
