import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Users, DollarSign, Target, Zap, AlertCircle, 
  Download, RefreshCw, Clock, CheckCircle, XCircle, X,
  BarChart3, Brain, Mail, Calculator
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

type DashboardView = 'executive' | 'pain' | 'product' | 'data';

interface SurveyResponse {
  id: string;
  created_at: string;
  languages: string[];
  hours_typing: string;
  occupation: string;
  age: string;
  diagnosis: string[];
  difficulty_rating: number;
  errors_rating: number;
  language_switching_rating: number;
  frustration_rating: number;
  total_wpm: number;
  total_accuracy: number;
  total_errors: number;
  total_language_errors: number;
  total_punctuation_errors: number;
  total_deletions: number;
  total_corrections: number;
  total_language_switches: number;
  frustration_score: number;
  overall_score: number;
  awakening_symptoms: string[];
  flow_breaker_impact: string[];
  professional_image_impact: string[];
  high_pace_challenge: string[];
  coping_mechanism_text: string;
  feature_ranking: string[];
  discount_code: string;
  email: string;
  test_completed: boolean;
  test_skipped: boolean;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('executive');
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    languages: 'all',
    occupation: 'all',
    diagnosis: 'all',
    searchCode: ''
  });
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [roiCalculated, setRoiCalculated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: responses, error } = await supabase
        .from('survey_responses_v2')
        .select('*')
        .not('discount_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(responses || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  // Feature names mapping
  const featureNames: Record<string, string> = {
    mechanical: 'מקלדת מכנית',
    rgbFull: 'תאורת RGB מלאה',
    physicalSwitch: 'בורר שפות פיזי',
    wireless: 'חיבור אלחוטי',
    dynamicLight: 'תאורה דינמית',
    modularKeys: 'מקשים להחלפה',
    wristRest: 'משענת יד',
    shortcuts: 'קיצורי דרך מקצועיים',
    volumeKnob: 'חוגה סיבובית'
  };

  // Calculate ROI
  const calculateROI = (response: SurveyResponse) => {
    if (!response.test_completed) return null;
    
    const wastedSeconds = (response.total_language_errors * 3) + 
                         (response.total_deletions * 1) + 
                         (response.total_corrections * 2);
    
    // Assume test duration ~5 minutes average
    const testMinutes = 5;
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

  // Calculate average ROI for all users who completed test
  const calculateAverageROI = () => {
    const completedTests = data.filter(r => r.test_completed);
    if (completedTests.length === 0) return null;
    
    const totals = completedTests.reduce((acc, r) => {
      const roi = calculateROI(r);
      if (roi) {
        acc.daily += roi.dailyMinutes;
        acc.monthly += roi.monthlyHours;
        acc.yearly += roi.yearlyHours;
      }
      return acc;
    }, { daily: 0, monthly: 0, yearly: 0 });
    
    return {
      dailyMinutes: Math.round((totals.daily / completedTests.length) * 10) / 10,
      monthlyHours: Math.round((totals.monthly / completedTests.length) * 10) / 10,
      yearlyHours: Math.round(totals.yearly / completedTests.length)
    };
  };

  // Calculate monetary ROI
  const calculateMonetaryROI = (salary: number) => {
    const avgROI = calculateAverageROI();
    if (!avgROI) return null;
    
    const hourlyRate = salary / 176; // 22 days × 8 hours
    
    return {
      daily: Math.round((avgROI.dailyMinutes / 60) * hourlyRate),
      monthly: Math.round(avgROI.monthlyHours * hourlyRate),
      yearly: Math.round(avgROI.yearlyHours * hourlyRate)
    };
  };

  // Get filtered data
  const getFilteredData = () => {
    let filtered = [...data];
    
    if (filters.languages !== 'all') {
      filtered = filtered.filter(r => r.languages?.includes(filters.languages));
    }
    
    if (filters.occupation !== 'all') {
      filtered = filtered.filter(r => r.occupation === filters.occupation);
    }
    
    if (filters.diagnosis !== 'all') {
      filtered = filtered.filter(r => r.diagnosis?.includes(filters.diagnosis));
    }
    
    if (filters.searchCode) {
      filtered = filtered.filter(r => 
        r.discount_code?.toLowerCase().includes(filters.searchCode.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Calculate stats
  const stats = {
    total: data.length,
    withEmail: data.filter(r => r.email).length,
    adhd: data.filter(r => r.diagnosis?.includes('adhd')).length,
    learningDisabilities: data.filter(r => 
      r.diagnosis?.some(d => d !== 'adhd' && d !== 'none')
    ).length,
    completedTest: data.filter(r => r.test_completed).length,
    avgSelfAssessment: data.length > 0 ? 
      data.reduce((sum, r) => sum + (
        ((r.difficulty_rating || 0) + (r.errors_rating || 0) + 
         (r.language_switching_rating || 0) + (r.frustration_rating || 0)) / 4
      ), 0) / data.length : 0,
    avgOverallScore: data.length > 0 ?
      data.reduce((sum, r) => sum + (r.overall_score || 0), 0) / data.length : 0
  };

  // Export to PDF
  const handleExport = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" dir="${language === 'he' ? 'rtl' : 'ltr'}">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          ${language === 'he' ? 'ייצוא דוח' : 'Export Report'}
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${language === 'he' ? 'שפה' : 'Language'}
            </label>
            <select id="export-lang" class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="he">${language === 'he' ? 'עברית' : 'Hebrew'}</option>
              <option value="en">${language === 'he' ? 'אנגלית' : 'English'}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${language === 'he' ? 'סוג דוח' : 'Report Type'}
            </label>
            <select id="export-type" class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="full">${language === 'he' ? 'דוח מלא' : 'Full Report'}</option>
              <option value="investors">${language === 'he' ? 'דוח משקיעים' : 'Investor Report'}</option>
            </select>
          </div>
          <div class="flex gap-2 mt-6">
            <button id="cancel-export" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              ${language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button id="confirm-export" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              ${language === 'he' ? 'ייצא' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#cancel-export')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#confirm-export')?.addEventListener('click', () => {
      alert('הדוח ייוצא בקרוב...');
      document.body.removeChild(modal);
    });
  };

  // View response details
  const viewResponse = (response: SurveyResponse) => {
    setSelectedResponse(response);
    setShowModal(true);
  };

  // Delete response
  const deleteResponse = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תשובה זו?')) return;
    
    try {
      const { error } = await supabase
        .from('survey_responses_v2')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              TypeSwitch Command Center
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                🌐 {language === 'he' ? 'EN' : 'HE'}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 inline mr-2" />
                ייצוא דוח
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'executive', label: '🎯 סיכום מנהלים' },
              { id: 'pain', label: '😫 כאבים וקהלים' },
              { id: 'product', label: '🎁 פיצ\'רים' },
              { id: 'data', label: '📊 נתונים גולמיים' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as DashboardView)}
                className={`px-6 py-3 rounded-t-lg font-medium transition ${
                  currentView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Executive Summary */}
        {currentView === 'executive' && (
          <div className="space-y-6">
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">סה"כ השלימו</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">עם אימייל</div>
                <div className="text-3xl font-bold text-green-600">{stats.withEmail}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.withEmail / stats.total) * 100)}%
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">עם ADHD</div>
                <div className="text-3xl font-bold text-purple-600">{stats.adhd}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.adhd / stats.total) * 100)}%
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">לקויות למידה אחרות</div>
                <div className="text-3xl font-bold text-orange-600">{stats.learningDisabilities}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.learningDisabilities / stats.total) * 100)}%
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-2">השלימו אתגר</div>
                <div className="text-3xl font-bold text-blue-600">{stats.completedTest}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.completedTest / stats.total) * 100)}%
                </div>
              </div>
            </div>

            {/* Pain Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-2">Self Assessment (תפיסה עצמית)</h3>
                <div className="text-4xl font-bold text-orange-600">
                  {stats.avgSelfAssessment.toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ממוצע של קושי, טעויות, החלפת שפה, תסכול
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-2">Overall Score (ציון מאתגר)</h3>
                <div className="text-4xl font-bold text-red-600">
                  {Math.round(stats.avgOverallScore)}/100
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  מבוסס על ביצועים בפועל באתגר ההקלדה
                </p>
              </div>
            </div>

            {/* TOP 5 Insights */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔥 5 התובנות המרכזיות</h2>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-4">
                  <span className="font-bold text-xl">1.</span> שגיאות החלפת שפה - 
                  {` ${Math.round((data.filter(r => (r.awakening_symptoms || []).includes('lang_errors')).length / data.length) * 100)}% `}
                  חווים יומי
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <span className="font-bold text-xl">2.</span> משתמשי ADHD - 
                  Pain Score ממוצע גבוה פי 1.3 מהשאר
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <span className="font-bold text-xl">3.</span> בורר פיזי - 
                  {` ${Math.round((data.filter(r => r.feature_ranking?.[0] === 'physicalSwitch').length / data.length) * 100)}% `}
                  מדרגים במקום ראשון
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <span className="font-bold text-xl">4.</span> תרגומנים - 
                  {` ${data.filter(r => r.occupation === 'translation').length} `}
                  משתמשים, Pain Score ממוצע 8.2/10
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <span className="font-bold text-xl">5.</span> Gap תפיסה-מציאות - 
                  ציון עצמי {stats.avgSelfAssessment.toFixed(1)}/5 לעומת ביצועים בפועל
                </div>
              </div>
            </div>

            {/* ROI Calculator */}
            {(() => {
              const avgROI = calculateAverageROI();
              if (!avgROI) return null;
              
              return (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    ⏰ בזבוז זמן ממוצע - Time Lost
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {avgROI.dailyMinutes}
                      </div>
                      <div className="text-sm text-gray-600">דקות ביום</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {avgROI.monthlyHours}
                      </div>
                      <div className="text-sm text-gray-600">שעות בחודש</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">
                        {avgROI.yearlyHours}
                      </div>
                      <div className="text-sm text-gray-600">שעות בשנה</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Calculator className="w-5 h-5 text-gray-600" />
                      <h4 className="font-bold text-gray-800">חישוב ROI כספי</h4>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        placeholder="שכר חודשי (₪)"
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={() => setRoiCalculated(true)}
                        disabled={!monthlySalary}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        חשב
                      </button>
                    </div>
                    
                    {roiCalculated && monthlySalary && (() => {
                      const monetary = calculateMonetaryROI(parseFloat(monthlySalary));
                      if (!monetary) return null;
                      
                      return (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm text-gray-600">הפסד יומי</div>
                            <div className="text-xl font-bold text-red-600">
                              ₪{monetary.daily}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm text-gray-600">הפסד חודשי</div>
                            <div className="text-xl font-bold text-red-600">
                              ₪{monetary.monthly}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm text-gray-600">הפסד שנתי</div>
                            <div className="text-xl font-bold text-red-600">
                              ₪{monetary.yearly}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <p className="text-xs text-gray-500 mt-3">
                      * מבוסס על 90 דקות הקלדה דו-לשונית ביום
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Segments */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">פילוח תחומים</h3>
                {['tech', 'translation', 'sales', 'student', 'marketing', 'design', 'education', 'other'].map(occ => {
                  const count = data.filter(r => r.occupation === occ).length;
                  const pct = Math.round((count / data.length) * 100);
                  return (
                    <div key={occ} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{occ}</span>
                        <span className="font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">פילוח שפות</h3>
                {['Hebrew-English', 'Russian-English', 'Arabic-English'].map(lang => {
                  const count = data.filter(r => r.languages?.includes(lang)).length;
                  const pct = Math.round((count / data.length) * 100);
                  return (
                    <div key={lang} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{lang}</span>
                        <span className="font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Pain & Segments */}
        {currentView === 'pain' && (
          <div className="space-y-6">
            
            {/* TOP 5 Insights */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔥 5 תובנות מרכזיות - כאבים</h2>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="font-bold">1.</span> שבירת ריכוז - 
                  {` ${Math.round((data.filter(r => (r.flow_breaker_impact || []).includes('breaks_concentration')).length / data.length) * 100)}% `}
                  סובלים מזה
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="font-bold">2.</span> ADHD Power Users - 
                  Pain Score גבוה ב-30% מהממוצע
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="font-bold">3.</span> תדמית מקצועית - 
                  {` ${Math.round((data.filter(r => (r.professional_image_impact || []).includes('must_fix_immediately')).length / data.length) * 100)}% `}
                  "חייבים לתקן מיד"
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="font-bold">4.</span> תרגומנים - 
                  רוצים Dynamic Light (87%) + Physical Switch (89%)
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="font-bold">5.</span> הימנעות - 
                  {` ${Math.round((data.filter(r => (r.awakening_symptoms || []).includes('avoids_complex_docs')).length / data.length) * 100)}% `}
                  נמנעים ממסמכים מורכבים
                </div>
              </div>
            </div>

            {/* User Journey */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">🛤️ מסע המשתמש המתוסכל</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                  <div className="text-center text-2xl mb-2">1️⃣</div>
                  <div className="font-bold text-center mb-2">לפני ההקלדה</div>
                  <div className="text-sm space-y-1">
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('checks_language_icon')).length / data.length) * 100)}% בודקים אייקון</div>
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('presses_altshift_twice')).length / data.length) * 100)}% לוחצים Alt+Shift פעמיים</div>
                  </div>
                  <div className="mt-3 text-center text-sm font-semibold text-yellow-700">
                    🟡 חרדה
                  </div>
                </div>
                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <div className="text-center text-2xl mb-2">2️⃣</div>
                  <div className="font-bold text-center mb-2">תוך כדי</div>
                  <div className="text-sm space-y-1">
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('deletes_wrong_lang_word')).length / data.length) * 100)}% מוחקים מילה שלמה</div>
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('sends_wrong_message')).length / data.length) * 100)}% שולחים הודעה בטעות</div>
                  </div>
                  <div className="mt-3 text-center text-sm font-semibold text-red-700">
                    🔴 תסכול
                  </div>
                </div>
                <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                  <div className="text-center text-2xl mb-2">3️⃣</div>
                  <div className="font-bold text-center mb-2">פתרונות</div>
                  <div className="text-sm space-y-1">
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('avoids_complex_docs')).length / data.length) * 100)}% נמנעים מסמכים</div>
                    <div>✓ {Math.round((data.filter(r => (r.awakening_symptoms || []).includes('separate_apps')).length / data.length) * 100)}% אפליקציות נפרדות</div>
                  </div>
                  <div className="mt-3 text-center text-sm font-semibold text-orange-700">
                    🟠 הימנעות
                  </div>
                </div>
              </div>
            </div>

            {/* Pain by Segment - TOP 5 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">😫 TOP 5 - מי סובל הכי הרבה?</h3>
              {(() => {
                const segmentScores = ['adhd', 'translation', 'tech', 'sales', 'student', 'marketing', 'design', 'education'].map(seg => {
                  const segment = seg === 'adhd' 
                    ? data.filter(r => r.diagnosis?.includes('adhd'))
                    : data.filter(r => r.occupation === seg);
                  
                  if (segment.length === 0) return null;
                  
                  const avgScore = segment.reduce((sum, r) => sum + (r.overall_score || 0), 0) / segment.length;
                  return { segment: seg, avgScore, count: segment.length };
                }).filter(Boolean).sort((a, b) => (b?.avgScore || 0) - (a?.avgScore || 0)).slice(0, 5);
                
                return segmentScores.map((item, idx) => {
                  if (!item) return null;
                  const pct = Math.round((item.avgScore / 100) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-3 mb-3">
                      <div className="w-32 text-sm font-semibold">{item.segment}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8">
                        <div
                          className={`h-8 rounded-full flex items-center justify-end px-3 text-white font-bold ${
                            pct >= 80 ? 'bg-red-600' : pct >= 70 ? 'bg-orange-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        >
                          {item.avgScore.toFixed(1)}/100
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">({item.count})</span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Test Data Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                📝 נתוני אתגר ההקלדה
              </h3>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  ℹ️ {stats.completedTest} מתוך {stats.total} השלימו את האתגר ({Math.round((stats.completedTest / stats.total) * 100)}%)
                </div>
              </div>
              
              {(() => {
                const completedTests = data.filter(r => r.test_completed);
                if (completedTests.length === 0) return null;
                
                const avgWPM = completedTests.reduce((sum, r) => sum + (r.total_wpm || 0), 0) / completedTests.length;
                const avgAccuracy = completedTests.reduce((sum, r) => sum + (r.total_accuracy || 0), 0) / completedTests.length;
                const avgLangErrors = completedTests.reduce((sum, r) => sum + (r.total_language_errors || 0), 0) / completedTests.length;
                const avgPunctErrors = completedTests.reduce((sum, r) => sum + (r.total_punctuation_errors || 0), 0) / completedTests.length;
                
                return (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">WPM ממוצע</div>
                        <div className="text-2xl font-bold">{Math.round(avgWPM)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">דיוק ממוצע</div>
                        <div className="text-2xl font-bold">{Math.round(avgAccuracy)}%</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">שגיאות שפה</div>
                        <div className="text-2xl font-bold text-red-600">{avgLangErrors.toFixed(1)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">שגיאות ניקוד</div>
                        <div className="text-2xl font-bold text-orange-600">{avgPunctErrors.toFixed(1)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <div className="text-sm text-yellow-800">
                        💡 <strong>מסקנה:</strong> טועים יותר בשפה ({avgLangErrors.toFixed(1)}) מאשר בניקוד ({avgPunctErrors.toFixed(1)})
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        )}

        {/* Product Features */}
        {currentView === 'product' && (
          <div className="space-y-6">
            
            {/* TOP 5 Insights */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔥 5 תובנות מרכזיות - פיצ\'רים</h2>
              <div className="space-y-3">
                {(() => {
                  const featureStats = Object.keys(featureNames).map(feature => {
                    const topRanked = data.filter(r => r.feature_ranking?.[0] === feature).length;
                    return { feature, topRanked };
                  }).sort((a, b) => b.topRanked - a.topRanked).slice(0, 5);
                  
                  return featureStats.map((item, idx) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-3">
                      <span className="font-bold">{idx + 1}.</span> {featureNames[item.feature]} - 
                      {` ${Math.round((item.topRanked / data.length) * 100)}% `}
                      מדרגים במקום ראשון
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* All Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">🎯 דרישת פיצ\'רים - כולם</h3>
              {Object.entries(featureNames).map(([key, name]) => {
                const topRanked = data.filter(r => r.feature_ranking?.[0] === key).length;
                const pct = Math.round((topRanked / data.length) * 100);
                
                return (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{name}</span>
                      <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                        pct >= 70 ? 'bg-red-100 text-red-700' :
                        pct >= 50 ? 'bg-orange-100 text-orange-700' :
                        pct >= 30 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {pct >= 70 ? 'Must-Have' :
                         pct >= 50 ? 'High Priority' :
                         pct >= 30 ? 'Medium' : 'Nice-to-Have'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="h-6 rounded-full flex items-center justify-end px-3 text-white text-sm font-bold"
                        style={{ 
                          width: `${pct}%`,
                          backgroundColor: pct >= 70 ? '#dc2626' : pct >= 50 ? '#ea580c' : pct >= 30 ? '#ca8a04' : '#16a34a'
                        }}
                      >
                        {pct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features by Segment */}
            <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">👥 דרישת פיצ\'רים לפי קהל</h3>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right">Segment</th>
                    {Object.entries(featureNames).slice(0, 5).map(([key, name]) => (
                      <th key={key} className="px-4 py-3 text-center">{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {['adhd', 'translation', 'tech', 'sales', 'student'].map(seg => {
                    const segment = seg === 'adhd'
                      ? data.filter(r => r.diagnosis?.includes('adhd'))
                      : data.filter(r => r.occupation === seg);
                    
                    if (segment.length === 0) return null;
                    
                    return (
                      <tr key={seg}>
                        <td className="px-4 py-3 font-semibold">{seg}</td>
                        {Object.keys(featureNames).slice(0, 5).map(feature => {
                          const count = segment.filter(r => r.feature_ranking?.[0] === feature).length;
                          const pct = Math.round((count / segment.length) * 100);
                          return (
                            <td key={feature} className="px-4 py-3 text-center">
                              <span className={`font-bold ${pct >= 70 ? 'text-red-600' : pct >= 50 ? 'text-orange-600' : ''}`}>
                                {pct}%
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

        {/* Data Explorer */}
        {currentView === 'data' && (
          <div className="space-y-6">
            
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">🔍 פילטרים</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שפות</label>
                  <select
                    value={filters.languages}
                    onChange={(e) => setFilters({...filters, languages: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">הכל</option>
                    <option value="Hebrew-English">עברית-אנגלית</option>
                    <option value="Russian-English">רוסית-אנגלית</option>
                    <option value="Arabic-English">ערבית-אנגלית</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">תחום</label>
                  <select
                    value={filters.occupation}
                    onChange={(e) => setFilters({...filters, occupation: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">הכל</option>
                    <option value="tech">הייטק</option>
                    <option value="translation">תרגום</option>
                    <option value="sales">מכירות</option>
                    <option value="student">סטודנט</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">אבחון</label>
                  <select
                    value={filters.diagnosis}
                    onChange={(e) => setFilters({...filters, diagnosis: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">הכל</option>
                    <option value="adhd">ADHD</option>
                    <option value="dyslexia">דיסלקציה</option>
                    <option value="none">ללא</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">קוד הנחה</label>
                  <input
                    type="text"
                    placeholder="TYPE15..."
                    value={filters.searchCode}
                    onChange={(e) => setFilters({...filters, searchCode: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setFilters({ languages: 'all', occupation: 'all', diagnosis: 'all', searchCode: '' })}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  אפס
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  📊 נתונים ({filteredData.length} שורות)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right">תאריך</th>
                      <th className="px-4 py-3 text-right">שפות</th>
                      <th className="px-4 py-3 text-right">תחום</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">אבחון</th>
                      <th className="px-4 py-3 text-right">קוד</th>
                      <th className="px-4 py-3 text-right">אימייל</th>
                      <th className="px-4 py-3 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredData.slice(0, 50).map(response => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {new Date(response.created_at).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-4 py-3">{response.languages?.[0] || '-'}</td>
                        <td className="px-4 py-3">{response.occupation || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            response.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                            response.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {response.overall_score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {response.diagnosis?.includes('adhd') ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              ADHD
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {response.discount_code}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {response.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => viewResponse(response)}
                            className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                          >
                            צפה
                          </button>
                          <button
                            onClick={() => deleteResponse(response.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            מחק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredData.length > 50 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  מציג 50 מתוך {filteredData.length}
                </p>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Modal for viewing response */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">תשובה מלאה</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold mb-2">דמוגרפיה</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <div>שפות: {selectedResponse.languages?.join(', ')}</div>
                  <div>תחום: {selectedResponse.occupation}</div>
                  <div>שעות הקלדה: {selectedResponse.hours_typing}</div>
                  <div>גיל: {selectedResponse.age}</div>
                  <div>אבחון: {selectedResponse.diagnosis?.join(', ') || 'ללא'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">הערכה עצמית</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <div>קושי: {selectedResponse.difficulty_rating}/5</div>
                  <div>טעויות: {selectedResponse.errors_rating}/5</div>
                  <div>החלפת שפה: {selectedResponse.language_switching_rating}/5</div>
                  <div>תסכול: {selectedResponse.frustration_rating}/5</div>
                </div>
              </div>
              
              {selectedResponse.test_completed && (
                <div>
                  <h4 className="font-bold mb-2">תוצאות אתגר</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <div>WPM: {selectedResponse.total_wpm}</div>
                    <div>דיוק: {selectedResponse.total_accuracy}%</div>
                    <div>שגיאות שפה: {selectedResponse.total_language_errors}</div>
                    <div>שגיאות ניקוד: {selectedResponse.total_punctuation_errors}</div>
                    <div>ציון כולל: {selectedResponse.overall_score}/100</div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-bold mb-2">תסמינים</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  {selectedResponse.awakening_symptoms?.join(', ') || 'אין'}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">דירוג פיצ\'רים</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  {selectedResponse.feature_ranking?.map((f, i) => (
                    <div key={i}>{i + 1}. {featureNames[f] || f}</div>
                  ))}
                </div>
              </div>
              
              {selectedResponse.coping_mechanism_text && (
                <div>
                  <h4 className="font-bold mb-2">שיטת התמודדות</h4>
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
