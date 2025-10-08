import React, { useState, useEffect } from 'react';
import { getAllSurveyResponses } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, AlertCircle, 
  Download, RefreshCw, Clock, CheckCircle,
  Activity, Mail, Star, Calculator, Zap, Target
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState<string>('15000');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllSurveyResponses();
      if (result.error) throw result.error;
      
      const responses = result.data || [];
      setData(analyzeEverything(responses));
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const analyzeEverything = (responses: any[]) => {
    const completed = responses.filter(r => r.test_completed);
    
    // Typing Hours Segments
    const segments = {
      light: responses.filter(r => r.hours_typing === '1-3' || r.hours_typing === 'less-1'),
      medium: responses.filter(r => r.hours_typing === '3-5'),
      heavy: responses.filter(r => r.hours_typing === '5-8' || r.hours_typing === '8+')
    };

    // Calculate metrics per segment
    const getSegmentMetrics = (segment: any[]) => {
      const completedInSegment = segment.filter(r => r.test_completed);
      if (completedInSegment.length === 0) return null;

      const avgScore = completedInSegment.reduce((acc, r) => acc + (r.overall_score || 0), 0) / completedInSegment.length;
      const avgErrors = completedInSegment.reduce((acc, r) => acc + (r.total_language_errors || 0), 0) / completedInSegment.length;
      const avgWPM = completedInSegment.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / completedInSegment.length;
      
      // Top features
      const featureCounts: Record<string, number> = {};
      segment.forEach(r => {
        if (r.feature_ranking?.[0]) {
          featureCounts[r.feature_ranking[0]] = (featureCounts[r.feature_ranking[0]] || 0) + 1;
        }
      });
      const topFeature = Object.entries(featureCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      return {
        count: segment.length,
        completedCount: completedInSegment.length,
        avgScore: Math.round(avgScore),
        avgErrors: Math.round(avgErrors * 10) / 10,
        avgWPM: Math.round(avgWPM),
        topFeature: featureNameMap[topFeature] || topFeature,
        withEmail: segment.filter(r => r.email).length
      };
    };

    const featureNameMap: Record<string, string> = {
      mechanical: 'Mechanical Keyboard',
      physicalSwitch: 'Physical Language Switch',
      autoDetection: 'Auto Language Detection',
      dynamicLight: 'Dynamic Backlighting',
      wireless: 'Wireless Connectivity',
      programmableKeys: 'Programmable Keys'
    };

    // ROI Calculation
    const totalWasted = completed.reduce((acc, r) => {
      const wastedSeconds = (r.total_language_errors || 0) * 3 + (r.total_deletions || 0) * 1;
      return acc + wastedSeconds;
    }, 0);
    const avgWastedSeconds = totalWasted / completed.length;
    const dailyMinutes = (avgWastedSeconds / 300) * 90;
    const yearlyHours = Math.round((dailyMinutes / 60) * 22 * 12);

    return {
      total: responses.length,
      completed: completed.length,
      light: getSegmentMetrics(segments.light),
      medium: getSegmentMetrics(segments.medium),
      heavy: getSegmentMetrics(segments.heavy),
      roi: { yearlyHours, dailyMinutes: Math.round(dailyMinutes * 10) / 10 }
    };
  };

  const calculateROI = () => {
    const salary = parseFloat(monthlySalary);
    if (!salary || !data?.roi?.yearlyHours) return null;
    
    const hourlyRate = salary / 22 / 8;
    const yearlyLoss = data.roi.yearlyHours * hourlyRate;
    
    return {
      hourlyRate: Math.round(hourlyRate),
      yearlyLoss: Math.round(yearlyLoss)
    };
  };

  const roiResult = calculateROI();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">TypeSwitch Investor Dashboard</h1>
            <div className="flex items-center space-x-2">
              <button onClick={loadData} className="p-2 rounded-lg bg-white text-blue-600">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={onLogout} className="px-4 py-2 bg-white text-blue-600 rounded-lg">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Executive Summary */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">📊 Executive Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600">{data?.total || 0}</p>
              <p className="text-gray-600 mt-2">Total Respondents</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600">{data?.completed || 0}</p>
              <p className="text-gray-600 mt-2">Completed Test</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-orange-600">{data?.roi?.yearlyHours || 0}h</p>
              <p className="text-gray-600 mt-2">Wasted per Year</p>
            </div>
          </div>
        </div>

        {/* User Segments */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">👥 User Segments by Typing Hours</h2>
          
          <div className="space-y-6">
            {/* Heavy Users */}
            {data?.heavy && (
              <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">🔥 Heavy Users (5-8+ hours/day)</h3>
                    <p className="text-gray-600 mt-1">{data.heavy.count} users · {data.heavy.completedCount} completed test</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold text-red-600">{data.heavy.avgScore}</p>
                    <p className="text-sm text-gray-600">Pain Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Errors</p>
                    <p className="text-2xl font-bold text-red-600">{data.heavy.avgErrors}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg WPM</p>
                    <p className="text-2xl font-bold text-blue-600">{data.heavy.avgWPM}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Top Feature</p>
                    <p className="text-sm font-bold text-gray-900">{data.heavy.topFeature}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Email Leads</p>
                    <p className="text-2xl font-bold text-green-600">{data.heavy.withEmail}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Medium Users */}
            {data?.medium && (
              <div className="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">⚡ Medium Users (3-5 hours/day)</h3>
                    <p className="text-gray-600 mt-1">{data.medium.count} users · {data.medium.completedCount} completed test</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold text-orange-600">{data.medium.avgScore}</p>
                    <p className="text-sm text-gray-600">Pain Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Errors</p>
                    <p className="text-2xl font-bold text-red-600">{data.medium.avgErrors}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg WPM</p>
                    <p className="text-2xl font-bold text-blue-600">{data.medium.avgWPM}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Top Feature</p>
                    <p className="text-sm font-bold text-gray-900">{data.medium.topFeature}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Email Leads</p>
                    <p className="text-2xl font-bold text-green-600">{data.medium.withEmail}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Light Users */}
            {data?.light && (
              <div className="border-2 border-yellow-200 rounded-xl p-6 bg-yellow-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">💡 Light Users (1-3 hours/day)</h3>
                    <p className="text-gray-600 mt-1">{data.light.count} users · {data.light.completedCount} completed test</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold text-yellow-600">{data.light.avgScore}</p>
                    <p className="text-sm text-gray-600">Pain Score</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Errors</p>
                    <p className="text-2xl font-bold text-red-600">{data.light.avgErrors}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg WPM</p>
                    <p className="text-2xl font-bold text-blue-600">{data.light.avgWPM}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Top Feature</p>
                    <p className="text-sm font-bold text-gray-900">{data.light.topFeature}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Email Leads</p>
                    <p className="text-2xl font-bold text-green-600">{data.light.withEmail}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-green-600" />
            ROI Calculator
          </h2>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Monthly Salary (₪):</label>
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg text-lg font-semibold"
              />
            </div>
            
            {roiResult && (
              <div className="bg-white rounded-xl p-6 border-2 border-green-400">
                <p className="text-sm text-gray-600 mb-2">Annual Cost per Employee:</p>
                <p className="text-5xl font-bold text-red-600">₪{roiResult.yearlyLoss.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Based on {data?.roi?.yearlyHours}h wasted/year at ₪{roiResult.hourlyRate}/hour
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Calculation:</strong> Users waste {data?.roi?.dailyMinutes} minutes/day on language errors = {data?.roi?.yearlyHours} hours/year. 
              Hourly rate = Monthly Salary ÷ 176 hours.
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">💡 Investment Thesis</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              ✅ <strong>Heavy users (5-8h/day)</strong> show the highest pain score ({data?.heavy?.avgScore}/100) and make {data?.heavy?.avgErrors} language errors per test.
            </p>
            <p>
              ✅ Top requested feature across all segments: <strong>{data?.heavy?.topFeature || data?.medium?.topFeature}</strong>
            </p>
            <p>
              ✅ With {roiResult ? `₪${roiResult.yearlyLoss.toLocaleString()}` : 'calculated'} annual cost per employee, TypeSwitch delivers clear ROI.
            </p>
            <p>
              ✅ {data?.completed} users completed the typing challenge, validating real pain points with measurable data.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
