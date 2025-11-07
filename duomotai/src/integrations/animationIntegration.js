/**
 * 动画集成模块 (Animation Integration)
 *
 * 功能: 将高级动画效果集成到多魔汰辩论系统的各个阶段
 * 创建时间: 2025-10-17 (Night-Auth FULL ON)
 * 阶段: Stage 4 - Advanced UI Animations Integration
 *
 * @module animationIntegration
 * @version v1.0
 *
 * 使用示例:
 * 1. 在 index.html 中引入此模块（在 advancedAnimations.js 之后）
 * 2. 调用 initAnimationIntegration() 启用自动动画集成
 */

(function(window) {
    'use strict';

    /**
     * 初始化动画集成
     */
    function initAnimationIntegration() {
        if (!window.AdvancedAnimations) {
            console.error('❌ [AnimationIntegration] AdvancedAnimations 模块未加载');
            return;
        }

        console.log('✅ [AnimationIntegration] 开始集成动画到多魔汰系统');

        // 1. ✅ 辩论轮次卡片自动淡入动画
        window.AdvancedAnimations.autoApply('.debate-round', 'fadeIn', 600);

        // 2. ✅ 专家发言卡片自动滑入动画
        window.AdvancedAnimations.autoApply('.speech-item', 'slideInFromRight', 500);

        // 3. ✅ 委托人提示框自动缩放进入动画
        window.AdvancedAnimations.autoApply('.delegate-prompt', 'scaleIn', 400);

        // 4. ✅ 报告区块自动淡入动画
        window.AdvancedAnimations.autoApply('.report-section', 'fadeIn', 800);

        // 5. ✅ 为所有按钮添加波纹点击效果
        enhanceButtonsWithRipple();

        // 6. ✅ 错误提示自动抖动
        enhanceErrorShaking();

        // 7. ✅ 完成时彩纸庆祝效果
        enhanceCompletionCelebration();

        console.log('✅ [AnimationIntegration] 动画集成完成');
    }

    /**
     * 为所有按钮添加波纹点击效果
     */
    function enhanceButtonsWithRipple() {
        // 监听所有按钮点击
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (button && window.AdvancedAnimations) {
                // 确定波纹颜色（根据按钮背景）
                const computedStyle = window.getComputedStyle(button);
                const bgColor = computedStyle.background;

                let rippleColor = 'rgba(255, 255, 255, 0.6)';

                // 如果是浅色按钮，使用深色波纹
                if (bgColor.includes('white') || bgColor.includes('rgb(255, 255, 255)')) {
                    rippleColor = 'rgba(0, 0, 0, 0.2)';
                }

                window.AdvancedAnimations.ripple(button, event, rippleColor);
            }
        }, true); // 使用捕获阶段，确保在所有按钮点击事件之前执行

        console.log('✅ [AnimationIntegration] 已启用按钮波纹效果');
    }

    /**
     * 错误提示自动抖动
     */
    function enhanceErrorShaking() {
        // 监听 alert 错误提示（通过劫持 window.alert）
        const originalAlert = window.alert;
        window.alert = function(message) {
            // 如果消息包含错误关键词，抖动最近的输入框
            if (message && (message.includes('错误') || message.includes('失败') || message.includes('无效') || message.includes('Error'))) {
                const activeInput = document.activeElement;
                if (activeInput && (activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA')) {
                    window.AdvancedAnimations.shake(activeInput, 10, 500);
                }
            }

            // 调用原始 alert
            return originalAlert.call(window, message);
        };

        console.log('✅ [AnimationIntegration] 已启用错误提示抖动效果');
    }

    /**
     * 完成时彩纸庆祝效果
     */
    function enhanceCompletionCelebration() {
        // 监听 debateEngine 的 phaseChange 事件
        if (window.state && window.state.debateEngine) {
            window.state.debateEngine.on('phaseChange', (data) => {
                if (data.phase === 'delivery' || data.phase === 'completed') {
                    console.log('🎉 [AnimationIntegration] 辩论完成，触发庆祝动画');

                    // 延迟 500ms 触发彩纸效果（等待报告显示）
                    setTimeout(() => {
                        window.AdvancedAnimations.confetti(document.body, 60, 3000);
                    }, 500);
                }
            });

            console.log('✅ [AnimationIntegration] 已启用完成庆祝效果');
        }
    }

    /**
     * 手动触发特定元素的动画
     * @param {HTMLElement} element - 目标元素
     * @param {string} animationType - 动画类型
     * @param {number} duration - 动画时长（毫秒）
     */
    function applyAnimation(element, animationType, duration) {
        if (!window.AdvancedAnimations) {
            console.error('❌ [AnimationIntegration] AdvancedAnimations 模块未加载');
            return;
        }

        switch (animationType) {
            case 'fadeIn':
                return window.AdvancedAnimations.fadeIn(element, duration);
            case 'slideInFromRight':
                return window.AdvancedAnimations.slideInFromRight(element, duration);
            case 'scaleIn':
                return window.AdvancedAnimations.scaleIn(element, duration);
            case 'shake':
                return window.AdvancedAnimations.shake(element, 10, duration);
            case 'pulse':
                return window.AdvancedAnimations.pulse(element, 1.1, duration);
            default:
                console.warn(`⚠️ [AnimationIntegration] 未知的动画类型: ${animationType}`);
        }
    }

    // 导出到全局
    window.AnimationIntegration = {
        init: initAnimationIntegration,
        applyAnimation: applyAnimation
    };

    console.log('✅ [AnimationIntegration] 模块已加载，全局对象: window.AnimationIntegration');

})(window);

/**
 * 使用说明:
 *
 * 1. 在 DOMContentLoaded 后调用:
 *    document.addEventListener('DOMContentLoaded', () => {
 *        window.AnimationIntegration.init();
 *    });
 *
 * 2. 手动触发动画:
 *    const element = document.querySelector('.my-element');
 *    window.AnimationIntegration.applyAnimation(element, 'fadeIn', 600);
 *
 * 3. 直接使用全局便捷函数:
 *    animateFadeIn(element, 600);
 *    animateSlideIn(element, 500);
 *    animateShake(element);
 *    animatePulse(element);
 *    animateConfetti();
 */
