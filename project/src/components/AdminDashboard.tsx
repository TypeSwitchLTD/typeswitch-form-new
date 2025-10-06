import React, { useState, useEffect, useMemo } from 'react';
import { getAllSurveyResponses, deleteSurveyResponses } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, Target, Zap, AlertCircle, 
  Download, RefreshCw, Filter, ChevronRight, Award, Globe,
  Package, ShoppingCart, Brain, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, Briefcase, Mail, Star, LogOut
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

type DashboardView = 'executive' | 'sales' | 'operations' | 'research';

interface SurveyResponse {
  id: string;
  created_at: string;
  discount_code: string;
  email?: string;
  
  languages: string[];
  occupation: string;
  hours_typing: string;
  age: string;
  diagnosis: string[];
  
  difficulty_rating?: number;
  errors_rating?: number;
  language_switching_rating?: number;
  frustration_rating?: number;
  
  test_completed?: boolean;
  test_skipped?: boolean;
  overall_score?: number;
  total_wpm?: number;
  total_accuracy?: number;
  total_language_errors?: number;
  total_punctuation_errors?: number;
  total_deletions?: number;
  total_corrections?: number;
  total_language_switches?: number;
  frustration_score?: number;
  
  awakening_symptoms?: string[];
  feature_ranking?: string[];
  
  screen_times?: Record<string, number>;
  completion_time?: number;
  
  ip_country?: string;
  device_type?: string;
}

