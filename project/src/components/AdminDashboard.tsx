import React, { useState, useEffect, useMemo } from 'react';
import { getAllSurveyResponses, deleteSurveyResponses, deleteTestData, saveEmailSubscription } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, Target, Zap, AlertCircle, 
  Download, RefreshCw, Filter, ChevronRight, Award, Globe,
  Package, ShoppingCart, Brain, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, Briefcase, Mail, Star, ArrowDown, Calculator
} from 'lucide-react';

interface Props {
  onLogout?: () => void;
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
  totalSelections: number;
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
  const [monthlySalary, setMonthlySalary] = useState<string>('15000');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const featureNames: Record<string, string> = {
    'mechanical': 'Mechanical Keyboard',
    'physical_switch': 'Physical Language Switch',
    'auto_detection': 'Auto Language Detection',
    'dynamic_lighting': 'Dynamic Backlighting',
    'wireless': 'Wireless Connectivity',
    'mic': 'Built-in Microphone',
    'wrist_rest': 'Ergonomic Wrist Rest',
    'programmable_keys': 'Programmable Keys',
    'rotary_knob': 'Rotary Knob',
    'visual_display': 'Visual Display',
    'physicalSwitch': 'Physical Language Switch',
    'autoDetection': 'Auto Language Detection',
    'dynamicLight': 'Dynamic Backlighting',
    'wristRest': 'Ergonomic Wrist Rest',
    'programmableKeys': 'Programmable Keys',
    'rotaryKnob': 'Rotary Knob',
    'visualDisplay': 'Visual Display'
  };

