// 用户画像模块 - v5 用户调研系统
// 集成 rrxs.xyz 整体用户系统，用于多魔汰个性化 AI 提示

/**
 * UserProfile - 用户画像管理类
 *
 * 功能：
 * 1. 检查用户基本信息完整性（年龄段/性别/昵称/密码/邮箱）
 * 2. 显示调研模态框（首次或信息不完整时）
 * 3. 保存调研数据到 sessionStorage 和后端
 * 4. 提供用户画像数据供 AI 提示使用
 */

class UserProfile {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || 'http://localhost:3000/api/user/profile',
      storageKey: 'duomotai_user_profile',
      requiredFields: ['ageGroup', 'gender', 'nickname', 'email'],
      ...config
    };

    this.profile = null;
    this.isComplete = false;
  }

  /**
   * 初始化 - 检查用户画像完整性
   * @param {string} phone - 用户手机号（已登录）
   * @returns {Promise<boolean>} - 是否需要显示调研模态
   */
  async init(phone) {
    if (!phone) {
      console.warn('⚠️ 用户未登录，无法初始化画像');
      return true;
    }

    try {
      // 1. 尝试从 sessionStorage 加载
      const cached = this.loadFromSession();
      if (cached && this.validateProfile(cached)) {
        this.profile = cached;
        this.isComplete = true;
        console.log('✅ 用户画像已加载（缓存）:', this.profile);
        return false;
      }

      // 2. 从后端加载
      const serverProfile = await this.fetchFromServer(phone);
      if (serverProfile && this.validateProfile(serverProfile)) {
        this.profile = serverProfile;
        this.isComplete = true;
        this.saveToSession(serverProfile);
        console.log('✅ 用户画像已加载（服务器）:', this.profile);
        return false;
      }

      // 3. 画像不完整，需要调研
      console.log('📋 用户画像不完整，需要填写调研');
      return true;

    } catch (error) {
      console.error('❌ 初始化用户画像失败:', error);
      return true;
    }
  }

  /**
   * 验证画像完整性
   */
  validateProfile(profile) {
    if (!profile) return false;

    return this.config.requiredFields.every(field => {
      const value = profile[field];
      return value && value.trim && value.trim().length > 0;
    });
  }

  /**
   * 从 sessionStorage 加载
   */
  loadFromSession() {
    try {
      const data = sessionStorage.getItem(this.config.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('⚠️ sessionStorage 加载失败:', error);
      return null;
    }
  }

  /**
   * 保存到 sessionStorage
   */
  saveToSession(profile) {
    try {
      sessionStorage.setItem(this.config.storageKey, JSON.stringify(profile));
    } catch (error) {
      console.warn('⚠️ sessionStorage 保存失败:', error);
    }
  }

  /**
   * 从服务器获取画像
   */
  async fetchFromServer(phone) {
    try {
      const response = await fetch(`${this.config.apiEndpoint}?phone=${phone}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`服务器错误: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.profile : null;

    } catch (error) {
      console.warn('⚠️ 从服务器获取画像失败:', error);
      return null;
    }
  }

  /**
   * 显示调研模态框
   * @param {string} phone - 用户手机号
   * @returns {Promise<Object>} - 用户填写的画像数据
   */
  async showSurveyModal(phone) {
    return new Promise((resolve, reject) => {
      // 创建模态框 HTML
      const modalHTML = `
        <div id="profileSurveyModal" class="modal-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        ">
          <div class="modal-content" style="
            background: #FFFAF0;
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          ">
            <h2 style="font-size: 1.8em; font-weight: bold; color: #333; margin-bottom: 10px; text-align: center;">
              🎯 完善您的个人信息
            </h2>
            <p style="color: #666; margin-bottom: 30px; text-align: center; line-height: 1.6;">
              为了提供更个性化的辩论体验，请完善以下信息（仅需一次）
            </p>

            <form id="profileSurveyForm">
              <!-- 年龄段 -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; color: #333; margin-bottom: 8px;">
                  年龄段 <span style="color: red;">*</span>
                </label>
                <select name="ageGroup" required style="
                  width: 100%;
                  padding: 12px;
                  border: 2px solid #e0e0e0;
                  border-radius: 8px;
                  font-size: 1em;
                  background: white;
                ">
                  <option value="">请选择年龄段</option>
                  <option value="18-25">18-25岁</option>
                  <option value="26-35">26-35岁</option>
                  <option value="36-45">36-45岁</option>
                  <option value="46-55">46-55岁</option>
                  <option value="56+">56岁及以上</option>
                </select>
              </div>

              <!-- 性别 -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; color: #333; margin-bottom: 8px;">
                  性别 <span style="color: red;">*</span>
                </label>
                <div style="display: flex; gap: 20px;">
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="gender" value="male" required style="margin-right: 8px; width: 20px; height: 20px;">
                    <span>男</span>
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="gender" value="female" required style="margin-right: 8px; width: 20px; height: 20px;">
                    <span>女</span>
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="gender" value="other" required style="margin-right: 8px; width: 20px; height: 20px;">
                    <span>其他</span>
                  </label>
                </div>
              </div>

              <!-- 昵称 -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; color: #333; margin-bottom: 8px;">
                  昵称 <span style="color: red;">*</span>
                </label>
                <input type="text" name="nickname" required maxlength="20" placeholder="输入您的昵称" style="
                  width: 100%;
                  padding: 12px;
                  border: 2px solid #e0e0e0;
                  border-radius: 8px;
                  font-size: 1em;
                ">
              </div>

              <!-- 邮箱 -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; color: #333; margin-bottom: 8px;">
                  邮箱 <span style="color: red;">*</span>
                </label>
                <input type="email" name="email" required placeholder="your@email.com" style="
                  width: 100%;
                  padding: 12px;
                  border: 2px solid #e0e0e0;
                  border-radius: 8px;
                  font-size: 1em;
                ">
              </div>

              <!-- 进度条 -->
              <div class="progress-bar" style="
                width: 100%;
                height: 8px;
                background: #e0e0e0;
                border-radius: 4px;
                margin: 25px 0;
                overflow: hidden;
              ">
                <div id="progressFill" style="
                  height: 100%;
                  width: 0%;
                  background: linear-gradient(90deg, #667eea, #764ba2);
                  transition: width 0.3s ease;
                "></div>
              </div>

              <!-- 提交按钮 -->
              <button type="submit" style="
                width: 100%;
                padding: 16px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 30px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                保存并继续
              </button>
            </form>

            <p style="color: #999; font-size: 0.85em; text-align: center; margin-top: 15px;">
              您的信息将安全保存，仅用于优化辩论体验
            </p>
          </div>
        </div>
      `;

      // 插入模态框
      const modalEl = document.createElement('div');
      modalEl.innerHTML = modalHTML;
      document.body.appendChild(modalEl);

      // 表单进度条更新
      const form = document.getElementById('profileSurveyForm');
      const progressFill = document.getElementById('progressFill');
      const inputs = form.querySelectorAll('input[required], select[required]');

      const updateProgress = () => {
        const filled = Array.from(inputs).filter(input => {
          if (input.type === 'radio') {
            return form.querySelector(`input[name="${input.name}"]:checked`);
          }
          return input.value.trim().length > 0;
        }).length;
        const progress = (filled / inputs.length) * 100;
        progressFill.style.width = `${progress}%`;
      };

      inputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
      });

      // 表单提交
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const profile = {
          phone: phone,
          ageGroup: formData.get('ageGroup'),
          gender: formData.get('gender'),
          nickname: formData.get('nickname'),
          email: formData.get('email'),
          updatedAt: new Date().toISOString()
        };

        try {
          // 保存到服务器
          await this.saveToServer(profile);

          // 保存到本地
          this.profile = profile;
          this.isComplete = true;
          this.saveToSession(profile);

          // 关闭模态框
          document.getElementById('profileSurveyModal').remove();

          resolve(profile);

        } catch (error) {
          alert('保存失败：' + error.message);
          reject(error);
        }
      });
    });
  }

  /**
   * 保存画像到服务器
   */
  async saveToServer(profile) {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error(`服务器错误: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '保存失败');
      }

      console.log('✅ 用户画像已保存到服务器');
      return data;

    } catch (error) {
      console.error('❌ 保存画像到服务器失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户画像（用于 AI 提示）
   * @returns {Object} - 用户画像数据
   */
  getProfile() {
    return this.profile;
  }

  /**
   * 生成 AI 提示中的用户画像文本
   * @returns {string} - 格式化的用户画像文本
   */
  getProfileText() {
    if (!this.profile || !this.isComplete) {
      return '';
    }

    const genderText = {
      'male': '男性',
      'female': '女性',
      'other': '其他'
    }[this.profile.gender] || this.profile.gender;

    return `用户画像：昵称"${this.profile.nickname}"，年龄段${this.profile.ageGroup}，${genderText}`;
  }

  /**
   * 检查是否为测试用户
   */
  isTestUser(phone) {
    return phone === '13917895758';
  }

  /**
   * 清除画像数据（用于测试或登出）
   */
  clear() {
    this.profile = null;
    this.isComplete = false;
    sessionStorage.removeItem(this.config.storageKey);
    console.log('🔄 用户画像已清除');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserProfile;
}

// 全局实例（可选，方便直接使用）
if (typeof window !== 'undefined') {
  window.UserProfile = UserProfile;
}