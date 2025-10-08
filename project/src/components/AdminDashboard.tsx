import React, { useState, useEffect, useMemo } from 'react';
import { getAllSurveyResponses, deleteSurveyResponses, deleteTestData } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, Target, Zap, AlertCircle, 
  Download, RefreshCw, Filter, ChevronRight, Award, Globe,
  Package, ShoppingCart, Brain, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Activity, Briefcase, Mail, Star
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

type DashboardView = 'executive' | 'product' | 'sales' | 'marketing' | 'operations' | 'research';

interface MarketOpportunity {
  language: string;
  score: number;
  avgPrice: number;
  marketSize: number;
  readyToPay: number;
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
  avgPrice: number;
  characteristics: string[];
  topFeatures: string[];
  emails: string[];
  score: number;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('executive');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Feature display names mapping
  const featureNames: Record<string, string> = {
    mechanical: 'Mechanical Keyboard',
    rgbFull: 'Full RGB Lighting',
    physicalSwitch: 'Physical Language Switch',
    wireless: 'Wireless Connectivity',
    dynamicLight: 'Dynamic Language Lighting',
    modularKeys: 'Replaceable Keys',
    wristRest: 'Ergonomic Wrist Rest',
    shortcuts: 'Professional Shortcuts',
    volumeKnob: 'Rotary Encoder Knob'
  };

