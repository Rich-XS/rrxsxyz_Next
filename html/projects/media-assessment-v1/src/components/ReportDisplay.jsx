import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Share2, 
  BarChart3, 
  Target, 
  Users, 
  Package, 
  Megaphone, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowRight,
  Star
} from 'lucide-react';

const ReportDisplay = ({ reportData, userInfo, onStartOver, onDownloadPDF }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { scores, level, suggestions, actionPlan } = reportData;

  const pillarData = [
    {
      key: 'purpose',
      title: '定位',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-blue-500',
      description: '品牌定位和价值主张'
    },
    {
      key: 'people',
      title: '用户',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
      description: '目标用户理解深度'
    },
    {
      key: 'product',
      title: '产品',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-purple-500',
      description: '产品价值和体系化'
    },
    {
      key: 'platform',
      title: '流量',
      icon: <Megaphone className="w-6 h-6" />,
      color: 'bg-orange-500',
      description: '流量策略和执行力'
    },
    {
      key: 'process',
      title: '体系',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-red-500',
      description: '系统化和可规模化'
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 81) return 'text-green-600';
    if (score >= 61) return 'text-yellow-600';
    if (score >= 41) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 81) return 'bg-green-100';
    if (score >= 61) return 'bg-yellow-100';
    if (score >= 41) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const RadarChart = () => {
    const maxScore = 100;
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    
    const points = pillarData.map((pillar, index) => {
      const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
      const score = scores[pillar.key];
      const distance = (score / maxScore) * radius;
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
        fullX: centerX + radius * Math.cos(angle),
        fullY: centerY + radius * Math.sin(angle),
        title: pillar.title,
        score: score
      };
    });

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="flex justify-center">
        <svg width="300" height="300" className="overflow-visible">
          {/* 背景网格 */}
          {[20, 40, 60, 80, 100].map(percent => {
            const r = (percent / 100) * radius;
            return (
              <circle
                key={percent}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}
          
          {/* 轴线 */}
          {pillarData.map((pillar, index) => {
            const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
            const endX = centerX + radius * Math.cos(angle);
            const endY = centerY + radius * Math.sin(angle);
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}
          
          {/* 数据区域 */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* 数据点 */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
            />
          ))}
          
          {/* 标签 */}
          {points.map((point, index) => (
            <g key={index}>
              <text
                x={point.fullX}
                y={point.fullY - 10}
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                {point.title}
              </text>
              <text
                x={point.fullX}
                y={point.fullY + 5}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {point.score}分
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}
                 style={{ backgroundColor: level.color }}>
              {scores.total}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            您的商业化准备度报告
          </h1>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Badge 
              className="text-lg px-4 py-2"
              style={{ backgroundColor: level.color, color: 'white' }}
            >
              {level.label}级创作者
            </Badge>
            <span className="text-gray-600">总分：{scores.total}/100</span>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {level.description}，以下是为您量身定制的分析报告和改进建议。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={onDownloadPDF}
          >
            <Download className="w-5 h-5 mr-2" />
            下载完整PDF报告
          </Button>
          <Button variant="outline" size="lg">
            <Share2 className="w-5 h-5 mr-2" />
            分享报告
          </Button>
          <Button variant="outline" size="lg" onClick={onStartOver}>
            重新测试
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="analysis">详细分析</TabsTrigger>
            <TabsTrigger value="suggestions">改进建议</TabsTrigger>
            <TabsTrigger value="action">行动计划</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    五大支柱雷达图
                  </CardTitle>
                  <CardDescription>
                    直观展示您在各个维度的表现
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarChart />
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>详细得分</CardTitle>
                  <CardDescription>
                    各支柱的具体分数和等级
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pillarData.map((pillar) => (
                    <div key={pillar.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 ${pillar.color} rounded-lg flex items-center justify-center text-white`}>
                            {pillar.icon}
                          </div>
                          <div>
                            <div className="font-medium">{pillar.title}</div>
                            <div className="text-sm text-gray-500">{pillar.description}</div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(scores[pillar.key])}`}>
                          {scores[pillar.key]}
                        </div>
                      </div>
                      <Progress value={scores[pillar.key]} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">最强优势</span>
                  </div>
                  <p className="text-green-700">
                    {pillarData.find(p => p.key === Object.entries(scores)
                      .filter(([key]) => key !== 'total')
                      .sort(([,a], [,b]) => b - a)[0][0])?.title}
                    领域表现出色
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800">需要关注</span>
                  </div>
                  <p className="text-orange-700">
                    {pillarData.find(p => p.key === Object.entries(scores)
                      .filter(([key]) => key !== 'total')
                      .sort(([,a], [,b]) => a - b)[0][0])?.title}
                    领域有提升空间
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">发展潜力</span>
                  </div>
                  <p className="text-blue-700">
                    具备{level.label}级创作者的基础能力
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid gap-6">
              {pillarData.map((pillar) => (
                <Card key={pillar.key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${pillar.color} rounded-lg flex items-center justify-center text-white`}>
                          {pillar.icon}
                        </div>
                        <div>
                          <CardTitle>{pillar.title}支柱分析</CardTitle>
                          <CardDescription>{pillar.description}</CardDescription>
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(scores[pillar.key])}`}>
                        {scores[pillar.key]}分
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg ${getScoreBackground(scores[pillar.key])}`}>
                      <p className={`${getScoreColor(scores[pillar.key])}`}>
                        {scores[pillar.key] >= 81 && "您在这个领域表现优秀，已经具备了专业水准。建议继续保持并分享经验给其他创作者。"}
                        {scores[pillar.key] >= 61 && scores[pillar.key] < 81 && "您在这个领域有良好的基础，通过进一步优化可以达到更高水平。"}
                        {scores[pillar.key] >= 41 && scores[pillar.key] < 61 && "您在这个领域有一定基础，但还需要系统性的提升和改进。"}
                        {scores[pillar.key] < 41 && "这个领域是您的薄弱环节，建议优先投入时间和精力进行改善。"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className={
                  suggestion.priority === 'high' ? 'border-red-200 bg-red-50' :
                  suggestion.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        suggestion.type === 'weakness' ? 'bg-red-500' :
                        suggestion.type === 'strength' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}>
                        {suggestion.type === 'weakness' && <AlertTriangle className="w-4 h-4 text-white" />}
                        {suggestion.type === 'strength' && <CheckCircle className="w-4 h-4 text-white" />}
                        {suggestion.type === 'action' && <ArrowRight className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{suggestion.title}</h3>
                        <p className="text-gray-700">{suggestion.description}</p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${
                            suggestion.priority === 'high' ? 'border-red-300 text-red-700' :
                            suggestion.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-blue-300 text-blue-700'
                          }`}
                        >
                          {suggestion.priority === 'high' ? '高优先级' : 
                           suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Action Plan Tab */}
          <TabsContent value="action" className="space-y-6">
            <div className="grid gap-6">
              {actionPlan.map((plan, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      {plan.period}行动计划
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                            {taskIndex + 1}
                          </div>
                          <span className="text-gray-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">准备开始您的百万收入之路？</h3>
                  <p className="mb-4 opacity-90">
                    如需更详细的一对一指导，欢迎预约专业咨询
                  </p>
                  <Button variant="secondary" size="lg">
                    预约专业咨询
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportDisplay;

