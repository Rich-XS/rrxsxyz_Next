import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';
import { questionData } from '../data/questions';
import TestButton from './TestButton';

const AssessmentForm = ({ onComplete, onBack }) => {
  const [currentPillar, setCurrentPillar] = useState('purpose');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);

  const pillars = Object.keys(questionData);
  const currentPillarData = questionData[currentPillar];
  const currentQuestion = currentPillarData.questions[currentQuestionIndex];
  const totalQuestions = Object.values(questionData).reduce((sum, pillar) => sum + pillar.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const pillarColors = {
    purpose: 'bg-blue-500',
    people: 'bg-green-500',
    product: 'bg-purple-500',
    platform: 'bg-orange-500',
    process: 'bg-red-500'
  };

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentPillarData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const currentPillarIndex = pillars.indexOf(currentPillar);
      if (currentPillarIndex < pillars.length - 1) {
        setCurrentPillar(pillars[currentPillarIndex + 1]);
        setCurrentQuestionIndex(0);
      } else {
        // 完成所有问题
        onComplete(answers);
      }
    }
    setShowHint(false);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      const currentPillarIndex = pillars.indexOf(currentPillar);
      if (currentPillarIndex > 0) {
        const prevPillar = pillars[currentPillarIndex - 1];
        setCurrentPillar(prevPillar);
        setCurrentQuestionIndex(questionData[prevPillar].questions.length - 1);
      }
    }
    setShowHint(false);
  };

  const isAnswered = answers[currentQuestion.id] !== undefined;
  const canProceed = isAnswered;

  const getQuestionNumber = () => {
    let questionNumber = 0;
    for (let i = 0; i < pillars.indexOf(currentPillar); i++) {
      questionNumber += questionData[pillars[i]].questions.length;
    }
    return questionNumber + currentQuestionIndex + 1;
  };

  const renderQuestionInput = () => {
    if (currentQuestion.type === 'text') {
      return (
        <Textarea
          placeholder={currentQuestion.placeholder}
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="min-h-[120px] text-base"
        />
      );
    } else if (currentQuestion.type === 'radio') {
      return (
        <RadioGroup
          value={answers[currentQuestion.id]?.toString() || ''}
          onValueChange={(value) => handleAnswerChange(parseInt(value))}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
              <Label htmlFor={`option-${option.value}`} className="text-base cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
  };

  const getHint = () => {
    const hints = {
      purpose: "💡 定位提示：想想你的独特价值和使命，什么让你与众不同？",
      people: "💡 用户提示：越具体越好，想象一个真实的人，他们的痛点和渴望是什么？",
      product: "💡 产品提示：考虑你的价值阶梯，从免费到高价，如何循序渐进？",
      platform: "💡 流量提示：思考公域种草、私域转化的完整链路。",
      process: "💡 体系提示：关注可规模化和自动化，如何让业务更高效？"
    };
    return hints[currentPillar];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <TestButton onTestComplete={onComplete} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <Badge variant="secondary">
              问题 {getQuestionNumber()} / {totalQuestions}
            </Badge>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>整体进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Pillar Indicator */}
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-4 h-4 ${pillarColors[currentPillar]} rounded-full`}></div>
            <span className="font-semibold text-lg">{currentPillarData.title}</span>
            <Badge variant="outline">{currentQuestionIndex + 1}/{currentPillarData.questions.length}</Badge>
          </div>
          <p className="text-gray-600">{currentPillarData.description}</p>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">
                  {currentQuestion.text}
                </CardTitle>
                {showHint && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-blue-800 text-sm">{getHint()}</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="ml-4 flex-shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderQuestionInput()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPillar === 'purpose' && currentQuestionIndex === 0}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一题
          </Button>

          <div className="flex items-center space-x-2">
            {isAnswered && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                已回答
              </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentPillar === 'process' && currentQuestionIndex === currentPillarData.questions.length - 1 
              ? '生成报告' 
              : '下一题'
            }
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Progress Indicators */}
        <div className="mt-8 flex justify-center space-x-2">
          {pillars.map((pillar, index) => {
            const pillarQuestions = questionData[pillar].questions.length;
            const pillarAnswered = questionData[pillar].questions.filter(q => answers[q.id] !== undefined).length;
            const isCurrentPillar = pillar === currentPillar;
            const isCompleted = pillarAnswered === pillarQuestions;
            
            return (
              <div
                key={pillar}
                className={`w-12 h-2 rounded-full transition-colors ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isCurrentPillar 
                      ? pillarColors[pillar]
                      : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;

