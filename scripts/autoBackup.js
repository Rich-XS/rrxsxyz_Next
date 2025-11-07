/**
 * 自动版本备份脚本
 *
 * 功能：当 P0/P1 任务完成后，自动创建版本备份
 * 触发：progress-recorder agent 调用 / 手动调用
 *
 * 使用方法：
 * node scripts/autoBackup.js --files "file1.js,file2.html" --reason "完成图片生成功能"
 *
 * @created 2025-10-17
 * @purpose D-35决策 + RCCM长期对策
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 自动备份类
 */
class AutoBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.projectRoot = path.join(__dirname, '..');

        // 确保备份目录存在
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * 获取当前时间戳（Windows PowerShell格式）
     */
    getTimestamp() {
        try {
            const timestamp = execSync('powershell -Command "Get-Date -Format \'yyyyMMdd_HHmmss\'"', {
                encoding: 'utf-8'
            }).trim();
            return timestamp;
        } catch (error) {
            // 备用方案：使用 Node.js Date
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');
            const second = String(now.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}_${hour}${minute}${second}`;
        }
    }

    /**
     * 创建备份
     * @param {Object} options
     * @param {string[]} options.files - 要备份的文件路径（相对于项目根目录）
     * @param {string} options.reason - 备份原因
     * @param {string} options.priority - 任务优先级（P0/P1/P2）
     * @returns {Object} 备份结果
     */
    createBackup(options) {
        const { files = [], reason = '未指定原因', priority = 'P1' } = options;

        if (files.length === 0) {
            throw new Error('❌ 备份失败：未指定要备份的文件');
        }

        console.log('='.repeat(60));
        console.log('🗄️  自动版本备份');
        console.log('='.repeat(60));
        console.log(`📋 备份原因: ${reason}`);
        console.log(`🎯 任务优先级: ${priority}`);
        console.log(`📁 文件数量: ${files.length}`);
        console.log('='.repeat(60));
        console.log('');

        // 验证文件是否存在
        const validFiles = [];
        for (const file of files) {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                validFiles.push(fullPath);
                console.log(`✅ ${file}`);
            } else {
                console.warn(`⚠️  文件不存在，跳过: ${file}`);
            }
        }

        if (validFiles.length === 0) {
            throw new Error('❌ 备份失败：没有有效的文件可备份');
        }

        console.log('');

        // 生成备份文件名
        const timestamp = this.getTimestamp();
        const sanitizedReason = reason
            .replace(/[<>:"/\\|?*]/g, '_') // 移除不合法字符
            .substring(0, 50); // 限制长度
        const backupFileName = `${sanitizedReason}_${timestamp}.zip`;
        const backupFilePath = path.join(this.backupDir, backupFileName);

        console.log(`📦 正在创建备份: ${backupFileName}`);
        console.log('');

        try {
            // 使用 PowerShell Compress-Archive
            // 注意：需要转义引号和路径
            const filesParam = validFiles.map(f => `'${f}'`).join(', ');
            const command = `powershell -Command "Compress-Archive -Path ${filesParam} -DestinationPath '${backupFilePath}' -Force"`;

            execSync(command, { encoding: 'utf-8', stdio: 'inherit' });

            // 验证备份文件
            if (fs.existsSync(backupFilePath)) {
                const stats = fs.statSync(backupFilePath);
                console.log('');
                console.log('='.repeat(60));
                console.log('✅ 备份成功！');
                console.log('='.repeat(60));
                console.log(`📁 备份文件: ${backupFileName}`);
                console.log(`📏 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log(`📂 保存路径: ${backupFilePath}`);
                console.log('='.repeat(60));

                return {
                    success: true,
                    backupFile: backupFileName,
                    backupPath: backupFilePath,
                    fileSize: stats.size,
                    filesBackedUp: validFiles.length,
                    timestamp: timestamp
                };
            } else {
                throw new Error('备份文件未生成');
            }

        } catch (error) {
            console.error('');
            console.error('='.repeat(60));
            console.error('❌ 备份失败');
            console.error('='.repeat(60));
            console.error(`错误信息: ${error.message}`);
            console.error('');
            console.error('可能的原因:');
            console.error('1. 文件被其他进程占用（如日志文件）');
            console.error('2. PowerShell 权限不足');
            console.error('3. 磁盘空间不足');
            console.error('='.repeat(60));

            return {
                success: false,
                error: error.message,
                filesAttempted: validFiles.length
            };
        }
    }

    /**
     * 从命令行参数创建备份
     */
    static fromCommandLine() {
        const args = process.argv.slice(2);

        // 解析参数
        let files = [];
        let reason = '未指定原因';
        let priority = 'P1';

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--files' && args[i + 1]) {
                files = args[i + 1].split(',').map(f => f.trim());
                i++;
            } else if (args[i] === '--reason' && args[i + 1]) {
                reason = args[i + 1];
                i++;
            } else if (args[i] === '--priority' && args[i + 1]) {
                priority = args[i + 1];
                i++;
            }
        }

        const backup = new AutoBackup();
        return backup.createBackup({ files, reason, priority });
    }

    /**
     * 列出所有备份文件
     */
    listBackups() {
        console.log('📁 备份文件列表:');
        console.log('='.repeat(80));

        const backups = fs.readdirSync(this.backupDir)
            .filter(file => file.endsWith('.zip'))
            .map(file => {
                const stats = fs.statSync(path.join(this.backupDir, file));
                return {
                    name: file,
                    size: stats.size,
                    date: stats.mtime
                };
            })
            .sort((a, b) => b.date - a.date); // 最新的在前

        if (backups.length === 0) {
            console.log('（无备份文件）');
        } else {
            backups.forEach((backup, index) => {
                const sizeKB = (backup.size / 1024).toFixed(2);
                const dateStr = backup.date.toLocaleString('zh-CN');
                console.log(`${index + 1}. ${backup.name}`);
                console.log(`   大小: ${sizeKB} KB | 时间: ${dateStr}`);
                console.log('');
            });
        }

        console.log('='.repeat(80));
        console.log(`总计: ${backups.length} 个备份文件`);
    }
}

// CLI 模式执行
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--list')) {
        // 列出所有备份
        const backup = new AutoBackup();
        backup.listBackups();
    } else {
        // 创建备份
        AutoBackup.fromCommandLine();
    }
}

module.exports = AutoBackup;
