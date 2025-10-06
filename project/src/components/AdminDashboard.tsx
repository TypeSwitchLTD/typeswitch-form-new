import React, { useState, useEffect, useMemo } from 'react';
import { getAllSurveyResponses, deleteSurveyResponses } from '../lib/supabase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  Users, Mail, Brain, TrendingUp, Clock, Target, Award,
  Download, LogOut, RefreshCw, Search, Filter, X, ChevronDown,
  ChevronUp, Eye, Trash2, FileText, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Calendar, Activity, Zap, Package,
  BarChart3, PieChart as PieChartIcon, Settings, Globe, Layers
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Types
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
  keyboard_type: string;
  current_keyboard: string[];
  
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
  flow_breaker_impact?: string;
  professional_image_impact?: string;
  high_pace_challenge?: string;
  coping_mechanism_text?: string;
  coping_mechanism_none?: boolean;
  
  overall_value_proposition?: string;
  feature_ranking?: string[];
  final_feedback_text?: string;
  
  screen_times?: Record<string, number>;
  drop_off_screen?: string;
  browser_closed_at?: string;
  completion_time?: number;
  
  ip_country?: string;
  device_type?: string;
}

// Constants
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  pink: '#EC4899',
  gray: '#6B7280'
};

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#14B8A6', '#EC4899', '#6B7280', '#F97316', '#06B6D4'
];

const featureNames: Record<string, string> = {
  mechanical: 'מקלדת מכנית',
  physical_switch: 'בורר שפות פיזי',
  auto_detection: 'זיהוי שפה אוטומטי',
  dynamic_lighting: 'תאורה דינמית לפי שפה',
  wireless: 'חיבור אלחוטי יציב',
  mic: 'מיקרופון מובנה איכותי',
  wrist_rest: 'משענת יד ארגונומית',
  programmable_keys: 'מקשים ניתנים לתכנות',
  rotary_knob: 'חוגה סיבובית',
  visual_display: 'תצוגה ויזואלית'
};

const symptomTranslations: Record<string, string> = {
  glance_icon: 'בודק אייקון שפה',
  extra_shortcut: 'לוחץ Alt+Shift מיותר',
  type_and_check: 'מקליד ובודק',
  preventive_none: 'ללא מניעה',
  delete_word: 'מוחק מילים',
  wrong_punctuation: 'טעויות פיסוק',
  sent_wrong_lang: 'שולח בשפה לא נכונה',
  delete_line: 'מוחק שורות',
  go_back_fix: 'חוזר לתקן',
  caps_lock_error: 'טעות Caps Lock',
  micro_none: 'ללא תיקונים קטנים',
  mental_effort: 'מאמץ מנטלי',
  shortcut_conflict: 'קונפליקט קיצורים',
  use_3rd_party: 'משתמש בכלי חיצוני',
  avoid_multilingual: 'נמנע ממסמכים רב-לשוניים',
  use_separate_apps: 'אפליקציות נפרדות',
  self_talk: 'דיבור פנימי',
  shortcut_memory: 'שוכח קיצורים',
  none_of_above: 'אף אחד מהנ"ל'
};

// Helper Functions
const calculateROI = (response: SurveyResponse) => {
  if (!response.test_completed || !response.completion_time) return null;
  
  const wastedSeconds = 
    ((response.total_language_errors || 0) * 3) + 
    ((response.total_deletions || 0) * 0.3) + 
    ((response.total_corrections || 0) * 2);
  
  const testMinutes = response.completion_time / 60;
  const wastedPerMinute = wastedSeconds / testMinutes;
  const dailyMinutes = (wastedPerMinute * 90) / 60;
  const monthlyHours = (dailyMinutes * 22) / 60;
  const yearlyHours = monthlyHours * 12;
  
  return {
    dailyMinutes: Math.round(dailyMinutes * 10) / 10,
    monthlyHours: Math.round(monthlyHours * 10) / 10,
    yearlyHours: Math.round(yearlyHours)
  };
};