interface MarketOpportunity {
  language: string;
  score: number;
  marketSize: number;
  avgScore: number;
  mainOccupation: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  avgScore: number;
  characteristics: string[];
  emails: string[];
  score: number;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('executive');
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllSurveyResponses();
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to load data');
      }
      
      if (response.data) {
        const completedSurveys = response.data.filter(r => r.discount_code);
        setData(completedSurveys);
      }
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתונים');
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  // Calculate Market Opportunities
  const marketOpportunities = useMemo((): MarketOpportunity[] => {
    const markets: Record<string, any> = {};
    
    data.forEach(r => {
      r.languages?.forEach((lang: string) => {
        if (!markets[lang]) {
          markets[lang] = {
            language: lang,
            count: 0,
            totalScore: 0,
            occupations: {}
          };
        }
        
        markets[lang].count++;
        markets[lang].totalScore += r.overall_score || 0;
        
        if (r.occupation) {
          markets[lang].occupations[r.occupation] = (markets[lang].occupations[r.occupation] || 0) + 1;
        }
      });
    });

    return Object.values(markets).map(m => {
      const avgScore = m.totalScore / m.count;
      const mainOccupation = Object.entries(m.occupations)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';
      
      const opportunityScore = Math.round((m.count / data.length * 100) * 0.5 + avgScore * 0.5);

      return {
        language: m.language,
        score: opportunityScore,
        avgScore: Math.round(avgScore),
        marketSize: m.count,
        mainOccupation
      };
    }).sort((a, b) => b.score - a.score);
  }, [data]);

  // Calculate Customer Segments
  const customerSegments = useMemo((): CustomerSegment[] => {
    const segments: CustomerSegment[] = [];

    // Segment 1: ADHD Users
    const adhdUsers = data.filter(r => r.diagnosis?.includes('adhd'));
    if (adhdUsers.length > 0) {
      const scores = adhdUsers.filter(r => r.overall_score).map(r => r.overall_score!);
      segments.push({
        id: 'adhd',
        name: 'ADHD & Accessibility Focused',
        size: adhdUsers.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        characteristics: ['ADHD diagnosis', 'Need visual cues', 'Frustration reduction priority'],
        emails: adhdUsers.filter(r => r.email).map(r => r.email!),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      });
    }

    // Segment 2: Power Users (5+ hours typing)
    const powerUsers = data.filter(r => 
      r.hours_typing === '5-8' || r.hours_typing === '8+'
    );
    if (powerUsers.length > 0) {
      const scores = powerUsers.filter(r => r.overall_score).map(r => r.overall_score!);
      segments.push({
        id: 'power-users',
        name: 'Professional Power Users',
        size: powerUsers.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        characteristics: ['5-8+ hours typing', 'High productivity needs'],
        emails: powerUsers.filter(r => r.email).map(r => r.email!),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      });
    }

    // Segment 3: Translators
    const translators = data.filter(r => 
      r.occupation === 'translation' || r.occupation === 'education'
    );
    if (translators.length > 0) {
      const scores = translators.filter(r => r.overall_score).map(r => r.overall_score!);
      segments.push({
        id: 'translators',
        name: 'Translators & Educators',
        size: translators.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        characteristics: ['Multi-language needs', 'High accuracy requirements'],
        emails: translators.filter(r => r.email).map(r => r.email!),
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      });
    }

    return segments.sort((a, b) => b.score - a.score);
  }, [data]);

  // Stats
  const stats = useMemo(() => {
    const withEmail = data.filter(r => r.email).length;
    const withADHD = data.filter(r => r.diagnosis?.includes('adhd')).length;
    const completedTest = data.filter(r => r.test_completed).length;
    const avgScore = data.reduce((acc, r) => acc + (r.overall_score || 0), 0) / (data.length || 1);
    const avgWPM = data.filter(r => r.test_completed).reduce((acc, r) => acc + (r.total_wpm || 0), 0) / (completedTest || 1);
    
    return {
      total: data.length,
      withEmail,
      withEmailPercent: data.length > 0 ? Math.round((withEmail / data.length) * 100) : 0,
      withADHD,
      withADHDPercent: data.length > 0 ? Math.round((withADHD / data.length) * 100) : 0,
      completedTest,
      completedTestPercent: data.length > 0 ? Math.round((completedTest / data.length) * 100) : 0,
      avgScore: Math.round(avgScore),
      avgWPM: Math.round(avgWPM)
    };
  }, [data]);

  // Export Functions
  const exportToCSV = (dataset: string = 'all') => {
    let exportData = data;
    let filename = 'typeswitch-export';
    
    if (dataset === 'hot-leads') {
      exportData = data.filter(r => r.overall_score && r.overall_score >= 80 && r.email);
      filename = 'typeswitch-hot-leads';
    } else if (dataset === 'emails') {
      exportData = data.filter(r => r.email);
      filename = 'typeswitch-email-list';
    }
    
    const headers = [
      'Date', 'Email', 'Languages', 'Occupation', 'Age', 'Score', 
      'WPM', 'Accuracy', 'Diagnosis', 'Test Completed'
    ];
    
    const rows = exportData.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      r.email || '',
      (r.languages || []).join(';'),
      r.occupation || '',
      r.age || '',
      r.overall_score || 0,
      r.total_wpm || 0,
      r.total_accuracy || 0,
      (r.diagnosis || []).join(';'),
      r.test_completed ? 'Yes' : 'No'
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

  const exportSegmentEmails = (segment: CustomerSegment) => {
    const csvContent = [
      'Email,Segment,Score',
      ...segment.emails.map(email => {
        const user = data.find(r => r.email === email);
        return `"${email}","${segment.name}","${user?.overall_score || ''}"`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${segment.id}-emails-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading TypeSwitch Command Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">TypeSwitch Command Center</h1>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Refresh now"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'executive', label: 'Executive', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'sales', label: 'Sales', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'operations', label: 'Operations', icon: <Activity className="w-4 h-4" /> },
              { id: 'research', label: 'Research', icon: <Brain className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as DashboardView)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  currentView === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Executive Dashboard */}
        {currentView === 'executive' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">With Email</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.withEmail} ({stats.withEmailPercent}%)
                    </p>
                  </div>
                  <Mail className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ADHD Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.withADHD} ({stats.withADHDPercent}%)
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg WPM</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgWPM}</p>
                  </div>
                  <Activity className="w-8 h-8 text-teal-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Market Opportunity Score */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-blue-600" />
                  Market Opportunity Analysis
                </h2>
                <button
                  onClick={() => exportToCSV('all')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export All Data
                </button>
              </div>
              
              <div className="space-y-4">
                {marketOpportunities.slice(0, 5).map((market) => (
                  <div key={market.language} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-semibold">{market.language}</span>
                          {market.score >= 80 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              HOT MARKET
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>👥 {market.marketSize} users</span>
                          <span>📊 {market.avgScore} avg score</span>
                          <span>💼 {market.mainOccupation}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-blue-600">{market.score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            market.score >= 80 ? 'bg-green-500' : 
                            market.score >= 60 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${market.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Insights */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2" />
                Top 5 Insights
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>{marketOpportunities[0]?.language} is your primary market with {marketOpportunities[0]?.marketSize} users</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>{stats.withADHDPercent}% of users have ADHD - a key accessibility segment</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>{stats.completedTestPercent}% completed the typing test</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Average typing speed: {stats.avgWPM} WPM</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">5.</span>
                  <span>{stats.withEmailPercent}% provided email for follow-up</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Dashboard */}
        {currentView === 'sales' && (
          <div className="space-y-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Qualified Leads</h3>
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.filter(r => r.overall_score && r.overall_score >= 60 && r.email).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">With email & score 60+</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Hot Leads 🔥</h3>
                  <Star className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.filter(r => r.overall_score && r.overall_score >= 80 && r.email).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Score 80+ with email</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Email Collection</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.withEmailPercent}%</p>
                <p className="text-sm text-gray-500 mt-1">{stats.withEmail} total emails</p>
              </div>
            </div>

            {/* Customer Segments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Segments</h2>
              
              <div className="grid gap-4">
                {customerSegments.map((segment) => (
                  <div key={segment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {segment.size} users
                          </span>
                          {segment.score >= 80 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              HIGH VALUE
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            📊 Average score: <span className="font-semibold">{segment.avgScore}/100</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            ✉️ Emails collected: <span className="font-semibold">{segment.emails.length}</span>
                          </p>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Characteristics</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.characteristics.map((char, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {char}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => exportSegmentEmails(segment)}
                          className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export Emails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Operations Dashboard */}
        {currentView === 'operations' && (
          <div className="space-y-6">
            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Responses</h2>
                <button
                  onClick={() => exportToCSV('all')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Occupation</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">WPM</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.slice(0, 50).map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.languages?.[0] || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.occupation || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-center font-bold">
                          {r.overall_score || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-center">
                          {r.total_wpm || 0}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.email || '-'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {r.test_completed ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Complete
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Partial
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Research Dashboard */}
        {currentView === 'research' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Research & Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language Distribution */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Language Distribution</h3>
                  <div className="space-y-2">
                    {marketOpportunities.map(market => (
                      <div key={market.language}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{market.language}</span>
                          <span>{market.marketSize} ({Math.round(market.marketSize / data.length * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(market.marketSize / data.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Occupation Distribution */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Top Occupations</h3>
                  <div className="space-y-2">
                    {(() => {
                      const occupations: Record<string, number> = {};
                      data.forEach(r => {
                        if (r.occupation) {
                          occupations[r.occupation] = (occupations[r.occupation] || 0) + 1;
                        }
                      });
                      return Object.entries(occupations)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([occ, count]) => (
                          <div key={occ}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{occ}</span>
                              <span>{count} ({Math.round(count / data.length * 100)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(count / data.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Test Completion Stats */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Test Completion</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed Test</span>
                      <span className="font-semibold">{stats.completedTest} ({stats.completedTestPercent}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Skipped Test</span>
                      <span className="font-semibold">
                        {data.filter(r => r.test_skipped).length} 
                        ({Math.round((data.filter(r => r.test_skipped).length / data.length) * 100)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average WPM</span>
                      <span className="font-semibold">{stats.avgWPM}</span>
                    </div>
                  </div>
                </div>

                {/* Score Distribution */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Score Distribution</h3>
                  <div className="space-y-2">
                    {['80-100', '60-79', '40-59', '0-39'].map(range => {
                      const [min, max] = range.split('-').map(Number);
                      const count = data.filter(r => 
                        r.overall_score && r.overall_score >= min && r.overall_score <= max
                      ).length;
                      const percent = Math.round((count / data.length) * 100);
                      return (
                        <div key={range}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{range}</span>
                            <span>{count} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                min >= 80 ? 'bg-green-600' :
                                min >= 60 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
