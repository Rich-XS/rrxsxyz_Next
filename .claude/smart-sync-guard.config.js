module.exports = {
    // 检查间隔（分钟）
    CHECK_INTERVAL_MIN: 10,
    
    // 报警阈值（分钟）
    ALERT_THRESHOLD_MIN: 30,
    
    // 自动同步开关
    AUTO_SYNC: true,
    
    // 内存管理
    MAX_HEAP_MB: 4096,           // 4GB
    MEM_CHECK_INTERVAL_MIN: 5,    // 每5分钟检查一次
    FORCE_GC_THRESHOLD_MB: 3072,  // 3GB时强制GC
    
    // 日志管理
    MAX_LOG_SIZE_MB: 50,         // 日志文件最大50MB
    LOG_ROTATION_COUNT: 5,        // 保留5个历史日志文件
    LOG_BUFFER_SIZE: 64 * 1024,  // 64KB缓冲区
    
    // 调试选项
    DEBUG: false,
    VERBOSE_LOGGING: false
};