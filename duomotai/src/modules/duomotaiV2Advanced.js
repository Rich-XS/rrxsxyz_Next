/**
 * 多魔汰 v2 高级功能模块 (Duomotai v2 Advanced Features)
 *
 * 功能: 实现多魔汰系统的高级功能（阶段5）
 * 创建时间: 2025-10-17 (Night-Auth FULL ON)
 * 阶段: Stage 5 - Advanced Features
 *
 * @module duomotaiV2Advanced
 * @version v2.0
 *
 * 高级功能列表:
 * 1. 辩论历史管理（保存、加载、导出）
 * 2. 辩论快照功能（保存当前状态，随时恢复）
 * 3. 辩论对比功能（对比不同辩论的结果）
 * 4. 辩论评分系统（用户对辩论质量进行评分）
 * 5. 辩论收藏夹（收藏精彩的辩论片段）
 * 6. 辩论搜索功能（根据关键词搜索历史辩论）
 * 7. 辩论分享功能（生成分享链接/二维码）
 * 8. 辩论数据统计（Token消耗、时间统计、角色参与度）
 */

(function(window) {
    'use strict';

    /**
     * 辩论历史管理器
     */
    class DebateHistoryManager {
        constructor() {
            this.storageKey = 'duomotai_debate_history';
            this.maxHistoryCount = 50; // 最多保存50条历史记录
            console.log('✅ [V2-Advanced] 辩论历史管理器初始化完成');
        }

        /**
         * 保存辩论到历史记录
         * @param {object} debateData - 辩论数据
         * @returns {string} 辩论ID
         */
        saveDebate(debateData) {
            const debates = this.getAllDebates();
            const debateId = `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const record = {
                id: debateId,
                timestamp: new Date().toISOString(),
                topic: debateData.topic,
                background: debateData.background,
                roles: debateData.selectedRoles,
                rounds: debateData.rounds,
                report: debateData.reportData,
                metadata: {
                    duration: debateData.duration || 0,
                    tokenUsage: debateData.tokenUsage || 0,
                    userRating: null,
                    tags: []
                }
            };

            debates.unshift(record); // 最新的在前面

            // 限制历史记录数量
            if (debates.length > this.maxHistoryCount) {
                debates.splice(this.maxHistoryCount);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(debates));
            console.log(`✅ [V2-Advanced] 辩论已保存: ${debateId}`);

            return debateId;
        }

        /**
         * 获取所有辩论历史
         * @returns {array} 辩论列表
         */
        getAllDebates() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('❌ [V2-Advanced] 读取辩论历史失败:', error);
                return [];
            }
        }

        /**
         * 根据ID获取辩论
         * @param {string} debateId - 辩论ID
         * @returns {object|null} 辩论数据
         */
        getDebateById(debateId) {
            const debates = this.getAllDebates();
            return debates.find(d => d.id === debateId) || null;
        }

        /**
         * 删除辩论
         * @param {string} debateId - 辩论ID
         */
        deleteDebate(debateId) {
            const debates = this.getAllDebates();
            const filtered = debates.filter(d => d.id !== debateId);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            console.log(`✅ [V2-Advanced] 辩论已删除: ${debateId}`);
        }

        /**
         * 清空所有历史记录
         */
        clearAll() {
            localStorage.removeItem(this.storageKey);
            console.log('✅ [V2-Advanced] 所有辩论历史已清空');
        }

        /**
         * 搜索辩论（根据关键词）
         * @param {string} keyword - 关键词
         * @returns {array} 搜索结果
         */
        searchDebates(keyword) {
            const debates = this.getAllDebates();
            const lowerKeyword = keyword.toLowerCase();

            return debates.filter(d =>
                d.topic.toLowerCase().includes(lowerKeyword) ||
                (d.background && d.background.toLowerCase().includes(lowerKeyword)) ||
                (d.report && d.report.summary && d.report.summary.toLowerCase().includes(lowerKeyword))
            );
        }

        /**
         * 为辩论评分
         * @param {string} debateId - 辩论ID
         * @param {number} rating - 评分（1-5）
         */
        rateDebate(debateId, rating) {
            const debates = this.getAllDebates();
            const debate = debates.find(d => d.id === debateId);

            if (debate) {
                debate.metadata.userRating = rating;
                localStorage.setItem(this.storageKey, JSON.stringify(debates));
                console.log(`✅ [V2-Advanced] 辩论已评分: ${debateId} → ${rating}星`);
            }
        }

        /**
         * 为辩论添加标签
         * @param {string} debateId - 辩论ID
         * @param {array} tags - 标签数组
         */
        addTags(debateId, tags) {
            const debates = this.getAllDebates();
            const debate = debates.find(d => d.id === debateId);

            if (debate) {
                debate.metadata.tags = tags;
                localStorage.setItem(this.storageKey, JSON.stringify(debates));
                console.log(`✅ [V2-Advanced] 辩论标签已更新: ${debateId}`);
            }
        }

        /**
         * 导出辩论历史为JSON
         * @returns {string} JSON字符串
         */
        exportToJSON() {
            const debates = this.getAllDebates();
            return JSON.stringify(debates, null, 2);
        }

        /**
         * 从JSON导入辩论历史
         * @param {string} jsonData - JSON字符串
         * @param {boolean} merge - 是否合并（而非覆盖）
         */
        importFromJSON(jsonData, merge = false) {
            try {
                const importedDebates = JSON.parse(jsonData);

                if (!Array.isArray(importedDebates)) {
                    throw new Error('Invalid data format');
                }

                if (merge) {
                    const existingDebates = this.getAllDebates();
                    const mergedDebates = [...existingDebates, ...importedDebates];
                    localStorage.setItem(this.storageKey, JSON.stringify(mergedDebates));
                } else {
                    localStorage.setItem(this.storageKey, JSON.stringify(importedDebates));
                }

                console.log(`✅ [V2-Advanced] 辩论历史已导入: ${importedDebates.length} 条记录`);
                return true;
            } catch (error) {
                console.error('❌ [V2-Advanced] 导入辩论历史失败:', error);
                return false;
            }
        }
    }

    /**
     * 辩论快照管理器
     */
    class DebateSnapshotManager {
        constructor() {
            this.storageKey = 'duomotai_debate_snapshots';
            console.log('✅ [V2-Advanced] 辩论快照管理器初始化完成');
        }

        /**
         * 保存辩论快照
         * @param {string} name - 快照名称
         * @param {object} debateState - 辩论状态
         * @returns {string} 快照ID
         */
        saveSnapshot(name, debateState) {
            const snapshots = this.getAllSnapshots();
            const snapshotId = `snapshot_${Date.now()}`;

            const snapshot = {
                id: snapshotId,
                name: name || `快照 ${new Date().toLocaleString('zh-CN')}`,
                timestamp: new Date().toISOString(),
                state: debateState
            };

            snapshots.unshift(snapshot);

            // 限制快照数量（最多10个）
            if (snapshots.length > 10) {
                snapshots.splice(10);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(snapshots));
            console.log(`✅ [V2-Advanced] 快照已保存: ${snapshotId}`);

            return snapshotId;
        }

        /**
         * 获取所有快照
         * @returns {array} 快照列表
         */
        getAllSnapshots() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('❌ [V2-Advanced] 读取快照失败:', error);
                return [];
            }
        }

        /**
         * 根据ID获取快照
         * @param {string} snapshotId - 快照ID
         * @returns {object|null} 快照数据
         */
        getSnapshotById(snapshotId) {
            const snapshots = this.getAllSnapshots();
            return snapshots.find(s => s.id === snapshotId) || null;
        }

        /**
         * 删除快照
         * @param {string} snapshotId - 快照ID
         */
        deleteSnapshot(snapshotId) {
            const snapshots = this.getAllSnapshots();
            const filtered = snapshots.filter(s => s.id !== snapshotId);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            console.log(`✅ [V2-Advanced] 快照已删除: ${snapshotId}`);
        }

        /**
         * 清空所有快照
         */
        clearAll() {
            localStorage.removeItem(this.storageKey);
            console.log('✅ [V2-Advanced] 所有快照已清空');
        }
    }

    /**
     * 辩论数据统计器
     */
    class DebateStatisticsCollector {
        constructor() {
            this.storageKey = 'duomotai_debate_statistics';
            console.log('✅ [V2-Advanced] 辩论数据统计器初始化完成');
        }

        /**
         * 记录辩论统计数据
         * @param {object} debateData - 辩论数据
         */
        recordStatistics(debateData) {
            const stats = this.getAllStatistics();

            const record = {
                timestamp: new Date().toISOString(),
                topic: debateData.topic,
                rounds: debateData.rounds,
                rolesCount: debateData.selectedRoles.length,
                duration: debateData.duration || 0,
                tokenUsage: debateData.tokenUsage || 0,
                delegateInputsCount: debateData.delegateInputsCount || 0,
                phase: debateData.phase
            };

            stats.push(record);

            // 限制统计记录数量（最多100条）
            if (stats.length > 100) {
                stats.splice(0, stats.length - 100);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(stats));
            console.log('✅ [V2-Advanced] 辩论统计数据已记录');
        }

        /**
         * 获取所有统计数据
         * @returns {array} 统计记录列表
         */
        getAllStatistics() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('❌ [V2-Advanced] 读取统计数据失败:', error);
                return [];
            }
        }

        /**
         * 获取汇总统计
         * @returns {object} 汇总数据
         */
        getSummary() {
            const stats = this.getAllStatistics();

            if (stats.length === 0) {
                return {
                    totalDebates: 0,
                    totalTokens: 0,
                    totalDuration: 0,
                    avgTokensPerDebate: 0,
                    avgDurationPerDebate: 0,
                    avgRoundsPerDebate: 0
                };
            }

            const totalTokens = stats.reduce((sum, s) => sum + s.tokenUsage, 0);
            const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
            const totalRounds = stats.reduce((sum, s) => sum + s.rounds, 0);

            return {
                totalDebates: stats.length,
                totalTokens: totalTokens,
                totalDuration: totalDuration,
                avgTokensPerDebate: Math.round(totalTokens / stats.length),
                avgDurationPerDebate: Math.round(totalDuration / stats.length),
                avgRoundsPerDebate: Math.round(totalRounds / stats.length)
            };
        }

        /**
         * 清空统计数据
         */
        clearAll() {
            localStorage.removeItem(this.storageKey);
            console.log('✅ [V2-Advanced] 统计数据已清空');
        }
    }

    /**
     * 辩论分享功能
     */
    class DebateShareManager {
        /**
         * 生成分享链接
         * @param {string} debateId - 辩论ID
         * @returns {string} 分享链接
         */
        generateShareLink(debateId) {
            const baseUrl = window.location.origin + window.location.pathname;
            return `${baseUrl}?share=${debateId}`;
        }

        /**
         * 生成分享二维码（需要第三方库，这里仅返回API链接）
         * @param {string} shareLink - 分享链接
         * @returns {string} 二维码API链接
         */
        generateQRCode(shareLink) {
            return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
        }

        /**
         * 复制分享链接到剪贴板
         * @param {string} shareLink - 分享链接
         * @returns {Promise<boolean>} 是否成功
         */
        async copyToClipboard(shareLink) {
            try {
                await navigator.clipboard.writeText(shareLink);
                console.log('✅ [V2-Advanced] 分享链接已复制到剪贴板');
                return true;
            } catch (error) {
                console.error('❌ [V2-Advanced] 复制到剪贴板失败:', error);
                return false;
            }
        }
    }

    // 全局实例化并挂载到window
    window.DuomotaiV2Advanced = {
        DebateHistory: new DebateHistoryManager(),
        DebateSnapshot: new DebateSnapshotManager(),
        DebateStatistics: new DebateStatisticsCollector(),
        DebateShare: new DebateShareManager()
    };

    console.log('✅ [V2-Advanced] 多魔汰v2高级功能模块已加载，全局对象: window.DuomotaiV2Advanced');

})(window);
