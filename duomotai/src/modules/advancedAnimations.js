/**
 * 高级UI动画模块 (Advanced Animations Module)
 *
 * 功能: 提供高级动画效果，增强多魔汰系统的用户体验
 * 创建时间: 2025-10-17 (Night-Auth FULL ON)
 * 阶段: Stage 4 - Advanced UI Animations
 *
 * @module advancedAnimations
 * @version v1.0
 */

(function(window) {
    'use strict';

    /**
     * 高级动画控制器类
     */
    class AdvancedAnimationsController {
        constructor() {
            this.animations = new Map(); // 活跃的动画实例
            this.animationId = 0; // 动画ID计数器
            console.log('✅ [AdvancedAnimations] 高级动画控制器初始化完成');
        }

        /**
         * 1. Fade In 动画（淡入效果）
         * @param {HTMLElement} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         * @param {function} onComplete - 完成回调
         * @returns {Promise} 动画完成的Promise
         */
        fadeIn(element, duration = 600, onComplete = null) {
            return new Promise((resolve) => {
                element.style.opacity = '0';
                element.style.transition = `opacity ${duration}ms ease-in-out`;

                // 触发重排
                element.offsetHeight;

                element.style.opacity = '1';

                setTimeout(() => {
                    if (onComplete) onComplete();
                    resolve();
                }, duration);
            });
        }

        /**
         * 2. Slide In 动画（从右侧滑入）
         * @param {HTMLElement} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         * @param {function} onComplete - 完成回调
         * @returns {Promise} 动画完成的Promise
         */
        slideInFromRight(element, duration = 500, onComplete = null) {
            return new Promise((resolve) => {
                element.style.transform = 'translateX(100%)';
                element.style.opacity = '0';
                element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease-in-out`;

                // 触发重排
                element.offsetHeight;

                element.style.transform = 'translateX(0)';
                element.style.opacity = '1';

                setTimeout(() => {
                    if (onComplete) onComplete();
                    resolve();
                }, duration);
            });
        }

        /**
         * 3. Scale In 动画（缩放进入）
         * @param {HTMLElement} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         * @param {function} onComplete - 完成回调
         * @returns {Promise} 动画完成的Promise
         */
        scaleIn(element, duration = 400, onComplete = null) {
            return new Promise((resolve) => {
                element.style.transform = 'scale(0.3)';
                element.style.opacity = '0';
                element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-in-out`;

                // 触发重排
                element.offsetHeight;

                element.style.transform = 'scale(1)';
                element.style.opacity = '1';

                setTimeout(() => {
                    if (onComplete) onComplete();
                    resolve();
                }, duration);
            });
        }

        /**
         * 4. Ripple 动画（波纹效果）
         * @param {HTMLElement} element - 目标元素
         * @param {MouseEvent} event - 鼠标事件（用于定位）
         * @param {string} color - 波纹颜色
         * @param {number} duration - 动画时长（毫秒）
         */
        ripple(element, event, color = 'rgba(255, 255, 255, 0.6)', duration = 600) {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                top: ${y}px;
                left: ${x}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${color};
                transform: scale(0);
                pointer-events: none;
                z-index: 1;
                transition: transform ${duration}ms ease-out, opacity ${duration}ms ease-out;
            `;

            element.style.position = element.style.position || 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);

            // 触发动画
            requestAnimationFrame(() => {
                ripple.style.transform = 'scale(2)';
                ripple.style.opacity = '0';
            });

            // 清理
            setTimeout(() => {
                ripple.remove();
            }, duration);
        }

        /**
         * 5. Shake 动画（抖动效果，用于错误提示）
         * @param {HTMLElement} element - 目标元素
         * @param {number} intensity - 抖动强度（px）
         * @param {number} duration - 动画时长（毫秒）
         */
        shake(element, intensity = 10, duration = 500) {
            const keyframes = [
                { transform: 'translateX(0)' },
                { transform: `translateX(-${intensity}px)` },
                { transform: `translateX(${intensity}px)` },
                { transform: `translateX(-${intensity}px)` },
                { transform: `translateX(${intensity}px)` },
                { transform: 'translateX(0)' }
            ];

            const animation = element.animate(keyframes, {
                duration: duration,
                easing: 'ease-in-out'
            });

            return animation.finished;
        }

        /**
         * 6. Pulse 动画（脉冲效果，用于强调）
         * @param {HTMLElement} element - 目标元素
         * @param {number} scale - 缩放比例
         * @param {number} duration - 动画时长（毫秒）
         */
        pulse(element, scale = 1.1, duration = 600) {
            const keyframes = [
                { transform: 'scale(1)' },
                { transform: `scale(${scale})` },
                { transform: 'scale(1)' }
            ];

            const animation = element.animate(keyframes, {
                duration: duration,
                easing: 'ease-in-out'
            });

            return animation.finished;
        }

        /**
         * 7. Typing Indicator 动画（打字指示器）
         * @param {HTMLElement} element - 目标元素
         * @returns {object} 控制对象（包含 stop 方法）
         */
        typingIndicator(element) {
            const indicator = document.createElement('span');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = `
                <span class="typing-dot" style="animation-delay: 0s;"></span>
                <span class="typing-dot" style="animation-delay: 0.2s;"></span>
                <span class="typing-dot" style="animation-delay: 0.4s;"></span>
            `;

            // 添加样式（如果不存在）
            if (!document.getElementById('typing-indicator-styles')) {
                const style = document.createElement('style');
                style.id = 'typing-indicator-styles';
                style.textContent = `
                    .typing-indicator {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        margin-left: 8px;
                    }
                    .typing-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #007AFF;
                        animation: typing-bounce 1.4s infinite ease-in-out;
                    }
                    @keyframes typing-bounce {
                        0%, 60%, 100% { transform: translateY(0); }
                        30% { transform: translateY(-10px); }
                    }
                `;
                document.head.appendChild(style);
            }

            element.appendChild(indicator);

            return {
                stop: () => indicator.remove()
            };
        }

        /**
         * 8. Progress Bar 动画（进度条）
         * @param {HTMLElement} element - 目标容器元素
         * @param {number} progress - 进度百分比（0-100）
         * @param {number} duration - 动画时长（毫秒）
         * @param {string} color - 进度条颜色
         */
        progressBar(element, progress, duration = 1000, color = '#007AFF') {
            let bar = element.querySelector('.progress-bar-fill');

            if (!bar) {
                element.innerHTML = `
                    <div class="progress-bar-container" style="
                        width: 100%;
                        height: 8px;
                        background: #f0f0f0;
                        border-radius: 10px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div class="progress-bar-fill" style="
                            width: 0%;
                            height: 100%;
                            background: linear-gradient(90deg, ${color}, ${color}dd);
                            border-radius: 10px;
                            transition: width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1);
                        "></div>
                    </div>
                `;
                bar = element.querySelector('.progress-bar-fill');
            }

            // 触发重排
            bar.offsetHeight;

            bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        /**
         * 9. Confetti 动画（彩纸庆祝效果）
         * @param {HTMLElement} container - 容器元素
         * @param {number} count - 彩纸数量
         * @param {number} duration - 动画时长（毫秒）
         */
        confetti(container = document.body, count = 50, duration = 3000) {
            const colors = ['#667eea', '#764ba2', '#FF3B30', '#34C759', '#FFD700', '#007AFF'];

            for (let i = 0; i < count; i++) {
                const confetti = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const startX = Math.random() * 100;
                const endX = startX + (Math.random() - 0.5) * 50;
                const rotation = Math.random() * 720;

                confetti.style.cssText = `
                    position: fixed;
                    top: -10px;
                    left: ${startX}%;
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    border-radius: 2px;
                    pointer-events: none;
                    z-index: 9999;
                `;

                container.appendChild(confetti);

                const animation = confetti.animate([
                    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                    { transform: `translate(${endX - startX}vw, 100vh) rotate(${rotation}deg)`, opacity: 0 }
                ], {
                    duration: duration + Math.random() * 1000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });

                animation.finished.then(() => confetti.remove());
            }
        }

        /**
         * 10. Smooth Scroll 动画（平滑滚动）
         * @param {HTMLElement} targetElement - 目标元素
         * @param {string} block - 对齐方式（'start', 'center', 'end', 'nearest'）
         * @param {number} offset - 偏移量（px）
         */
        smoothScroll(targetElement, block = 'center', offset = 0) {
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        /**
         * 11. Auto-Apply 动画到新元素（自动应用动画）
         * @param {string} selector - CSS选择器
         * @param {string} animationType - 动画类型（'fadeIn', 'slideInFromRight', 'scaleIn'）
         * @param {number} duration - 动画时长（毫秒）
         */
        autoApply(selector, animationType = 'fadeIn', duration = 600) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.matches(selector)) {
                            switch (animationType) {
                                case 'fadeIn':
                                    this.fadeIn(node, duration);
                                    break;
                                case 'slideInFromRight':
                                    this.slideInFromRight(node, duration);
                                    break;
                                case 'scaleIn':
                                    this.scaleIn(node, duration);
                                    break;
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            console.log(`✅ [AdvancedAnimations] 已启用自动动画: ${selector} → ${animationType}`);

            return observer; // 返回 observer 以便后续可以断开
        }
    }

    // 全局实例化并挂载到window
    window.AdvancedAnimations = new AdvancedAnimationsController();

    console.log('✅ [AdvancedAnimations] 模块已加载，全局对象: window.AdvancedAnimations');

})(window);

/**
 * 全局便捷函数 - 快速应用动画
 */

// 淡入动画
window.animateFadeIn = function(element, duration = 600) {
    return window.AdvancedAnimations.fadeIn(element, duration);
};

// 滑入动画
window.animateSlideIn = function(element, duration = 500) {
    return window.AdvancedAnimations.slideInFromRight(element, duration);
};

// 缩放动画
window.animateScaleIn = function(element, duration = 400) {
    return window.AdvancedAnimations.scaleIn(element, duration);
};

// 抖动动画（错误提示）
window.animateShake = function(element, intensity = 10, duration = 500) {
    return window.AdvancedAnimations.shake(element, intensity, duration);
};

// 脉冲动画（强调）
window.animatePulse = function(element, scale = 1.1, duration = 600) {
    return window.AdvancedAnimations.pulse(element, scale, duration);
};

// 彩纸庆祝动画
window.animateConfetti = function(container = document.body, count = 50, duration = 3000) {
    window.AdvancedAnimations.confetti(container, count, duration);
};

// 平滑滚动
window.animateSmoothScroll = function(targetElement, block = 'center', offset = 0) {
    window.AdvancedAnimations.smoothScroll(targetElement, block, offset);
};
