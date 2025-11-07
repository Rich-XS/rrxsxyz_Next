const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
// 使用环境变量 PROJECT_ROOT（如果设置），否则使用脚本相对路径
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
const backupBaseName = 'rrxsxyz_next';

// 生成时间戳（GMT+8）
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}`;
}

// 排除列表（不备份的目录和文件）
const excludePatterns = [
    'node_modules',
    '.git',
    '.claude/snapshots',
    'test_reports/archive_*',
    'server/UserInfo',
    'server/logs',
    '*.log',
    'temp*',
    'tmp*',
    'nul',
    '*.zip'
];

console.log('📦 项目备份工具\n');
console.log('='.repeat(80));

// 检测可用的压缩工具
let compressionTool = null;

// 1. 检查 7-Zip
try {
    execSync('7z', { stdio: 'ignore' });
    compressionTool = '7z';
    console.log('✅ 检测到 7-Zip');
} catch (err) {
    console.log('⏭️  7-Zip 未安装或不在 PATH 中');
}

// 2. 如果没有 7-Zip，使用 PowerShell（改进版）
if (!compressionTool) {
    console.log('ℹ️  将使用 PowerShell Compress-Archive（改进版）');
    compressionTool = 'powershell';
}

console.log('\n📋 备份配置:');
console.log(`  - 源目录: ${rootDir}`);
console.log(`  - 压缩工具: ${compressionTool}`);
console.log(`  - 排除模式: ${excludePatterns.length} 个`);

const timestamp = getTimestamp();
const backupFileName = `${backupBaseName}-${timestamp}.zip`;
const backupFilePath = path.join(path.dirname(rootDir), backupFileName);

console.log(`  - 备份文件: ${backupFilePath}`);

console.log('\n🚀 开始备份...\n');

try {
    let cmd;

    switch (compressionTool) {
        case '7z':
            // 7-Zip 命令
            const excludeArgs = excludePatterns.map(p => `-x!${p}`).join(' ');
            cmd = `7z a -tzip "${backupFilePath}" "${rootDir}\\*" ${excludeArgs} -mx5`;
            console.log(`执行命令: ${cmd}\n`);
            execSync(cmd, { stdio: 'inherit', cwd: rootDir, maxBuffer: 50 * 1024 * 1024 });
            break;

        case 'powershell':
            console.log('使用 PowerShell Compress-Archive（改进版）\n');

            // 创建临时脚本文件来处理复杂逻辑
            const tempScriptPath = path.join(rootDir, 'scripts', 'temp_backup.ps1');
            const psScript = `
# PowerShell 备份脚本
$ErrorActionPreference = "Stop"

$sourcePath = "${rootDir}"
$destPath = "${backupFilePath}"

# 排除模式
$excludePatterns = @(
    'node_modules',
    '.git',
    'snapshots',
    'archive_*',
    'UserInfo',
    'logs',
    '*.log',
    'temp*',
    'tmp*',
    'nul',
    '*.zip'
)

Write-Host "正在收集需要备份的文件..."

# 获取所有文件，排除指定模式
$files = Get-ChildItem -Path $sourcePath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $file = $_
    $shouldInclude = $true

    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like "*$pattern*") {
            $shouldInclude = $false
            break
        }
    }

    $shouldInclude
}

Write-Host "找到 $($files.Count) 个文件需要备份"

# 删除旧的备份文件（如果存在）
if (Test-Path $destPath) {
    Remove-Item $destPath -Force
    Write-Host "已删除旧的备份文件"
}

Write-Host "正在压缩文件（这可能需要几分钟）..."

# 使用 Compress-Archive
try {
    Compress-Archive -Path $files.FullName -DestinationPath $destPath -CompressionLevel Optimal -Force
    Write-Host "✅ 压缩完成"
} catch {
    Write-Host "❌ 压缩失败: $_"
    exit 1
}
`;

            // 写入临时脚本（使用 UTF-8 BOM，并强制 CRLF），以避免 PowerShell 解析问题
            const psContent = '\uFEFF' + psScript.replace(/\n/g, '\r\n');
            fs.writeFileSync(tempScriptPath, psContent, 'utf8');

            // 执行 PowerShell 脚本
            cmd = `powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`;
            console.log(`执行 PowerShell 脚本...\n`);

            try {
                execSync(cmd, {
                    stdio: 'inherit',
                    maxBuffer: 50 * 1024 * 1024,
                    timeout: 600000 // 10 分钟超时
                });

                // 成功后删除临时脚本
                if (fs.existsSync(tempScriptPath)) {
                    try { fs.unlinkSync(tempScriptPath); } catch (e) { /* ignore */ }
                }

            } catch (err) {
                // 发生错误时保留临时脚本以便排查（不会删除），并抛出错误
                console.error(`发生错误，临时脚本保留在: ${tempScriptPath}`);
                throw err;
            }
            break;
    }

    // 验证备份文件
    if (fs.existsSync(backupFilePath)) {
        const stats = fs.statSync(backupFilePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('\n' + '='.repeat(80));
        console.log('✅ 备份成功完成！');
        console.log(`\n📦 备份信息:`);
        console.log(`  - 文件路径: ${backupFilePath}`);
        console.log(`  - 文件大小: ${sizeMB} MB`);
        console.log(`  - 创建时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

        // 记录到日志
        const logEntry = `[${timestamp}] 备份成功: ${backupFileName} (${sizeMB} MB)\n`;
        const logFile = path.join(rootDir, 'scripts', 'backup.log');
        fs.appendFileSync(logFile, logEntry);
        console.log(`\n📝 已记录到: ${logFile}`);

    } else {
        throw new Error('备份文件未生成');
    }

} catch (err) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ 备份失败！');
    console.log(`错误信息: ${err.message}`);
    console.log('\n🔧 故障排查建议:');
    console.log('  1. 检查磁盘空间是否充足');
    console.log('  2. 关闭可能占用文件的程序（如编辑器、浏览器）');
    console.log('  3. 尝试安装 7-Zip: https://www.7-zip.org/');
    console.log('     下载后将 7z.exe 所在目录添加到系统 PATH');
    console.log('  4. 使用管理员权限运行此脚本');
    process.exit(1);
}

console.log('\n💡 使用提示:');
console.log('  - 添加到 package.json: "backup": "node scripts/backup_project.js"');
console.log('  - 快速备份: npm run backup');
console.log('  - 建议在重大变更前备份');
console.log('\n推荐: 安装 7-Zip 以获得更快的备份速度和更小的文件大小');

