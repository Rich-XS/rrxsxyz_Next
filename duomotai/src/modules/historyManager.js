/**
 * 历史记录管理模块
 * History Manager Module
 *
 * 功能：
 * - 显示辩论历史记录
 * - 查看辩论详情
 * - 删除辩论记录
 * - 搜索/过滤历史记录
 *
 * @version v1.0
 * @date 2025-10-18
 */

class HistoryManager {
  constructor() {
    this.currentDebateHistory = null;
  }

  /**
   * ✅ [Stage 4/5] 显示风暴辩论历史 - 完整模态UI实现
   */
  async showDebateHistory() {
    try {
      if (!window.UserAuth) {
        alert('用户认证模块未加载');
        return;
      }

      const history = await window.UserAuth.getDebateHistory();

      if (history.length === 0) {
        alert('您还没有风暴辩论历史记录');
        return;
      }

      console.log('📜 [Stage 4/5] 显示辩论历史:', history);

      // 创建模态对话框背景
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'historyModalOverlay';
      modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
      `;

      // 创建模态对话框容器
      const modalContainer = document.createElement('div');
      modalContainer.style.cssText = `
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease-out;
      `;

      // 创建模态头部
      const modalHeader = document.createElement('div');
      modalHeader.style.cssText = `
        padding: 20px 24px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      `;
      modalHeader.innerHTML = `
        <h2 style="margin: 0; color: #007AFF; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 22px; font-weight: 600;">📜 辩论历史记录</h2>
        <button onclick="window.historyManager.closeHistoryModal()" style="width: 32px; height: 32px; background: #f0f0f0; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 18px;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
          ✕
        </button>
      `;

      // 创建搜索栏（简化版）
      const searchBar = document.createElement('div');
      searchBar.style.cssText = `
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
      `;
      searchBar.innerHTML = `
        <input type="text" id="historySearch" placeholder="🔍 搜索辩论主题..." style="width: 100%; padding: 10px 16px; border: 2px solid #e0e0e0; border-radius: 10px; font-family: -apple-system, sans-serif; font-size: 14px; outline: none; transition: all 0.3s;" onfocus="this.style.borderColor='#007AFF'" onblur="this.style.borderColor='#e0e0e0'" oninput="window.historyManager.filterDebateHistory()">
      `;

      // 创建历史记录列表容器
      const historyList = document.createElement('div');
      historyList.id = 'historyList';
      historyList.style.cssText = `
        padding: 16px 24px;
        overflow-y: auto;
        flex: 1;
      `;

      // 生成历史记录卡片HTML
      historyList.innerHTML = history.map((record, index) => {
        const date = new Date(record.timestamp || record.createdAt);
        const dateStr = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const roundsCount = record.rounds ? record.rounds.length : 0;
        const topic = record.topic || '未命名辩论';
        const truncatedTopic = topic.length > 40 ? topic.substring(0, 40) + '...' : topic;

        return `
          <div class="history-card" data-index="${index}" data-topic="${record.topic}" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; transition: all 0.2s; cursor: pointer;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,122,255,0.1)'; this.style.borderColor='#007AFF'" onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e0e0e0'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <h3 style="margin: 0; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 16px; font-weight: 600; color: #333; flex: 1;">${truncatedTopic}</h3>
              <button onclick="event.stopPropagation(); window.historyManager.deleteDebateRecord(${index})" style="padding: 4px 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; margin-left: 12px;" onmouseover="this.style.background='#D12A22'" onmouseout="this.style.background='#FF3B30'">
                🗑️ 删除
              </button>
            </div>
            <div style="display: flex; gap: 16px; color: #666; font-size: 13px; font-family: -apple-system, sans-serif; margin-bottom: 12px;">
              <span>📅 ${dateStr}</span>
              <span>🔄 ${roundsCount} 轮</span>
            </div>
            <button onclick="event.stopPropagation(); window.historyManager.viewDebateDetail(${index})" style="padding: 6px 16px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,122,255,0.2);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              👁️ 查看详情
            </button>
          </div>
        `;
      }).join('');

      // 创建模态底部（统计信息）
      const modalFooter = document.createElement('div');
      modalFooter.style.cssText = `
        padding: 16px 24px;
        border-top: 1px solid #f0f0f0;
        text-align: center;
        color: #999;
        font-size: 13px;
        font-family: -apple-system, sans-serif;
      `;
      modalFooter.textContent = `共 ${history.length} 条辩论记录`;

      // 组装模态对话框
      modalContainer.appendChild(modalHeader);
      modalContainer.appendChild(searchBar);
      modalContainer.appendChild(historyList);
      modalContainer.appendChild(modalFooter);
      modalOverlay.appendChild(modalContainer);

      // 添加到页面
      document.body.appendChild(modalOverlay);

      // 点击背景关闭模态
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeHistoryModal();
        }
      });

      // 保存历史记录到实例，供其他函数使用
      this.currentDebateHistory = history;

      console.log('✅ [Stage 4/5] 历史辩论模态UI已显示');

    } catch (error) {
      console.error('❌ [Stage 4/5] 获取辩论历史失败:', error);
      alert('获取风暴辩论历史失败：' + error.message);
    }
  }

  /**
   * ✅ [Stage 4/5] 关闭历史记录模态
   */
  closeHistoryModal() {
    const modal = document.getElementById('historyModalOverlay');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => {
        modal.remove();
        this.currentDebateHistory = null;
      }, 300);
    }
  }

  /**
   * ✅ [Stage 4/5] 过滤历史记录（搜索功能）
   */
  filterDebateHistory() {
    const searchInput = document.getElementById('historySearch');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const historyCards = document.querySelectorAll('.history-card');

    historyCards.forEach(card => {
      const topic = card.dataset.topic.toLowerCase();
      if (topic.includes(keyword)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    console.log('🔍 [Stage 4/5] 搜索关键词:', keyword);
  }

  /**
   * ✅ [Stage 4/5] 查看辩论详情
   */
  viewDebateDetail(index) {
    if (!this.currentDebateHistory || !this.currentDebateHistory[index]) {
      alert('无法获取辩论详情');
      return;
    }

    const record = this.currentDebateHistory[index];
    console.log('👁️ [Stage 4/5] 查看辩论详情:', record);

    // 创建详情模态
    const detailOverlay = document.createElement('div');
    detailOverlay.id = 'debateDetailOverlay';
    detailOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;

    const detailContainer = document.createElement('div');
    detailContainer.style.cssText = `
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 900px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
    `;

    // 详情头部
    const detailHeader = document.createElement('div');
    detailHeader.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    detailHeader.innerHTML = `
      <h2 style="margin: 0; color: #007AFF; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 20px; font-weight: 600;">📋 辩论详情</h2>
      <button onclick="window.historyManager.closeDebateDetail()" style="width: 32px; height: 32px; background: #f0f0f0; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 18px;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
        ✕
      </button>
    `;

    // 详情内容
    const detailContent = document.createElement('div');
    detailContent.style.cssText = `
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    `;

    const date = new Date(record.timestamp || record.createdAt);
    const dateStr = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    let contentHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 18px; font-weight: 600;">主题</h3>
        <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">${record.topic || '未命名'}</p>
      </div>

      <div style="margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
        <div>
          <span style="color: #999; font-size: 14px;">📅 创建时间：</span>
          <span style="color: #333; font-size: 14px; font-weight: 500;">${dateStr}</span>
        </div>
        <div>
          <span style="color: #999; font-size: 14px;">🔄 辩论轮次：</span>
          <span style="color: #333; font-size: 14px; font-weight: 500;">${record.rounds ? record.rounds.length : 0} 轮</span>
        </div>
      </div>
    `;

    if (record.background) {
      contentHTML += `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 16px; font-weight: 600;">背景信息</h3>
          <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${record.background}</p>
        </div>
      `;
    }

    if (record.rounds && record.rounds.length > 0) {
      contentHTML += `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-family: -apple-system, SF Pro Display, sans-serif; font-size: 16px; font-weight: 600;">辩论轮次摘要</h3>
      `;

      record.rounds.forEach((round, idx) => {
        const speechCount = round.speeches ? round.speeches.length : 0;
        contentHTML += `
          <div style="background: #f5f5f7; padding: 12px 16px; border-radius: 10px; margin-bottom: 10px;">
            <div style="font-weight: 600; color: #007AFF; margin-bottom: 6px;">第 ${round.roundNumber || idx + 1} 轮</div>
            <div style="font-size: 13px; color: #666;">
              ${round.topic ? `主题：${round.topic}<br>` : ''}
              发言数：${speechCount} 条
            </div>
          </div>
        `;
      });

      contentHTML += `</div>`;
    }

    detailContent.innerHTML = contentHTML;

    // 详情底部（操作按钮）
    const detailFooter = document.createElement('div');
    detailFooter.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;
    detailFooter.innerHTML = `
      <button onclick="window.historyManager.closeDebateDetail()" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
        关闭
      </button>
    `;

    // 组装详情模态
    detailContainer.appendChild(detailHeader);
    detailContainer.appendChild(detailContent);
    detailContainer.appendChild(detailFooter);
    detailOverlay.appendChild(detailContainer);

    // 添加到页面
    document.body.appendChild(detailOverlay);

    // 点击背景关闭
    detailOverlay.addEventListener('click', (e) => {
      if (e.target === detailOverlay) {
        this.closeDebateDetail();
      }
    });
  }

