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

// NEW SCORING ALGORITHM - Range 40-100
// Accuracy: 70% | Flow: 15% | Completion: 10% | Speed: 5%
export const calculateOverallScore = (metrics: TypingMetrics, completionRate: number = 100): number => {
  let score = 100; // Start from 100
  
  // 1. ACCURACY (70 points total)
  // Language Errors - up to -35 points
  const languageErrorPenalty = Math.min(35, metrics.languageErrors * 2.0);
  score -= languageErrorPenalty;
  
  // Punctuation Errors - up to -20 points
  const punctuationPenalty = Math.min(20, metrics.punctuationErrors * 2.0);
  score -= punctuationPenalty;
  
  // Other Typing Errors - up to -15 points
  const otherErrors = Math.max(0, metrics.totalMistakesMade - metrics.languageErrors - metrics.punctuationErrors);
  const otherErrorPenalty = Math.min(15, otherErrors * 1.5);
  score -= otherErrorPenalty;
  
  // 2. FLOW (15 points total)
  // Deletions (only above 15) - up to -10 points
  if (metrics.deletions > 15) {
    const deletionPenalty = Math.min(10, (metrics.deletions - 15) * 0.6);
    score -= deletionPenalty;
  }
  
  // Frustration Score - up to -5 points
  const flowPenalty = Math.min(5, metrics.frustrationScore * 1.0);
  score -= flowPenalty;
  
  // 3. COMPLETION (10 points total)
  if (completionRate < 100) {
    const missingPercent = 100 - completionRate;
    const completionPenalty = Math.min(10, missingPercent * 0.1);
    score -= completionPenalty;
  }
  
  // 4. SPEED (5 points total) - WPM bonus/penalty
  let speedAdjustment = 0;
  if (metrics.wpm >= 60) speedAdjustment = 3;
  else if (metrics.wpm >= 45) speedAdjustment = 1;
  else if (metrics.wpm >= 30) speedAdjustment = 0;
  else if (metrics.wpm >= 20) speedAdjustment = -1;
  else speedAdjustment = -2;
  score += speedAdjustment;
  
  // Floor: 40, Ceiling: 100
  return Math.round(Math.max(40, Math.min(100, score)));
};

// Calculate wasted time in seconds
export const calculateWastedTime = (metrics: TypingMetrics): number => {
  const deletionTime = metrics.deletions * 0.3;
  const correctionTime = metrics.corrections * 2;
  const languageErrorTime = metrics.languageErrors * 3;
  
  return Math.round(deletionTime + correctionTime + languageErrorTime);
};

// Score breakdown function
export const getScoreBreakdown = (metrics: TypingMetrics, completionRate: number = 100) => {
  const breakdown = [];
  
  if (metrics.languageErrors > 0) {
    const penalty = Math.min(35, metrics.languageErrors * 2.0);
    breakdown.push({ 
      category: 'Language Errors', 
      penalty: Math.round(penalty), 
      reason: `${metrics.languageErrors} wrong language characters` 
    });
  }
  
  if (metrics.punctuationErrors > 0) {
    const penalty = Math.min(20, metrics.punctuationErrors * 2.0);
    breakdown.push({ 
      category: 'Punctuation Errors', 
      penalty: Math.round(penalty), 
      reason: `${metrics.punctuationErrors} punctuation mistakes` 
    });
  }
  
  const otherErrors = Math.max(0, metrics.totalMistakesMade - metrics.languageErrors - metrics.punctuationErrors);
  if (otherErrors > 0) {
    const penalty = Math.min(15, otherErrors * 1.5);
    breakdown.push({ 
      category: 'Other Typing Errors', 
      penalty: Math.round(penalty), 
      reason: `${otherErrors} other mistakes` 
    });
  }
  
  if (metrics.deletions > 15) {
    const penalty = Math.min(10, (metrics.deletions - 15) * 0.6);
    breakdown.push({ 
      category: 'Excessive Deletions', 
      penalty: Math.round(penalty), 
      reason: `${metrics.deletions} deletions made` 
    });
  }
  
  if (metrics.frustrationScore > 0) {
    const penalty = Math.min(5, metrics.frustrationScore * 1.0);
    breakdown.push({ 
      category: 'Flow Disruption', 
      penalty: Math.round(penalty), 
      reason: `${metrics.frustrationScore}/10 flow score` 
    });
  }
  
  if (completionRate < 100) {
    const penalty = Math.min(10, (100 - completionRate) * 0.1);
    breakdown.push({ 
      category: 'Incomplete Text', 
      penalty: Math.round(penalty), 
      reason: `Only ${Math.round(completionRate)}% completed` 
    });
  }
  
  if (metrics.wpm < 30) {
    let penalty = 0;
    if (metrics.wpm >= 20) penalty = 1;
    else penalty = 2;
    
    breakdown.push({ 
      category: 'Typing Speed', 
      penalty, 
      reason: `${metrics.wpm} WPM (below average)` 
    });
  }
  
  const totalPenalty = breakdown.reduce((sum, item) => sum + item.penalty, 0);
  return { breakdown, totalPenalty };
};

