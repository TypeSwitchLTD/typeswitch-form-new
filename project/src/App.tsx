// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { SurveyData, TypingMetrics } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import DemographicsScreen from './components/DemographicsScreen';
import TypingExercise from './components/TypingExercise';
import SelfAssessment from './components/SelfAssessment';
import ResultsReport from './components/ResultsReport';
import FeatureRating from './components/FeatureRating';
import PurchaseDecision from './components/PurchaseDecision';
import ThankYou from './components/ThankYou';
import ShareCard from './components/ShareCard';
import AdminDashboard from './components/AdminDashboard';
import { saveSurveyData, saveEmailSubscription } from './lib/supabase';
import {
  getDeviceFingerprint,
  getIPAddress,
  checkIfAlreadySubmitted,
  saveDeviceInfo,
  detectDevice,
  DeviceInfo
} from './lib/deviceTracking';
import { translations } from './lib/translations';

// NEW SCORING ALGORITHM - 50% Errors, 20% Completion, 20% Speed, 10% Other
export const calculateOverallScore = (metrics: TypingMetrics, completionRate: number = 100): number => {
  let score = 0;
  
  // 1. ERRORS COMPONENT (50 points max)
  let errorScore = 50;
  
  // Language errors (most critical) - 20 points
  if (metrics.languageErrors > 15) errorScore -= 20;
  else if (metrics.languageErrors > 10) errorScore -= 15;
  else if (metrics.languageErrors > 7) errorScore -= 12;
  else if (metrics.languageErrors > 5) errorScore -= 9;
  else if (metrics.languageErrors > 3) errorScore -= 6;
  else if (metrics.languageErrors > 1) errorScore -= 3;
  
  // Punctuation errors - 10 points
  if (metrics.punctuationErrors > 10) errorScore -= 10;
  else if (metrics.punctuationErrors > 7) errorScore -= 8;
  else if (metrics.punctuationErrors > 5) errorScore -= 6;
  else if (metrics.punctuationErrors > 3) errorScore -= 4;
  else if (metrics.punctuationErrors > 1) errorScore -= 2;
  
  // Letter errors - 10 points
  const letterErrors = Math.max(0, metrics.totalMistakesMade - metrics.languageErrors - metrics.punctuationErrors);
  if (letterErrors > 20) errorScore -= 10;
  else if (letterErrors > 15) errorScore -= 8;
  else if (letterErrors > 10) errorScore -= 6;
  else if (letterErrors > 7) errorScore -= 4;
  else if (letterErrors > 4) errorScore -= 2;
  
  // Multiple deletions penalty - 10 points
  if (metrics.deletions > 30) errorScore -= 10;
  else if (metrics.deletions > 20) errorScore -= 8;
  else if (metrics.deletions > 15) errorScore -= 6;
  else if (metrics.deletions > 10) errorScore -= 4;
  else if (metrics.deletions > 5) errorScore -= 2;
  
  score += Math.max(0, errorScore);
  
  // 2. COMPLETION COMPONENT (20 points max)
  let completionScore = 0;
  if (completionRate >= 100) completionScore = 20;
  else if (completionRate >= 90) completionScore = 18;
  else if (completionRate >= 80) completionScore = 16;
  else if (completionRate >= 70) completionScore = 14;
  else if (completionRate >= 60) completionScore = 12;
  else completionScore = Math.max(0, (completionRate / 60) * 12);
  
  score += completionScore;
  
  // 3. SPEED COMPONENT (20 points max)
  let speedScore = 0;
  if (metrics.wpm >= 60) speedScore = 20;
  else if (metrics.wpm >= 50) speedScore = 18;
  else if (metrics.wpm >= 40) speedScore = 15;
  else if (metrics.wpm >= 30) speedScore = 12;
  else if (metrics.wpm >= 20) speedScore = 8;
  else if (metrics.wpm >= 10) speedScore = 4;
  else speedScore = 1;
  
  score += speedScore;
  
  // 4. OTHER FACTORS (10 points max)
  let otherScore = 10;
  
  // Language switches penalty
  if (metrics.languageSwitches > 15) otherScore -= 4;
  else if (metrics.languageSwitches > 10) otherScore -= 3;
  else if (metrics.languageSwitches > 5) otherScore -= 2;
  
  // Flow disruption penalty (removed "frustration" terminology)
  if (metrics.frustrationScore > 8) otherScore -= 4;
  else if (metrics.frustrationScore > 6) otherScore -= 3;
  else if (metrics.frustrationScore > 4) otherScore -= 2;
  else if (metrics.frustrationScore > 2) otherScore -= 1;
  
  // Average delay penalty
  if (metrics.averageDelay > 3000) otherScore -= 2;
  else if (metrics.averageDelay > 2000) otherScore -= 1;
  
  score += Math.max(0, otherScore);
  
  return Math.max(1, Math.min(100, Math.round(score)));
};

