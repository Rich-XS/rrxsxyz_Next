import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, User } from 'lucide-react';

const UserInfoForm = ({ onComplete, onBack }) => {
  const [userInfo, setUserInfo] = useState({
    gender: '',
    ageGroup: '',
    title: '',
    email: '',
    phone: '',
    wechat: '',
    otherContact: ''
  });

  const handleChange = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // 可以在这里添加表单验证
    onComplete(userInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <User className="w-12 h-12 mx-auto text-blue-600 mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-900">关于你</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            在开始自测前，请告诉我们一些基本信息，以便为您提供更精准的报告。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 性别 */}
          <div>
            <Label htmlFor="gender" className="text-lg font-medium mb-2 block">性别</Label>
            <RadioGroup 
              onValueChange={(value) => handleChange('gender', value)}
              value={userInfo.gender}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male">男</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female">女</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer-not-to-say" id="gender-prefer-not-to-say" />
                <Label htmlFor="gender-prefer-not-to-say">不便透露</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 年龄段 */}
          <div>
            <Label htmlFor="ageGroup" className="text-lg font-medium mb-2 block">年龄段</Label>
            <Select onValueChange={(value) => handleChange('ageGroup', value)} value={userInfo.ageGroup}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择您的年龄段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18-25">18-25岁</SelectItem>
                <SelectItem value="26-30">26-30岁</SelectItem>
                <SelectItem value="31-35">31-35岁</SelectItem>
                <SelectItem value="36-40">36-40岁</SelectItem>
                <SelectItem value="41-45">41-45岁</SelectItem>
                <SelectItem value="46-50">46-50岁</SelectItem>
                <SelectItem value="50+">50岁以上</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 称呼 */}
          <div>
            <Label htmlFor="title" className="text-lg font-medium mb-2 block">您的称呼 (如：张先生，李女士)</Label>
            <Input 
              id="title" 
              placeholder="请输入您的姓氏和称呼" 
              value={userInfo.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          {/* 联系方式 (可选) */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">联系方式 (可选)</h3>
            <p className="text-gray-600 text-sm">提供联系方式，方便我们为您提供更深入的咨询服务。</p>
            <div>
              <Label htmlFor="email" className="mb-1 block">邮箱地址</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                value={userInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1 block">手机号码</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="138XXXXXXXX" 
                value={userInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wechat" className="mb-1 block">微信号</Label>
              <Input 
                id="wechat" 
                placeholder="您的微信号" 
                value={userInfo.wechat}
                onChange={(e) => handleChange('wechat', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="otherContact" className="mb-1 block">其他联系方式</Label>
              <Input 
                id="otherContact" 
                placeholder="如：您的社交媒体账号" 
                value={userInfo.otherContact}
                onChange={(e) => handleChange('otherContact', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              开始自测
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInfoForm;

