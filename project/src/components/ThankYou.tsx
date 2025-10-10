import React, { useState } from 'react';
import { verifyDiscountCode } from '../lib/supabase';

interface Props {
  discountCode: string;
  onShare: () => void;
  onEmailSubmit?: (email: string) => void;
  skippedTest?: boolean;
  onTryTest?: () => void;
  t: any; // Translation object
}

const ThankYou: React.FC<Props> = ({ discountCode, onShare, onEmailSubmit, skippedTest = false, onTryTest, t }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  // NEW: Code verification popup
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleEmailSubmit = () => {
    if (email && email.includes('@')) {
      console.log('Email submitted:', email);
      onEmailSubmit?.(email);
      setEmailSubmitted(true);
    }
  };

  const handleTryTestClick = () => {
    if (onTryTest) {
      onTryTest();
    }
  };

  // NEW: Handle view results button
  const handleViewResults = () => {
    setShowCodePopup(true);
    setEnteredCode('');
    setCodeError('');
  };

  // NEW: Verify code and navigate to results
  const handleCodeSubmit = async () => {
    if (!enteredCode || enteredCode.trim() === '') {
      setCodeError('Please enter your code');
      return;
    }

    setVerifying(true);
    setCodeError('');

    const result = await verifyDiscountCode(enteredCode.trim());

    if (result.valid) {
      // Code is valid - navigate to dashboard
      window.location.href = '/results-dashboard';
    } else {
      setCodeError(
        <>
          Code not found in our system. Please{' '}
          <a href="https://typeswitch.io/contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
            contact us via our website
          </a>
          .
        </>
      );
    }

    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
        {/* Success Animation */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Progress Complete */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
              🎉 100% Complete!
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
            {t.title}
          </h1>
          <p className="text-lg text-gray-600 text-center">
            {t.subtitle}
          </p>
        </div>

        {/* Discount Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-center">{t.discountTitle}</h3>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-center mb-3">{t.discountDesc}</p>
            <div className="flex items-center justify-center space-x-3">
              <code className="bg-white text-gray-800 px-6 py-3 rounded-lg text-2xl font-mono font-bold">
                {discountCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="bg-white/30 hover:bg-white/40 text-white px-4 py-3 rounded-lg transition"
              >
                {copied ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-center text-sm mt-2 text-green-200">
                ✓ Code copied to clipboard!
              </p>
            )}
          </div>
          <p className="text-center text-sm mt-3 text-blue-100">
            {t.discountNote}
          </p>
          
          {/* NEW: Explanation about code usage */}
          <div className="mt-4 bg-blue-500/30 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">💡 Your Code is Your Key:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-50">
              <li>Use it for <strong>25% discount</strong> at launch</li>
              <li>Reference it in <strong>support emails</strong></li>
              <li>Use it to <strong>view survey results</strong> anytime</li>
            </ul>
          </div>
        </div>

        {/* NEW: View Survey Results Button */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            📊 Curious About the Results?
          </h3>
          <p className="text-gray-600 text-center mb-4">
            See how your responses compare to others! View aggregate survey results, typing metrics, and discover what features the community values most.
          </p>
          <button
            onClick={handleViewResults}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-105 flex items-center justify-center"
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Survey Results
          </button>
        </div>

        {/* Share Results OR Try Test Section */}
        {!skippedTest ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              {t.shareTitle}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {t.shareDesc}
            </p>
            <button
              onClick={onShare}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition transform hover:scale-105 flex items-center justify-center"
            >
              <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
              {t.shareButton}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              {t.tryTestTitle}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {t.tryTestDesc}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleTryTestClick}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-yellow-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t.tryTestButton}
              </button>
            </div>
          </div>
        )}

        {/* Email Subscription */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            {t.emailTitle}
          </h3>
          
          {!emailSubmitted ? (
            <div className="flex space-x-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleEmailSubmit}
                disabled={!email || !email.includes('@')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.emailButton}
              </button>
            </div>
          ) : (
            <div className="bg-green-100 text-green-700 rounded-lg p-4 max-w-md mx-auto text-center">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.emailSuccess}
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">{t.nextTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">📊</span>
              </div>
              <p className="text-sm text-gray-600">{t.nextStep1}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🔧</span>
              </div>
              <p className="text-sm text-gray-600">{t.nextStep2}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🚀</span>
              </div>
              <p className="text-sm text-gray-600">{t.nextStep3}</p>
            </div>
          </div>
        </div>

        {/* Final Message */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>{t.surveyId} {discountCode.replace('TYPE', 'SURV')}</p>
          <p className="mt-1">{t.completed} {new Date().toLocaleDateString()}</p>
          <p className="mt-1 text-xs">{t.dataSaved}</p>
        </div>
      </div>

      {/* NEW: Code Verification Popup */}
      {showCodePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Your Code</h2>
              <p className="text-gray-600">Use your discount code to access survey results</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleCodeSubmit()}
                  placeholder="TYPE123ABC"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-center font-mono text-lg uppercase"
                  disabled={verifying}
                />
                {codeError && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    {codeError}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCodePopup(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-semibold"
                  disabled={verifying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCodeSubmit}
                  disabled={verifying || !enteredCode}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'View Results'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThankYou;