type Language = 'en' | 'he';

// PROTECTION LAYER
const setupProtections = () => {
  // Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
    }
  });
  
  // Detect DevTools
  const devtools = /./;
  devtools.toString = function() {
    console.warn('DevTools detected - Please complete the survey normally');
    return '';
  };
  console.log('%c', devtools);
  
  // Clean console in production
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }
};

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
  
  // ANALYTICS: Screen tracking
  const [screenTimes, setScreenTimes] = useState<Record<string, number>>({});
  const screenStartTime = useRef<number>(Date.now());
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
  
  // Setup protections on mount
  useEffect(() => {
    setupProtections();
  }, []);
  
  // Track screen time
  useEffect(() => {
    const screenName = screens[currentScreen];
    screenStartTime.current = Date.now();
    
    return () => {
      const timeSpent = Date.now() - screenStartTime.current;
      setScreenTimes(prev => ({
        ...prev,
        [screenName]: (prev[screenName] || 0) + timeSpent
      }));
    };
  }, [currentScreen]);
  
  // Track page visibility (drop-off detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !surveyCompleted) {
        const dropOffScreen = screens[currentScreen];
        // Save drop-off data (will be sent if user returns and completes)
        setSurveyData(prev => ({
          ...prev,
          dropOffScreen,
          browserClosedAt: new Date().toISOString()
        }));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentScreen, surveyCompleted]);
  
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
      const enhancedData = { 
        ...dataToSave, 
        deviceInfo, 
        chosenExercise,
        screenTimes,
        dropOffScreen: dataToSave.dropOffScreen,
        browserClosedAt: dataToSave.browserClosedAt
      };
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
  
  const handleBackToBeforeExercise = () => {
    setCurrentScreen(screens.indexOf('beforeExercise'));
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
             <p className="text-xs text-gray-500 mt-2">תוכלו להשתמש בקוד הזה לזיהוי בפניות ליצירת קשר, You can use this code for identification in contact inquiries.</p>
             <a href="https://typeswitch.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-semibold mt-2 inline-block">typeswitch.io</a>
           </div>
         </div>
       </div>
     );
  }

  const renderScreen = () => {
    const screenName = screens[currentScreen];
    const isHebrewUser = language === 'he' || surveyData.demographics.languages?.[0] === 'Hebrew-English';

    switch (screenName) {
      case 'welcome':
        return <WelcomeScreen language={language} onNext={() => setCurrentScreen(screens.indexOf('demographics'))} onAdminClick={handleAdminClick} setLanguage={setLanguage} t={getTranslations('welcome')} />;
      
      case 'demographics':
        return <DemographicsScreen onNext={handleNext} t={getTranslations('demographics')} />;
      
      case 'beforeExercise':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-3xl w-full">
              
              {isHebrewUser ? (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">{t.beforeExercise.challengeChoiceTitle}</h2>
                  <p className="text-gray-600 text-center mb-6">{t.beforeExercise.subtitle}</p>
                  
                  <div className="bg-blue-50 rounded-xl p-4 md:p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">{t.beforeExercise.scoringTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-blue-600">70%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringError}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringErrorDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-orange-600">15%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringFlow}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringFlowDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-green-600">10%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringCompletion}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringCompletionDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-purple-600">5%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringSpeed}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringSpeedDesc}</div></div>
                    </div>
                  </div>
                  
                  {isMobileDevice ? (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6 text-center">
                      <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">מבחן ההקלדה זמין רק במחשב/לפטופ</h3>
                      <p className="text-gray-600 mb-4">לצורך דיוק מרבי, המבחן דורש מקלדת פיזית</p>
                      <button onClick={handleSkipTest} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">
                        המשך לשאלון
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div onClick={() => handleStartChallenge('purchasing_email')} className="border-2 border-blue-200 hover:border-blue-400 bg-blue-50 rounded-lg p-6 cursor-pointer transition">
                          <h3 className="font-bold text-blue-800 text-lg mb-2">{t.beforeExercise.challenge1Name}</h3>
                          <p className="text-sm text-gray-700 mb-2">{t.beforeExercise.challenge1Desc}</p>
                          <p className="text-xs text-gray-500">(ניתן להשלים לפחות 60% כדי להמשיך, You can complete at least 60% to continue.)</p>
                        </div>
                        <div onClick={() => handleStartChallenge('student_article')} className="border-2 border-purple-200 hover:border-purple-400 bg-purple-50 rounded-lg p-6 cursor-pointer transition">
                          <h3 className="font-bold text-purple-800 text-lg mb-2">{t.beforeExercise.challenge2Name}</h3>
                          <p className="text-sm text-gray-700 mb-2">{t.beforeExercise.challenge2Desc}</p>
                          <p className="text-xs text-gray-500">(ניתן להשלים לפחות 60% כדי להמשיך, You can complete at least 60% to continue.)</p>
                        </div>
                      </div>
                      
                      {!surveyCompleted && !isRetakeTest && (
                        <button onClick={handleSkipTest} className="w-full mt-6 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition">
                          {t.beforeExercise.skipButton}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">{t.beforeExercise.title}</h2>
                  <p className="text-gray-600 text-center mb-6">{t.beforeExercise.subtitle}</p>
                  
                  <div className="bg-blue-50 rounded-xl p-4 md:p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">{t.beforeExercise.scoringTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-blue-600">70%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringError}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringErrorDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-orange-600">15%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringFlow}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringFlowDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-green-600">10%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringCompletion}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringCompletionDesc}</div></div>
                      <div className="text-center"><div className="text-xl md:text-2xl font-bold text-purple-600">5%</div><div className="text-xs md:text-sm text-gray-700 font-medium">{t.beforeExercise.scoringSpeed}</div><div className="text-xs text-gray-500">{t.beforeExercise.scoringSpeedDesc}</div></div>
                    </div>
                  </div>
                  
                  {isMobileDevice && !isRetakeTest ? (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6 text-center">
                      <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Typing test available on desktop only</h3>
                      <p className="text-gray-600 mb-4">For accurate results, a physical keyboard is required</p>
                      <button onClick={handleSkipTest} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">
                        {t.beforeExercise.mobileWarningButton}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-medium text-sm md:text-base">{t.beforeExercise.tip}</p>
                        <p className="text-yellow-700 text-xs mt-1">(You can complete at least 60% to continue)</p>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => handleStartChallenge('purchasing_email')} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">
                          {t.beforeExercise.startButton}
                        </button>
                        {!surveyCompleted && !isRetakeTest && (
                          <button onClick={handleSkipTest} className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition">
                            {t.beforeExercise.skipButton}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'exercise1':
        return <TypingExercise chosenExercise={chosenExercise} onComplete={handleNext} onBack={handleBackToBeforeExercise} selectedLanguage={surveyData.demographics.languages?.[0] || 'Hebrew-English'} t={getTranslations('exercise1')} />;
      
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