// Calculate wasted time in seconds
export const calculateWastedTime = (metrics: TypingMetrics): number => {
  const deletionTime = metrics.deletions * 0.3;
  const correctionTime = metrics.corrections * 2;
  const languageErrorTime = metrics.languageErrors * 3;
  
  return Math.round(deletionTime + correctionTime + languageErrorTime);
};

// Score breakdown function with new algorithm (removed "frustration" from user-facing text)
export const getScoreBreakdown = (metrics: TypingMetrics, completionRate: number = 100) => {
  const breakdown = [];
  
  if (metrics.languageErrors > 1) {
    breakdown.push({ 
      category: 'Language Errors', 
      penalty: Math.min(20, metrics.languageErrors * 2), 
      reason: `${metrics.languageErrors} wrong language characters` 
    });
  }
  
  if (metrics.punctuationErrors > 1) {
    breakdown.push({ 
      category: 'Punctuation Errors', 
      penalty: Math.min(10, metrics.punctuationErrors), 
      reason: `${metrics.punctuationErrors} punctuation mistakes` 
    });
  }
  
  if (metrics.deletions > 5) {
    breakdown.push({ 
      category: 'Excessive Deletions', 
      penalty: Math.min(10, Math.floor(metrics.deletions / 3)), 
      reason: `${metrics.deletions} deletions made` 
    });
  }
  
  if (completionRate < 100) {
    breakdown.push({ 
      category: 'Incomplete Text', 
      penalty: Math.round((100 - completionRate) * 0.2), 
      reason: `Only ${completionRate.toFixed(0)}% completed` 
    });
  }
  
  if (metrics.wpm < 40) {
    breakdown.push({ 
      category: 'Typing Speed', 
      penalty: Math.min(15, Math.max(0, 40 - metrics.wpm)), 
      reason: `${metrics.wpm} WPM (below average)` 
    });
  }
  
  if (metrics.languageSwitches > 5) {
    breakdown.push({ 
      category: 'Rhythm Disruption', 
      penalty: Math.min(4, Math.floor(metrics.languageSwitches / 3)), 
      reason: `${metrics.languageSwitches} language switches` 
    });
  }
  
  if (metrics.frustrationScore > 4) {
    breakdown.push({ 
      category: 'Flow Disruption', 
      penalty: Math.min(4, metrics.frustrationScore - 4), 
      reason: `${metrics.frustrationScore}/10 flow score` 
    });
  }
  
  const totalPenalty = breakdown.reduce((sum, item) => sum + item.penalty, 0);
  return { breakdown, totalPenalty };
};

type Language = 'en' | 'he';

