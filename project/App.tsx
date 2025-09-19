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

// Centralized scoring function - SAME LOGIC, DIFFERENT DISPLAY
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

// Score breakdown function - WITH NEW TERMINOLOGY
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
  
  // CHANGED: Language Switches -> Rhythm Disruption
  let switchPenalty = 0;
  if (metrics.languageSwitches > 20) switchPenalty = 15;
  else if (metrics.languageSwitches > 15) switchPenalty = 12;
  else if (metrics.languageSwitches > 10) switchPenalty = 8;
  else if (metrics.languageSwitches > 5) switchPenalty = 4;
  
  if (switchPenalty > 0) {
    breakdown.push({
      category: 'Rhythm Disruption',  // CHANGED FROM 'Language Switches'
      penalty: switchPenalty,
      reason: `${metrics.languageSwitches} interruptions`  // CHANGED FROM 'switches'
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
  
  // CHANGED: Frustration Level -> Flow Disruption
  let frustrationPenalty = 0;
  if (metrics.frustrationScore > 8) frustrationPenalty = 15;
  else if (metrics.frustrationScore > 6) frustrationPenalty = 12;
  else if (metrics.frustrationScore > 4) frustrationPenalty = 8;
  else if (metrics.frustrationScore > 2) frustrationPenalty = 4;
  
  if (frustrationPenalty > 0) {
    breakdown.push({
      category: 'Flow Disruption',  // CHANGED FROM 'Frustration Level'
      penalty: frustrationPenalty,
      reason: `${metrics.frustrationScore}/10 disruption level`  // CHANGED FROM 'frustration'
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
  
  // Admin click tracking
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

  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentScreen === 0 && !(window as any).surveyStartTime) {
      (window as any).surveyStartTime = Date.now();
    }
  }, [currentScreen]);

  const saveToDatabase = async (dataToSave: SurveyData) => {
    if (saveAttempted.current || isSaving) {
      console.log('Save already attempted or in progress');
      return { success: false, id: null };
    }
    
    setIsSaving(true);
    saveAttempted.current = true;
    
    console.log('Attempting to save survey data...');
    console.log('Current survey data:', dataToSave);
    console.log('Purchase decision data:', dataToSave.purchaseDecision);
    
    try {
      const result = await saveSurveyData(dataToSave, discountCode);
      
      if (result.success && result.id) {
        setSurveyId(result.id);
        console.log('Survey saved successfully with ID:', result.id);
        return { success: true, id: result.id };
      } else {
        console.error('Failed to save survey:', result.error);
        setError(`Error saving: ${result.error || 'Unknown issue'}`);
        saveAttempted.current = false;
        return { success: false, id: null };
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error saving data. Please try again.');
      saveAttempted.current = false;
      return { success: false, id: null };
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async (data?: any) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Create updated survey data
      let updatedSurveyData = { ...surveyData };
      
      // Update survey data with new information
      if (data) {
        if (data.exercises && data.exercises.length > 0) {
          const exercise = data.exercises[0];
          const exerciseCount = updatedSurveyData.exercises.length + 1;
          
          const updatedMetrics = {
            totalErrors: updatedSurveyData.metrics.totalErrors + (exercise.metrics.totalErrors || 0),
            languageErrors: updatedSurveyData.metrics.languageErrors + (exercise.metrics.languageErrors || 0),
            punctuationErrors: updatedSurveyData.metrics.punctuationErrors + (exercise.metrics.punctuationErrors || 0),
            deletions: updatedSurveyData.metrics.deletions + (exercise.metrics.deletions || 0),
            corrections: updatedSurveyData.metrics.corrections + (exercise.metrics.corrections || 0),
            languageSwitches: updatedSurveyData.metrics.languageSwitches + (exercise.metrics.languageSwitches || 0),
            totalMistakesMade: updatedSurveyData.metrics.totalMistakesMade + (exercise.metrics.totalMistakesMade || 0),
            finalErrors: updatedSurveyData.metrics.finalErrors + (exercise.metrics.finalErrors || 0),
            averageDelay: Math.round((updatedSurveyData.metrics.averageDelay * (exerciseCount - 1) + exercise.metrics.averageDelay) / exerciseCount),
            frustrationScore: Math.round((updatedSurveyData.metrics.frustrationScore * (exerciseCount - 1) + exercise.metrics.frustrationScore) / exerciseCount),
            accuracy: Math.round((updatedSurveyData.metrics.accuracy * (exerciseCount - 1) + exercise.metrics.accuracy) / exerciseCount),
            wpm: Math.round((updatedSurveyData.metrics.wpm * (exerciseCount - 1) + exercise.metrics.wpm) / exerciseCount)
          };
          
          updatedSurveyData = {
            ...updatedSurveyData,
            exercises: [...updatedSurveyData.exercises, exercise],
            metrics: updatedMetrics
          };
        } else {
          updatedSurveyData = {
            ...updatedSurveyData,
            ...data
          };
        }
      }
      
      // Update state with the new data
      setSurveyData(updatedSurveyData);
      
      // Save after purchase decision screen (screen 7)
      if (currentScreen === 7 && !saveAttempted.current) {
        console.log('Saving after purchase decision with data:', updatedSurveyData.purchaseDecision);
        
        // Use the updated data directly for saving
        const saveResult = await saveToDatabase(updatedSurveyData);
        if (!saveResult.success) {
          console.error('Failed to save but continuing');
          // Don't block the user from continuing even if save failed
        }
      }
      
      setCurrentScreen(prev => prev + 1);
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
    
    console.log('Admin click:', adminClickCount.current);
    
    if (adminClickTimer.current) {
      clearTimeout(adminClickTimer.current);
    }
    
    adminClickTimer.current = setTimeout(() => {
      adminClickCount.current = 0;
    }, 2000);
    
    if (adminClickCount.current >= 5) {
      console.log('Opening admin...');
      adminClickCount.current = 0;
      
      if (adminClickTimer.current) {
        clearTimeout(adminClickTimer.current);
        adminClickTimer.current = null;
      }
      
      const username = prompt('Admin Username:');
      if (username === 'Miki$123456') {
        const password = prompt('Admin Password:');
        if (password === 'Miki$123456') {
          console.log('Admin authenticated');
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
        console.log('No survey ID, attempting to save survey first...');
        const updatedData = { ...surveyData, email };
        const result = await saveToDatabase(updatedData);
        if (result.success && result.id) {
          await saveEmailSubscription(email, result.id);
        } else {
          console.error('Could not save email - no survey ID');
          setSurveyData(prev => ({ ...prev, email }));
        }
      } else {
        await saveEmailSubscription(email, surveyId);
      }
    } catch (err) {
      console.error('Error saving email:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (adminClickTimer.current) {
        clearTimeout(adminClickTimer.current);
      }
    };
  }, []);

  // Show admin dashboard if authenticated
  if (showAdmin) {
    return (
      <AdminDashboard 
        onLogout={() => { 
          setShowAdmin(false);
        }} 
      />
    );
  }

  // Error screen
  if (error && currentScreen !== screens.length - 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null);
                if (currentScreen === 7 && !saveAttempted.current) {
                  saveToDatabase(surveyData);
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null);
                setCurrentScreen(0);
                saveAttempted.current = false;
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
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

  // Share card
  if (showShareCard) {
    return <ShareCard 
      metrics={surveyData.metrics} 
      onClose={() => setShowShareCard(false)} 
      selectedLanguage={surveyData.demographics.languages?.[0] || 'Arabic-English'}
    />;
  }

  const renderScreen = () => {
    const screenName = screens[currentScreen];
    
    switch (screenName) {
      case 'welcome':
        return <WelcomeScreen onNext={handleNext} onAdminClick={handleAdminClick} />;
      
      case 'demographics':
        return <DemographicsScreen onNext={handleNext} />;
      
      case 'beforeExercise':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
              <div className="mb-6 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Ready for the Typing Exercise?</h2>
                <p className="text-gray-600">Just 1 quick exercise to understand your typing patterns</p>
              </div>
              
              <div className="space-y-4 text-lg text-gray-700">
                <p className="font-semibold">We'll measure automatically:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Typing errors and corrections</li>
                  <li>Time to find punctuation marks</li>
                  <li>How many times you delete and fix</li>
                  <li>Language switching patterns</li>
                </ul>
                
                <div className="bg-yellow-50 rounded-lg p-4 mt-6">
                  <p className="text-yellow-800 font-medium">
                    Tip: Just 1 exercise! Type naturally as you normally would - don't try to be perfect!
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleNext()}
                className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Start the Exercise
              </button>
            </div>
          </div>
        );
      
      case 'exercise1':
        return (
          <TypingExercise 
            exerciseNumber={1} 
            onComplete={handleNext}
            selectedLanguage={surveyData.demographics.languages?.[0] || 'Arabic-English'}
          />
        );
      
      case 'selfAssessment':
        return <SelfAssessment onNext={handleNext} />;
      
      case 'results':
        return <ResultsReport 
          metrics={surveyData.metrics} 
          onNext={handleNext} 
          onShare={() => {}} 
          showBreakdown={true}
        />;
      
      case 'featureRating':
        return <FeatureRating onNext={handleNext} />;
      
      case 'purchase':
        return <PurchaseDecision onNext={handleNext} />;
      
      case 'thankYou':
        return <ThankYou 
          discountCode={discountCode} 
          onShare={handleShowShareCard} 
          onEmailSubmit={handleEmailSubmit} 
        />;
      
      default:
        console.error('Unknown screen:', screenName);
        return <WelcomeScreen onNext={handleNext} onAdminClick={handleAdminClick} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
      
      {/* Progress bar */}
      {currentScreen > 0 && currentScreen < screens.length - 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-2 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">
                Step {currentScreen} of {screens.length - 1}
              </span>
              <span className="text-xs text-gray-600">
                {Math.round(((currentScreen) / (screens.length - 1)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentScreen) / (screens.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
