/**
 * V4.0 答题质量检测参数配置
 *
 * 使用说明：
 * - 生产环境：使用 PRODUCTION 配置
 * - 调试测试：使用 DEBUG 配置
 * - 当前模式：修改 CURRENT_MODE 来切换
 */

// 配置模式
const CONFIG_MODES = {
    PRODUCTION: {
        name: "生产环境",
        description: "正式上线使用的严格标准",
        minTotalTimeMinutes: 30,        // 最少总时长（分钟）
        minTimePerQuestionSeconds: 10,  // 每题最少时间（秒）
        maxIdenticalAnswers: 0,         // 允许与示例完全一致的题数
        maxSimilarityThreshold: 0.8,    // 最大相似度阈值
        minQualityScore: 60,            // 最低质量分数
        minCompletionRate: 0.8,         // 最低完成率
        maxConsecutiveWarnings: 3       // 最大连续警告次数
    },

    DEBUG: {
        name: "调试模式",
        description: "开发测试使用的宽松标准",
        minTotalTimeMinutes: 0,         // 测试：无最少时长要求
        minTimePerQuestionSeconds: 0,   // 测试：无单题时长要求
        maxIdenticalAnswers: 100,       // 测试：允许所有题目一致
        maxSimilarityThreshold: 1.0,    // 测试：允许100%相似
        minQualityScore: 0,             // 测试：无最低分数要求
        minCompletionRate: 0.1,         // 测试：只需10%完成率
        maxConsecutiveWarnings: 999     // 测试：基本不警告
    },

    MODERATE: {
        name: "中等模式",
        description: "适中的检测标准",
        minTotalTimeMinutes: 10,        // 中等：10分钟总时长
        minTimePerQuestionSeconds: 3,   // 中等：3秒每题
        maxIdenticalAnswers: 10,        // 中等：允许10题一致
        maxSimilarityThreshold: 0.9,    // 中等：90%相似度
        minQualityScore: 30,            // 中等：30分最低分
        minCompletionRate: 0.5,         // 中等：50%完成率
        maxConsecutiveWarnings: 5       // 中等：5次连续警告
    }
};

// 当前使用的配置模式
// 🔧 修改这里来切换配置模式
const CURRENT_MODE = 'DEBUG';  // 可选: 'PRODUCTION', 'DEBUG', 'MODERATE'

// 导出当前配置
const QUALITY_CONFIG = CONFIG_MODES[CURRENT_MODE];

// 添加运行时信息
QUALITY_CONFIG.mode = CURRENT_MODE;
QUALITY_CONFIG.switchedAt = new Date().toISOString();

// 控制台输出当前配置
console.log(`📊 质量检测配置 - ${QUALITY_CONFIG.name}`);
console.log(`📝 ${QUALITY_CONFIG.description}`);
console.log('🔧 当前参数:', {
    总时长要求: `${QUALITY_CONFIG.minTotalTimeMinutes}分钟`,
    单题时长要求: `${QUALITY_CONFIG.minTimePerQuestionSeconds}秒`,
    允许相同答案: `${QUALITY_CONFIG.maxIdenticalAnswers}题`,
    相似度阈值: `${(QUALITY_CONFIG.maxSimilarityThreshold * 100).toFixed(0)}%`,
    最低质量分: `${QUALITY_CONFIG.minQualityScore}分`,
    最低完成率: `${(QUALITY_CONFIG.minCompletionRate * 100).toFixed(0)}%`
});

// 开发者快捷切换函数
function switchQualityMode(mode) {
    if (!CONFIG_MODES[mode]) {
        console.error(`❌ 无效的配置模式: ${mode}`);
        console.log(`✅ 可用模式:`, Object.keys(CONFIG_MODES).join(', '));
        return false;
    }

    console.log(`🔄 切换到: ${CONFIG_MODES[mode].name}`);
    // 注意：这只是示例，实际切换需要重新加载页面
    return true;
}

// 配置验证函数
function validateConfig(config) {
    const issues = [];

    if (config.minTotalTimeMinutes < 0) issues.push('总时长不能为负数');
    if (config.minTimePerQuestionSeconds < 0) issues.push('单题时长不能为负数');
    if (config.maxIdenticalAnswers < 0) issues.push('相同答案数不能为负数');
    if (config.maxSimilarityThreshold < 0 || config.maxSimilarityThreshold > 1) {
        issues.push('相似度阈值必须在0-1之间');
    }

    if (issues.length > 0) {
        console.warn('⚠️ 配置验证警告:', issues);
    }

    return issues.length === 0;
}

// 验证当前配置
validateConfig(QUALITY_CONFIG);

// 全局暴露配置（供HTML页面使用）
if (typeof window !== 'undefined') {
    window.QUALITY_CONFIG = QUALITY_CONFIG;
    window.switchQualityMode = switchQualityMode;
    window.CONFIG_MODES = CONFIG_MODES;
}