function App() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [discountCode] = useState(`TYPE${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [isSaving, setIsSaving] = useState(false);
  const saveAttempted = useRef(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingDiscountCode, setExistingDiscountCode] = useState<string | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [skippedTest, setSkippedTest] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isRetakeTest, setIsRetakeTest] = useState(false);
  const [retakeSourceScreen, setRetakeSourceScreen] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [chosenExercise, setChosenExercise] = useState('purchasing_email');
  const adminClickCount = useRef(0);
  const adminClickTimer = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    demographics: {},
    exercises: [],
    selfAssessment: {},
    featureRatings: {},
    purchaseDecision: {},
    metrics: { totalErrors: 0, languageErrors: 0, punctuationErrors: 0, deletions: 0, averageDelay: 0, frustrationScore: 0, languageSwitches: 0, corrections: 0, totalMistakesMade: 0, finalErrors: 0, accuracy: 0, wpm: 0 }
  });
  const screens = ['welcome', 'demographics', 'beforeExercise', 'exercise1', 'selfAssessment', 'results', 'featureRating', 'purchase', 'thankYou'];
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  
  useEffect(() => {
    const checkDevice = async () => {
      setCheckingSubmission(true);
      try {
        const deviceDetection = detectDevice();
        setIsMobileDevice(deviceDetection.isMobile);
        const [fingerprint, ip] = await Promise.all([getDeviceFingerprint(), getIPAddress()]);
        const info: DeviceInfo = { fingerprint, ip, deviceType: deviceDetection.type, isMobile: deviceDetection.isMobile };
        setDeviceInfo(info);
        const submissionResult = await checkIfAlreadySubmitted(fingerprint, ip);
        if (submissionResult) {
          setAlreadySubmitted(true);
          setExistingDiscountCode(submissionResult);
        }
      } catch (err) {
        console.error("Device check failed:", err);
      } finally {
        setCheckingSubmission(false);
      }
    };
    checkDevice();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentScreen === 0 && !(window as any).surveyStartTime) {
      (window as any).surveyStartTime = Date.now();
    }
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [currentScreen, language]);

  const saveToDatabase = async (dataToSave: SurveyData) => {
    if (saveAttempted.current || isSaving) return { success: false, id: null };
    setIsSaving(true);
    saveAttempted.current = true;
    try {
      const enhancedData = { ...dataToSave, deviceInfo, chosenExercise };
      const result = await saveSurveyData(enhancedData, discountCode);
      if (result.success && result.id) {
        setSurveyId(result.id);
        if (deviceInfo) await saveDeviceInfo(result.id, deviceInfo);
        setSurveyCompleted(true);
        return { success: true, id: result.id };
      } else {
        setError(t.app.errorDefault);
        saveAttempted.current = false;
        return { success: false, id: null };
      }
    } catch (err) {
      setError(t.app.errorDefault);
      saveAttempted.current = false;
      return { success: false, id: null };
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSkipTest = () => {
    if (surveyCompleted) { setCurrentScreen(screens.indexOf('thankYou')); return; }
    setSkippedTest(true);
    setCurrentScreen(screens.indexOf('featureRating'));
  };

  const handleTryTest = () => {
    setRetakeSourceScreen(currentScreen);
    setShowLanguageSelect(true);
  };

  const handleLanguageSelectForRetake = (language: string) => {
    setShowLanguageSelect(false);
    setIsRetakeTest(true);
    setTestCompleted(false);
    setSkippedTest(false);
    setSurveyData(prev => ({ ...prev, demographics: { ...prev.demographics, languages: [language] } }));
    setCurrentScreen(screens.indexOf('beforeExercise'));
  };

  const handleNext = async (data?: any) => {
    setError(null);
    setIsLoading(true);
    try {
      let updatedSurveyData = { ...surveyData };
      if (data) {
        if (data.demographics) {
          updatedSurveyData = { ...updatedSurveyData, demographics: data.demographics };
        } else if (data.exercises && data.exercises.length > 0) {
          const exercise = data.exercises[0];
          updatedSurveyData = { ...updatedSurveyData, exercises: [...updatedSurveyData.exercises, exercise], metrics: exercise.metrics };
          setTestCompleted(true);
        } else {
          updatedSurveyData = { ...updatedSurveyData, ...data };
        }
      }
      setSurveyData(updatedSurveyData);
      if (currentScreen === screens.indexOf('purchase') && !saveAttempted.current && !surveyCompleted && !isRetakeTest) {
        updatedSurveyData.testSkipped = skippedTest;
        updatedSurveyData.testCompleted = testCompleted;
        await saveToDatabase(updatedSurveyData);
      }
      
      const nextScreenIndex = currentScreen + 1;
      if (nextScreenIndex < screens.length) {
        setCurrentScreen(nextScreenIndex);
      } else {
        setCurrentScreen(screens.indexOf('thankYou'));
      }

    } catch (err) {
      setError(t.app.errorDefault);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartChallenge = (exercise: string) => {
    setChosenExercise(exercise);
    setCurrentScreen(screens.indexOf('exercise1'));
  };
  
  const handleShowShareCard = () => setShowShareCard(true);

  const handleAdminClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current > 2000) {
      adminClickCount.current = 0;
    }
    lastClickTime.current = currentTime;
    adminClickCount.current++;
    if (adminClickTimer.current) {
      clearTimeout(adminClickTimer.current);
    }
    adminClickTimer.current = setTimeout(() => {
      adminClickCount.current = 0;
    }, 2000);
    if (adminClickCount.current >= 5) {
      if (adminClickTimer.current) {
        clearTimeout(adminClickTimer.current);
        adminClickTimer.current = null;
      }
      const username = prompt('Admin Username:');
      if (username === 'Miki$123456') {
        const password = prompt('Admin Password:');
        if (password === 'Miki$123456') {
          setShowAdmin(true);
        }
      }
    }
  };
  
  const handleEmailSubmit = async (email: string) => {
    try {
      if (!surveyId) {
        const updatedData = { ...surveyData, email };
        const result = await saveToDatabase(updatedData);
        if (result.success && result.id) {
          await saveEmailSubscription(email, result.id);
        } else {
          setSurveyData(prev => ({ ...prev, email }));
        }
      } else {
        await saveEmailSubscription(email, surveyId);
      }
    } catch (err) {
      console.error('Error saving email:', err);
    }
  };

  const handleResultsClose = () => {
    if (isRetakeTest) {
      setIsRetakeTest(false);
      setCurrentScreen(retakeSourceScreen !== null ? retakeSourceScreen : 0);
      setRetakeSourceScreen(null);
    }
  };
  
  const getTranslations = (key: string) => t[key] || {};
  
  if (checkingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t.app.verifying}</p>
        </div>
      </div>
    );
  }
  
  if (showAdmin) { return <AdminDashboard onLogout={() => { setShowAdmin(false); }} />; }

  if (error && currentScreen !== screens.length - 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.app.oops}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => { setError(null); setCurrentScreen(0); saveAttempted.current = false; }} className="w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">{t.app.startOver}</button>
        </div>
      </div>
    );
  }

  if (isLoading && screens[currentScreen] === 'thankYou') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t.app.saving}</p>
        </div>
      </div>
    );
  }

  if (showShareCard) {
    return <ShareCard metrics={surveyData.metrics} onClose={() => setShowShareCard(false)} selectedLanguage={surveyData.demographics.languages?.[0] || 'Arabic-English'} t={getTranslations('shareCard')} />;
  }
  
  if (showLanguageSelect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.app.chooseLang}</h2>
            <p className="text-gray-600">{t.app.chooseLangDesc}</p>
          </div>
          <div className="space-y-3">
            {[{ value: 'Hebrew-English', label: 'Hebrew + English' },{ value: 'Arabic-English', label: 'Arabic + English' },{ value: 'Russian-English', label: 'Russian + English' }].map(lang => (
              <button key={lang.value} onClick={() => handleLanguageSelectForRetake(lang.value)} className="w-full p-4 bg-gray-50 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 rounded-lg text-left transition group">
                <span className="font-semibold text-gray-800 group-hover:text-blue-600">{lang.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowLanguageSelect(false)} className="w-full mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition">{t.app.cancel}</button>
        </div>
      </div>
    );
  }
  
  if (alreadySubmitted && !isRetakeTest && currentScreen !== screens.indexOf('thankYou')) {
    return (
     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.app.alreadySubmittedTitle}</h2>
           <p className="text-gray-600 mb-6">{t.app.alreadySubmittedDesc}</p>
           <div className="space-y-3">
             <button onClick={handleTryTest} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition">
               {t.app.tryChallengeButton}
             </button>
           </div>
           <div className="mt-6 pt-6 border-t">
             <p className="text-sm text-gray-600 mb-2">{t.app.yourDiscountCode}</p>
             <div className="bg-green-50 border border-green-200 rounded-lg p-3">
               <code className="text-green-800 font-mono font-bold">{existingDiscountCode || '...'}</code>
             </div>
             <p className="text-xs text-gray-500 mt-2">{t.app.saveCode}</p>
           </div>
         </div>
       </div>
     );
  }

  const renderScreen = () => {
    const screenName = screens[currentScreen];
    const isHebrewUser = surveyData.demographics.languages?.[0] === 'Hebrew-English';

    switch (screenName) {
      case 'welcome':
        return <WelcomeScreen language={language} onNext={() => setCurrentScreen(screens.indexOf('demographics'))} onAdminClick={handleAdminClick} setLanguage={setLanguage} t={getTranslations('welcome')} />;
      
      case 'demographics':
        return <DemographicsScreen onNext={handleNext} t={getTranslations('demographics')} />;
      
      case 'beforeExercise':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
              
              {isHebrewUser ? (
                // VIEW FOR HEBREW USERS (works for both initial run and retake)
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">{t.beforeExercise.challengeChoiceTitle}</h2>
                  <p className="text-gray-600 text-center mb-6">{t.beforeExercise.subtitle}</p>
                  
                  {/* SCORING TABLE - RESTORED */}
                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">{t.beforeExercise.scoringTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center"><div className="text-2xl font-bold text-blue-600">50%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringError}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringErrorDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-green-600">20%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringCompletion}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringCompletionDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-purple-600">20%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringSpeed}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringSpeedDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-orange-600">10%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringFlow}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringFlowDesc}</div></div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-8">
                    <div onClick={() => handleStartChallenge('purchasing_email')} className="border-2 border-blue-200 hover:border-blue-400 bg-blue-50 rounded-lg p-6 cursor-pointer transition">
                      <h3 className="font-bold text-blue-800 text-lg mb-2">{t.beforeExercise.challenge1Name}</h3>
                      <p className="text-sm text-gray-700">{t.beforeExercise.challenge1Desc}</p>
                    </div>
                    <div onClick={() => handleStartChallenge('student_article')} className="border-2 border-purple-200 hover:border-purple-400 bg-purple-50 rounded-lg p-6 cursor-pointer transition">
                      <h3 className="font-bold text-purple-800 text-lg mb-2">{t.beforeExercise.challenge2Name}</h3>
                      <p className="text-sm text-gray-700">{t.beforeExercise.challenge2Desc}</p>
                    </div>
                  </div>
                  
                  {/* SKIP BUTTON - Only show if survey not completed and not in retake mode */}
                  {!surveyCompleted && !isRetakeTest && (
                    <button onClick={handleSkipTest} className="w-full mt-6 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition">
                      {t.beforeExercise.skipButton}
                    </button>
                  )}
                </div>
              ) : (
                // VIEW FOR ALL OTHER USERS (AND MOBILE)
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">{t.beforeExercise.title}</h2>
                  <p className="text-gray-600 text-center mb-6">{t.beforeExercise.subtitle}</p>
                  
                  {/* SCORING TABLE - RESTORED */}
                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">{t.beforeExercise.scoringTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center"><div className="text-2xl font-bold text-blue-600">50%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringError}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringErrorDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-green-600">20%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringCompletion}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringCompletionDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-purple-600">20%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringSpeed}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringSpeedDesc}</div></div>
                      <div className="text-center"><div className="text-2xl font-bold text-orange-600">10%</div><div className="text-sm text-gray-700 font-medium">{t.beforeExercise.scoringFlow}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringFlowDesc}</div></div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6"><p className="text-yellow-800 font-medium">{t.beforeExercise.tip}</p></div>
                  <div className="flex gap-3 mt-8">
                    {isMobileDevice && !isRetakeTest? (
                      <button onClick={handleSkipTest} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">{t.beforeExercise.mobileWarningButton}</button>
                    ) : (
                      <>
                        <button onClick={() => handleStartChallenge('purchasing_email')} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">{t.beforeExercise.startButton}</button>
                        {/* SKIP BUTTON - Only show if survey not completed and not in retake mode */}
                        {!surveyCompleted && !isRetakeTest && (
                          <button onClick={handleSkipTest} className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition">{t.beforeExercise.skipButton}</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'exercise1':
        return <TypingExercise chosenExercise={isRetakeTest ? 'purchasing_email' : chosenExercise} onComplete={handleNext} selectedLanguage={surveyData.demographics.languages?.[0] || 'Hebrew-English'} t={getTranslations('exercise1')} />;
      
      case 'selfAssessment':
        return <SelfAssessment onNext={handleNext} t={getTranslations('selfAssessment')} />;
      
      case 'results':
        return <ResultsReport metrics={surveyData.metrics} onNext={isRetakeTest ? handleResultsClose : handleNext} onShare={handleShowShareCard} isRetake={isRetakeTest} t={getTranslations('results')} />;
      
      case 'featureRating':
        return <FeatureRating onNext={handleNext} t={getTranslations('featureRating')} />;
        
      case 'purchase':
        return <PurchaseDecision onNext={handleNext} t={getTranslations('purchase')} />;
        
      case 'thankYou':
        return <ThankYou discountCode={discountCode} onShare={handleShowShareCard} onEmailSubmit={handleEmailSubmit} skippedTest={skippedTest && !testCompleted} onTryTest={handleTryTest} t={getTranslations('thankYou')} />;
        
      default:
        return <WelcomeScreen language={language} onNext={() => setCurrentScreen(1)} onAdminClick={handleAdminClick} setLanguage={setLanguage} t={getTranslations('welcome')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {currentScreen > 0 && currentScreen < screens.length - 1 && !isRetakeTest && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-2 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">{t.app.step(currentScreen, screens.length - 2)}</span>
                <span className="text-xs text-gray-600">{t.app.percentComplete(Math.round(((currentScreen) / (screens.length - 2)) * 100))}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentScreen) / (screens.length - 2)) * 100}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
