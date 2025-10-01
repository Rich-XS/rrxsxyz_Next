import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target, Users, Package, Megaphone, Settings, CheckCircle, TrendingUp, Shield, Clock } from 'lucide-react';

const HomePage = ({ onStartAssessment }) => {
  const pillars = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "定位 (Purpose)",
      description: "你为何存在？你是谁，你带来什么独特价值？",
      color: "bg-blue-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "用户 (People)",
      description: "你为谁服务？深度理解你的目标受众。",
      color: "bg-green-500"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "产品 (Product)",
      description: "你卖什么？打造无法抗拒的价值主张。",
      color: "bg-purple-500"
    },
    {
      icon: <Megaphone className="w-8 h-8" />,
      title: "流量 (Platform)",
      description: "你在哪里找到他们？你的内容与分发策略。",
      color: "bg-orange-500"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "体系 (Process)",
      description: "你如何交付与增长？业务背后的系统。",
      color: "bg-red-500"
    }
  ];

  const features = [
    {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      title: "100个灵魂拷问",
      description: "基于中国自媒体生态的专业诊断"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
      title: "AI实时分析",
      description: "智能评分和个性化建议"
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: "权威报告",
      description: "专业PDF报告，含避坑指南"
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      title: "3分钟开始",
      description: "快速上手，理清百万之路"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              专业自媒体转型工具
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                百万被动收入之路
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              系统自测，理清思路，获取自测咨询报告
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={onStartAssessment}
              >
                3分钟理清百万之路
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-gray-500">
                ✨ 完全免费 · 无需注册 · 即时生成报告
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们的自测系统？</h2>
          <p className="text-lg text-gray-600">基于中国自媒体生态，专为创作者打造的专业诊断工具</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-2">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Five Pillars Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">五大支柱诊断模型</h2>
          <p className="text-lg text-gray-600 mb-8">全面评估你的自媒体商业化准备度</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {pillars.map((pillar, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className={`w-16 h-16 ${pillar.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                  {pillar.icon}
                </div>
                <CardTitle className="text-xl">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{pillar.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            准备好开始你的百万收入之路了吗？
          </h3>
          <p className="text-lg mb-6 opacity-90">
            100个专业问题，15分钟完成，获得价值万元的商业化诊断报告
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            onClick={onStartAssessment}
          >
            立即开始专业自测
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">已帮助超过10,000+创作者理清商业化思路</p>
            <div className="flex justify-center items-center space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">专业可信</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">数据安全</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">持续优化</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

