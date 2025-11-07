import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { generateTestAnswers } from '../utils/testData';

const TestButton = ({ onTestComplete }) => {
  const handleQuickTest = () => {
    const testAnswers = generateTestAnswers();
    onTestComplete(testAnswers);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleQuickTest}
      className="fixed top-4 right-4 z-50 bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
    >
      <Zap className="w-4 h-4 mr-2" />
      快速演示
    </Button>
  );
};

export default TestButton;