  // Load and process data
  useEffect(() => {
    loadData();
    if (autoRefresh) {
      const interval = setInterval(loadData, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, selectedMarket, autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      // CHANGED: Using getAllSurveyResponses instead of direct supabase query
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

  // Process all data for insights
  const processAllData = (responses: any[]) => {
    // Market Opportunities
    const marketOpportunities = calculateMarketOpportunities(responses);
    
    // Smart Insights
    const insights = generateSmartInsights(responses);
    
    // Feature Analysis
    const featureAnalysis = analyzeFeatures(responses);
    
    // Customer Segments
    const segments = identifyCustomerSegments(responses);
    
    // Sales Metrics
    const salesMetrics = calculateSalesMetrics(responses);
    
    // Marketing Data
    const marketingData = analyzeMarketingData(responses);

    return {
      raw: responses,
      total: responses.length,
      marketOpportunities,
      insights,
      featureAnalysis,
      segments,
      salesMetrics,
      marketingData,
      completionRate: responses.filter(r => r.discount_code).length / responses.length * 100,
      avgScore: responses.reduce((acc, r) => acc + (r.overall_score || 0), 0) / responses.length,
      avgWPM: responses.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / responses.length,
      avgAccuracy: responses.reduce((acc, r) => acc + (r.total_accuracy || 0), 0) / responses.length,
    };
  };

  // Calculate Market Opportunities
  const calculateMarketOpportunities = (responses: any[]): MarketOpportunity[] => {
    const markets: Record<string, any> = {};
    
    responses.forEach(r => {
      r.languages?.forEach((lang: string) => {
        if (!markets[lang]) {
          markets[lang] = {
            language: lang,
            count: 0,
            totalScore: 0,
            totalPrice: 0,
            priceRanges: {},
            features: {},
            occupations: {},
            readyToPay150Plus: 0
          };
        }
        
        markets[lang].count++;
        markets[lang].totalScore += r.overall_score || 0;
        
        // Price analysis (using mock data if price_range doesn't exist)
        const priceValue = r.price_range ? getPriceValue(r.price_range) : 120;
        markets[lang].totalPrice += priceValue;
        if (priceValue >= 150) markets[lang].readyToPay150Plus++;
        
        // Top features (if available)
        if (r.feature_ranking) {
          r.feature_ranking.slice(0, 3).forEach((feature: string) => {
            markets[lang].features[feature] = (markets[lang].features[feature] || 0) + 1;
          });
        }
        
        // Occupations
        if (r.occupation) {
          markets[lang].occupations[r.occupation] = (markets[lang].occupations[r.occupation] || 0) + 1;
        }
      });
    });

    return Object.values(markets).map(m => {
      const topFeature = Object.entries(m.features)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';
      
      const mainOccupation = Object.entries(m.occupations)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || '';

      const avgScore = m.totalScore / m.count;
      const avgPrice = m.totalPrice / m.count;
      const readyToPayPercent = (m.readyToPay150Plus / m.count) * 100;
      
      // Calculate opportunity score (0-100)
      const opportunityScore = calculateOpportunityScore(
        m.count,
        avgScore,
        avgPrice,
        readyToPayPercent
      );

      return {
        language: m.language,
        score: Math.round(opportunityScore),
        avgPrice: Math.round(avgPrice),
        marketSize: m.count,
        readyToPay: Math.round(readyToPayPercent),
        topFeature: featureNames[topFeature] || topFeature || 'N/A',
        mainOccupation: mainOccupation || 'N/A'
      };
    }).sort((a, b) => b.score - a.score);
  };

  // Generate Smart Insights
  const generateSmartInsights = (responses: any[]): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Insight 1: Best market opportunity
    const hebrewUsers = responses.filter(r => r.languages?.includes('Hebrew-English'));
    if (hebrewUsers.length > 0) {
      const avgScore = hebrewUsers.reduce((acc, r) => acc + (r.overall_score || 0), 0) / hebrewUsers.length;
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Hebrew-English Market Dominance',
        description: `${hebrewUsers.length} Hebrew-English users with ${avgScore.toFixed(0)} avg score. Your primary market.`,
        actionLabel: 'View Hebrew Market Analysis'
      });
    }

    // Insight 2: ADHD opportunity
    const adhdUsers = responses.filter(r => r.diagnosis?.includes('adhd'));
    if (adhdUsers.length >= 3) {
      const avgScore = adhdUsers.reduce((acc, r) => acc + (r.overall_score || 0), 0) / adhdUsers.length;
      
      insights.push({
        type: 'info',
        icon: <Brain className="w-5 h-5" />,
        title: 'ADHD User Segment Opportunity',
        description: `${adhdUsers.length} ADHD users identified. Average score: ${avgScore.toFixed(0)}/100`,
        actionLabel: 'Target ADHD Segment'
      });
    }

    // Insight 3: Email collection
    const withEmail = responses.filter(r => r.email).length;
    const emailRate = (withEmail / responses.length) * 100;
    if (emailRate > 50) {
      insights.push({
        type: 'success',
        icon: <Mail className="w-5 h-5" />,
        title: 'Strong Email Collection Rate',
        description: `${emailRate.toFixed(0)}% of users provided email (${withEmail} leads)`,
        actionLabel: 'Export Email List'
      });
    } else {
      insights.push({
        type: 'warning',
        icon: <Mail className="w-5 h-5" />,
        title: 'Low Email Collection',
        description: `Only ${emailRate.toFixed(0)}% provided email. Consider incentives.`,
        actionLabel: 'Optimize Email Capture'
      });
    }

    // Insight 4: Test completion
    const completedTest = responses.filter(r => r.test_completed).length;
    const testRate = (completedTest / responses.length) * 100;
    if (testRate < 60) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Test Completion Issue',
        description: `Only ${testRate.toFixed(0)}% complete the typing test. Consider making it shorter.`,
        actionLabel: 'Analyze Drop-offs'
      });
    }

    // Insight 5: Average performance
    const avgWPM = responses.reduce((acc, r) => acc + (r.total_wpm || 0), 0) / responses.length;
    insights.push({
      type: 'info',
      icon: <Activity className="w-5 h-5" />,
      title: 'Average User Performance',
      description: `Users type at ${avgWPM.toFixed(0)} WPM with typical language switching errors`,
      actionLabel: 'View Detailed Analytics'
    });

    return insights;
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
        implementationDifficulty: getImplementationDifficulty(feature)
      };
    });

    // Calculate metrics (simplified for now)
    const totalRankings = responses.filter(r => r.feature_ranking).length;
    
    if (totalRankings > 0) {
      responses.forEach(r => {
        if (r.feature_ranking && Array.isArray(r.feature_ranking)) {
          r.feature_ranking.forEach((feature: string, index: number) => {
            if (features[feature]) {
              features[feature].avgRating += (5 - index); // Higher rank = higher rating
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

    return Object.values(features).sort((a, b) => b.impactScore - a.impactScore);
  };

  // Identify Customer Segments
  const identifyCustomerSegments = (responses: any[]): CustomerSegment[] => {
    const segments: CustomerSegment[] = [];

    // Segment 1: Professional Power Users
    const powerUsers = responses.filter(r => 
      r.hours_typing === '5-8' || r.hours_typing === '8+'
    );
    
    if (powerUsers.length > 0) {
      segments.push({
        id: 'power-users',
        name: 'Professional Power Users',
        size: powerUsers.length,
        avgPrice: 150, // Mock value
        characteristics: ['5-8+ hours typing', 'High productivity needs', 'Professional use'],
        topFeatures: getTopFeaturesForSegment(powerUsers),
        emails: powerUsers.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(powerUsers)
      });
    }

    // Segment 2: ADHD Users
    const adhdUsers = responses.filter(r => r.diagnosis?.includes('adhd'));
    
    if (adhdUsers.length > 0) {
      segments.push({
        id: 'adhd',
        name: 'ADHD & Accessibility Focused',
        size: adhdUsers.length,
        avgPrice: 140, // Mock value
        characteristics: ['ADHD diagnosis', 'Need visual cues', 'Frustration reduction priority'],
        topFeatures: getTopFeaturesForSegment(adhdUsers),
        emails: adhdUsers.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(adhdUsers)
      });
    }

    // Segment 3: Translators
    const translators = responses.filter(r => 
      r.occupation === 'translation' || r.occupation === 'education'
    );
    
    if (translators.length > 0) {
      segments.push({
        id: 'translators',
        name: 'Translators & Educators',
        size: translators.length,
        avgPrice: 135, // Mock value
        characteristics: ['Multi-language needs', 'High accuracy requirements', 'Professional use'],
        topFeatures: getTopFeaturesForSegment(translators),
        emails: translators.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(translators)
      });
    }

    return segments.sort((a, b) => b.score - a.score);
  };

  // Calculate Sales Metrics
  const calculateSalesMetrics = (responses: any[]) => {
    const metrics = {
      totalAddressableMarket: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      conversionPotential: 0,
      avgDealSize: 0,
      projectedRevenue: 0
    };

    const qualifiedLeads = responses.filter(r => 
      r.overall_score >= 60 && r.email
    );
    
    const hotLeads = responses.filter(r => 
      r.overall_score >= 80 && r.email
    );

    metrics.qualifiedLeads = qualifiedLeads.length;
    metrics.hotLeads = hotLeads.length;
    metrics.avgDealSize = 120; // Mock value
    metrics.conversionPotential = (hotLeads.length / responses.length) * 100;
    metrics.projectedRevenue = hotLeads.length * 120 * 0.3; // 30% conversion estimate

    return metrics;
  };

  // Analyze Marketing Data
  const analyzeMarketingData = (responses: any[]) => {
    const channelPreference: Record<string, number> = {
      'Online': 0,
      'Physical Store': 0,
      'Marketplace': 0,
      'Other': 0
    };

    // Mock data for now
    responses.forEach(r => {
      channelPreference['Online'] += Math.random() > 0.5 ? 1 : 0;
      channelPreference['Marketplace'] += Math.random() > 0.7 ? 1 : 0;
    });

    return {
      channelPreference,
      topMessage: 'Save 10+ minutes every day with TypeSwitch',
      preferredChannel: 'Online'
    };
  };

  // Helper Functions
  const getPriceValue = (priceRange: string): number => {
    const priceMap: Record<string, number> = {
      'Up to $80': 70,
      '$80-120': 100,
      '$120-150': 135,
      '$150-200': 175,
      'Over $200': 225
    };
    return priceMap[priceRange] || 120;
  };

  const calculateOpportunityScore = (
    marketSize: number,
    avgScore: number,
    avgPrice: number,
    readyToPayPercent: number
  ): number => {
    const sizeScore = Math.min(marketSize / 10, 10) * 10;
    const qualityScore = avgScore;
    const priceScore = (avgPrice / 200) * 100;
    const readinessScore = readyToPayPercent;
    
    return (sizeScore * 0.25 + qualityScore * 0.25 + priceScore * 0.25 + readinessScore * 0.25);
  };

  const getImplementationDifficulty = (feature: string): number => {
    const difficulty: Record<string, number> = {
      mechanical: 3,
      rgbFull: 5,
      physicalSwitch: 2,
      wireless: 7,
      dynamicLight: 4,
      modularKeys: 6,
      wristRest: 2,
      shortcuts: 3,
      volumeKnob: 3
    };
    return difficulty[feature] || 5;
  };

  const getTopFeaturesForSegment = (segment: any[]): string[] => {
    const features: Record<string, number> = {};
    
    segment.forEach(r => {
      if (r.feature_ranking && Array.isArray(r.feature_ranking)) {
        r.feature_ranking.slice(0, 3).forEach((f: string) => {
          features[f] = (features[f] || 0) + 1;
        });
      }
    });
    
    return Object.entries(features)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([f]) => featureNames[f] || f);
  };

  const calculateSegmentScore = (segment: any[]): number => {
    const avgScore = segment.reduce((acc, r) => acc + (r.overall_score || 0), 0) / segment.length;
    const withEmail = segment.filter(r => r.email).length / segment.length;
    
    return Math.round(avgScore * 0.6 + withEmail * 100 * 0.4);
  };

  // Export Functions
  const exportToCSV = (dataset: string = 'all') => {
    if (!data?.raw) return;
    
    let exportData = data.raw;
    let filename = 'typeswitch-export';
    
    if (dataset === 'hot-leads') {
      exportData = data.raw.filter((r: any) => 
        r.overall_score >= 80 && r.email
      );
      filename = 'typeswitch-hot-leads';
    } else if (dataset === 'emails') {
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

  const exportSegmentEmails = (segment: CustomerSegment) => {
    const csvContent = [
      'Email,Name,Score',
      ...segment.emails.map(email => {
        const user = data.raw.find((r: any) => r.email === email);
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

  const generateReport = (type: string) => {
    console.log('Generating report:', type);
  };

  const handleDeleteTestData = async () => {
    if (!window.confirm('Delete all test data (score < 30 or completion time < 60 seconds)?')) return;
    
    const result = await deleteTestData();
    if (result.success) {
      alert('Test data deleted successfully');
      loadData();
    } else {
      alert('Error deleting test data');
    }
  };

  // Render loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Command Center v2.0...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">TypeSwitch Command Center v2</h1>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
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
              { id: 'executive', label: '📊 Executive', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'product', label: '🚀 Product', icon: <Package className="w-4 h-4" /> },
              { id: 'sales', label: '💰 Sales', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'marketing', label: '📈 Marketing', icon: <Target className="w-4 h-4" /> },
              { id: 'operations', label: '⚙️ Operations', icon: <Activity className="w-4 h-4" /> },
              { id: 'research', label: '🔬 Research', icon: <Brain className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as DashboardView)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  currentView === tab.id
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
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
            {/* Market Opportunity Score */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-purple-600" />
                  Market Opportunity Analysis
                </h2>
                <button
                  onClick={() => exportToCSV('all')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export Data
                </button>
              </div>
              
              <div className="space-y-4">
                {data?.marketOpportunities?.slice(0, 5).map((market: MarketOpportunity) => (
                  <div key={market.language} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-semibold">{market.language}</span>
                          {market.score >= 75 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              HOT MARKET
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>👥 {market.marketSize} users</span>
                          <span>💰 ${market.avgPrice} avg</span>
                          <span>🎯 {market.readyToPay}% ready $150+</span>
                          <span>⭐ {market.topFeature}</span>
                          <span>💼 {market.mainOccupation}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-purple-600">{market.score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            market.score >= 75 ? 'bg-green-500' : 
                            market.score >= 50 ? 'bg-yellow-500' : 
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

            {/* Smart Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                Smart Insights
              </h2>
              
              <div className="grid gap-4">
                {data?.insights?.map((insight: SmartInsight, index: number) => (
                  <div 
                    key={index}
                    className={`border-l-4 rounded-lg p-4 ${
                      insight.type === 'success' ? 'border-green-500 bg-green-50' :
                      insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      insight.type === 'critical' ? 'border-red-500 bg-red-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`mr-3 mt-0.5 ${
                        insight.type === 'success' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        insight.type === 'critical' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <p className="mt-1 text-gray-700">{insight.description}</p>
                        {insight.actionLabel && (
                          <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                            {insight.actionLabel} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.completionRate?.toFixed(0) || 0}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(data?.avgScore || 0)}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg WPM</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(data?.avgWPM || 0)}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other views would go here - simplified for space */}
        {currentView !== 'executive' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Dashboard
            </h2>
            <p className="text-gray-600">
              This section is under development. Use Executive view for main insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
