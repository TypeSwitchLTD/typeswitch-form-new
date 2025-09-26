import React, { useState } from 'react';

interface Props {
  discountCode: string;
  onShare: () => void;
  onEmailSubmit?: (email: string) => void;
  skippedTest?: boolean;
  onTryTest?: () => void;
}

const ThankYou: React.FC<Props> = ({ discountCode, onShare, onEmailSubmit, skippedTest = false, onTryTest }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

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
      alert('✅ Email saved! We\'ll notify you when TypeSwitch launches.');
    }
  };

  const handleTryTestClick = () => {
    if (onTryTest) {
      onTryTest();
    }
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
            Thank You for Participating!
          </h1>
          <p className="text-lg text-gray-600 text-center">
            You've helped shape the future of multilingual keyboards
          </p>
        </div>

        {/* Discount Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-center">Your Exclusive Reward</h3>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-center mb-3">25% Early Bird Discount Code:</p>
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
            Valid for the first 1000 customers when we launch
          </p>
        </div>

        {/* Share Results OR Try Test Section */}
        {!skippedTest ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
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
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Want to Try the Typing Test?
            </h3>
            <p className="text-gray-600 text-center mb-4">
              See how you perform and get shareable results!
            </p>
            <div className="space-y-3">
              <button
                onClick={handleTryTestClick}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-yellow-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Try the Test Now
              </button>
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 py-3 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268 3.12 9.032-7.326" />
                </svg>
                Share Results (Complete test first)
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Don't worry - your survey answers are already saved!
            </p>
          </div>
        )}

        {/* Email Subscription */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            Want to be notified when we launch?
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
                Notify Me
              </button>
            </div>
          ) : (
            <div className="bg-green-100 text-green-700 rounded-lg p-4 max-w-md mx-auto text-center">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Perfect! We'll email you when TypeSwitch launches.
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">What Happens Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">📊</span>
              </div>
              <p className="text-sm text-gray-600">We analyze all responses to perfect our design</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🔧</span>
              </div>
              <p className="text-sm text-gray-600">Build the features you voted most important</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🚀</span>
              </div>
              <p className="text-sm text-gray-600">Launch in Q2 2026 with your discount ready</p>
            </div>
          </div>
        </div>

        {/* Final Message */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Survey ID: {discountCode.replace('TYPE', 'SURV')}</p>
          <p className="mt-1">Completed: {new Date().toLocaleDateString()}</p>
          <p className="mt-1 text-xs">✅ Data saved to database</p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
