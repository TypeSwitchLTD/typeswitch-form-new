import React, { useState, useEffect, useMemo } from 'react';
import { getAllSurveyResponses, deleteSurveyResponses, deleteTestData } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, Target, Zap, AlertCircle, 
  Download, RefreshCw, Filter, ChevronRight, Award, Globe,
  Package, ShoppingCart, Brain, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, Briefcase, Mail, Star, ArrowDown
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

interface MarketOpportunity {
  language: string;
  score: number;
  marketSize: number;
  topFeature: string;
  mainOccupation: string;
}

interface SmartInsight {
  type: 'success' | 'warning' | 'info' | 'critical';
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionData?: any;
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

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  characteristics: string[];
  topFeatures: string[];
  emails: string[];
  score: number;
}

interface PainPoint {
  symptom: string;
  count: number;
  percentage: number;
}

interface SegmentPain {
  segment: string;
  count: number;
  avgErrors: number;
  avgWPM: number;
  topFeature: string;
  withEmail: number;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // 🔧 CHANGED: Analyze Segment by Metrics (not pain)
  const analyzeSegmentMetrics = (responses: any[]): SegmentPain[] => {
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

        const completedUsers = segmentUsers.filter(r => r.test_completed);
        
        const avgErrors = completedUsers.length > 0
          ? completedUsers.reduce((acc, r) => acc + (r.total_language_errors || 0), 0) / completedUsers.length
          : 0;

        const avgWPM = completedUsers.length > 0
          ? completedUsers.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / completedUsers.length
          : 0;
        
        // Find top feature
        const featureCounts: Record<string, number> = {};
        segmentUsers.forEach(r => {
          if (r.feature_ranking && Array.isArray(r.feature_ranking) && r.feature_ranking[0]) {
            featureCounts[r.feature_ranking[0]] = (featureCounts[r.feature_ranking[0]] || 0) + 1;
          }
        });
        
        const topFeatureKey = Object.entries(featureCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        const topFeature = featureNames[topFeatureKey] || topFeatureKey;

        return {
          segment: seg.name,
          count: segmentUsers.length,
          avgErrors: Math.round(avgErrors * 10) / 10,
          avgWPM: Math.round(avgWPM),
          topFeature,
          withEmail: segmentUsers.filter(r => r.email).length
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.count - a!.count) as SegmentPain[];
  };

  // 🔧 CHANGED: Analyze Impact with better logic
  const analyzeImpact = (responses: any[]) => {
    // Count all frustration-related symptoms
    const frustrationSymptoms = responses.filter(r => 
      r.awakening_symptoms && Array.isArray(r.awakening_symptoms) && r.awakening_symptoms.length > 0
    ).length;

    const deletionErrors = responses.filter(r => 
      r.awakening_symptoms?.includes('delete_word') || r.awakening_symptoms?.includes('delete_line')
    ).length;
    
    const avoidsMultilingual = responses.filter(r => 
      r.awakening_symptoms?.includes('avoid_multilingual')
    ).length;
    
    const searchedSolution = responses.filter(r => 
      r.awakening_symptoms?.includes('use_3rd_party')
    ).length;

    return {
      frustration: Math.round((frustrationSymptoms / responses.length) * 100),
      deletionErrors: Math.round((deletionErrors / responses.length) * 100),
      avoidsMultilingual: Math.round((avoidsMultilingual / responses.length) * 100),
      searchedSolution: Math.round((searchedSolution / responses.length) * 100)
    };
  };

  // Process all data for insights
  const processAllData = (responses: any[]) => {
    const painPoints = analyzePainPoints(responses);
    const segmentMetrics = analyzeSegmentMetrics(responses); // 🔧 CHANGED
    const impact = analyzeImpact(responses);
    const featureAnalysis = analyzeFeatures(responses);
    const roi = calculateAverageROI(responses);
    
    const completedTest = responses.filter(r => r.test_completed).length;
    const withEmail = responses.filter(r => r.email).length;

    const completedTests = responses.filter(r => r.test_completed);

    const avgWPM = completedTests.length > 0
      ? completedTests.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / completedTests.length
      : 0;

    const avgDeletions = completedTests.length > 0
      ? completedTests.reduce((acc, r) => acc + (r.total_deletions || 0), 0) / completedTests.length
      : 0;

    const avgLanguageErrors = completedTests.length > 0
      ? completedTests.reduce((acc, r) => acc + (r.total_language_errors || 0), 0) / completedTests.length
      : 0;

    return {
      raw: responses,
      total: responses.length,
      completedTest,
      completedTestRate: Math.round((completedTest / responses.length) * 100),
      withEmail,
      emailRate: Math.round((withEmail / responses.length) * 100),
      avgWPM: Math.round(avgWPM),
      avgDeletions: Math.round(avgDeletions * 10) / 10, // 🆕 NEW
      avgLanguageErrors: Math.round(avgLanguageErrors * 10) / 10,
      painPoints,
      segmentMetrics, // 🔧 CHANGED
      impact,
      featureAnalysis,
      roi
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

    const totalRankings = responses.filter(r => r.feature_ranking && Array.isArray(r.feature_ranking)).length;
    
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
          
          {/* EXECUTIVE SUMMARY */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-10 h-10 mr-3" />
              Market Validation Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Validated Users</p>
                <p className="text-5xl font-bold">{data?.total || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">Survey completions proving demand</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Test Completion</p>
                <p className="text-5xl font-bold">{data?.completedTestRate || 0}%</p>
                <p className="text-indigo-200 text-sm mt-2">{data?.completedTest || 0} users proved the problem</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Language Errors</p>
                <p className="text-5xl font-bold">{data?.avgLanguageErrors || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">Average per 5-minute test</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Productivity Loss</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold">{data?.roi?.dailyMinutes || 0}</p>
                  <span className="text-lg">min/day</span>
                </div>
                <p className="text-indigo-200 text-sm mt-2">
                  {data?.roi?.yearlyHours || 0} hours wasted annually
                </p>
              </div>
            </div>
          </div>

          {/* 🔧 CHANGED: Typing Performance Data */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-9 h-9 mr-3 text-blue-600" />
              Typing Performance Data
            </h2>
            <p className="text-gray-600 mb-8">
              Real metrics from {data?.completedTest || 0} users who completed the typing challenge:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <p className="text-5xl font-bold text-blue-600 mb-2">{data?.avgWPM || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Average WPM</p>
                <div className="flex items-center justify-center mt-2 text-xs text-red-600">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  <span>Global avg: 40 WPM</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <p className="text-5xl font-bold text-purple-600 mb-2">{data?.avgDeletions || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Average Deletions</p>
                <p className="text-xs text-gray-500 mt-2">Backspace presses per test</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <p className="text-5xl font-bold text-red-600 mb-2">{data?.avgLanguageErrors || 0}</p>
                <p className="text-sm font-semibold text-gray-700">Language Errors</p>
                <p className="text-xs text-gray-500 mt-2">Average per 5-minute test</p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insight</h3>
              <p className="text-gray-700 leading-relaxed">
                Users type at <strong className="text-blue-600">{data?.avgWPM || 0} WPM</strong> (below the 40 WPM global average), 
                make <strong className="text-purple-600">{data?.avgDeletions || 0} deletions</strong>, and experience{' '}
                <strong className="text-red-600">{data?.avgLanguageErrors || 0} language-switching errors</strong> in just 5 minutes.
                This proves language switching is a <strong>distinct, measurable problem</strong> separate from general typing skills.
              </p>
            </div>
          </div>

          {/* PAIN POINTS */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-9 h-9 mr-3 text-red-600" />
              TOP 10 Validated Pain Points
            </h2>
            <p className="text-gray-600 mb-8">Real user frustrations when switching languages while typing:</p>
            
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
                      <p className="text-sm text-gray-500">{pain.count} users affected</p>
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

          {/* 🔧 CHANGED: Target Segments by Metrics */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-9 h-9 mr-3 text-purple-600" />
              User Segments Analysis
            </h2>
            <p className="text-gray-600 mb-8">Performance metrics and preferences by user segment:</p>
            
            <div className="space-y-5">
              {data?.segmentMetrics?.map((seg: SegmentPain, index: number) => (
                <div key={index} className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{seg.segment}</h3>
                      <p className="text-sm text-gray-600">{seg.count} users · {seg.withEmail} emails collected</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-red-600">{seg.avgErrors}</p>
                      <p className="text-xs text-gray-600 mt-1">Avg Errors</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{seg.avgWPM}</p>
                      <p className="text-xs text-gray-600 mt-1">Avg WPM</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm font-bold text-green-700">{seg.topFeature}</p>
                      <p className="text-xs text-gray-600 mt-1">Top Feature</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔧 CHANGED: Business Impact */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-9 h-9 mr-3 text-yellow-600" />
              Business Impact
            </h2>
            <p className="text-gray-600 mb-8">How language-switching errors affect professional work:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-6xl font-bold text-red-600 mb-2">{data?.impact?.frustration || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Experience Frustration</p>
                <p className="text-sm text-gray-600">Report at least one frustration symptom</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-orange-600" />
                </div>
                <p className="text-6xl font-bold text-orange-600 mb-2">{data?.impact?.deletionErrors || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Delete Words/Lines</p>
                <p className="text-sm text-gray-600">Must delete due to wrong language</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-6xl font-bold text-purple-600 mb-2">{data?.impact?.avoidsMultilingual || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Avoidance Behavior</p>
                <p className="text-sm text-gray-600">Skip multilingual tasks entirely</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-6xl font-bold text-blue-600 mb-2">{data?.impact?.searchedSolution || 0}%</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">Active Solution Seekers</p>
                <p className="text-sm text-gray-600">Already looking for alternatives</p>
              </div>
            </div>
          </div>

          {/* 🔧 CHANGED: Feature Validation - ALL features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-9 h-9 mr-3 text-green-600" />
              Product-Market Fit: Feature Validation
            </h2>
            <p className="text-gray-600 mb-8">Features users ranked as #1 priority (solution validation):</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data?.featureAnalysis?.map((feature: FeatureDemand, index: number) => (
                <div key={feature.feature} className="border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{feature.displayName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-13">Top choice by users</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-4xl font-bold text-green-600">{feature.topChoicePercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.max(feature.topChoicePercent, 2)}%` }}
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
              Investment Highlights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <Mail className="w-12 h-12 mb-3 text-blue-200" />
                <p className="text-4xl font-bold mb-2">{data?.emailRate || 0}%</p>
                <p className="text-blue-100">Lead Conversion</p>
                <p className="text-sm text-blue-200 mt-2">{data?.withEmail || 0} qualified sales leads</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <Activity className="w-12 h-12 mb-3 text-purple-200" />
                <p className="text-4xl font-bold mb-2">{data?.avgLanguageErrors || 0}</p>
                <p className="text-purple-100">Errors per 5-Min Test</p>
                <p className="text-sm text-purple-200 mt-2">Quantifiable problem proof</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <TrendingUp className="w-12 h-12 mb-3 text-green-200" />
                <p className="text-4xl font-bold mb-2">{data?.avgWPM || 0}</p>
                <p className="text-green-100">Average WPM</p>
                <p className="text-sm text-green-200 mt-2">Professional users validated</p>
              </div>
            </div>

            <div className="border-t border-white border-opacity-20 pt-6">
              <h3 className="text-2xl font-bold mb-4">Why Invest in TypeSwitch?</h3>
              <p className="text-lg text-blue-50 leading-relaxed">
                <strong className="text-white">Market Validation Complete:</strong> {data?.total || 0} users proved the problem exists, 
                with {data?.completedTest || 0} completing real typing challenges showing {data?.avgLanguageErrors || 0} errors per test. 
                Users waste <strong className="text-white">{data?.roi?.yearlyHours || 0} hours annually</strong> on preventable errors. 
                {data?.emailRate || 0}% conversion to sales leads demonstrates strong buyer intent. 
                Top-requested features ({data?.featureAnalysis?.[0]?.displayName || 'N/A'}, {data?.featureAnalysis?.[1]?.displayName || 'N/A'}) 
                align with our core product, confirming product-market fit in the $5B global keyboard market.
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
