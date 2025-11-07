// 用户认证服务
const fs = require('fs').promises;
const path = require('path');

class UserAuthService {
  constructor() {
    this.usersFile = path.join(__dirname, '../data/users.json');
    this.verificationCodes = new Map(); // 验证码临时存储
    this.TEST_MODE_PHONE = process.env.TEST_MODE_PHONE || '13917895758';
    this.ensureDataDirectory();
  }

  // 确保数据目录存在
  async ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // 初始化users.json
    try {
      await fs.access(this.usersFile);
    } catch {
      await fs.writeFile(this.usersFile, JSON.stringify({ users: [] }, null, 2));
    }
  }

  // 生成6位验证码
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送验证码（实际生产环境需对接短信服务）
  async sendVerificationCode(phone) {
    const code = this.generateVerificationCode();

    // 测试模式：固定验证码888888
    const finalCode = phone === this.TEST_MODE_PHONE ? '888888' : code;

    // 存储验证码，5分钟有效
    this.verificationCodes.set(phone, {
      code: finalCode,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // ✅ [开发环境] 高亮显示验证码（方便测试）
    if (phone !== this.TEST_MODE_PHONE) {
      console.log('\n' + '='.repeat(70));
      console.log('🔐 【验证码通知】 - 请手动复制给用户');
      console.log(`📱 手机号: ${phone}`);
      console.log(`🔢 验证码: ${finalCode}`);
      console.log(`⏰ 有效期: 5分钟`);
      console.log('='.repeat(70) + '\n');
    } else {
      console.log(`[验证码] 测试账号 ${phone} - 固定验证码: ${finalCode}`);
    }

    // TODO: [阶段4] 生产环境需要对接短信API（Aliyun/Tencent/Twilio）
    // await smsService.send(phone, `您的验证码是：${finalCode}，5分钟内有效。`);

    return {
      success: true,
      message: phone === this.TEST_MODE_PHONE
        ? '测试模式，验证码为：888888'
        : '验证码已发送，请查看后台控制台',
      isTestMode: phone === this.TEST_MODE_PHONE,
      // 开发环境返回验证码（仅用于调试）
      ...(process.env.NODE_ENV !== 'production' && { devCode: finalCode })
    };
  }

  // 验证验证码
  verifyCode(phone, code) {
    const stored = this.verificationCodes.get(phone);

    if (!stored) {
      return { valid: false, message: '验证码不存在或已过期' };
    }

    if (Date.now() > stored.expiresAt) {
      this.verificationCodes.delete(phone);
      return { valid: false, message: '验证码已过期' };
    }

    if (stored.code !== code) {
      return { valid: false, message: '验证码错误' };
    }

    // 验证成功后删除验证码
    this.verificationCodes.delete(phone);
    return { valid: true };
  }

  // 读取用户数据
  async readUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { users: [] };
    }
  }

  // 写入用户数据
  async writeUsers(data) {
    await fs.writeFile(this.usersFile, JSON.stringify(data, null, 2));
  }

  // 创建或获取用户
  async createOrGetUser(phone) {
    const data = await this.readUsers();
    const isTestMode = phone === this.TEST_MODE_PHONE;

    // 查找现有用户
    let user = data.users.find(u => u.phone === phone);

    if (user) {
      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
    } else {
      // 创建新用户
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phone,
        isTestMode,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        debateHistory: [],
        profile: {
          nickname: `用户${phone.substr(-4)}`,
          avatar: null
        }
      };
      data.users.push(user);
    }

    await this.writeUsers(data);
    return user;
  }

  // 生成简单的Token（生产环境应使用JWT）
  generateToken(user) {
    const payload = {
      userId: user.id,
      phone: user.phone,
      isTestMode: user.isTestMode,
      timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // 验证Token
  verifyToken(token) {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());

      // 简单的过期检查（7天）
      if (Date.now() - payload.timestamp > 7 * 24 * 60 * 60 * 1000) {
        return { valid: false, message: 'Token已过期' };
      }

      return { valid: true, userId: payload.userId, phone: payload.phone, isTestMode: payload.isTestMode };
    } catch {
      return { valid: false, message: 'Token无效' };
    }
  }

  // 获取用户信息
  async getUserById(userId) {
    const data = await this.readUsers();
    return data.users.find(u => u.id === userId);
  }

  // 更新用户辩论历史
  async updateUserDebateHistory(userId, debateSession) {
    const data = await this.readUsers();
    const user = data.users.find(u => u.id === userId);

    if (user) {
      user.debateHistory = user.debateHistory || [];
      user.debateHistory.unshift({
        sessionId: debateSession.sessionId,
        question: debateSession.question,
        status: debateSession.status,
        completedRounds: debateSession.completedRounds || 0,
        totalRounds: debateSession.rounds,
        createdAt: debateSession.createdAt,
        updatedAt: new Date().toISOString()
      });

      // 只保留最近20条历史记录
      if (user.debateHistory.length > 20) {
        user.debateHistory = user.debateHistory.slice(0, 20);
      }

      await this.writeUsers(data);
    }
  }

  // 获取用户辩论历史
  async getUserDebateHistory(userId) {
    const user = await this.getUserById(userId);
    return user ? user.debateHistory || [] : [];
  }
}

module.exports = new UserAuthService();