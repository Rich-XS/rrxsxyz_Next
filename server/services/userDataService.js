const fs = require('fs').promises;
const path = require('path');

class UserDataService {
  constructor() {
    // 用户数据存储目录
    this.userDataDir = path.join(process.cwd(), 'UserInfo');
    this.summaryFile = path.join(this.userDataDir, 'user_summary.json');

    // 确保目录存在
    this.ensureDirectories();
  }

  // 确保目录存在
  async ensureDirectories() {
    try {
      await fs.access(this.userDataDir);
    } catch (error) {
      await fs.mkdir(this.userDataDir, { recursive: true });
      console.log('✅ UserInfo目录已创建');
    }
  }

  // 生成用户文件名
  generateUserFileName(userInfo) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeName = userInfo.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
    return `${userInfo.phone}_${safeName}_${date}.json`;
  }

  // 保存用户注册信息
  async saveUserRegistration(userInfo) {
    try {
      await this.ensureDirectories();

      const userData = {
        ...userInfo,
        registrationTime: new Date().toISOString(),
        dataType: 'registration',
        lastUpdated: new Date().toISOString()
      };

      // 保存用户个人文件
      const fileName = this.generateUserFileName(userInfo);
      const filePath = path.join(this.userDataDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');
      console.log(`✅ 用户注册信息已保存: ${fileName}`);

      // 更新汇总表
      await this.updateSummaryTable(userInfo, 'registration');

      return {
        success: true,
        fileName,
        message: '用户注册信息保存成功'
      };

    } catch (error) {
      console.error('保存用户注册信息失败:', error);
      throw new Error(`保存用户注册信息失败: ${error.message}`);
    }
  }

  // 保存用户测评完成数据
  async saveUserAssessment(userInfo, answers, analysisResult) {
    try {
      await this.ensureDirectories();

      // 计算测评统计信息
      const stats = this.calculateAssessmentStats(answers);

      const assessmentData = {
        userInfo,
        answers,
        analysisResult,
        stats,
        completionTime: new Date().toISOString(),
        dataType: 'assessment',
        lastUpdated: new Date().toISOString()
      };

      // 保存测评完成文件（覆盖或新建）
      const fileName = this.generateUserFileName(userInfo);
      const filePath = path.join(this.userDataDir, fileName);

      // 如果文件已存在，读取原有数据并合并
      let existingData = {};
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        // 文件不存在，创建新文件
      }

      const mergedData = {
        ...existingData,
        ...assessmentData,
        registrationTime: existingData.registrationTime || assessmentData.completionTime
      };

      await fs.writeFile(filePath, JSON.stringify(mergedData, null, 2), 'utf8');
      console.log(`✅ 用户测评数据已保存: ${fileName}`);

      // 更新汇总表
      await this.updateSummaryTable(userInfo, 'assessment', stats);

      return {
        success: true,
        fileName,
        stats,
        message: '用户测评数据保存成功'
      };

    } catch (error) {
      console.error('保存用户测评数据失败:', error);
      throw new Error(`保存用户测评数据失败: ${error.message}`);
    }
  }

  // 计算测评统计信息
  calculateAssessmentStats(answers) {
    const totalQuestions = 100;
    const answeredQuestions = Object.keys(answers).length;
    const completionRate = (answeredQuestions / totalQuestions) * 100;

    // 计算每个维度的完成情况
    const dimensions = ['定位', '用户', '产品', '流量', '体系'];
    const dimensionStats = {};

    dimensions.forEach((dimension, index) => {
      let dimensionAnswered = 0;
      for (let i = 0; i < 20; i++) {
        const questionIndex = index * 20 + i;
        if (answers[questionIndex] && answers[questionIndex].length > 0) {
          dimensionAnswered++;
        }
      }
      dimensionStats[dimension] = {
        completed: dimensionAnswered,
        total: 20,
        rate: (dimensionAnswered / 20) * 100
      };
    });

    // 计算平均答案长度
    const answerLengths = Object.values(answers).map(answer => answer.length);
    const avgAnswerLength = answerLengths.length > 0 ?
      Math.round(answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length) : 0;

    return {
      totalQuestions,
      answeredQuestions,
      completionRate: Math.round(completionRate * 100) / 100,
      dimensionStats,
      avgAnswerLength,
      shortAnswers: answerLengths.filter(len => len < 20).length,
      longAnswers: answerLengths.filter(len => len > 100).length
    };
  }

  // 更新汇总表
  async updateSummaryTable(userInfo, action, stats = null) {
    try {
      let summaryData = {};

      // 读取现有汇总表
      try {
        const summaryContent = await fs.readFile(this.summaryFile, 'utf8');
        summaryData = JSON.parse(summaryContent);
      } catch (error) {
        // 汇总文件不存在，创建新的
        summaryData = {
          metadata: {
            created: new Date().toISOString(),
            totalUsers: 0,
            totalRegistrations: 0,
            totalAssessments: 0
          },
          users: {}
        };
      }

      const userId = userInfo.phone;

      // 更新用户信息
      if (!summaryData.users[userId]) {
        summaryData.users[userId] = {
          phone: userInfo.phone,
          email: userInfo.email,
          name: userInfo.name,
          registrationTime: userInfo.registrationTime || new Date().toISOString(),
          hasRegistered: false,
          hasCompletedAssessment: false,
          lastActivity: new Date().toISOString()
        };
        summaryData.metadata.totalUsers++;
      }

      // 更新活动记录
      summaryData.users[userId].lastActivity = new Date().toISOString();

      if (action === 'registration') {
        summaryData.users[userId].hasRegistered = true;
        summaryData.metadata.totalRegistrations++;
      }

      if (action === 'assessment') {
        summaryData.users[userId].hasCompletedAssessment = true;
        summaryData.users[userId].assessmentStats = stats;
        summaryData.users[userId].completionTime = new Date().toISOString();
        summaryData.metadata.totalAssessments++;
      }

      summaryData.metadata.lastUpdated = new Date().toISOString();

      // 保存汇总表
      await fs.writeFile(this.summaryFile, JSON.stringify(summaryData, null, 2), 'utf8');
      console.log(`✅ 汇总表已更新: ${action}`);

    } catch (error) {
      console.error('更新汇总表失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  // 获取用户数据
  async getUserData(phone) {
    try {
      const files = await fs.readdir(this.userDataDir);
      const userFile = files.find(file => file.startsWith(phone));

      if (!userFile) {
        return null;
      }

      const filePath = path.join(this.userDataDir, userFile);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);

    } catch (error) {
      console.error('读取用户数据失败:', error);
      return null;
    }
  }

  // 获取汇总统计
  async getSummaryStats() {
    try {
      const summaryContent = await fs.readFile(this.summaryFile, 'utf8');
      const summaryData = JSON.parse(summaryContent);

      return {
        success: true,
        data: summaryData.metadata,
        userCount: Object.keys(summaryData.users).length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          totalUsers: 0,
          totalRegistrations: 0,
          totalAssessments: 0
        }
      };
    }
  }

  // 获取所有用户列表
  async getAllUsers() {
    try {
      const summaryContent = await fs.readFile(this.summaryFile, 'utf8');
      const summaryData = JSON.parse(summaryContent);

      return {
        success: true,
        users: Object.values(summaryData.users),
        total: Object.keys(summaryData.users).length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        users: [],
        total: 0
      };
    }
  }
}

module.exports = new UserDataService();