  /**
   * ✅ [Stage 4/5] 关闭辩论详情模态
   */
  closeDebateDetail() {
    const modal = document.getElementById('debateDetailOverlay');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => modal.remove(), 300);
    }
  }

  /**
   * ✅ [Stage 4/5] 删除辩论记录
   */
  async deleteDebateRecord(index) {
    if (!this.currentDebateHistory || !this.currentDebateHistory[index]) {
      alert('无法删除记录');
      return;
    }

    const record = this.currentDebateHistory[index];
    const confirmed = confirm(`确定删除这条辩论记录吗？\n\n主题：${record.topic || '未命名'}`);

    if (!confirmed) return;

    try {
      console.log('🗑️ [Stage 4/5] 删除辩论记录:', record);

      // 调用 UserAuth 删除记录
      if (window.UserAuth && typeof window.UserAuth.deleteDebateRecord === 'function') {
        await window.UserAuth.deleteDebateRecord(record.id || index);

        // 从当前列表中移除
        this.currentDebateHistory.splice(index, 1);

        // 刷新UI
        const historyCard = document.querySelector(`.history-card[data-index="${index}"]`);
        if (historyCard) {
          historyCard.style.animation = 'fadeOut 0.3s ease-in';
          setTimeout(() => {
            historyCard.remove();

            // 更新底部统计
            const footer = document.querySelector('#historyModalOverlay .modal-footer');
            if (footer) {
              footer.textContent = `共 ${this.currentDebateHistory.length} 条辩论记录`;
            }
          }, 300);
        }

        console.log('✅ [Stage 4/5] 辩论记录已删除');
      } else {
        throw new Error('删除功能未实现');
      }

    } catch (error) {
      console.error('❌ [Stage 4/5] 删除记录失败:', error);
      alert('删除失败：' + error.message);
    }
  }
}

// 全局实例化并挂载到window
window.historyManager = new HistoryManager();

// 导出全局函数（向后兼容）
window.showDebateHistory = () => window.historyManager.showDebateHistory();

console.log('✅ [HistoryManager] 历史记录管理模块已加载');
