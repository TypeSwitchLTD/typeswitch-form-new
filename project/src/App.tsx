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

// Centralized scoring function
export const calculateOverallScore = (metrics: TypingMetrics): number => {
  let score = 100;

  if (metrics.wpm < 20) score -= 30;
  else if (metrics.wpm < 30) score -= 25;
  else if (metrics.wpm < 40) score -= 18;
  else if (metrics.wpm < 50) score -= 10;
  else if (metrics.wpm < 60) score -= 5;

  if (metrics.accuracy < 70) score -= 30;
  else if (metrics.accuracy < 80) score -= 25;
  else if (metrics.accuracy < 85) score -= 20;
  else if (metrics.accuracy < 90) score -= 15;
  else if (metrics.accuracy < 95) score -= 10;
  else if (metrics.accuracy < 98) score -= 5;

  if (metrics.languageSwitches > 20) score -= 15;
  else if (metrics.languageSwitches > 15) score -= 12;
  else if (metrics.languageSwitches > 10) score -= 8;
  else if (metrics.languageSwitches > 5) score -= 4;

  if (metrics.totalMistakesMade > 80) score -= 15;
  else if (metrics.totalMistakesMade > 60) score -= 12;
  else if (metrics.totalMistakesMade > 40) score -= 8;
  else if (metrics.totalMistakesMade > 20) score -= 4;

  if (metrics.frustrationScore > 8) score -= 15;
  else if (metrics.frustrationScore > 6) score -= 12;
  else if (metrics.frustrationScore > 4) score -= 8;
  else if (metrics.frustrationScore > 2) score -= 4;

  return Math.max(1, Math.min(100, score));
};

