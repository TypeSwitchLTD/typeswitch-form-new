import React from 'react';
import { TypingMetrics } from '../types';
import { calculateOverallScore, getScoreBreakdown, calculateWastedTime } from '../App';

interface Props {
  metrics: TypingMetrics;
  onNext: () => void;
  onShare: () => void;
  showBreakdown?: boolean;
  isRetake?: boolean;
}

const ResultsReport: React.FC<Props> = ({ 
  metrics, 
  onNext, 
  onShare, 
  showBreakdown = true,
  isRetake = false 
}) => {
  const completionRate = (metrics as any).completionRate || 100;
  const overallScore = calculateOverallScore(metrics, completionRate);
  const scoreBreakdown = showBreakdown ? getScoreBreakdown(metrics, completionRate) : null;
  const wastedTimeSeconds = calculateWastedTime(metrics);
  
  // Calculate realistic daily, monthly, yearly waste
  const testDurationMinutes = Math.max(1, (Date.now() - (window as any).exerciseStartTime) / 60000) || 5; // Fallback to 5 if not available
  const wastedSecondsPerMinute = wastedTimeSeconds / testDurationMinutes;
  const dailyWasteMinutes = (wastedSecondsPerMinute * 90) / 60; // 90 minutes daily multilingual typing
  const monthlyWasteHours = (dailyWasteMinutes * 22) / 60; // 22 working days
  const yearlyWasteHours = monthlyWasteHours * 12;
  
  const getScoreLevel = (score: number) => {
    if (score >= 85) return { level: 'Excellent!', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { level: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Room to Grow', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const scoreLevel = getScoreLevel(overallScore);

  const getWPMLevel = (wpm: number) => {
    if (wpm < 25) return { level: 'Beginner', color: 'text-red-600' };
    if (wmp < 35) return { level: 'Good Foundation', color: 'text-orange-600' };
    if (wpm < 45) return { level: 'Average', color: 'text-yellow-600' };
    if (wpm < 60) return { level: 'Above Average', color: 'text-green-600' };
    if (wpm < 80) return { level: 'Fast', color: 'text-green-700' };
    return { level: 'Professional', color: 'text-purple-600' };
  };

  const wpmLevel = getWPMLevel(metrics.wpm || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-5 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Your Typing Analysis</h2>
        <p className="text-gray-600 text-center mb-4 text-sm">Here's how you really performed</p>
        
        <div className="space-y-4">
          {/* Overall Score Card - FIRST */}
          <div className={`${scoreLevel.bg} rounded-xl p-4 text-center`}>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Overall Performance Score</h3>
            <div className={`text-5xl font-bold ${scoreLevel.color} mb-1`}>
              {overallScore}/100
            </div>
            <p className={`text-base font-semibold ${scoreLevel.color}`}>{scoreLevel.level}</p>
            <p className="text-xs text-gray-600 mt-1">
              Based on: 50% Errors • 20% Completion • 20% Speed • 10% Flow
            </p>
            {overallScore < 55 && (
              <p className="text-xs text-gray-600 mt-1">
                Multilingual typing is challenging - our keyboard can help!
              </p>
            )}
          </div>

          {/* Wasted Time Analysis - NEW PROMINENT SECTION */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-3 text-center">
              ⏰ Time Lost to Typing Errors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{wastedTimeSeconds}s</div>
                <div className="text-xs text-gray-600">This Test</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{dailyWasteMinutes.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Minutes/90 min daily</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{monthlyWasteHours.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Hours/22 working days = Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{yearlyWasteHours.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Hours/Year</div>
              </div>
            </div>
            <p className="text-center text-sm text-red-700 mt-3 font-medium">
              **You're losing {yearlyWasteHours.toFixed(0)} hours per year to multilingual typing errors!**
              </p>
              <p className="text-center text-xs text-gray-600 mt-1">
              Based on 90 minutes daily multilingual typing with similar error rates
              </p>
          </div>

          {/* Main Performance Metrics - SECOND */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Typing Speed</h3>
              <p className={`text-2xl font-bold ${wpmLevel.color}`}>{metrics.wpm || 0}</p>
              <p className="text-xs text-gray-600">Words Per Minute</p>
              <p className={`text-xs mt-0.5 ${wpmLevel.color}`}>{wpmLevel.level}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Final Accuracy</h3>
              <p className={`text-2xl font-bold ${metrics.accuracy >= 90 ? 'text-green-600' : metrics.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.accuracy || 0}%
              </p>
              <p className="text-xs text-gray-600">After all corrections</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Text Completed</h3>
              <p className={`text-2xl font-bold ${completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {completionRate}%
              </p>
              <p className="text-xs text-gray-600">Of required text</p>
            </div>
          </div>

          {/* Error Breakdown - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Language Errors</h3>
              <p className={`text-2xl font-bold ${metrics.languageErrors <= 2 ? 'text-green-600' : metrics.languageErrors <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.languageErrors || 0}
              </p>
              <p className="text-xs text-gray-600">Wrong language chars</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Punctuation Errors</h3>
              <p className={`text-2xl font-bold ${metrics.punctuationErrors <= 2 ? 'text-green-600' : metrics.punctuationErrors <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.punctuationErrors || 0}
              </p>
              <p className="text-xs text-gray-600">Wrong punctuation</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Deletions Made</h3>
              <p className={`text-2xl font-bold ${metrics.deletions <= 10 ? 'text-green-600' : metrics.deletions <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.deletions || 0}
              </p>
              <p className="text-xs text-gray-600">Backspace presses</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">Frustration Level</h3>
              <p className={`text-2xl font-bold ${metrics.frustrationScore <= 3 ? 'text-green-600' : metrics.frustrationScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.frustrationScore}/10
              </p>
              <p className="text-xs text-gray-600">
                {metrics.frustrationScore <= 2 ? 'Very Calm' : metrics.frustrationScore <= 4 ? 'Normal' : metrics.frustrationScore <= 6 ? 'Frustrated' : metrics.frustrationScore <= 8 ? 'Very Frustrated' : 'Extremely Frustrated'}
              </p>
            </div>
          </div>

          {/* Score Breakdown - THIRD (if enabled) */}
          {showBreakdown && scoreBreakdown && scoreBreakdown.breakdown.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Score Deductions Breakdown</h3>
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
                    <span className="text-gray-800 font-semibold">Starting Score:</span>
                    <span className="text-gray-800 font-bold">100</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 text-sm">
                    <span className="font-semibold">Total Deductions:</span>
                    <span className="font-bold">-{scoreBreakdown.totalPenalty}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600 mt-1 pt-1 border-t">
                    <span className="font-semibold">Final Score:</span>
                    <span className="font-bold text-lg">{scoreBreakdown.finalScore}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Stats - FOURTH */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Additional Statistics</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Mistakes:</span>
                <span className="font-semibold">{metrics.totalMistakesMade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Corrections Made:</span>
                <span className="font-semibold">{metrics.corrections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language Switches:</span>
                <span className="font-semibold">{metrics.languageSwitches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Delay:</span>
                <span className="font-semibold">{metrics.averageDelay}ms</span>
              </div>
            </div>
          </div>

          {/* Share Section - For Retakes */}
          {isRetake && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Show Off Your Typing Skills!
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Create a shareable image of your results to challenge friends
              </p>
              <button
                onClick={onShare}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                </svg>
                Share My Results & Get Friends to Try
              </button>
            </div>
          )}

          {/* Call to Action - LAST (only for non-retake) */}
          {!isRetake && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 text-center">
              <h3 className="text-base font-semibold mb-2">Ready to Continue?</h3>
              <p className="mb-3 text-sm">Complete the survey to get your 15% instant discount!</p>
              <button
                onClick={onNext}
                className="bg-white text-blue-600 py-2 px-6 rounded-lg font-semibold text-sm hover:bg-gray-100 transition transform hover:scale-105"
              >
                Continue to Feature Evaluation →
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
                Close Results
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Your original survey responses are still saved
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsReport;
