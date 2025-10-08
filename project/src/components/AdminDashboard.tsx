import React, { useState, useEffect } from 'react';
import { getAllSurveyResponses } from '../lib/supabase';
import { 
  TrendingUp, Users, Target, Zap, AlertCircle, 
  Download, RefreshCw, 
  Package, Brain, Clock, CheckCircle, XCircle,
  Activity, Mail, Star, DollarSign, Calculator
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

interface PainPoint {
  symptom: string;
  count: number;
  percentage: number;
}

interface SegmentPain {
  segment: string;
  avgScore: number;
  count: number;
  topPain: string;
}

interface FeatureDemand {
  feature: string;
  displayName: string;
  avgRating: number;
  topChoicePercent: number;
  correlatedFeatures: string[];
  impactScore: number;
  implementationDifficulty: number;
}

// 🆕 NEW INTERFACE
interface TypingMetrics {
  avgWPM: number;
  avgAccuracy: number;
  avgLanguageErrors: number;
  avgPunctuationErrors: number;
  avgDeletions: number;
  avgCorrections: number;
  avgScore: number;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // 🆕 NEW STATE for ROI Calculator
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [monetaryROI, setMonetaryROI] = useState<any>(null);

  // Feature display names mapping
  const featureNames: Record<string, string> = {
    mechanical: 'Mechanical Keyboard',
    physicalSwitch: 'Physical Language Switch',
    autoDetection: 'Auto Language Detection',
    dynamicLight: 'Dynamic Backlighting',
    wireless: 'Wireless Connectivity',
    mic: 'Built-in Microphone',
    wristRest: 'Ergonomic Wrist Rest',
    programmableKeys: 'Programmable Keys',
    rotaryKnob: 'Rotary Knob',
    visualDisplay: 'Visual Display'
  };

  // Load and process data
  useEffect(() => {
    loadData();
    if (autoRefresh) {
      const interval = setInterval(loadData, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllSurveyResponses();

      if (result.error) throw result.error;

      const responses = result.data || [];
      const processed = processAllData(responses);
      setData(processed);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  // 🆕 NEW FUNCTION - Calculate Monetary ROI
  const calculateMonetaryROI = (salary: number, yearlyHours: number) => {
    const hourlyRate = salary / 22 / 8;
    const yearlyLoss = yearlyHours * hourlyRate;
    const monthlyLoss = yearlyLoss / 12;
    const dailyLoss = monthlyLoss / 22;

    return {
      hourlyRate: Math.round(hourlyRate),
      dailyLoss: Math.round(dailyLoss),
      monthlyLoss: Math.round(monthlyLoss),
      yearlyLoss: Math.round(yearlyLoss)
    };
  };

  // 🆕 NEW FUNCTION - Handle ROI Calculation
  const handleCalculateROI = () => {
    const salary = parseFloat(monthlySalary);
    if (isNaN(salary) || salary <= 0 || !data?.roi?.yearlyHours) {
      setMonetaryROI(null);
      return;
    }

    const result = calculateMonetaryROI(salary, data.roi.yearlyHours);
    setMonetaryROI(result);
  };

  // Calculate ROI - Time Wasted
  const calculateAverageROI = (responses: any[]) => {
    const completedTests = responses.filter(r => r.test_completed);
    if (completedTests.length === 0) return { dailyMinutes: 0, monthlyHours: 0, yearlyHours: 0 };

    const totalWasted = completedTests.reduce((acc, r) => {
      const wastedSeconds = (r.total_language_errors || 0) * 3 + 
                           (r.total_deletions || 0) * 1 + 
                           (r.total_corrections || 0) * 2;
      return acc + wastedSeconds;
    }, 0);

    const avgWastedSeconds = totalWasted / completedTests.length;
    const testMinutes = 5;
    const wastedPerMinute = avgWastedSeconds / testMinutes;
    const dailyMinutes = (wastedPerMinute * 90) / 60;
    const monthlyHours = (dailyMinutes * 22) / 60;
    const yearlyHours = monthlyHours * 12;

    return {
      dailyMinutes: Math.round(dailyMinutes * 10) / 10,
      monthlyHours: Math.round(monthlyHours * 10) / 10,
      yearlyHours: Math.round(yearlyHours)
    };
  };

  // 🆕 NEW FUNCTION - Analyze Typing Metrics
  const analyzeTypingMetrics = (responses: any[]): TypingMetrics => {
    const completedTests = responses.filter(r => r.test_completed);
    if (completedTests.length === 0) {
      return {
        avgWPM: 0,
        avgAccuracy: 0,
        avgLanguageErrors: 0,
        avgPunctuationErrors: 0,
        avgDeletions: 0,
        avgCorrections: 0,
        avgScore: 0
      };
    }

    const totals = completedTests.reduce((acc, r) => ({
      wpm: acc.wpm + (r.total_wpm || 0),
      accuracy: acc.accuracy + (r.total_accuracy || 0),
      languageErrors: acc.languageErrors + (r.total_language_errors || 0),
      punctuationErrors: acc.punctuationErrors + (r.total_punctuation_errors || 0),
      deletions: acc.deletions + (r.total_deletions || 0),
      corrections: acc.corrections + (r.total_corrections || 0),
      score: acc.score + (r.overall_score || 0)
    }), { wpm: 0, accuracy: 0, languageErrors: 0, punctuationErrors: 0, deletions: 0, corrections: 0, score: 0 });

    const count = completedTests.length;

    return {
      avgWPM: Math.round(totals.wpm / count),
      avgAccuracy: Math.round((totals.accuracy / count) * 10) / 10,
      avgLanguageErrors: Math.round((totals.languageErrors / count) * 10) / 10,
      avgPunctuationErrors: Math.round((totals.punctuationErrors / count) * 10) / 10,
      avgDeletions: Math.round((totals.deletions / count) * 10) / 10,
      avgCorrections: Math.round((totals.corrections / count) * 10) / 10,
      avgScore: Math.round(totals.score / count)
    };
  };

  // Analyze Pain Points
  const analyzePainPoints = (responses: any[]): PainPoint[] => {
    const painCounts: Record<string, number> = {};
    
    responses.forEach(r => {
      if (r.awakening_symptoms && Array.isArray(r.awakening_symptoms)) {
        r.awakening_symptoms.forEach((symptom: string) => {
          painCounts[symptom] = (painCounts[symptom] || 0) + 1;
        });
      }
    });

    const symptomNames: Record<string, string> = {
      'glance_icon': 'Check language icon constantly',
      'extra_shortcut': 'Press Alt+Shift multiple times',
      'type_and_check': 'Type and pause to verify language',
      'delete_word': 'Delete entire words in wrong language',
      'wrong_punctuation': 'Punctuation errors due to language',
      'sent_wrong_lang': 'Send messages in wrong language',
      'delete_line': 'Delete full lines/multiple words',
      'go_back_fix': 'Go back to fix language errors',
      'caps_lock_error': 'Accidental Caps Lock issues',
      'mental_effort': 'Mental effort to remember language',
      'shortcut_conflict': 'Avoid certain shortcuts',
      'use_3rd_party': 'Search for external solutions',
      'avoid_multilingual': 'Avoid multilingual documents',
      'use_separate_apps': 'Use separate apps per language',
      'self_talk': 'Talk to self about language',
      'shortcut_memory': 'Forget shortcuts due to overload'
    };

    return Object.entries(painCounts)
      .map(([symptom, count]) => ({
        symptom: symptomNames[symptom] || symptom,
        count,
        percentage: Math.round((count / responses.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Analyze Segment Pain
  const analyzeSegmentPain = (responses: any[]): SegmentPain[] => {
    const segments = [
      { id: 'adhd', filter: (r: any) => r.diagnosis?.includes('adhd'), name: 'ADHD Users' },
      { id: 'translation', filter: (r: any) => r.occupation === 'translation', name: 'Translators' },
      { id: 'tech', filter: (r: any) => r.occupation === 'tech', name: 'Tech Workers' },
      { id: 'power', filter: (r: any) => r.hours_typing === '5-8' || r.hours_typing === '8+', name: 'Power Users (5-8h)' },
      { id: 'hebrew', filter: (r: any) => r.languages?.includes('Hebrew-English'), name: 'Hebrew-English' }
    ];

    return segments
      .map(seg => {
        const segmentUsers = responses.filter(seg.filter);
        if (segmentUsers.length === 0) return null;

        // 🔧 FIX: Only calculate from users who completed the test
        const completedUsers = segmentUsers.filter(r => r.test_completed);
        const avgScore = completedUsers.length > 0
          ? completedUsers.reduce((acc, r) => acc + (r.overall_score || 0), 0) / completedUsers.length
          : 0;
        
        const painCounts: Record<string, number> = {};
        segmentUsers.forEach(r => {
          if (r.awakening_symptoms) {
            r.awakening_symptoms.forEach((s: string) => {
              painCounts[s] = (painCounts[s] || 0) + 1;
            });
          }
        });
        
        const topPain = Object.entries(painCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        return {
          segment: seg.name,
          avgScore: Math.round(avgScore),
          count: segmentUsers.length,
          topPain
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.avgScore - a!.avgScore) as SegmentPain[];
  };

  // Analyze Impact
  const analyzeImpact = (responses: any[]) => {
    const breaksConcentration = responses.filter(r => 
      r.flow_breaker_impact === 'breaks_concentration'
    ).length;
    
    const unprofessional = responses.filter(r => 
      r.professional_image_impact === 'unprofessional'
    ).length;
    
    const avoidsMultilingual = responses.filter(r => 
      r.awakening_symptoms?.includes('avoid_multilingual')
    ).length;
    
    const searchedSolution = responses.filter(r => 
      r.awakening_symptoms?.includes('use_3rd_party')
    ).length;

    return {
      breaksConcentration: Math.round((breaksConcentration / responses.length) * 100),
      unprofessional: Math.round((unprofessional / responses.length) * 100),
      avoidsMultilingual: Math.round((avoidsMultilingual / responses.length) * 100),
      searchedSolution: Math.round((searchedSolution / responses.length) * 100)
    };
  };

  // Process all data for insights
  const processAllData = (responses: any[]) => {
    const painPoints = analyzePainPoints(responses);
    const segmentPain = analyzeSegmentPain(responses);
    const impact = analyzeImpact(responses);
    const featureAnalysis = analyzeFeatures(responses);
    const roi = calculateAverageROI(responses);
    const typingMetrics = analyzeTypingMetrics(responses); // 🆕 NEW
    
    const completedTest = responses.filter(r => r.test_completed).length;
    const withEmail = responses.filter(r => r.email).length;

    // 🔧 FIX: Calculate avgScore only from completed tests
    const completedTests = responses.filter(r => r.test_completed);
    const avgScore = completedTests.length > 0
      ? completedTests.reduce((acc, r) => acc + (r.overall_score || 0), 0) / completedTests.length
      : 0;

    return {
      raw: responses,
      total: responses.length,
      completedTest,
      completedTestRate: Math.round((completedTest / responses.length) * 100),
      withEmail,
      emailRate: Math.round((withEmail / responses.length) * 100),
      avgScore: Math.round(avgScore), // 🔧 FIXED
      avgWPM: completedTests.length > 0 ? Math.round(completedTests.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / completedTests.length) : 0,
      avgLanguageErrors: completedTests.length > 0 ? Math.round((completedTests.reduce((acc, r) => acc + (r.total_language_errors || 0), 0) / completedTests.length) * 10) / 10 : 0,
      painPoints,
      segmentPain,
      impact,
      featureAnalysis,
      roi,
      typingMetrics // 🆕 NEW
    };
  };

  // Analyze Features
  const analyzeFeatures = (responses: any[]): FeatureDemand[] => {
    const features: Record<string, FeatureDemand> = {};
    
    Object.keys(featureNames).forEach(feature => {
      features[feature] = {
        feature,
        displayName: featureNames[feature],
        avgRating: 0,
        topChoicePercent: 0,
        correlatedFeatures: [],
        impactScore: 0,
        implementationDifficulty: 5
      };
    });

    const totalRankings = responses.filter(r => r.feature_ranking).length;
    
    if (totalRankings > 0) {
      responses.forEach(r => {
        if (r.feature_ranking && Array.isArray(r.feature_ranking)) {
          r.feature_ranking.forEach((feature: string, index: number) => {
            if (features[feature]) {
              features[feature].avgRating += (5 - index);
              if (index === 0) features[feature].topChoicePercent++;
            }
          });
        }
      });

      Object.values(features).forEach(f => {
        f.avgRating = f.avgRating / totalRankings;
        f.topChoicePercent = (f.topChoicePercent / totalRankings) * 100;
        f.impactScore = (f.avgRating * 0.4 + (f.topChoicePercent / 20) * 0.6) * 20;
      });
    }

    return Object.values(features).sort((a, b) => b.topChoicePercent - a.topChoicePercent);
  };

  // Export Functions
  const exportToCSV = (dataset: string = 'all') => {
    if (!data?.raw) return;
    
    let exportData = data.raw;
    let filename = 'typeswitch-export';
    
    if (dataset === 'emails') {
      exportData = data.raw.filter((r: any) => r.email);
      filename = 'typeswitch-email-list';
    }
    
    const headers = [
      'Date', 'Email', 'Languages', 'Occupation', 'Age', 'Score', 
      'WPM', 'Accuracy', 'Diagnosis'
    ];
    
    const rows = exportData.map((r: any) => [
      new Date(r.created_at).toLocaleDateString(),
      r.email || '',
      (r.languages || []).join(';'),
      r.occupation || '',
      r.age || '',
      r.overall_score || 0,
      r.total_wpm || 0,
      r.total_accuracy || 0,
      (r.diagnosis || []).join(';')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Investor Dashboard...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white">TypeSwitch Investor Dashboard</h1>
              <div className="flex items-center text-sm text-blue-100">
                <Clock className="w-4 h-4 mr-1" />
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          
          {/* EXECUTIVE SUMMARY BANNER */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-10 h-10 mr-3" />
              Executive Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Total Respondents</p>
                <p className="text-5xl font-bold">{data?.total || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">Survey Participants</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Completed Test</p>
                <p className="text-5xl font-bold">{data?.completedTestRate || 0}%</p>
                <p className="text-indigo-200 text-sm mt-2">{data?.completedTest || 0} users finished typing challenge</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Average Score</p>
                <p className="text-5xl font-bold">{data?.avgScore || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">Out of 100 (Pain Severity)</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Time Wasted</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold">{data?.roi?.dailyMinutes || 0}</p>
                  <span className="text-lg">min/day</span>
                </div>
                <p className="text-indigo-200 text-sm mt-2">
                  {data?.roi?.monthlyHours || 0}h/month · {data?.roi?.yearlyHours || 0}h/year
                </p>
              </div>
            </div>
          </div>

          {/* 🆕 TYPING CHALLENGE ANALYSIS */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-9 h-9 mr-3 text-blue-600" />
              Typing Challenge Analysis
            </h2>
            <p className="text-gray-600 mb-8">
              Detailed metrics from {data?.completedTest || 0} users who completed the 5-minute typing challenge:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <p className="text-4xl font-bold text-blue-600 mb-2">{data?.typingMetrics?.avgWPM || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Average WPM</p>
                <p className="text-xs text-gray-500 mt-1">Words per minute</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p className="text-4xl font-bold text-green-600 mb-2">{data?.typingMetrics?.avgAccuracy || 0}%</p>
                <p className="text-sm font-semibold text-gray-700">Average Accuracy</p>
                <p className="text-xs text-gray-500 mt-1">Overall precision</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <p className="text-4xl font-bold text-red-600 mb-2">{data?.typingMetrics?.avgLanguageErrors || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Language Errors</p>
                <p className="text-xs text-gray-500 mt-1">Per test (avg)</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-orange-600" />
                <p className="text-4xl font-bold text-orange-600 mb-2">{data?.typingMetrics?.avgPunctuationErrors || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Punctuation Errors</p>
                <p className="text-xs text-gray-500 mt-1">Per test (avg)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Deletions (Backspace)</span>
                  <span className="text-2xl font-bold text-purple-600">{data?.typingMetrics?.avgDeletions || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((data?.typingMetrics?.avgDeletions || 0) / 50 * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Corrections Made</span>
                  <span className="text-2xl font-bold text-indigo-600">{data?.typingMetrics?.avgCorrections || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((data?.typingMetrics?.avgCorrections || 0) / 30 * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Pain Score</span>
                  <span className="text-2xl font-bold text-red-600">{data?.typingMetrics?.avgScore || 0}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${data?.typingMetrics?.avgScore || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insight</h3>
              <p className="text-gray-700 leading-relaxed">
                Users make <strong className="text-red-600">{data?.typingMetrics?.avgLanguageErrors || 0} language errors</strong> on average 
                compared to <strong className="text-orange-600">{data?.typingMetrics?.avgPunctuationErrors || 0} punctuation errors</strong> in 
                just 5 minutes of typing. This demonstrates that <strong>language switching is a significantly bigger problem than general typing accuracy</strong>, 
                validating the core pain point TypeSwitch solves.
              </p>
            </div>
          </div>

          {/* 🆕 INTERACTIVE ROI CALCULATOR */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-9 h-9 mr-3 text-green-600" />
              ROI Calculator
            </h2>
            <p className="text-gray-600 mb-8">
              Calculate the annual financial cost of language-switching errors for your employees:
            </p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Enter Monthly Salary (₪):
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      placeholder="e.g., 15000"
                      className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg text-lg font-semibold focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={handleCalculateROI}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition flex items-center"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Based on {data?.roi?.yearlyHours || 0} hours wasted per year</p>
                </div>

                {monetaryROI && (
                  <div className="bg-white rounded-xl p-6 border-2 border-green-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Annual Cost Breakdown:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Hourly Rate:</span>
                        <span className="text-lg font-bold text-green-600">₪{monetaryROI.hourlyRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Daily Loss:</span>
                        <span className="text-lg font-bold text-orange-600">₪{monetaryROI.dailyLoss.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monthly Loss:</span>
                        <span className="text-lg font-bold text-red-600">₪{monetaryROI.monthlyLoss.toLocaleString()}</span>
                      </div>
                      <div className="border-t-2 border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-gray-900">Yearly Loss:</span>
                          <span className="text-3xl font-bold text-red-600">₪{monetaryROI.yearlyLoss.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!monetaryROI && (
                <div className="mt-6 text-center">
                  <p className="text-gray-500 italic">Enter a monthly salary above to calculate the financial impact</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How is this calculated?</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Based on our typing challenge results, users waste an average of <strong>{data?.roi?.yearlyHours || 0} hours per year</strong> on 
                language-switching errors. We calculate hourly rate as: Monthly Salary ÷ 22 working days ÷ 8 hours = Hourly Rate. 
                Then multiply by the hours wasted to get the annual financial cost.
              </p>
            </div>
          </div>

          {/* PAIN POINTS ANALYSIS */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-9 h-9 mr-3 text-red-600" />
              TOP 10 Pain Points
            </h2>
            <p className="text-gray-600 mb-8">What users actually experience when typing in multiple languages:</p>
            
            <div className="grid gap-4">
              {data?.painPoints?.map((pain: PainPoint, index: number) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white font-bold text-xl w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{pain.symptom}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-red-600">{pain.percentage}%</p>
                      <p className="text-sm text-gray-500">{pain.count} users</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-600 h-3 rounded-full transition-all"
                      style={{ width: `${pain.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WHO SUFFERS MOST */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-9 h-9 mr-3 text-purple-600" />
              Who Suffers Most?
            </h2>
            <p className="text-gray-600 mb-8">Average pain score by user segment (higher = more severe pain):</p>
            
            <div className="space-y-5">
              {data?.segmentPain?.map((seg: SegmentPain, index: number) => (
                <div key={index} className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{seg.segment}</h3>
                      <p className="text-sm text-gray-600">{seg.count} users in this segment</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${
                        seg.avgScore >= 75 ? 'text-red-600' : 
                        seg.avgScore >= 60 ? 'text-orange-600' : 
                        'text-yellow-600'
                      }`}>
                        {seg.avgScore}
                      </div>
                      <p className="text-sm text-gray-500">Pain Score</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        seg.avgScore >= 75 ? 'bg-gradient-to-r from-red-600 to-pink-600' : 
                        seg.avgScore >= 60 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 
                        'bg-gradient-to-r from-yellow-500 to-orange-500'
                      }`}
                      style={{ width: `${seg.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IMPACT ON USERS */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-9 h-9 mr-3 text-yellow-600" />
              The Real Impact
            </h2>
            <p className="text-gray-600 mb-8">How multilingual typing issues affect users' work and professional image:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-6xl font-bold text-red-600 mb-2">{data?.impact?.breaksConcentration || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Breaks Concentration</p>
                <p className="text-sm text-gray-600">Report that language errors disrupt their flow</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-orange-600" />
                </div>
                <p className="text-6xl font-bold text-orange-600 mb-2">{data?.impact?.unprofessional || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Looks Unprofessional</p>
                <p className="text-sm text-gray-600">Feel it damages their professional image</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-6xl font-bold text-purple-600 mb-2">{data?.impact?.avoidsMultilingual || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Avoid Complex Docs</p>
                <p className="text-sm text-gray-600">Sometimes avoid multilingual writing</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-6xl font-bold text-blue-600 mb-2">{data?.impact?.searchedSolution || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Searched for Solution</p>
                <p className="text-sm text-gray-600">Actively looked for external tools/software</p>
              </div>
            </div>
          </div>

          {/* FEATURE DEMAND */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-9 h-9 mr-3 text-green-600" />
              What Do They Want?
            </h2>
            <p className="text-gray-600 mb-8">Top features ranked #1 by users (solution validation):</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data?.featureAnalysis?.slice(0, 6).map((feature: FeatureDemand, index: number) => (
                <div key={feature.feature} className="border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{feature.displayName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-13">Ranked #1 by users</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-4xl font-bold text-green-600">{feature.topChoicePercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${feature.topChoicePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MARKET VALIDATION */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <CheckCircle className="w-10 h-10 mr-3" />
              Market Validation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <Mail className="w-12 h-12 mb-3 text-blue-200" />
                <p className="text-4xl font-bold mb-2">{data?.emailRate || 0}%</p>
                <p className="text-blue-100">Email Collection Rate</p>
                <p className="text-sm text-blue-200 mt-2">{data?.withEmail || 0} qualified leads</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <Activity className="w-12 h-12 mb-3 text-purple-200" />
                <p className="text-4xl font-bold mb-2">{data?.typingMetrics?.avgLanguageErrors || 0}</p>
                <p className="text-purple-100">Avg Language Errors</p>
                <p className="text-sm text-purple-200 mt-2">In 5-minute typing test</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <TrendingUp className="w-12 h-12 mb-3 text-green-200" />
                <p className="text-4xl font-bold mb-2">{data?.typingMetrics?.avgWPM || 0}</p>
                <p className="text-green-100">Average WPM</p>
                <p className="text-sm text-green-200 mt-2">User typing speed</p>
              </div>
            </div>

            <div className="border-t border-white border-opacity-20 pt-6">
              <h3 className="text-2xl font-bold mb-4">Investment Thesis</h3>
              <p className="text-lg text-blue-50 leading-relaxed">
                <strong className="text-white">Bottom Line:</strong> With {data?.total || 0} validated users, {data?.completedTest || 0} completing the typing challenge with an average pain score of {data?.avgScore || 0}/100, 
                and {data?.emailRate || 0}% voluntarily providing contact information, TypeSwitch has demonstrated clear product-market fit. 
                Users waste an average of <strong className="text-white">{data?.roi?.yearlyHours || 0} hours per year</strong> on language-switching errors, 
                representing a quantifiable productivity loss that TypeSwitch directly addresses. 
                The top-requested features ({data?.featureAnalysis?.[0]?.displayName || 'N/A'}, {data?.featureAnalysis?.[1]?.displayName || 'N/A'}) align perfectly with our product roadmap.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => exportToCSV('emails')}
                className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold shadow-lg transition"
              >
                <Download className="w-5 h-5 mr-2" />
                Export Lead List
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
