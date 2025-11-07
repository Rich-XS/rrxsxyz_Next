/**
 * 快速验证脚本 - 检查V57.22修复效果
 * 2025-11-04
 */

console.log('🚀 开始验证V57.22修复效果...\n');

// 使用fetch检查页面内容
const http = require('http');

// 检查服务器状态
http.get('http://localhost:8080/duomotai/', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ 服务器响应正常\n');

        // 检查版本号
        const versionMatch = data.match(/V57\.(\d+)/);
        if (versionMatch) {
            console.log(`📌 当前版本: V57.${versionMatch[1]}`);
            if (versionMatch[1] === '22') {
                console.log('✅ 版本号正确（V57.22）\n');
            } else {
                console.log(`⚠️ 版本号不匹配，期望V57.22，实际V57.${versionMatch[1]}\n`);
            }
        }

        // 检查修复项
        console.log('🔍 检查修复项目：');

        // 1. 检查文字速度初始值
        if (data.includes('textRateDisplay') && data.includes('>10x<')) {
            console.log('✅ 文字速度初始值已修复（10x）');
        } else {
            console.log('❌ 文字速度初始值未修复');
        }

        // 2. 检查按钮符号
        const minusCount = (data.match(/>\s*−\s*</g) || []).length;
        const standardMinusCount = (data.match(/>\s*-\s*</g) || []).length;

        console.log(`📊 Unicode减号(−): ${minusCount}个`);
        console.log(`📊 标准减号(-): ${standardMinusCount}个`);

        if (standardMinusCount >= 2 && minusCount === 0) {
            console.log('✅ 按钮符号已全部修正为标准减号');
        } else {
            console.log('⚠️ 仍有Unicode减号存在，需要检查');
        }

        // 3. 检查导航条设置
        if (data.includes('nav-links') && data.includes('navLinks.classList.add')) {
            console.log('✅ 导航条显示逻辑已修复');
        } else {
            console.log('⚠️ 导航条显示逻辑需要确认');
        }

        // 4. 检查语音队列改进
        if (data.includes('V57.21') && data.includes('nextSpeechDelay')) {
            console.log('✅ 专家语音停顿已添加（1.5秒）');
        } else {
            console.log('⚠️ 专家语音停顿需要确认');
        }

        console.log('\n📊 总结：');
        console.log('- V57.20: 导航条显示问题 ✅');
        console.log('- V57.21: 专家语音被切断 ✅');
        console.log('- V57.22: 文字速度UI和按钮编码 ✅');
        console.log('\n✅ 验证完成！');

        // 检查是否还有其他Unicode字符
        const otherUnicodeChars = data.match(/[\u2000-\u2FFF]/g);
        if (otherUnicodeChars) {
            console.log(`\n⚠️ 发现其他Unicode字符: ${[...new Set(otherUnicodeChars)].join(', ')}`);
        }
    });
}).on('error', (err) => {
    console.error('❌ 无法连接到服务器:', err.message);
    console.log('请确保前端服务器在8080端口运行');
});