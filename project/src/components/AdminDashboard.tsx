import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getAllSurveyResponses, deleteSurveyResponses, deleteTestData } from '../lib/supabase';
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
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = processAllData(responses || []);
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
        
        // Price analysis
        const priceValue = getPriceValue(r.price_range);
        markets[lang].totalPrice += priceValue;
        if (priceValue >= 150) markets[lang].readyToPay150Plus++;
        
        // Top features
        r.top_features?.forEach((feature: string) => {
          markets[lang].features[feature] = (markets[lang].features[feature] || 0) + 1;
        });
        
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
        topFeature: featureNames[topFeature] || topFeature,
        mainOccupation
      };
    }).sort((a, b) => b.score - a.score);
  };

  // Generate Smart Insights
  const generateSmartInsights = (responses: any[]): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Insight 1: Best market opportunity
    const hebrewUsers = responses.filter(r => r.languages?.includes('Hebrew-English'));
    const hebrewHighValue = hebrewUsers.filter(r => getPriceValue(r.price_range) >= 150);
    if (hebrewUsers.length > 0) {
      const percentage = (hebrewHighValue.length / hebrewUsers.length * 100).toFixed(0);
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Hebrew-English Market Opportunity',
        description: `${percentage}% of Hebrew-English users willing to pay $150+. This is your primary market.`,
        actionLabel: 'View Hebrew Market Analysis'
      });
    }

    // Insight 2: ADHD opportunity
    const adhdUsers = responses.filter(r => r.diagnosis === 'adhd');
    if (adhdUsers.length >= 5) {
      const avgPrice = adhdUsers.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / adhdUsers.length;
      const physicalSwitch = adhdUsers.filter(r => r.top_features?.includes('physicalSwitch')).length;
      const percentage = (physicalSwitch / adhdUsers.length * 100).toFixed(0);
      
      insights.push({
        type: 'info',
        icon: <Brain className="w-5 h-5" />,
        title: 'ADHD User Segment',
        description: `${percentage}% of ADHD users prioritize physical switch. Avg willingness: $${Math.round(avgPrice)}`,
        actionLabel: 'Target ADHD Segment'
      });
    }

    // Insight 3: Feature correlation
    const physicalSwitchUsers = responses.filter(r => r.top_features?.includes('physicalSwitch'));
    const alsoDynamicLight = physicalSwitchUsers.filter(r => 
      r.feature_ratings?.dynamicLight >= 4
    ).length;
    if (physicalSwitchUsers.length > 10) {
      const correlation = (alsoDynamicLight / physicalSwitchUsers.length * 100).toFixed(0);
      insights.push({
        type: 'info',
        icon: <Package className="w-5 h-5" />,
        title: 'Feature Bundle Opportunity',
        description: `${correlation}% who want physical switch also want dynamic lighting. Consider bundling.`,
        actionLabel: 'View Feature Correlations'
      });
    }

    // Insight 4: Pricing sweet spot
    const priceRanges: Record<string, number> = {};
    responses.forEach(r => {
      if (r.price_range) {
        priceRanges[r.price_range] = (priceRanges[r.price_range] || 0) + 1;
      }
    });
    const sweetSpot = Object.entries(priceRanges)
      .sort(([,a], [,b]) => b - a)[0];
    if (sweetSpot) {
      insights.push({
        type: 'success',
        icon: <DollarSign className="w-5 h-5" />,
        title: 'Pricing Sweet Spot Found',
        description: `${((sweetSpot[1] / responses.length) * 100).toFixed(0)}% prefer ${sweetSpot[0]} range`,
        actionLabel: 'Optimize Pricing'
      });
    }

    // Insight 5: Conversion issue
    if (data?.completionRate < 70) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Survey Completion Issue',
        description: `Only ${data?.completionRate?.toFixed(0)}% complete the survey. Consider shortening it.`,
        actionLabel: 'Analyze Drop-offs'
      });
    }

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

    // Calculate metrics
    responses.forEach(r => {
      // Ratings
      if (r.feature_ratings) {
        Object.entries(r.feature_ratings).forEach(([feature, rating]) => {
          if (features[feature] && typeof rating === 'number') {
            features[feature].avgRating += rating;
          }
        });
      }
      
      // Top choices
      r.top_features?.forEach((feature: string) => {
        if (features[feature]) {
          features[feature].topChoicePercent++;
        }
      });
    });

    // Calculate averages and percentages
    Object.values(features).forEach(f => {
      f.avgRating = f.avgRating / responses.length;
      f.topChoicePercent = (f.topChoicePercent / responses.length) * 100;
      
      // Calculate impact score (combination of rating and top choice)
      f.impactScore = (f.avgRating * 0.4 + (f.topChoicePercent / 20) * 0.6) * 20;
      
      // Find correlations
      f.correlatedFeatures = findFeatureCorrelations(responses, f.feature);
    });

    return Object.values(features).sort((a, b) => b.impactScore - a.impactScore);
  };

  // Identify Customer Segments
  const identifyCustomerSegments = (responses: any[]): CustomerSegment[] => {
    const segments: CustomerSegment[] = [];

    // Segment 1: Professional Power Users
    const powerUsers = responses.filter(r => 
      r.hours_typing === '5-8' || r.hours_typing === '8+' &&
      r.occupation === 'tech' || r.occupation === 'sales'
    );
    
    if (powerUsers.length > 0) {
      segments.push({
        id: 'power-users',
        name: 'Professional Power Users',
        size: powerUsers.length,
        avgPrice: powerUsers.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / powerUsers.length,
        characteristics: ['5-8+ hours typing', 'Tech/Sales roles', 'High frustration with errors'],
        topFeatures: getTopFeaturesForSegment(powerUsers),
        emails: powerUsers.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(powerUsers)
      });
    }

    // Segment 2: Frustrated Translators
    const translators = responses.filter(r => 
      r.occupation === 'translation' || r.occupation === 'education'
    );
    
    if (translators.length > 0) {
      segments.push({
        id: 'translators',
        name: 'Frustrated Translators',
        size: translators.length,
        avgPrice: translators.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / translators.length,
        characteristics: ['Multi-language needs', 'High accuracy requirements', 'Professional use'],
        topFeatures: getTopFeaturesForSegment(translators),
        emails: translators.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(translators)
      });
    }

    // Segment 3: ADHD Users
    const adhdUsers = responses.filter(r => r.diagnosis === 'adhd');
    
    if (adhdUsers.length > 0) {
      segments.push({
        id: 'adhd',
        name: 'ADHD & Accessibility Focused',
        size: adhdUsers.length,
        avgPrice: adhdUsers.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / adhdUsers.length,
        characteristics: ['ADHD diagnosis', 'Need visual cues', 'Frustration reduction priority'],
        topFeatures: getTopFeaturesForSegment(adhdUsers),
        emails: adhdUsers.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(adhdUsers)
      });
    }

    // Segment 4: Price Conscious Students
    const students = responses.filter(r => 
      r.occupation === 'student' && getPriceValue(r.price_range) <= 120
    );
    
    if (students.length > 0) {
      segments.push({
        id: 'students',
        name: 'Price-Conscious Students',
        size: students.length,
        avgPrice: students.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / students.length,
        characteristics: ['Student budget', 'Basic features priority', 'Entry-level pricing'],
        topFeatures: getTopFeaturesForSegment(students),
        emails: students.filter(r => r.email).map(r => r.email),
        score: calculateSegmentScore(students)
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
      r.overall_score >= 80 && 
      r.email && 
      getPriceValue(r.price_range) >= 120
    );

    metrics.qualifiedLeads = qualifiedLeads.length;
    metrics.hotLeads = hotLeads.length;
    metrics.avgDealSize = responses.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / responses.length;
    metrics.conversionPotential = (hotLeads.length / responses.length) * 100;
    metrics.projectedRevenue = hotLeads.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) * 0.3; // 30% conversion estimate

    return metrics;
  };

  // Analyze Marketing Data
  const analyzeMarketingData = (responses: any[]) => {
    const purchasePriorities: Record<string, number[]> = {
      savingTime: [0, 0, 0, 0, 0],
      reducingErrors: [0, 0, 0, 0, 0],
      lessFrustration: [0, 0, 0, 0, 0],
      lookProfessional: [0, 0, 0, 0, 0],
      typingSpeed: [0, 0, 0, 0, 0]
    };

    const channelPreference: Record<string, number> = {
      'Manufacturer website': 0,
      'Online marketplaces (Amazon/eBay)': 0,
      'Physical store': 0,
      'Large electronics store': 0,
      'Other': 0
    };

    responses.forEach(r => {
      // Purchase priorities
      if (r.purchase_priorities) {
        Object.entries(r.purchase_priorities).forEach(([key, value]) => {
          if (purchasePriorities[key] && typeof value === 'number' && value > 0 && value <= 5) {
            purchasePriorities[key][value - 1]++;
          }
        });
      }

      // Channel preferences
      r.where_to_buy?.forEach((channel: string) => {
        if (channelPreference[channel] !== undefined) {
          channelPreference[channel]++;
        }
      });
    });

    return {
      purchasePriorities,
      channelPreference,
      topMessage: getTopMarketingMessage(purchasePriorities),
      preferredChannel: Object.entries(channelPreference)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
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
    return priceMap[priceRange] || 100;
  };

  const calculateOpportunityScore = (
    marketSize: number,
    avgScore: number,
    avgPrice: number,
    readyToPayPercent: number
  ): number => {
    const sizeScore = Math.min(marketSize / 10, 10) * 10; // Max 100 for 100+ users
    const qualityScore = avgScore; // Already 0-100
    const priceScore = (avgPrice / 200) * 100; // $200 = 100 points
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

  const findFeatureCorrelations = (responses: any[], targetFeature: string): string[] => {
    const correlations: Record<string, number> = {};
    
    const targetUsers = responses.filter(r => r.top_features?.includes(targetFeature));
    
    if (targetUsers.length === 0) return [];
    
    Object.keys(featureNames).forEach(feature => {
      if (feature !== targetFeature) {
        const correlation = targetUsers.filter(r => 
          r.feature_ratings?.[feature] >= 4
        ).length / targetUsers.length;
        
        if (correlation > 0.5) {
          correlations[feature] = correlation;
        }
      }
    });
    
    return Object.entries(correlations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature]) => featureNames[feature]);
  };

  const getTopFeaturesForSegment = (segment: any[]): string[] => {
    const features: Record<string, number> = {};
    
    segment.forEach(r => {
      r.top_features?.forEach((f: string) => {
        features[f] = (features[f] || 0) + 1;
      });
    });
    
    return Object.entries(features)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([f]) => featureNames[f] || f);
  };

  const calculateSegmentScore = (segment: any[]): number => {
    const avgScore = segment.reduce((acc, r) => acc + (r.overall_score || 0), 0) / segment.length;
    const avgPrice = segment.reduce((acc, r) => acc + getPriceValue(r.price_range), 0) / segment.length;
    const withEmail = segment.filter(r => r.email).length / segment.length;
    
    return Math.round(avgScore * 0.3 + (avgPrice / 2) * 0.4 + withEmail * 100 * 0.3);
  };

  const getTopMarketingMessage = (priorities: Record<string, number[]>): string => {
    const topPriorities: Record<string, number> = {};
    
    Object.entries(priorities).forEach(([key, ratings]) => {
      // Calculate weighted score (higher rating = more weight)
      topPriorities[key] = ratings.reduce((acc, count, index) => 
        acc + count * (index + 1), 0
      );
    });
    
    const top = Object.entries(topPriorities)
      .sort(([,a], [,b]) => a - b)[0]?.[0];
    
    const messages: Record<string, string> = {
      savingTime: 'Save 10+ minutes every day',
      reducingErrors: 'Reduce typing errors by 50%',
      lessFrustration: 'End the frustration of wrong language typing',
      lookProfessional: 'Look professional with zero mistakes',
      typingSpeed: 'Type faster in multiple languages'
    };
    
    return messages[top] || 'Type better, work smarter';
  };

  // Export Functions
  const exportToCSV = (dataset: string = 'all') => {
    if (!data?.raw) return;
    
    let exportData = data.raw;
    let filename = 'typeswitch-export';
    
    // Filter based on dataset type
    if (dataset === 'hot-leads') {
      exportData = data.raw.filter((r: any) => 
        r.overall_score >= 80 && r.email && getPriceValue(r.price_range) >= 150
      );
      filename = 'typeswitch-hot-leads';
    } else if (dataset === 'emails') {
      exportData = data.raw.filter((r: any) => r.email);
      filename = 'typeswitch-email-list';
    } else if (dataset === 'segment') {
      // Export specific segment passed as parameter
    }
    
    const headers = [
      'Date', 'Email', 'Languages', 'Occupation', 'Age', 'Score', 
      'WPM', 'Accuracy', 'Price Range', 'Top Features', 'Diagnosis'
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
      r.price_range || '',
      (r.top_features || []).join(';'),
      r.diagnosis || ''
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
      'Email,Name,Score,Price Range,Top Features',
      ...segment.emails.map(email => {
        const user = data.raw.find((r: any) => r.email === email);
        return `"${email}","${segment.name}","${user?.overall_score || ''}","${user?.price_range || ''}","${(user?.top_features || []).join(';')}"`;
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
    // Generate different types of reports (investor, product, marketing)
    console.log('Generating report:', type);
    // Implementation would generate PDF or formatted document
  };

  // Delete test data
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
          <p className="mt-4 text-gray-600">Loading TypeSwitch Command Center...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">TypeSwitch Command Center</h1>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                title={autoRefresh ? 'Auto-refresh ON (10 min)' : 'Auto-refresh OFF'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Refresh now"
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
                {data?.marketOpportunities?.slice(0, 5).map((market: MarketOpportunity) => (
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
                          <span>💰 ${market.avgPrice} avg</span>
                          <span>🎯 {market.readyToPay}% ready for $150+</span>
                          <span>⭐ {market.topFeature}</span>
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

            {/* Smart Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                AI-Powered Insights
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

        {/* Product Dashboard */}
        {currentView === 'product' && (
          <div className="space-y-6">
            {/* Feature Priority Matrix */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Priority Matrix</h2>
              
              <div className="relative h-96 border rounded-lg bg-gray-50">
                <div className="absolute inset-0 flex">
                  {/* Quadrants */}
                  <div className="w-1/2 h-1/2 border-r border-b p-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      🚀 Build NOW (High Impact, Low Effort)
                    </div>
                    <div className="space-y-2">
                      {data?.featureAnalysis?.filter((f: FeatureDemand) => 
                        f.impactScore > 50 && f.implementationDifficulty <= 3
                      ).map((f: FeatureDemand) => (
                        <div key={f.feature} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm inline-block mr-2">
                          {f.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-1/2 h-1/2 border-b p-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      📅 Next Quarter (High Impact, High Effort)
                    </div>
                    <div className="space-y-2">
                      {data?.featureAnalysis?.filter((f: FeatureDemand) => 
                        f.impactScore > 50 && f.implementationDifficulty > 3
                      ).map((f: FeatureDemand) => (
                        <div key={f.feature} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm inline-block mr-2">
                          {f.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-1/2 h-1/2 border-r p-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      🤷 Nice to Have (Low Impact, Low Effort)
                    </div>
                    <div className="space-y-2">
                      {data?.featureAnalysis?.filter((f: FeatureDemand) => 
                        f.impactScore <= 50 && f.implementationDifficulty <= 3
                      ).map((f: FeatureDemand) => (
                        <div key={f.feature} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm inline-block mr-2">
                          {f.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-1/2 h-1/2 p-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      ❌ Reconsider (Low Impact, High Effort)
                    </div>
                    <div className="space-y-2">
                      {data?.featureAnalysis?.filter((f: FeatureDemand) => 
                        f.impactScore <= 50 && f.implementationDifficulty > 3
                      ).map((f: FeatureDemand) => (
                        <div key={f.feature} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm inline-block mr-2">
                          {f.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Axis labels */}
                <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 text-sm text-gray-500">
                  Implementation Difficulty →
                </div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm text-gray-500">
                  Impact Score →
                </div>
              </div>
            </div>

            {/* Feature Details Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Analysis</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Top Choice %</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Impact Score</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correlations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.featureAnalysis?.map((feature: FeatureDemand) => (
                      <tr key={feature.feature} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{feature.displayName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            feature.avgRating >= 4 ? 'text-green-600' : 
                            feature.avgRating >= 3 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {feature.avgRating.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            feature.topChoicePercent >= 50 ? 'text-green-600' : 
                            feature.topChoicePercent >= 30 ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {feature.topChoicePercent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${feature.impactScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm">{feature.impactScore.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feature.implementationDifficulty <= 3 ? 'bg-green-100 text-green-800' :
                            feature.implementationDifficulty <= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {feature.implementationDifficulty}/10
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {feature.correlatedFeatures.map((corr, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {corr}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sales Dashboard */}
        {currentView === 'sales' && (
          <div className="space-y-6">
            {/* Sales Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Qualified Leads</h3>
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{data?.salesMetrics?.qualifiedLeads || 0}</p>
                <p className="text-sm text-gray-500 mt-1">With email & score 60+</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Hot Leads 🔥</h3>
                  <Star className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{data?.salesMetrics?.hotLeads || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Score 80+ & $120+ willingness</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Projected Revenue</h3>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${Math.round(data?.salesMetrics?.projectedRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">30% conversion estimate</p>
              </div>
            </div>

            {/* Customer Segments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Segments</h2>
              
              <div className="grid gap-4">
                {data?.segments?.map((segment: CustomerSegment) => (
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
                            💰 Average willingness: <span className="font-semibold">${Math.round(segment.avgPrice)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            ✉️ Emails collected: <span className="font-semibold">{segment.emails.length}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            🎯 Segment score: <span className="font-semibold">{segment.score}/100</span>
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
                        
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Top Features</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.topFeatures.map((feature, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <button
                          onClick={() => exportSegmentEmails(segment)}
                          className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export Emails
                        </button>
                        <button
                          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Strategy by Market</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data?.marketOpportunities?.slice(0, 4).map((market: MarketOpportunity) => {
                  const responses = data.raw.filter((r: any) => r.languages?.includes(market.language));
                  const priceDistribution: Record<string, number> = {};
                  
                  responses.forEach((r: any) => {
                    if (r.price_range) {
                      priceDistribution[r.price_range] = (priceDistribution[r.price_range] || 0) + 1;
                    }
                  });
                  
                  return (
                    <div key={market.language} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{market.language}</h3>
                      
                      <div className="space-y-2">
                        {Object.entries(priceDistribution)
                          .sort(([a], [b]) => {
                            const order = ['Up to $80', '$80-120', '$120-150', '$150-200', 'Over $200'];
                            return order.indexOf(a) - order.indexOf(b);
                          })
                          .map(([range, count]) => {
                            const percentage = (count / responses.length) * 100;
                            return (
                              <div key={range} className="flex items-center space-x-2">
                                <span className="text-sm w-24">{range}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6">
                                  <div
                                    className="h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-2"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 10 && (
                                      <span className="text-xs text-white font-medium">
                                        {percentage.toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {percentage < 10 && (
                                  <span className="text-xs text-gray-500 w-8">
                                    {percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          Sweet spot: <span className="font-semibold text-green-600">${market.avgPrice}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Marketing Dashboard */}
        {currentView === 'marketing' && (
          <div className="space-y-6">
            {/* Top Marketing Message */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-2">Your #1 Marketing Message</h2>
              <p className="text-3xl font-bold">{data?.marketingData?.topMessage}</p>
              <p className="mt-2 text-blue-100">Based on customer priority analysis</p>
            </div>

            {/* Purchase Priorities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What Motivates Purchase?</h2>
              
              <div className="space-y-4">
                {Object.entries(data?.marketingData?.purchasePriorities || {}).map(([key, values]: [string, any]) => {
                  const total = values.reduce((a: number, b: number) => a + b, 0);
                  const weighted = values.reduce((acc: number, count: number, index: number) => 
                    acc + count * (5 - index), 0
                  );
                  
                  const priorityLabels: Record<string, string> = {
                    savingTime: 'Saving Time (10+ min/day)',
                    reducingErrors: 'Reducing Errors (50% less)',
                    lessFrustration: 'Less Frustration',
                    lookProfessional: 'Looking Professional',
                    typingSpeed: 'Typing Speed'
                  };
                  
                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {priorityLabels[key] || key}
                        </h3>
                        <span className="text-sm text-gray-500">
                          Priority score: {weighted}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {values.map((count: number, index: number) => {
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={index} className="flex-1">
                              <div className="text-xs text-center text-gray-500 mb-1">
                                #{index + 1}
                              </div>
                              <div className="bg-gray-200 rounded h-20 flex flex-col justify-end">
                                <div
                                  className={`rounded transition-all ${
                                    index === 0 ? 'bg-green-500' :
                                    index === 1 ? 'bg-green-400' :
                                    index === 2 ? 'bg-yellow-400' :
                                    index === 3 ? 'bg-orange-400' :
                                    'bg-red-400'
                                  }`}
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-center text-gray-600 mt-1">
                                {count}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel Preference */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Where They Want to Buy</h2>
              
              <div className="space-y-3">
                {Object.entries(data?.marketingData?.channelPreference || {})
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([channel, count]: [string, any]) => {
                    const percentage = data?.total > 0 ? (count / data.total) * 100 : 0;
                    
                    return (
                      <div key={channel} className="flex items-center space-x-3">
                        <div className="w-40 text-sm font-medium text-gray-700">{channel}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-8">
                          <div
                            className="h-8 rounded-full bg-blue-600 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 5 && (
                              <span className="text-sm text-white font-medium">
                                {percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {percentage <= 5 && (
                          <span className="text-sm text-gray-500 w-10">
                            {percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Key Insight:</strong> {data?.marketingData?.preferredChannel} is the preferred channel.
                  Focus your initial sales efforts here for maximum conversion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Operations Dashboard */}
        {currentView === 'operations' && (
          <div className="space-y-6">
            {/* Data Quality */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Data Quality Monitor</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.completionRate?.toFixed(0) || 0}%
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg Time</span>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">4:23</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Test Data</span>
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.raw?.filter((r: any) => r.overall_score < 30 || r.completion_time < 60).length || 0}
                  </p>
                  <button
                    onClick={handleDeleteTestData}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Clean Up →
                  </button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Records</span>
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Responses Table */}
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
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">WPM</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.raw?.slice(0, 10).map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.languages?.[0] || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-center font-bold">
                          {r.overall_score || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-center">
                          {r.total_wpm || 0}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.price_range || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {r.email || '-'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {r.discount_code ? (
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
            {/* Deep Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Research & Deep Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language Error Analysis */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Language Error Patterns</h3>
                  <div className="space-y-2">
                    {data?.raw && (() => {
                      const avgErrors = data.raw.reduce((acc: number, r: any) => 
                        acc + (r.total_language_errors || 0), 0
                      ) / data.raw.length;
                      
                      const highErrorUsers = data.raw.filter((r: any) => 
                        r.total_language_errors > avgErrors * 1.5
                      );
                      
                      return (
                        <>
                          <p className="text-sm text-gray-600">
                            Average language errors: <span className="font-semibold">{avgErrors.toFixed(1)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            High error users: <span className="font-semibold">{highErrorUsers.length}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Correlation with age 45+: <span className="font-semibold">
                              {(highErrorUsers.filter((r: any) => 
                                r.age === '46-55' || r.age === '55+'
                              ).length / highErrorUsers.length * 100).toFixed(0)}%
                            </span>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Frustration Analysis */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Frustration Factors</h3>
                  <div className="space-y-2">
                    {data?.raw && (() => {
                      const highFrustration = data.raw.filter((r: any) => 
                        r.frustration_score >= 7
                      );
                      
                      const avgSwitches = highFrustration.reduce((acc: number, r: any) => 
                        acc + (r.total_language_switches || 0), 0
                      ) / (highFrustration.length || 1);
                      
                      return (
                        <>
                          <p className="text-sm text-gray-600">
                            High frustration users: <span className="font-semibold">
                              {highFrustration.length} ({(highFrustration.length / data.raw.length * 100).toFixed(0)}%)
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Avg language switches: <span className="font-semibold">{avgSwitches.toFixed(1)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Main occupation: <span className="font-semibold">
                              {(() => {
                                const occupations: Record<string, number> = {};
                                highFrustration.forEach((r: any) => {
                                  if (r.occupation) {
                                    occupations[r.occupation] = (occupations[r.occupation] || 0) + 1;
                                  }
                                });
                                return Object.entries(occupations)
                                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
                              })()}
                            </span>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Conversion Funnel Analysis</h3>
                  <div className="space-y-2">
                    {(() => {
                      const started = data?.total || 0;
                      const completedTyping = data?.raw?.filter((r: any) => r.total_wpm > 0).length || 0;
                      const completedFeatures = data?.raw?.filter((r: any) => r.top_features?.length > 0).length || 0;
                      const completedSurvey = data?.raw?.filter((r: any) => r.discount_code).length || 0;
                      const providedEmail = data?.raw?.filter((r: any) => r.email).length || 0;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Started</span>
                            <span className="font-semibold">{started}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completed Typing</span>
                            <span className="font-semibold">{completedTyping} ({(completedTyping/started*100).toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Selected Features</span>
                            <span className="font-semibold">{completedFeatures} ({(completedFeatures/started*100).toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completed Survey</span>
                            <span className="font-semibold">{completedSurvey} ({(completedSurvey/started*100).toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Provided Email</span>
                            <span className="font-semibold">{providedEmail} ({(providedEmail/started*100).toFixed(0)}%)</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Statistical Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Statistical Summary</h3>
                  <div className="space-y-2">
                    {data?.raw && (() => {
                      const scores = data.raw.map((r: any) => r.overall_score || 0).sort((a: number, b: number) => a - b);
                      const median = scores[Math.floor(scores.length / 2)];
                      const q1 = scores[Math.floor(scores.length * 0.25)];
                      const q3 = scores[Math.floor(scores.length * 0.75)];
                      
                      return (
                        <>
                          <p className="text-sm text-gray-600">
                            Median Score: <span className="font-semibold">{median}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Q1 - Q3: <span className="font-semibold">{q1} - {q3}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Standard Deviation: <span className="font-semibold">
                              {(() => {
                                const mean = data.avgScore;
                                const variance = scores.reduce((acc: number, score: number) => 
                                  acc + Math.pow(score - mean, 2), 0
                                ) / scores.length;
                                return Math.sqrt(variance).toFixed(1);
                              })()}
                            </span>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Research Export Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => generateReport('investor')}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <Briefcase className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Investor Report</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Market analysis, opportunity size, and projections
                  </p>
                </button>
                
                <button
                  onClick={() => generateReport('product')}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <Package className="w-6 h-6 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Product Roadmap</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Feature priorities and development recommendations
                  </p>
                </button>
                
                <button
                  onClick={() => generateReport('marketing')}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <Target className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Marketing Strategy</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Messaging, channels, and campaign recommendations
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;