="font-semibold text-gray-700 mb-1 text-xs">{t.finalAccuracy}</h3>
              <p className={`text-2xl font-bold ${metrics.accuracy >= 90 ? 'text-green-600' : metrics.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.accuracy || 0}%
              </p>
              <p className="text-xs text-gray-600">{t.accuracySubtext}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.textCompleted}</h3>
              <p className={`text-2xl font-bold ${completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {Math.round(completionRate)}%
              </p>
              <p className="text-xs text-gray-600">{t.completedSubtext}</p>
            </div>
          </div>

          {/* Error Breakdown */}
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
              <h3 className="font-semibold text-gray-700 mb-1 text-xs">{t.flowLevel}</h3>
              <p className={`text-2xl font-bold ${metrics.frustrationScore <= 3 ? 'text-green-600' : metrics.frustrationScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {metrics.frustrationScore}/10
              </p>
              <p className="text-xs text-gray-600">
                {getFlowLevelText(metrics.frustrationScore)}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
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
                    <span className="font-bold text-lg">{overallScore}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Stats */}
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