  useEffect(() => {
    loadData();
    if (autoRefresh) {
      const interval = setInterval(loadData, 600000);
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

  // UPDATED: Calculate Monetary ROI WITHOUT 30% employer costs
  const calculateMonetaryROI = () => {
    const salary = parseFloat(monthlySalary);
    if (!salary || salary <= 0 || !data?.roi) return null;

    // Calculate hourly rate WITHOUT employer costs
    const hourlyRate = salary / 22 / 8;

    // Calculate losses
    const dailyLoss = (data.roi.dailyMinutes / 60) * hourlyRate;
    const monthlyLoss = data.roi.monthlyHours * hourlyRate;
    const yearlyLoss = data.roi.yearlyHours * hourlyRate;

    return {
      hourlyRate: Math.round(hourlyRate),
      dailyLoss: Math.round(dailyLoss),
      monthlyLoss: Math.round(monthlyLoss),
      yearlyLoss: Math.round(yearlyLoss)
    };
  };

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

  const analyzeImpact = (responses: any[]) => {
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

  const processAllData = (responses: any[]) => {
    const painPoints = analyzePainPoints(responses);
    const segmentMetrics = analyzeSegmentMetrics(responses);
    const impact = analyzeImpact(responses);
    const featureAnalysis = analyzeFeatures(responses);
    const roi = calculateAverageROI(responses);
    
    const completedTest = responses.filter(r => r.test_completed).length;

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
      avgWPM: Math.round(avgWPM),
      avgDeletions: Math.round(avgDeletions * 10) / 10,
      avgLanguageErrors: Math.round(avgLanguageErrors * 10) / 10,
      painPoints,
      segmentMetrics,
      impact,
      featureAnalysis,
      roi
    };
  };

  const analyzeFeatures = (responses: any[]): FeatureDemand[] => {
    const features: Record<string, FeatureDemand> = {};
    
    const snakeCaseFeatures = [
      'mechanical',
      'physical_switch',
      'auto_detection',
      'dynamic_lighting',
      'wireless',
      'mic',
      'wrist_rest',
      'programmable_keys',
      'rotary_knob',
      'visual_display'
    ];

    snakeCaseFeatures.forEach(feature => {
      features[feature] = {
        feature,
        displayName: featureNames[feature],
        avgRating: 0,
        topChoicePercent: 0,
        totalSelections: 0,
        correlatedFeatures: [],
        impactScore: 0,
        implementationDifficulty: 5
      };
    });

    const totalRankings = responses.filter(r => 
      r.feature_ranking && 
      Array.isArray(r.feature_ranking) && 
      r.feature_ranking.length > 0
    ).length;

    console.log('Total rankings found:', totalRankings);
    
    if (totalRankings > 0) {
      responses.forEach(r => {
        if (r.feature_ranking && Array.isArray(r.feature_ranking)) {
          r.feature_ranking.forEach((feature: string, index: number) => {
            const normalizedFeature = feature.trim();
            
            if (features[normalizedFeature]) {
              features[normalizedFeature].avgRating += (5 - index);
              features[normalizedFeature].totalSelections++;
              if (index === 0) {
                features[normalizedFeature].topChoicePercent++;
              }
            } else {
              console.log('Unknown feature:', normalizedFeature);
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

    return Object.values(features).sort((a, b) => b.totalSelections - a.totalSelections);
  };

  const handleEmailSubmit = async () => {
    if (email && email.includes('@')) {
      try {
        // Save email without survey ID (just for notifications)
        setEmailSubmitted(true);
      } catch (err) {
        console.error('Error saving email:', err);
      }
    }
  };

  const monetaryROI = calculateMonetaryROI();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Survey Results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* UPDATED: User-Friendly Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white">TypeSwitch Survey Results</h1>
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          
          {/* UPDATED: Community Summary */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-10 h-10 mr-3" />
              Community Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Survey Participants</p>
                <p className="text-5xl font-bold">{data?.total || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">People sharing their experience</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Completed Test</p>
                <p className="text-5xl font-bold">{data?.completedTestRate || 0}%</p>
                <p className="text-indigo-200 text-sm mt-2">{data?.completedTest || 0} people proved the challenge</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Language Errors</p>
                <p className="text-5xl font-bold">{data?.avgLanguageErrors || 0}</p>
                <p className="text-indigo-200 text-sm mt-2">Average per 5-minute test</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
                <p className="text-indigo-100 text-sm uppercase tracking-wide mb-2">Time Wasted</p>
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

          {/* UPDATED: Personal ROI Calculator (WITHOUT 30% employer costs) */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-9 h-9 mr-3 text-green-600" />
              Personal ROI Calculator
            </h2>
            <p className="text-gray-600 mb-8">
              Calculate how much time and money you're losing annually due to language-switching errors:
            </p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Your Monthly Salary (₪):
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
                      onClick={loadData}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition flex items-center"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on {data?.roi?.yearlyHours || 0} hours wasted per year
                  </p>
                </div>

                {monetaryROI && (
                  <div className="bg-white rounded-xl p-6 border-2 border-green-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Annual Cost:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your Hourly Rate:</span>
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
                  <p className="text-gray-500 italic">Enter your monthly salary above to see the financial impact</p>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">How We Calculate:</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Hourly Rate:</strong> Monthly Salary ÷ 22 working days ÷ 8 hours<br/>
                  <strong>Time Wasted:</strong> Based on {data?.roi?.dailyMinutes || 0} min/day, {data?.roi?.monthlyHours || 0} hours/month, {data?.roi?.yearlyHours || 0} hours/year<br/>
                  <strong>Financial Loss:</strong> Your Hourly Rate × Hours Wasted
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Activity className="w-9 h-9 mr-3 text-blue-600" />
              Real Typing Performance
            </h2>
            <p className="text-gray-600 mb-8">
              Metrics from {data?.completedTest || 0} people who completed the typing challenge:
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">Community Insight</h3>
              <p className="text-gray-700 leading-relaxed">
                Community members type at <strong className="text-blue-600">{data?.avgWPM || 0} WPM</strong>, 
                make <strong className="text-purple-600">{data?.avgDeletions || 0} deletions</strong>, and experience{' '}
                <strong className="text-red-600">{data?.avgLanguageErrors || 0} language-switching errors</strong> in just 5 minutes.
                This proves language switching is a <strong>real, measurable challenge</strong> that affects typing performance.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-9 h-9 mr-3 text-red-600" />
              TOP 10 Common Frustrations
            </h2>
            <p className="text-gray-600 mb-8">What people experience when switching languages while typing:</p>
            
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
                      <p className="text-sm text-gray-500">{pain.count} people</p>
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

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-9 h-9 mr-3 text-purple-600" />
              Different User Groups
            </h2>
            <p className="text-gray-600 mb-8">Performance metrics by user segment:</p>
            
            <div className="space-y-5">
              {data?.segmentMetrics?.map((seg: SegmentPain, index: number) => (
                <div key={index} className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{seg.segment}</h3>
                      <p className="text-sm text-gray-600">{seg.count} participants</p>
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

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-9 h-9 mr-3 text-yellow-600" />
              Impact on Daily Work
            </h2>
            <p className="text-gray-600 mb-8">How language-switching errors affect professional productivity:</p>
            
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

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-9 h-9 mr-3 text-green-600" />
              Most Wanted Features
            </h2>
            <p className="text-gray-600 mb-8">Features ranked by total community votes:</p>
            
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
                      <p className="text-sm text-gray-600 ml-13">
                        {feature.totalSelections} votes · {feature.topChoicePercent.toFixed(0)}% ranked #1
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-4xl font-bold text-green-600">{feature.totalSelections}</p>
                      <p className="text-xs text-gray-500">votes</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((feature.totalSelections / data?.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NEW: Email Subscription Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
              <Mail className="w-10 h-10 mr-3" />
              Stay Updated on TypeSwitch
            </h2>
            
            <p className="text-center text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Be the first to know when TypeSwitch launches and get exclusive early-bird offers!
            </p>

            {!emailSubmitted ? (
              <div className="max-w-md mx-auto">
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email || !email.includes('@')}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Notify Me
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur rounded-lg p-6 max-w-md mx-auto text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="text-xl font-semibold">Thank You!</p>
                <p className="text-blue-100 mt-2">We'll notify you when TypeSwitch launches.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
