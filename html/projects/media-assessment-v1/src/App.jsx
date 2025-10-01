import React, { useState } from 'react';
import HomePage from './components/HomePage';
import AssessmentForm from './components/AssessmentForm';
import ReportGeneration from './components/ReportGeneration';
import ReportDisplay from './components/ReportDisplay';
import { generatePDFReport, downloadReportAsText } from './utils/pdfGenerator';
import './App.css';

function App()  const [currentView, setCurrentView] = useState(\'home\'); // \'home\', \'userInfo\', \'assessment\', \'generating\', \'report\'
  const [userInfo, setUserInfo] = useState({});
  const [assessmentAnswers, setAssessmentAnswers] = useState({});t [reportData, setReportData] = useState(null);

  const handleStartAssessment = () => {
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = (answers) => {
    setAssessmentAnswers(answers);
    setCurrentView('generating');
  };

  const handleReportReady = (report) => {
    setReportData(report);
    setCurrentView('report');
  };

  const handleStartOver = () => {
    setCurrentView('home');
    setAssessmentAnswers({});
    setReportData(null);
  };

  const handleDownloadPDF = () => {
    if (reportData) {
      downloadReportAsText(reportData);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="App">
      {currentView === 'home' && (
        <HomePage onStartAssessment={() => setCurrentView('userInfo')} />
      )}

      {currentView === 'userInfo' && (
        <UserInfoForm 
          onComplete={(info) => {
            setUserInfo(info);
            setCurrentView('assessment');
          }}
          onBack={handleBackToHome}
        />
      )}
      
      {currentView === 'assessment' && (
        <AssessmentForm 
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentView('userInfo')}
        />
      )}
      
      {currentView === 'generating' && (
        <ReportGeneration 
          answers={assessmentAnswers}
          userInfo={userInfo}
          onReportReady={handleReportReady}
        />
      )}
      
      {currentView === 'report' && reportData && (
        <ReportDisplay 
          reportData={reportData}
          onStartOver={handleStartOver}
          onDownloadPDF={handleDownloadPDF}
        />
      )}
    </div>
  );
}

export default App;