const calculateAverageROI = (data: SurveyResponse[]) => {
  const completedTests = data.filter(r => r.test_completed);
  if (completedTests.length === 0) return null;
  
  const totals = completedTests.reduce((acc, r) => {
    const roi = calculateROI(r);
    if (roi) {
      acc.daily += roi.dailyMinutes;
      acc.monthly += roi.monthlyHours;
      acc.yearly += roi.yearlyHours;
      acc.count++;
    }
    return acc;
  }, { daily: 0, monthly: 0, yearly: 0, count: 0 });
  
  if (totals.count === 0) return null;
  
  return {
    dailyMinutes: Math.round((totals.daily / totals.count) * 10) / 10,
    monthlyHours: Math.round((totals.monthly / totals.count) * 10) / 10,
    yearlyHours: Math.round(totals.yearly / totals.count)
  };
};

const calculateMonetaryROI = (salary: number, avgROI: ReturnType<typeof calculateAverageROI>) => {
  if (!avgROI || !salary) return null;
  
  const hourlyRate = salary / 176;
  
  return {
    daily: Math.round((avgROI.dailyMinutes / 60) * hourlyRate),
    monthly: Math.round(avgROI.monthlyHours * hourlyRate),
    yearly: Math.round(avgROI.yearlyHours * hourlyRate)
  };
};

const getSegmentScore = (data: SurveyResponse[], segment: string) => {
  const segmentData = segment === 'adhd' 
    ? data.filter(r => r.diagnosis?.includes('adhd'))
    : data.filter(r => r.occupation === segment);
  
  if (segmentData.length === 0) return { avg: 0, count: 0 };
  
  const scores = segmentData
    .filter(r => r.overall_score)
    .map(r => r.overall_score!);
  
  return {
    avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    count: segmentData.length
  };
};

const getFeatureRanking = (data: SurveyResponse[]) => {
  const rankings: Record<string, number[]> = {};
  
  data.forEach(response => {
    if (response.feature_ranking && response.feature_ranking.length > 0) {
      response.feature_ranking.forEach((feature, index) => {
        if (!rankings[feature]) rankings[feature] = [];
        rankings[feature].push(index + 1);
      });
    }
  });
  
  const totalWithRankings = data.filter(r => r.feature_ranking && r.feature_ranking.length > 0).length;
  
  const results = Object.entries(rankings).map(([feature, positions]) => {
    const firstPlace = positions.filter(p => p === 1).length;
    const totalVotes = positions.length;
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    
    return {
      feature,
      name: featureNames[feature] || feature,
      firstPlace,
      totalVotes,
      avgPosition: Math.round(avgPosition * 10) / 10,
      firstPlacePercent: totalWithRankings > 0 ? Math.round((firstPlace / totalWithRankings) * 100) : 0
    };
  });
  
  return results.sort((a, b) => b.firstPlace - a.firstPlace);
};