// Score breakdown function
export const getScoreBreakdown = (metrics: TypingMetrics) => {
  const breakdown = [];
  let totalPenalty = 0;

  let wpmPenalty = 0;
  if (metrics.wpm < 20) wpmPenalty = 30;
  else if (metrics.wpm < 30) wpmPenalty = 25;
  else if (metrics.wpm < 40) wpmPenalty = 18;
  else if (metrics.wpm < 50) wpmPenalty = 10;
  else if (metrics.wpm < 60) wpmPenalty = 5;

  if (wpmPenalty > 0) {
    breakdown.push({
      category: 'Typing Speed',
      penalty: wpmPenalty,
      reason: `${metrics.wpm} WPM (below average)`
    });
    totalPenalty += wpmPenalty;
  }

  let accuracyPenalty = 0;
  if (metrics.accuracy < 70) accuracyPenalty = 30;
  else if (metrics.accuracy < 80) accuracyPenalty = 25;
  else if (metrics.accuracy < 85) accuracyPenalty = 20;
  else if (metrics.accuracy < 90) accuracyPenalty = 15;
  else if (metrics.accuracy < 95) accuracyPenalty = 10;
  else if (metrics.accuracy < 98) accuracyPenalty = 5;

  if (accuracyPenalty > 0) {
    breakdown.push({
      category: 'Accuracy',
      penalty: accuracyPenalty,
      reason: `${metrics.accuracy}% accuracy`
    });
    totalPenalty += accuracyPenalty;
  }

  let switchPenalty = 0;
  if (metrics.languageSwitches > 20) switchPenalty = 15;
  else if (metrics.languageSwitches > 15) switchPenalty = 12;
  else if (metrics.languageSwitches > 10) switchPenalty = 8;
  else if (metrics.languageSwitches > 5) switchPenalty = 4;

  if (switchPenalty > 0) {
    breakdown.push({
      category: 'Rhythm Disruption',
      penalty: switchPenalty,
      reason: `${metrics.languageSwitches} interruptions`
    });
    totalPenalty += switchPenalty;
  }

  let mistakePenalty = 0;
  if (metrics.totalMistakesMade > 80) mistakePenalty = 15;
  else if (metrics.totalMistakesMade > 60) mistakePenalty = 12;
  else if (metrics.totalMistakesMade > 40) mistakePenalty = 8;
  else if (metrics.totalMistakesMade > 20) mistakePenalty = 4;

  if (mistakePenalty > 0) {
    breakdown.push({
      category: 'Total Mistakes',
      penalty: mistakePenalty,
      reason: `${metrics.totalMistakesMade} mistakes`
    });
    totalPenalty += mistakePenalty;
  }

  let frustrationPenalty = 0;
  if (metrics.frustrationScore > 8) frustrationPenalty = 15;
  else if (metrics.frustrationScore > 6) frustrationPenalty = 12;
  else if (metrics.frustrationScore > 4) frustrationPenalty = 8;
  else if (metrics.frustrationScore > 2) frustrationPenalty = 4;

  if (frustrationPenalty > 0) {
    breakdown.push({
      category: 'Flow Disruption',
      penalty: frustrationPenalty,
      reason: `${metrics.frustrationScore}/10 disruption level`
    });
    totalPenalty += frustrationPenalty;
  }

  return {
    breakdown,
    totalPenalty,
    finalScore: 100 - totalPenalty
  };
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
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const [skippedTest, setSkippedTest] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isRetakeTest, setIsRetakeTest] = useState(false);
  const [retakeSourceScreen, setRetakeSourceScreen] = useState<number | null>(null);

  const adminClickCount = useRef(0);
  const adminClickTimer = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);

  const [surveyData, setSurveyData] = useState<SurveyData>({
    demographics: {},
    exercises: [],
    selfAssessment: {},
    featureRatings: {},
    purchaseDecision: {},
    metrics: {
      totalErrors: 0,
      languageErrors: 0,
      punctuationErrors: 0,
      deletions: 0,
      averageDelay: 0,
      frustrationScore: 0,
      languageSwitches: 0,
      corrections: 0,
      totalMistakesMade: 0,
      finalErrors: 0,
      accuracy: 0,
      wpm: 0
    }
  });

  const screens = [
    'welcome',
    'demographics',
    'beforeExercise',
    'exercise1',
    'selfAssessment',
    'results',
    'featureRating',
    'purchase',
    'thankYou'
  ];

  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [selectedRetakeLanguage, setSelectedRetakeLanguage] = useState('');

  useEffect(() => {
    const checkDevice = async () => {
      setCheckingSubmission(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Device check timed out')), 8000)
      );

      try {
        await Promise.race([
          (async () => {
            const deviceDetection = detectDevice();
            setIsMobileDevice(deviceDetection.isMobile);

            const [fingerprint, ip] = await Promise.all([
              getDeviceFingerprint(),
              getIPAddress()
            ]);

            const info: DeviceInfo = { fingerprint, ip, deviceType: deviceDetection.type, isMobile: deviceDetection.isMobile };
            setDeviceInfo(info);

            const hasSubmitted = await checkIfAlreadySubmitted(fingerprint, ip);
            setAlreadySubmitted(hasSubmitted);
          })(),
          timeoutPromise
        ]);
      } catch (err) {
        console.error("Device check failed or timed out:", err);
        setAlreadySubmitted(false); // Default to not submitted on error to not block user
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
  }, [currentScreen]);

  const saveToDatabase = async (dataToSave: SurveyData) => {
    if (saveAttempted.current || isSaving) {
      return { success: false, id: null };
    }

    setIsSaving(true);
    saveAttempted.current = true;

    try {
      const enhancedData = { ...dataToSave, deviceInfo: deviceInfo };
      const result = await saveSurveyData(enhancedData, discountCode);

      if (result.success && result.id) {
        setSurveyId(result.id);
        if (deviceInfo) {
          await saveDeviceInfo(result.id, deviceInfo);
        }
        setSurveyCompleted(true);
        return { success: true, id: result.id };
      } else {
        setError(`Error saving: ${result.error || 'Unknown issue'}`);
        saveAttempted.current = false;
        return { success: false, id: null };
      }
    } catch (err) {
      setError('Error saving data. Please try again.');
      saveAttempted.current = false;
      return { success: false, id: null };
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipTest = () => {
    if (surveyCompleted) {
      alert('Survey already completed!');
      setCurrentScreen(8);
      return;
    }
    setSkippedTest(true);
    setCurrentScreen(6);
  };

  const handleTryTest = () => {
    setRetakeSourceScreen(currentScreen); // Store where the retake was initiated from
    setShowLanguageSelect(true);
  };

  const handleLanguageSelectForRetake = (language: string) => {
    setSelectedRetakeLanguage(language);
    setShowLanguageSelect(false);
    setIsRetakeTest(true);
    setTestCompleted(false);
    setSkippedTest(false);

    setSurveyData(prev => ({
      ...prev,
      demographics: { ...prev.demographics, languages: [language] }
    }));

    setCurrentScreen(3); // Go directly to exercise screen
  };

  const handleNext = async (data?: any) => {
    setError(null);
    setIsLoading(true);

    try {
      let updatedSurveyData = { ...surveyData };

      if (data) {
        if (data.exercises && data.exercises.length > 0) {
          const exercise = data.exercises[0];
          updatedSurveyData = {
            ...updatedSurveyData,
            exercises: [...updatedSurveyData.exercises, exercise],
            metrics: exercise.metrics // For retakes, we only care about the latest metrics
          };
          setTestCompleted(true);
        } else {
          updatedSurveyData = { ...updatedSurveyData, ...data };
        }
      }

      setSurveyData(updatedSurveyData);

      if (currentScreen === 7 && !saveAttempted.current && !surveyCompleted && !isRetakeTest) {
        updatedSurveyData.testSkipped = skippedTest;
        updatedSurveyData.testCompleted = testCompleted;
        await saveToDatabase(updatedSurveyData);
      }

      const nextScreen = isRetakeTest && currentScreen === 3 ? 5 : currentScreen + 1;
      setCurrentScreen(nextScreen);

    } catch (err) {
      console.error('Error processing data:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowShareCard = () => {
    setShowShareCard(true);
  };

  const handleAdminClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current > 2000) {
      adminClickCount.current = 0;
    }
    lastClickTime.current = currentTime;
    adminClickCount.current++;

    if (adminClickTimer.current) clearTimeout(adminClickTimer.current);
    adminClickTimer.current = setTimeout(() => { adminClickCount.current = 0; }, 2000);

    if (adminClickCount.current >= 5) {
      if (adminClickTimer.current) clearTimeout(adminClickTimer.current);
      const username = prompt('Admin Username:');
      if (username === 'Miki$123456') {
        const password = prompt('Admin Password:');
        if (password === 'Miki$123456') {
          setShowAdmin(true);
        } else {
          alert('Invalid password');
        }
      } else if (username) {
        alert('Invalid username');
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

  useEffect(() => {
    return () => {
      if (adminClickTimer.current) clearTimeout(adminClickTimer.current);
    };
  }, []);

  // --- RENDER LOGIC ---

  if (checkingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verifying data...</p>
        </div>
      </div>
    );
  }

  if (showAdmin) {
    return <AdminDashboard onLogout={() => { setShowAdmin(false); }} />;
  }

  if (error && currentScreen !== screens.length - 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => { setError(null); setCurrentScreen(0); saveAttempted.current = false; }} className="w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">Start Over</button>
        </div>
      </div>
    );
  }

  if (isLoading && screens[currentScreen] === 'thankYou') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Saving your results...</p>
        </div>
      </div>
    );
  }

  if (showShareCard) {
    return <ShareCard
      metrics={surveyData.metrics}
      onClose={() => setShowShareCard(false)}
      selectedLanguage={selectedRetakeLanguage || surveyData.demographics.languages?.[0] || 'Arabic-English'}
    />;
  }

  if (showLanguageSelect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Language Pair</h2>
            <p className="text-gray-600">Select the languages for the test.</p>
          </div>
          <div className="space-y-3">
            {[
              { value: 'Hebrew-English', label: 'Hebrew + English' },
              { value: 'Arabic-English', label: 'Arabic + English' },
              { value: 'Russian-English', label: 'Russian + English' }
            ].map(lang => (
              <button key={lang.value} onClick={() => handleLanguageSelectForRetake(lang.value)} className="w-full p-4 bg-gray-50 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 rounded-lg text-left transition group">
                <span className="font-semibold text-gray-800 group-hover:text-blue-600">{lang.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowLanguageSelect(false)} className="w-full mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
        </div>
      </div>
    );
  }
  
  if (alreadySubmitted && !isRetakeTest && currentScreen !== 8) {
    return (
     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-4">Survey Already Completed!</h2>
           <p className="text-gray-600 mb-6">
             Thank you for participating. You can retake the typing challenge anytime.
           </p>
           <div className="space-y-3">
             <button
               onClick={handleTryTest}
               className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
             >
               Try the Typing Challenge
             </button>
              <button
               disabled
               className="w-full bg-gray-200 text-gray-400 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
             >
               Skip to Survey (Completed)
             </button>
           </div>
         <div className="mt-6 pt-6 border-t">
           <p className="text-xs text-gray-400">
             If you think this is a mistake, please contact us.
           </p>
         </div>
       </div>
     </div>
   );
 }

  const renderScreen = () => {
    const screenName = screens[currentScreen];
    switch (screenName) {
      case 'welcome': return <WelcomeScreen onNext={() => setCurrentScreen(1)} onAdminClick={handleAdminClick} />;
      case 'demographics': return <DemographicsScreen onNext={handleNext} />;
      case 'beforeExercise':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Ready for the Typing Exercise?</h2>
              <p className="text-gray-600 text-center mb-6">A quick exercise to understand your typing patterns.</p>
              <div className="bg-yellow-50 rounded-lg p-4 mb-6"><p className="text-yellow-800 font-medium">Tip: Type naturally as you normally would - don't try to be perfect!</p></div>
              <div className="flex gap-3 mt-8">
                {isMobileDevice ? (
                  <div className="w-full bg-orange-100 border-2 border-orange-300 rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-gray-800 mb-2">Typing Test Requires a Keyboard</h3>
                    <p className="text-sm text-gray-600 mb-4">The test must be done on a computer with a physical keyboard.</p>
                    <button onClick={handleSkipTest} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">Continue to Survey Questions</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleNext()} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition">Start Exercise</button>
                    {!surveyCompleted && <button onClick={handleSkipTest} className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition">Skip to Survey</button>}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 'exercise1':
        if (isMobileDevice && !isRetakeTest) {
          handleSkipTest(); return null;
        }
        return <TypingExercise exerciseNumber={1} onComplete={handleNext} selectedLanguage={surveyData.demographics.languages?.[0] || 'Arabic-English'} />;
      case 'selfAssessment': return <SelfAssessment onNext={handleNext} />;
      case 'results': return <ResultsReport metrics={surveyData.metrics} onNext={isRetakeTest ? handleResultsClose : () => handleNext()} onShare={handleShowShareCard} isRetake={isRetakeTest} />;
      case 'featureRating': return <FeatureRating onNext={handleNext} />;
      case 'purchase': return <PurchaseDecision onNext={handleNext} />;
      case 'thankYou': return <ThankYou discountCode={discountCode} onShare={handleShowShareCard} onEmailSubmit={handleEmailSubmit} skippedTest={skippedTest && !testCompleted} onTryTest={handleTryTest} />;
      default: return <WelcomeScreen onNext={() => setCurrentScreen(1)} onAdminClick={handleAdminClick} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {currentScreen > 0 && currentScreen < screens.length - 1 && !isRetakeTest && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-2 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-600">Step {currentScreen} of {screens.length - 2}</span><span className="text-xs text-gray-600">{Math.round(((currentScreen) / (screens.length - 2)) * 100)}% Complete</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentScreen) / (screens.length - 2)) * 100}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;