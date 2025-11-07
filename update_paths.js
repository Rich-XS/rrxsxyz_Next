#!/usr/bin/env node
/**
 * 批量路径更新脚本
 * 用途: 从 D:\_100W 更新为 D:\OneDrive_New\_AIGPT\_100W_New
 * 生成: 2025-10-31
 */

const fs = require('fs');
const path = require('path');

const projectRoot = 'D:\\OneDrive_New\\_AIGPT\\_100W_New\\rrxsxyz_next';
const oldPath = 'D:\\_100W';
const newPath = 'D:\\OneDrive_New\\_AIGPT\\_100W_New';

// 支持两种路径格式（反斜杠和正斜杠）
const oldPathRegex = /D:\\\_100W/gi;
const oldPathRegexSlash = /D:\/\_100W/gi;

const filePatterns = ['**/*.md', '**/*.ps1', '**/*.bat', '**/*.js', '**/*.json', '**/*.yml', '**/*.yaml'];

console.log('\n============================================');
console.log('路径更新脚本 - 批量替换');
console.log('============================================\n');

console.log(`旧路径: ${oldPath}`);
console.log(`新路径: ${newPath}`);
console.log(`项目根: ${projectRoot}\n`);

let totalFiles = 0;
let updatedFiles = 0;
let errorFiles = 0;

function walkDir(dir, callback) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    // 跳过某些目录
                    if (!['node_modules', '.git', '.vscode', 'Backup'].includes(file)) {
                        walkDir(filePath, callback);
                    }
                } else {
                    callback(filePath);
                }
            } catch (e) {
                // 忽略访问错误
            }
        });
    } catch (e) {
        console.error(`❌ 目录读取错误: ${dir}`);
    }
}

console.log('[开始扫描文件...]');

walkDir(projectRoot, (filePath) => {
    totalFiles++;

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // 检查是否包含旧路径
        if (oldPathRegex.test(content) || oldPathRegexSlash.test(content)) {
            // 替换路径
            const newContent = content
                .replace(oldPathRegex, newPath)
                .replace(oldPathRegexSlash, newPath.replace(/\\/g, '/'));

            // 写回文件
            fs.writeFileSync(filePath, newContent, 'utf8');

            updatedFiles++;
            const relativePath = filePath.replace(projectRoot, '.').substring(2);
            console.log(`✅ 已更新: ${relativePath}`);
        }
    } catch (e) {
        errorFiles++;
        console.error(`❌ 错误: ${filePath} - ${e.message}`);
    }
});

console.log('\n============================================');
console.log('更新完成报告');
console.log('============================================\n');

console.log(`扫描总文件数: ${totalFiles}`);
console.log(`✅ 已更新文件: ${updatedFiles}`);
console.log(`❌ 出错文件: ${errorFiles}\n`);

// 验证：再次扫描确认
console.log('[验证: 检查是否还有残留的旧路径...]');

let remainingCount = 0;
walkDir(projectRoot, (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (oldPathRegex.test(content) || oldPathRegexSlash.test(content)) {
            remainingCount++;
            const relativePath = filePath.replace(projectRoot, '.').substring(2);
            console.log(`⚠️  仍有: ${relativePath}`);
        }
    } catch (e) {
        // 忽略
    }
});

if (remainingCount === 0) {
    console.log('✅ 验证通过: 所有旧路径已完全替换!\n');
} else {
    console.log(`⚠️  警告: 仍有 ${remainingCount} 个文件包含旧路径\n`);
}

console.log('============================================');
console.log('操作完成!');
console.log('============================================\n');