const getSymptomStats = (data: SurveyResponse[]) => {
  const symptoms: Record<string, number> = {};
  
  data.forEach(response => {
    if (response.awakening_symptoms) {
      response.awakening_symptoms.forEach(symptom => {
        symptoms[symptom] = (symptoms[symptom] || 0) + 1;
      });
    }
  });
  
  return Object.entries(symptoms)
    .map(([key, count]) => ({
      symptom: key,
      name: symptomTranslations[key] || key,
      count,
      percentage: Math.round((count / data.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getPriorityLabel = (percentage: number) => {
  if (percentage >= 70) return { label: 'Must-Have', color: 'bg-red-100 text-red-800' };
  if (percentage >= 50) return { label: 'High Priority', color: 'bg-orange-100 text-orange-800' };
  if (percentage >= 30) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Nice-to-Have', color: 'bg-gray-100 text-gray-800' };
};

interface DashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [filteredData, setFilteredData] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLanguage, setExportLanguage] = useState<'he' | 'en'>('he');
  const [exportType, setExportType] = useState('full');
  const ITEMS_PER_PAGE = 50;
  
  const [filters, setFilters] = useState({
    language: 'all',
    occupation: 'all',
    diagnosis: 'all',
    discountCode: ''
  });
  
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [roiResults, setRoiResults] = useState<ReturnType<typeof calculateMonetaryROI>>(null);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

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
        setFilteredData(completedSurveys);
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת הנתונים');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...data];
    
    if (filters.language !== 'all') {
      filtered = filtered.filter(r => r.languages?.includes(filters.language));
    }
    if (filters.occupation !== 'all') {
      filtered = filtered.filter(r => r.occupation === filters.occupation);
    }
    if (filters.diagnosis !== 'all') {
      if (filters.diagnosis === 'adhd') {
        filtered = filtered.filter(r => r.diagnosis?.includes('adhd'));
      } else if (filters.diagnosis === 'none') {
        filtered = filtered.filter(r => r.diagnosis?.includes('none') || !r.diagnosis?.length);
      }
    }
    if (filters.discountCode) {
      filtered = filtered.filter(r => 
        r.discount_code?.toLowerCase().includes(filters.discountCode.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [filters, data]);

  const stats = useMemo(() => {
    const withEmail = data.filter(r => r.email).length;
    const withADHD = data.filter(r => r.diagnosis?.includes('adhd')).length;
    const otherLearning = data.filter(r => 
      r.diagnosis?.some(d => d !== 'adhd' && d !== 'none' && d !== 'undiagnosed')
    ).length;
    const completedTest = data.filter(r => r.test_completed).length;
    const avgROI = calculateAverageROI(data);
    
    return {
      total: data.length,
      withEmail,
      withEmailPercent: data.length > 0 ? Math.round((withEmail / data.length) * 100) : 0,
      withADHD,
      withADHDPercent: data.length > 0 ? Math.round((withADHD / data.length) * 100) : 0,
      otherLearning,
      otherLearningPercent: data.length > 0 ? Math.round((otherLearning / data.length) * 100) : 0,
      completedTest,
      completedTestPercent: data.length > 0 ? Math.round((completedTest / data.length) * 100) : 0,
      avgROI
    };
  }, [data]);

  const symptomStats = useMemo(() => getSymptomStats(data), [data]);
  const featureRanking = useMemo(() => getFeatureRanking(data), [data]);

  const adhdInsight = useMemo(() => {
    const adhd = data.filter(r => r.diagnosis?.includes('adhd'));
    const nonAdhd = data.filter(r => !r.diagnosis?.includes('adhd'));
    
    const adhdScores = adhd.filter(r => r.overall_score).map(r => r.overall_score!);
    const nonAdhdScores = nonAdhd.filter(r => r.overall_score).map(r => r.overall_score!);
    
    if (adhdScores.length === 0 || nonAdhdScores.length === 0) {
      return { difference: 0, adhdAvg: 0, nonAdhdAvg: 0 };
    }
    
    const adhdAvg = adhdScores.reduce((a, b) => a + b, 0) / adhdScores.length;
    const nonAdhdAvg = nonAdhdScores.reduce((a, b) => a + b, 0) / nonAdhdScores.length;
    const difference = Math.round(((nonAdhdAvg - adhdAvg) / nonAdhdAvg) * 100);
    
    return { difference, adhdAvg: Math.round(adhdAvg), nonAdhdAvg: Math.round(nonAdhdAvg) };
  }, [data]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תשובה זו?')) return;
    
    try {
      const result = await deleteSurveyResponses([id]);
      if (result.success) {
        setData(prev => prev.filter(r => r.id !== id));
      } else {
        alert('שגיאה במחיקת התשובה');
      }
    } catch (err) {
      alert('שגיאה במחיקת התשובה');
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `TypeSwitch_Report_${exportType}_${new Date().toLocaleDateString('en-US')}.pdf`;
      pdf.save(fileName);
      
      setShowExportModal(false);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('שגיאה בייצוא PDF');
    }
  };

  const tabs = language === 'he' 
    ? ['סיכום מנהלים', 'כאבים וקהלים', 'פיצ\'רים', 'נתונים גולמיים', 'התנהגות']
    : ['Executive', 'Pain Points', 'Features', 'Raw Data', 'Behavior'];

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              TypeSwitch Command Center
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <Globe className="w-4 h-4" />
                {language === 'he' ? 'EN' : 'עב'}
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                {language === 'he' ? 'ייצוא דוח' : 'Export'}
              </button>
              
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                {language === 'he' ? 'יציאה' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 rtl:space-x-reverse">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === index
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">מעדכן נתונים...</span>
          </div>
        ) : (
          <>
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
                    </div>
                    <p className="text-gray-600 text-sm">סה"כ השלימו</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Mail className="w-8 h-8 text-green-600" />
                      <span className="text-2xl font-bold text-gray-800">
                        {stats.withEmail} ({stats.withEmailPercent}%)
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">עם אימייל</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Brain className="w-8 h-8 text-purple-600" />
                      <span className="text-2xl font-bold text-gray-800">
                        {stats.withADHD} ({stats.withADHDPercent}%)
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">עם ADHD</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="w-8 h-8 text-orange-600" />
                      <span className="text-2xl font-bold text-gray-800">
                        {stats.otherLearning} ({stats.otherLearningPercent}%)
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">לקויות למידה אחרות</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-8 h-8 text-teal-600" />
                      <span className="text-2xl font-bold text-gray-800">
                        {stats.completedTest} ({stats.completedTestPercent}%)
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">השלימו מבחן</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    5 התובנות המרכזיות
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>
                        {symptomStats[0]?.percentage || 0}% מהמשתמשים סובלים מ{symptomStats[0]?.name || 'תסמין'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>
                        משתמשי ADHD מקבלים ציון נמוך ב-{adhdInsight.difference}% מהממוצע
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>
                        {featureRanking[0]?.firstPlacePercent || 0}% מדרגים {featureRanking[0]?.name || 'פיצ\'ר'} במקום ראשון
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <span>
                        {data.filter(r => r.occupation === 'translation').length} מתרגמים בסקר, 
                        ציון ממוצע {getSegmentScore(data, 'translation').avg}/100
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <span>
                        {data.filter(r => r.test_completed).length > 0 
                          ? `מהירות הקלדה ממוצעת: ${Math.round(
                              data.filter(r => r.test_completed)
                                .reduce((a, r) => a + (r.total_wpm || 0), 0) / 
                              data.filter(r => r.test_completed).length
                            )} WPM`
                          : 'אין נתוני מבחן'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">חישוב ROI - זמן מבוזבז</h3>
                  
                  {stats.avgROI ? (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-800">{stats.avgROI.dailyMinutes}</p>
                        <p className="text-sm text-gray-600">דקות ביום</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-800">{stats.avgROI.monthlyHours}</p>
                        <p className="text-sm text-gray-600">שעות בחודש</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-800">{stats.avgROI.yearlyHours}</p>
                        <p className="text-sm text-gray-600">שעות בשנה</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">אין מספיק נתונים לחישוב ROI</p>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">חישוב עלות כספית</h4>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="שכר חודשי ב-₪"
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        onClick={() => setRoiResults(calculateMonetaryROI(Number(monthlySalary), stats.avgROI))}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        חשב
                      </button>
                    </div>
                    
                    {roiResults && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xl font-bold text-green-600">₪{roiResults.daily}</p>
                          <p className="text-sm text-gray-600">ליום</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xl font-bold text-blue-600">₪{roiResults.monthly}</p>
                          <p className="text-sm text-gray-600">לחודש</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xl font-bold text-purple-600">₪{roiResults.yearly}</p>
                          <p className="text-sm text-gray-600">לשנה</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">פילוח לפי תחומים</h3>
                    <div className="space-y-3">
                      {['tech', 'translation', 'sales', 'student', 'marketing', 'design', 'education', 'other'].map(occ => {
                        const count = data.filter(r => r.occupation === occ).length;
                        const percent = data.length > 0 ? Math.round((count / data.length) * 100) : 0;
                        return (
                          <div key={occ}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{occ}</span>
                              <span>{count} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">פילוח לפי שפות</h3>
                    <div className="space-y-3">
                      {['Hebrew-English', 'Russian-English', 'Arabic-English'].map(lang => {
                        const count = data.filter(r => r.languages?.includes(lang)).length;
                        const percent = data.length > 0 ? Math.round((count / data.length) * 100) : 0;
                        return (
                          <div key={lang}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{lang.replace('-', ' + ')}</span>
                              <span>{count} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
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
            )}

            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    5 נקודות הכאב המרכזיות
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const flowBreak = data.filter(r => r.flow_breaker_impact === 'mental').length;
                      const professional = data.filter(r => r.professional_image_impact === 'correction_focus').length;
                      const avoidance = data.filter(r => r.awakening_symptoms?.includes('avoid_multilingual')).length;
                      
                      return (
                        <>
                          <div>1. {Math.round((flowBreak / data.length) * 100)}% חווים שבירת ריכוז במעבר שפה</div>
                          <div>2. {Math.round((professional / data.length) * 100)}% חוששים מתדמית לא מקצועית</div>
                          <div>3. {symptomStats[0]?.percentage || 0}% סובלים מ{symptomStats[0]?.name || 'תסמין'}</div>
                          <div>4. {Math.round((avoidance / data.length) * 100)}% נמנעים ממסמכים רב-לשוניים</div>
                          <div>5. משתמשי ADHD מדווחים על קושי גבוה ב-{adhdInsight.difference}% מהממוצע</div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
                    <h4 className="font-bold text-yellow-800 mb-3">לפני ההקלדה</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const checksIcon = data.filter(r => r.awakening_symptoms?.includes('glance_icon')).length;
                        const extraShortcut = data.filter(r => r.awakening_symptoms?.includes('extra_shortcut')).length;
                        return (
                          <>
                            <p>{Math.round((checksIcon / data.length) * 100)}% בודקים אייקון</p>
                            <p>{Math.round((extraShortcut / data.length) * 100)}% לוחצים Alt+Shift מיותר</p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-2xl">😟</span>
                      <p className="text-yellow-800 font-semibold">חרדה</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
                    <h4 className="font-bold text-red-800 mb-3">תוך כדי</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const deleteWord = data.filter(r => r.awakening_symptoms?.includes('delete_word')).length;
                        const sentWrong = data.filter(r => r.awakening_symptoms?.includes('sent_wrong_lang')).length;
                        return (
                          <>
                            <p>{Math.round((deleteWord / data.length) * 100)}% מוחקים מילים</p>
                            <p>{Math.round((sentWrong / data.length) * 100)}% שולחים בשפה לא נכונה</p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-2xl">😤</span>
                      <p className="text-red-800 font-semibold">תסכול</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6">
                    <h4 className="font-bold text-orange-800 mb-3">פתרונות</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const avoidDocs = data.filter(r => r.awakening_symptoms?.includes('avoid_multilingual')).length;
                        const separateApps = data.filter(r => r.awakening_symptoms?.includes('use_separate_apps')).length;
                        return (
                          <>
                            <p>{Math.round((avoidDocs / data.length) * 100)}% נמנעים ממסמכים</p>
                            <p>{Math.round((separateApps / data.length) * 100)}% אפליקציות נפרדות</p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-2xl">🚫</span>
                      <p className="text-orange-800 font-semibold">הימנעות</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">TOP 5 - מי סובל הכי הרבה?</h3>
                  <div className="space-y-3">
                    {(() => {
                      const segments = ['adhd', 'translation', 'tech', 'sales', 'student', 'marketing', 'design', 'education'];
                      const scores = segments
                        .map(seg => ({ segment: seg, ...getSegmentScore(data, seg) }))
                        .filter(s => s.count > 0)
                        .sort((a, b) => a.avg - b.avg)
                        .slice(0, 5);
                      
                      return scores.map((seg, idx) => (
                        <div key={seg.segment}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {idx + 1}. {seg.segment === 'adhd' ? 'ADHD' : seg.segment}
                            </span>
                            <span className="text-sm text-gray-600">
                              {seg.avg}/100 ({seg.count})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all ${
                                seg.avg < 50 ? 'bg-red-600' :
                                seg.avg < 70 ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }`}
                              style={{ width: `${seg.avg}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {stats.completedTest > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">נתוני מבחן ההקלדה</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {(() => {
                        const completed = data.filter(r => r.test_completed);
                        const avgWPM = Math.round(completed.reduce((a, r) => a + (r.total_wpm || 0), 0) / completed.length);
                        const avgAccuracy = Math.round(completed.reduce((a, r) => a + (r.total_accuracy || 0), 0) / completed.length);
                        const avgLangErrors = (completed.reduce((a, r) => a + (r.total_language_errors || 0), 0) / completed.length).toFixed(1);
                        const avgPuncErrors = (completed.reduce((a, r) => a + (r.total_punctuation_errors || 0), 0) / completed.length).toFixed(1);
                        
                        return (
                          <>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600">{avgWPM}</p>
                              <p className="text-sm text-gray-600">WPM ממוצע</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-green-600">{avgAccuracy}%</p>
                              <p className="text-sm text-gray-600">דיוק ממוצע</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-red-600">{avgLangErrors}</p>
                              <p className="text-sm text-gray-600">שגיאות שפה</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-orange-600">{avgPuncErrors}</p>
                              <p className="text-sm text-gray-600">שגיאות ניקוד</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-center mt-4 text-gray-600">
                      טועים יותר בשפה מאשר בניקוד
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    5 הפיצ'רים המובילים
                  </h3>
                  <div className="space-y-2">
                    {featureRanking.slice(0, 5).map((feature, idx) => (
                      <div key={feature.feature}>
                        {idx + 1}. {feature.name} - {feature.firstPlacePercent}% מדרגים במקום ראשון
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">כל הפיצ'רים</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {featureRanking.map(feature => {
                      const priority = getPriorityLabel(feature.firstPlacePercent);
                      return (
                        <div key={feature.feature} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{feature.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            מקום ראשון: {feature.firstPlacePercent}% | 
                            ממוצע: {feature.avgPosition}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                feature.firstPlacePercent >= 70 ? 'bg-red-600' :
                                feature.firstPlacePercent >= 50 ? 'bg-orange-600' :
                                feature.firstPlacePercent >= 30 ? 'bg-yellow-600' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${feature.firstPlacePercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
                  <h3 className="text-lg font-bold mb-4">פיצ'רים לפי קהל</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">קהל</th>
                        {featureRanking.slice(0, 5).map(f => (
                          <th key={f.feature} className="text-center py-2 px-4 text-sm">
                            {f.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['adhd', 'translation', 'tech', 'sales', 'student'].map(segment => {
                        const segmentData = segment === 'adhd' 
                          ? data.filter(r => r.diagnosis?.includes('adhd'))
                          : data.filter(r => r.occupation === segment);
                        
                        if (segmentData.length === 0) return null;
                        
                        return (
                          <tr key={segment} className="border-b">
                            <td className="py-2 px-4 font-medium">
                              {segment === 'adhd' ? 'ADHD' : segment}
                            </td>
                            {featureRanking.slice(0, 5).map(feature => {
                              const segmentFirst = segmentData.filter(r => 
                                r.feature_ranking?.[0] === feature.feature
                              ).length;
                              const percent = Math.round((segmentFirst / segmentData.length) * 100);
                              
                              return (
                                <td key={feature.feature} className="text-center py-2 px-4">
                                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                                    percent >= 70 ? 'bg-red-100 text-red-800' :
                                    percent >= 50 ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {percent}%
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="grid grid-cols-5 gap-4">
                    <select
                      value={filters.language}
                      onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="all">כל השפות</option>
                      <option value="Hebrew-English">עברית-אנגלית</option>
                      <option value="Russian-English">רוסית-אנגלית</option>
                      <option value="Arabic-English">ערבית-אנגלית</option>
                    </select>
                    
                    <select
                      value={filters.occupation}
                      onChange={(e) => setFilters({ ...filters, occupation: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="all">כל התחומים</option>
                      <option value="tech">טכנולוגיה</option>
                      <option value="translation">תרגום</option>
                      <option value="sales">מכירות</option>
                      <option value="student">סטודנט</option>
                      <option value="marketing">שיווק</option>
                      <option value="design">עיצוב</option>
                      <option value="education">חינוך</option>
                      <option value="other">אחר</option>
                    </select>
                    
                    <select
                      value={filters.diagnosis}
                      onChange={(e) => setFilters({ ...filters, diagnosis: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="all">כל האבחונים</option>
                      <option value="adhd">ADHD</option>
                      <option value="none">ללא</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="חיפוש לפי קוד הנחה"
                      value={filters.discountCode}
                      onChange={(e) => setFilters({ ...filters, discountCode: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    />
                    
                    <button
                      onClick={() => setFilters({ language: 'all', occupation: 'all', diagnosis: 'all', discountCode: '' })}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      אפס
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      מציג {paginatedData.length} מתוך {filteredData.length} תשובות
                    </p>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ←
                        </button>
                        <span className="text-sm">
                          עמוד {currentPage} מתוך {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">שפות</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תחום</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">אבחון</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">קוד</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">פעולות</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedData.map((response) => (
                          <tr key={response.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(response.created_at)}</td>
                            <td className="px-4 py-3 text-sm">{response.languages?.[0] || '-'}</td>
                            <td className="px-4 py-3 text-sm">{response.occupation || '-'}</td>
                            <td className="px-4 py-3">
                              {response.overall_score ? (
                                <span className={`px-2 py-1 rounded text-sm ${getScoreColor(response.overall_score)}`}>
                                  {response.overall_score}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {response.diagnosis?.includes('adhd') && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                  ADHD
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{response.discount_code}</td>
                            <td className="px-4 py-3 text-sm">{response.email || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedResponse(response);
                                    setShowDetailModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(response.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">זמן ממוצע בכל מסך</h3>
                  <div className="space-y-3">
                    {(() => {
                      const screenNames = ['welcome', 'demographics', 'beforeExercise', 'exercise1', 'selfAssessment', 'results', 'featureRating', 'purchase', 'thankYou'];
                      const screenTimes: Record<string, number[]> = {};
                      
                      data.forEach(response => {
                        if (response.screen_times) {
                          Object.entries(response.screen_times).forEach(([screen, time]) => {
                            if (!screenTimes[screen]) screenTimes[screen] = [];
                            screenTimes[screen].push(time as number);
                          });
                        }
                      });
                      
                      const avgTimes = screenNames.map(screen => {
                        const times = screenTimes[screen] || [];
                        const avg = times.length > 0 
                          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000)
                          : 0;
                        return { screen, avg, count: times.length };
                      });
                      
                      return avgTimes.map(({ screen, avg, count }) => (
                        <div key={screen}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium capitalize">{screen}</span>
                            <span className="text-sm text-gray-600">
                              {formatTime(avg)} ({count} משתמשים)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((avg / 120) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">ניתוח נטישות</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <FunnelChart>
                      <Funnel
                        dataKey="value"
                        data={(() => {
                          const stages = ['welcome', 'demographics', 'beforeExercise', 'exercise1', 'selfAssessment', 'results', 'featureRating', 'purchase', 'thankYou'];
                          const dropOffs: Record<string, number> = {};
                          
                          data.forEach(response => {
                            if (response.drop_off_screen) {
                              dropOffs[response.drop_off_screen] = (dropOffs[response.drop_off_screen] || 0) + 1;
                            }
                          });
                          
                          let remaining = data.length;
                          return stages.map((stage, idx) => {
                            const dropOff = dropOffs[stage] || 0;
                            const value = remaining;
                            remaining -= dropOff;
                            return { 
                              name: stage, 
                              value,
                              fill: CHART_COLORS[idx % CHART_COLORS.length]
                            };
                          });
                        })()}
                        isAnimationActive
                      >
                        <LabelList position="center" fill="#fff" stroke="none" />
                      </Funnel>
                      <Tooltip />
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">אחוז השלמה לפי שלב</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(() => {
                      const testCompleted = data.filter(r => r.test_completed).length;
                      const testSkipped = data.filter(r => r.test_skipped).length;
                      const emailProvided = data.filter(r => r.email).length;
                      
                      return (
                        <>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">
                              {Math.round((testCompleted / data.length) * 100)}%
                            </p>
                            <p className="text-sm text-gray-600">השלימו מבחן</p>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-3xl font-bold text-yellow-600">
                              {Math.round((testSkipped / data.length) * 100)}%
                            </p>
                            <p className="text-sm text-gray-600">דילגו על מבחן</p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">
                              {Math.round((emailProvided / data.length) * 100)}%
                            </p>
                            <p className="text-sm text-gray-600">השאירו אימייל</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">התפלגות סוגי מכשירים</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const devices: Record<string, number> = {};
                          data.forEach(response => {
                            const type = response.device_type || 'unknown';
                            devices[type] = (devices[type] || 0) + 1;
                          });
                          return Object.entries(devices).map(([name, value]) => ({
                            name,
                            value
                          }));
                        })()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(() => {
                          const devices: Record<string, number> = {};
                          data.forEach(response => {
                            const type = response.device_type || 'unknown';
                            devices[type] = (devices[type] || 0) + 1;
                          });
                          return Object.entries(devices).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ));
                        })()}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">ייצוא דוח</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שפה</label>
                <select 
                  value={exportLanguage}
                  onChange={(e) => setExportLanguage(e.target.value as 'he' | 'en')}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">סוג דוח</label>
                <select 
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="full">דוח מלא</option>
                  <option value="executive">סיכום מנהלים</option>
                  <option value="investor">דוח למשקיעים</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                ביטול
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                ייצא
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">פרטי תשובה</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">דמוגרפיה</h4>
                <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                  <p>שפות: {selectedResponse.languages?.join(', ')}</p>
                  <p>תחום: {selectedResponse.occupation}</p>
                  <p>שעות הקלדה: {selectedResponse.hours_typing}</p>
                  <p>גיל: {selectedResponse.age}</p>
                  <p>אבחון: {selectedResponse.diagnosis?.join(', ') || 'ללא'}</p>
                </div>
              </div>
              
              {selectedResponse.difficulty_rating && (
                <div>
                  <h4 className="font-semibold mb-2">הערכה עצמית</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                    <p>קושי: {selectedResponse.difficulty_rating}/5</p>
                    <p>טעויות: {selectedResponse.errors_rating}/5</p>
                    <p>החלפת שפה: {selectedResponse.language_switching_rating}/5</p>
                    <p>תסכול: {selectedResponse.frustration_rating}/5</p>
                  </div>
                </div>
              )}
              
              {selectedResponse.test_completed && (
                <div>
                  <h4 className="font-semibold mb-2">תוצאות מבחן</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                    <p>WPM: {selectedResponse.total_wpm}</p>
                    <p>דיוק: {selectedResponse.total_accuracy}%</p>
                    <p>שגיאות שפה: {selectedResponse.total_language_errors}</p>
                    <p>שגיאות ניקוד: {selectedResponse.total_punctuation_errors}</p>
                    <p>ציון כולל: {selectedResponse.overall_score}/100</p>
                  </div>
                </div>
              )}
              
              {selectedResponse.awakening_symptoms && selectedResponse.awakening_symptoms.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">תסמינים</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    {selectedResponse.awakening_symptoms.map(s => symptomTranslations[s] || s).join(', ')}
                  </div>
                </div>
              )}
              
              {selectedResponse.feature_ranking && selectedResponse.feature_ranking.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">דירוג פיצ'רים</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                    {selectedResponse.feature_ranking.map((f, idx) => (
                      <p key={f}>{idx + 1}. {featureNames[f] || f}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResponse.coping_mechanism_text && (
                <div>
                  <h4 className="font-semibold mb-2">שיטת התמודדות</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    {selectedResponse.coping_mechanism_text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
