// src/components/ResultsReport.tsx

import React from 'react';
import { TypingMetrics } from '../types';
import { calculateOverallScore, getScoreBreakdown, calculateWastedTime } from '../App';

interface Props {
  metrics: TypingMetrics;
  onNext: () => void;
  onShare: () => void;
  showBreakdown?: boolean;
  isRetake?: boolean;
  t: any; // Translation object ADDED
}

const ResultsReport: React.FC<Props> = ({ 
  metrics, 
  onNext, 
  onShare, 
  showBreakdown = true,
  isRetake = false,
  t // Translation object ADDED
}) => {
  // Defensive check for translations
  if (!t || !t.levels) {
    return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg text-center">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Component Error</h2>
                <p className="text-gray-600">Translation data for the 'Results Report' screen is missing or corrupted.</p>
            </div>
        </div>
    );
  }

  const completionRate = (metrics as any).completionRate || 100;
  const overallScore = calculateOverallScore(metrics, completionRate);
  const scoreBreakdown = showBreakdown ? getScoreBreakdown(metrics, completionRate) : null;
  const wastedTimeSeconds = calculateWastedTime(metrics);
 
  // Calculate realistic daily, monthly, yearly waste
  const testDurationMinutes = Math.max(1, ((window as any).exerciseEndTime - (window as any).exerciseStartTime) / 60000) || 5;
  const wastedSecondsPerMinute = wastedTimeSeconds / testDurationMinutes;
  const dailyWasteMinutes = (wastedSecondsPerMinute * 90) / 60; // 90 minutes daily multilingual typing
  const monthlyWasteHours = (dailyWasteMinutes * 22) / 60; // 22 working days
  const yearlyWasteHours = monthlyWasteHours * 12;
 
  const getScoreLevel = (score: number) => {
    if (score >= 85) return { level: t.levels.excellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: t.levels.good, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { level: t.levels.average, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { level: t.levels.needsImprovement, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: t.levels.roomToGrow, color: 'text-red-600', bg: 'bg-red-100' };
  };

  const scoreLevel = getScoreLevel(overallScore);

  const getWPMLevel = (wpm: number) => {
    if (wpm < 25) return { level: t.levels.beginner, color: 'text-red-600' };
    if (wpm < 35) return { level: t.levels.goodFoundation, color: 'text-orange-600' }; // TYPO FIX: wmp -> wpm
    if (wpm < 45) return { level: t.levels.average, color: 'text-yellow-600' };
    if (wpm < 60) return { level: t.levels.aboveAverage, color: 'text-green-600' };
    if (wpm < 80) return { level: t.levels.fast, color: 'text-green-700' };
    return { level: t.levels.professional, color: 'text-purple-600' };
  };

  const wpmLevel = getWPMLevel(metrics.wpm || 0);

  const getFrustrationLevelText = (score: number) => {
      if (score <= 2) return t.levels.veryCalm;
      if (score <= 4) return t.levels.normal;
      if (score <= 6) return t.levels.frustrated;
      if (score <= 8) return t.levels.veryFrustrated;
      return t.levels.extremelyFrustrated;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-5 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{t.title}</h2>
        <p className="text-gray-600 text-center mb-4 text-sm">{t.subtitle}</p>
        
        <div className="space-y-4">
          {/* Overall Score Card - FIRST */}
          <div className={`${scoreLevel.bg} rounded-xl p-4 text-center`}>
            <h3 className="text-base font-semibold text-gray-700 mb-2">{t.overallScoreTitle}</h3>
            <div className={`text-5xl font-bold ${scoreLevel.color} mb-1`}>
              {overallScore}/100
            </div>
            <p className={`text-base font-semibold ${scoreLevel.color}`}>{scoreLevel.level}</p>
            <p className="text-xs text-gray-600 mt-1">{t.basedOn}</p>
            {overallScore < 55 && (
              <p className="text-xs text-gray-600 mt-1">{t.encouragement}</p>
            )}
          </div>

          {/* Wasted Time Analysis - NEW PROMINENT SECTION */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-3 text-center">{t.wastedTimeTitle}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{wastedTimeSeconds}s</div>
                <div className="text-xs text-gray-600">{t.thisTest}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{dailyWasteMinutes.toFixed(1)}</div>
                <div className="text-xs text-gray-600">{t.minutesPerDay}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{monthlyWasteHours.toFixed(1)}</div>
                <div className="text-xs text-gray-600">{t.hoursPerMonth}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{yearlyWasteHours.toFixed(0)}</div>
                <div className="text-xs text-gray-600">{t.hoursPerYear}</div>
              </div>
            </div>
            <p className="text-center text-sm text-red-700 mt-3 font-medium">
              **{t.yearlyLossEmphasis(yearlyWasteHours.toFixed(0))}**
            </p>
            <p className="text-center text-xs text-gray-600 mt-1">{t.yearlyLossSubtext}</p>
          </div>

          {/* Main Performance Metrics - SECOND */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.typingSpeed}</h3>
              <p className={`text-2xl font-bold ${wpmLevel.color}`}>{metrics.wpm || 0}</p>
              <p className="text-xs text-gray-600">{t.wpmLabel}</p>
              <p className={`text-xs mt-0.5 ${wpmLevel.color}`}>{wpmLevel.level}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.finalAccuracy}</h3>
              <p className={`text-2xl font-bold ${metrics.accuracy >= 90 ? 'text-green-600' : metrics.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.accuracy || 0}%
              </p>
              <p className="text-xs text-gray-600">{t.accuracySubtext}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.textCompleted}</h3>
              <p className={`text-2xl font-bold ${completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {completionRate}%
              </p>
              <p className="text-xs text-gray-600">{t.completedSubtext}</p>
            </div>
          </div>

          {/* Error Breakdown - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.languageErrors}</h3>
              <p className={`text-2xl font-bold ${metrics.languageErrors <= 2 ? 'text-green-600' : metrics.languageErrors <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.languageErrors || 0}
              </p>
              <p className="text-xs text-gray-600">{t.langErrorSubtext}</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.punctuationErrors}</h3>
              <p className={`text-2xl font-bold ${metrics.punctuationErrors <= 2 ? 'text-green-600' : metrics.punctuationErrors <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.punctuationErrors || 0}
              </p>
              <p className="text-xs text-gray-600">{t.puncErrorSubtext}</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.deletionsMade}</h3>
              <p className={`text-2xl font-bold ${metrics.deletions <= 10 ? 'text-green-600' : metrics.deletions <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.deletions || 0}
              </p>
              <p className="text-xs text-gray-600">{t.deletionsSubtext}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.frustrationLevel}</h3>
              <p className={`text-2xl font-bold ${metrics.frustrationScore <= 3 ? 'text-green-600' : metrics.frustrationScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.frustrationScore}/10
              </p>
              <p className="text-xs text-gray-600">
                {getFrustrationLevelText(metrics.frustrationScore)}
              </p>
            </div>
          </div>

          {/* Score Breakdown - THIRD (if enabled) */}
          {showBreakdown && scoreBreakdown && scoreBreakdown.breakdown.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">{t.deductionsBreakdown}</h3>
              <div className="space-y-2">
                {scoreBreakdown.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center pb-1 border-b border-gray-200">
                    <div>
                      <span className="text-gray-700 font-medium text-xs">{item.category}</span>
                      <span className="text-gray-500 text-xs ml-2">({item.reason})</span>
                    </div>
                    <span className="text-red-600 font-bold text-sm">-{item.penalty}</span>
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 font-semibold">{t.startingScore}:</span>
                    <span className="text-gray-800 font-bold">100</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 text-sm">
                    <span className="font-semibold">{t.totalDeductions}:</span>
                    <span className="font-bold">-{scoreBreakdown.totalPenalty}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600 mt-1 pt-1 border-t">
                    <span className="font-semibold">{t.finalScore}:</span>
                    {/* *** FIX: Display the consistent overallScore here *** */}
                    <span className="font-bold text-lg">{overallScore}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Stats - FOURTH */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">{t.additionalStats}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{t.totalMistakes}:</span>
                <span className="font-semibold">{metrics.totalMistakesMade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.correctionsMade}:</span>
                <span className="font-semibold">{metrics.corrections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.langSwitches}:</span>
                <span className="font-semibold">{metrics.languageSwitches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.avgDelay}:</span>
                <span className="font-semibold">{metrics.averageDelay}ms</span>
              </div>
            </div>
          </div>

          {/* Share Section - For Retakes */}
          {isRetake && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.shareTitle}</h3>
              <p className="text-gray-600 text-center mb-4">{t.shareDesc}</p>
              <button
                onClick={onShare}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                </svg>
                {t.shareButton}
              </button>
            </div>
          )}

          {/* Call to Action - LAST (only for non-retake) */}
          {!isRetake && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 text-center">
              <h3 className="text-base font-semibold mb-2">{t.ctaTitle}</h3>
              <p className="mb-3 text-sm">{t.ctaSubtitle}</p>
              <button
                onClick={onNext}
                className="bg-white text-blue-600 py-2 px-6 rounded-lg font-semibold text-sm hover:bg-gray-100 transition transform hover:scale-105"
              >
                {t.continueToNextStep}
              </button>
            </div>
          )}

          {/* Close Button - For Retakes Only */}
          {isRetake && (
            <div className="text-center pt-4 border-t">
              <button
                onClick={onNext}
                className="bg-gray-600 text-white py-2 px-8 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                {t.closeButton}
              </button>
              <p className="text-xs text-gray-500 mt-2">{t.retakeSaveNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsReport;
