// 测试数据 - 用于快速演示完整流程
export const generateTestAnswers = () => {
  const testAnswers = {};
  
  // 为每个问题生成测试答案
  for (let i = 1; i <= 100; i++) {
    if (i <= 20) {
      // 定位支柱 - 文本和选择题混合
      if ([10, 13, 19].includes(i)) {
        testAnswers[i] = Math.floor(Math.random() * 5) + 1; // 1-5分
      } else {
        testAnswers[i] = `这是第${i}题的测试答案，展示了具体的思考和规划。我有明确的目标和独特的价值主张，能够为目标用户提供专业的解决方案。`;
      }
    } else if (i <= 40) {
      // 用户支柱
      if ([30, 34, 38, 39].includes(i)) {
        testAnswers[i] = Math.floor(Math.random() * 5) + 1;
      } else {
        testAnswers[i] = `针对第${i}题，我对目标用户有深入的理解。我的核心用户是25-35岁的职场妈妈，她们在一线城市工作，有1-2个孩子，渴望在照顾家庭的同时实现自我价值。`;
      }
    } else if (i <= 60) {
      // 产品支柱
      if ([44, 46, 48, 52, 53, 56, 59].includes(i)) {
        testAnswers[i] = Math.floor(Math.random() * 5) + 1;
      } else {
        testAnswers[i] = `关于第${i}题，我有完整的产品体系规划。从免费的摄影技巧电子书，到99元的入门课程，再到999元的系统训练营，最后是5999元的一对一指导服务。`;
      }
    } else if (i <= 80) {
      // 流量支柱
      if ([64, 67, 71, 76, 80].includes(i)) {
        testAnswers[i] = Math.floor(Math.random() * 5) + 1;
      } else {
        testAnswers[i] = `对于第${i}题，我有清晰的流量策略。主要在小红书种草，通过实用的摄影技巧内容吸引目标用户，然后引导到微信私域进行深度转化。`;
      }
    } else {
      // 体系支柱
      if ([82, 84, 87, 92, 94, 97].includes(i)) {
        testAnswers[i] = Math.floor(Math.random() * 5) + 1;
      } else {
        testAnswers[i] = `针对第${i}题，我建立了系统化的运营体系。有标准的内容创作SOP，客户服务流程，以及数据分析看板来跟踪关键指标。`;
      }
    }
  }
  
  return testAnswers;
};

// 快速填充答案的函数
export const fillTestAnswers = (setAnswers) => {
  const testAnswers = generateTestAnswers();
  setAnswers(testAnswers);
};

