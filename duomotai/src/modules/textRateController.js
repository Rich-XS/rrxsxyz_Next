/**
 * 文字流速控制模块 (Text Rate Controller)
 *
 * 功能: 控制 AI 专家发言的文字显示速度
 * 创建时间: 2025-10-17 (Night-Auth FULL ON)
 * 决策参考: D-63 决策（语音与文字流同步机制）的功能增强
 *
 * @module textRateController
 * @version v1.0
 */

(function(window) {
    'use strict';

    /**
     * 文字速率控制器类
     */
    class TextRateController {
        constructor() {
            // ✅ [FIX V5.3-FIX4 SYNC] 速率档位重新设计 - 匹配语音速度
            // 语音默认rate=5 ≈ 10-15字/秒，文字默认5x = 10字/秒
            // step = 2字/秒，1x到10x区分明显
            this.RATE_LEVELS = [
                { speed: 2, label: '1x', delayMs: 500 },      // 2 字/秒（慢速）
                { speed: 4, label: '2x', delayMs: 250 },      // 4 字/秒
                { speed: 6, label: '3x', delayMs: 167 },      // 6 字/秒
                { speed: 8, label: '4x', delayMs: 125 },      // 8 字/秒
                { speed: 10, label: '5x', delayMs: 100 },     // 10 字/秒（默认，匹配语音）
                { speed: 12, label: '6x', delayMs: 83 },      // 12 字/秒
                { speed: 14, label: '7x', delayMs: 71 },      // 14 字/秒
                { speed: 16, label: '8x', delayMs: 63 },      // 16 字/秒
                { speed: 18, label: '9x', delayMs: 56 },      // 18 字/秒
                { speed: 20, label: '10x', delayMs: 50 },     // 20 字/秒（极快）
                { speed: Infinity, label: '即时', delayMs: 0 } // 瞬间显示
            ];

            // ✅ [D-66 重大决策] 默认档位改为9（10x = 20字/秒，最高速度）- 语音关闭时优先快速显示
            this.currentLevelIndex = 9;

            // 当前正在显示的文字流任务
            this.currentTask = null;

            console.log('✅ [TextRateController] 文字速率控制器初始化完成', {
                defaultLevel: this.RATE_LEVELS[this.currentLevelIndex].label,
                defaultSpeed: `${this.RATE_LEVELS[this.currentLevelIndex].speed}字/秒`,
                defaultDelayMs: this.RATE_LEVELS[this.currentLevelIndex].delayMs
            });

            // ✅ [D-66 FIX #5] 初始化完成后立即更新UI显示（修复硬编码5x问题）
            // 使用 setTimeout 确保 DOM 已加载
            setTimeout(() => this.updateDisplay(), 100);
        }

        /**
         * 调整文字速率
         * @param {number} delta - 调整档位（+1 加速，-1 减速）
         */
        adjustRate(delta) {
            const oldIndex = this.currentLevelIndex;
            this.currentLevelIndex = Math.max(
                0,
                Math.min(this.RATE_LEVELS.length - 1, this.currentLevelIndex + delta)
            );

            const level = this.RATE_LEVELS[this.currentLevelIndex];

            console.log('✅ [TextRateController] 速率调整', {
                delta,
                oldLevel: this.RATE_LEVELS[oldIndex].label,
                newLevel: level.label,
                delayMs: level.delayMs
            });

            // 更新UI显示
            this.updateDisplay();

            return level;
        }

        /**
         * 获取当前速率
         * @returns {object} 当前速率配置
         */
        getCurrentRate() {
            return this.RATE_LEVELS[this.currentLevelIndex];
        }

        /**
         * 更新UI显示
         */
        updateDisplay() {
            const displayEl = document.getElementById('textRateDisplay');
            if (displayEl) {
                const level = this.getCurrentRate();
                displayEl.textContent = level.label;
                console.log('✅ [TextRateController] UI更新:', level.label);
            }
        }

        /**
         * 模拟打字机效果显示文字（支持HTML格式）
         * @param {string} text - 要显示的文字（可包含HTML标签）
         * @param {HTMLElement} targetElement - 目标元素
         * @param {function} onComplete - 完成回调
         * @returns {Promise} 显示完成的Promise
         */
        async displayTextWithTyping(text, targetElement, onComplete = null) {
            // 如果已有正在进行的任务，取消它
            if (this.currentTask) {
                this.currentTask.cancelled = true;
                this.currentTask = null;
            }

            const level = this.getCurrentRate();
            const delayMs = level.delayMs;

            console.log('🖋️ [TextRateController] 开始打字机效果显示', {
                textLength: text.length,
                delayMs,
                level: level.label
            });

            // ✅ [FIX V5.3] 如果是即时显示，使用innerHTML保留格式
            if (delayMs === 0) {
                targetElement.innerHTML = text;
                if (onComplete) onComplete();
                return Promise.resolve();
            }

            // ✅ [FIX V5.3] 提取纯文本用于打字机效果
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            // 创建任务标记
            const task = { cancelled: false };
            this.currentTask = task;

            return new Promise((resolve, reject) => {
                let currentIndex = 0;

                const typeNextChar = () => {
                    // 检查任务是否被取消
                    if (task.cancelled) {
                        console.log('⚠️ [TextRateController] 任务被取消');
                        reject(new Error('Task cancelled'));
                        return;
                    }

                    // 检查是否完成
                    if (currentIndex >= plainText.length) {
                        // ✅ [FIX V5.3] 完成后替换为完整HTML格式
                        targetElement.innerHTML = text;
                        console.log('✅ [TextRateController] 打字机效果完成');
                        if (onComplete) onComplete();
                        resolve();
                        return;
                    }

                    // ✅ [FIX V5.3] 打字过程中显示纯文本（避免HTML标签被逐字显示导致格式混乱）
                    targetElement.textContent = plainText.substring(0, currentIndex + 1);
                    currentIndex++;

                    // 延迟后显示下一个字符
                    setTimeout(typeNextChar, delayMs);
                };

                // 开始打字
                typeNextChar();
            });
        }

        /**
         * 取消当前文字流任务
         */
        cancelCurrentTask() {
            if (this.currentTask) {
                this.currentTask.cancelled = true;
                this.currentTask = null;
                console.log('✅ [TextRateController] 当前任务已取消');
            }
        }

        /**
         * 重置到默认速率
         */
        resetToDefault() {
            this.currentLevelIndex = 9; // ✅ [D-66 重大决策] 10x（20字/秒，最高速度）
            this.updateDisplay();
            console.log('✅ [TextRateController] 速率已重置为默认（10x = 20字/秒）');
        }
    }

    // 全局实例化并挂载到window
    window.TextRateController = new TextRateController();

    console.log('✅ [TextRateController] 模块已加载，全局对象: window.TextRateController');

})(window);

/**
 * 全局便捷函数 - 调整文字速率
 * @param {number} delta - 调整档位（+1 加速，-1 减速）
 */
window.adjustTextRate = function(delta) {
    if (window.TextRateController) {
        window.TextRateController.adjustRate(delta);
    } else {
        console.error('❌ TextRateController 模块未加载');
    }
};
