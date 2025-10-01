import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, BarChart3, FileText, Download } from 'lucide-react';

const ReportGeneration = ({ answers, userInfo, onReportReady }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [reportData, setReportData] = useState(null);

  const steps = [
    { icon: <BarChart3 className="w-6 h-6" />, title: "分析答题数据", description: "正在处理您的100个回答..." },
    { icon: <CheckCircle className="w-6 h-6" />, title: "计算五大支柱得分", description: "评估定位、用户、产品、流量、体系..." },
    { icon: <FileText className="w-6 h-6" />, title: "生成个性化建议", description: "基于您的情况制定专属方案..." },
    { icon: <Download className="w-6 h-6" />, title: "准备报告下载", description: "正在生成PDF报告..." }
  ];

  useEffect(() => {
    const generateReport = async (userInfo) => {
      // 模拟报告生成过程
      for (let i = 0; i <= 3; i++) {
        setCurrentStep(i);
        setProgress((i + 1) * 25);
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 计算实际得分
      const scores = calculateScores(answers, userInfo);
      const report = generateReportData(scores, answers, userInfo);
      
      setReportData(report);
      onReportReady(report);
    };

    generateReport(userInfo);
  }, [answers, onReportReady]);

  const calculateScores = (answers, userInfo) => {
    const pillarScores = {
      purpose: 0,
      people: 0,
      product: 0,
      platform: 0,
      process: 0
    };

    // 计算每个支柱的得分
    Object.entries(answers).forEach(([questionId, answer]) => {
      const id = parseInt(questionId);
      let pillar;
      let score = 0;

      // 根据问题ID确定所属支柱
      if (id <= 20) pillar = 'purpose';
      else if (id <= 40) pillar = 'people';
      else if (id <= 60) pillar = 'product';
      else if (id <= 80) pillar = 'platform';
      else pillar = 'process';

      // 计算得分
      if (typeof answer === 'number') {
        score = answer * 20; // 1-5分转换为20-100分
      } else if (typeof answer === 'string') {
        // 文本答案根据长度和关键词评分
        const length = answer.length;
        const hasKeywords = /具体|明确|清晰|系统|专业|独特|价值|目标|策略|方法/.test(answer);
        
        if (length > 100 && hasKeywords) score = 90;
        else if (length > 50 && hasKeywords) score = 80;
        else if (length > 50) score = 70;
        else if (length > 20) score = 60;
        else score = 40;
      }

      pillarScores[pillar] += score;
    });

    // 计算平均分
    Object.keys(pillarScores).forEach(pillar => {
      const questionCount = pillar === 'purpose' ? 20 : 20; // 每个支柱20题
      pillarScores[pillar] = Math.round(pillarScores[pillar] / questionCount);
    });

    const totalScore = Math.round(
      Object.values(pillarScores).reduce((sum, score) => sum + score, 0) / 5
    );

    return { ...pillarScores, total: totalScore };
  };

  const generateReportData = (scores, answers, userInfo) => {
    const getLevel = (score) => {
      if (score >= 81) return { label: '大师', color: '#22c55e', description: '您在这个领域已经达到了专家水平' };
      if (score >= 61) return { label: '专家', color: '#eab308', description: '您在这个领域有很好的基础' };
      if (score >= 41) return { label: '进阶', color: '#f97316', description: '您在这个领域有一定经验' };
      return { label: '新手', color: '#ef4444', description: '这个领域还有很大提升空间' };
    };

    const level = getLevel(scores.total);
    
    const suggestions = generateSuggestions(scores, answers);
    const actionPlan = generateActionPlan(scores);

    return {
      scores,
      level,
      suggestions,
      actionPlan,
      generatedAt: new Date().toISOString()
    };
  };

  const generateSuggestions = (scores, answers) => {
    const suggestions = [];
    
    // 找出最低分的支柱
    const pillarNames = {
      purpose: '定位',
      people: '用户',
      product: '产品',
      platform: '流量',
      process: '体系'
    };

    const sortedPillars = Object.entries(scores)
      .filter(([key]) => key !== 'total')
      .sort(([,a], [,b]) => a - b);

    const weakestPillar = sortedPillars[0];
    const strongestPillar = sortedPillars[sortedPillars.length - 1];

    suggestions.push({
      type: 'weakness',
      title: `${pillarNames[weakestPillar[0]]}是您的主要短板`,
      description: `您在${pillarNames[weakestPillar[0]]}方面的得分为${weakestPillar[1]}分，建议重点关注这个领域的提升。`,
      priority: 'high'
    });

    suggestions.push({
      type: 'strength',
      title: `${pillarNames[strongestPillar[0]]}是您的优势领域`,
      description: `您在${pillarNames[strongestPillar[0]]}方面表现出色，得分${strongestPillar[1]}分，可以以此为基础进一步发展。`,
      priority: 'medium'
    });

    // 根据具体得分给出建议
    if (scores.purpose < 60) {
      suggestions.push({
        type: 'action',
        title: '明确您的独特定位',
        description: '建议深入思考您的核心价值主张，找到与竞争对手的差异化优势。',
        priority: 'high'
      });
    }

    if (scores.people < 60) {
      suggestions.push({
        type: 'action',
        title: '深度了解目标用户',
        description: '建议进行用户访谈，创建详细的用户画像，理解他们的真实需求和痛点。',
        priority: 'high'
      });
    }

    if (scores.platform < 60) {
      suggestions.push({
        type: 'action',
        title: '构建公域-私域流量体系',
        description: '建议设计完整的流量获取和转化漏斗，重点关注微信生态的私域运营。',
        priority: 'high'
      });
    }

    return suggestions;
  };

  const generateActionPlan = (scores) => {
    const plans = [];
    
    // 30天计划
    plans.push({
      period: '30天内',
      tasks: [
        '完善个人定位和价值主张',
        '创建详细的目标用户画像',
        '设计免费的流量磁石产品',
        '建立基础的内容创作SOP'
      ]
    });

    // 90天计划
    plans.push({
      period: '90天内',
      tasks: [
        '推出核心付费产品',
        '建立公域-私域转化流程',
        '开始系统化内容营销',
        '建立客户反馈收集机制'
      ]
    });

    // 1年计划
    plans.push({
      period: '1年内',
      tasks: [
        '实现月收入10万+目标',
        '建立完整的产品矩阵',
        '形成稳定的流量获取渠道',
        '建立团队和标准化流程'
      ]
    });

    return plans;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">正在生成您的专属报告</CardTitle>
            <CardDescription>
              我们正在分析您的回答，为您生成个性化的商业化建议报告
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>生成进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    index < currentStep
                      ? 'bg-green-50 text-green-700'
                      : index === currentStep
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {index < currentStep ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : index === currentStep ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    ) : (
                      <div className="w-6 h-6 text-gray-400">{step.icon}</div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm opacity-75">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Message */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
              <p className="text-sm">
                💡 <strong>小贴士：</strong>报告将包含您的五大支柱得分、个性化建议和详细的行动计划，
                帮助您在自媒体变现的道路上少走弯路。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportGeneration;

