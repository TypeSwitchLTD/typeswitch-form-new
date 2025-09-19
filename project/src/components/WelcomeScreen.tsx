import React from 'react';

interface Props {
  onNext: () => void;
  onAdminClick: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onNext, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-3xl w-full relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full opacity-20 -ml-24 -mb-24"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div 
            onClick={onAdminClick}
            className="mb-8 text-center cursor-pointer select-none"
          >
            {/* Animated Logo - Keyboard Key Design */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 animate-pulse relative">
              {/* Keyboard key icon */}
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <div className="text-center">
                  <div className="text-white text-3xl font-bold mb-1">⌨</div>
                  <div className="text-white/80 text-xs"></div>
                </div>
              </div>
              {/* Corner highlight to simulate key */}
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full"></div>
            </div>
            
            {/* Title with gradient */}
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              TypeSwitch Keyboard
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-light">
              The Future of Multilingual Typing
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid gap-4 mb-8">
            {/* Card 1 - Survey & Test */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Quick Survey + Optional Challenge</h3>
                  <p className="text-gray-600 text-sm">
                    • <span className="font-semibold">Survey (2-4 min):</span> Tell us about your typing needs and keyboard preferences<br/>
                    • <span className="font-semibold">Typing Test (3 min, optional):</span> A challenging multilingual exercise that tests even professional typists<br/>
                    • Share your results and challenge friends!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card 2 - What We Measure */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-100 rounded-2xl p-5 border border-orange-200 transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">What We Measure (If You Take the Test)</h3>
                  <p className="text-gray-600 text-sm">
                    • How many errors you make when switching languages<br/>
                    • Time wasted finding punctuation marks (?, !, ;)<br/>
                    • Number of deletions and corrections<br/>
                    • Your real typing speed in mixed-language text<br/>
                    <span className="text-orange-600 font-semibold">⚡ The test that shows exactly why multilingual typing is so hard</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card 3 - Reward */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl p-5 border border-purple-200 transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Exclusive Early Bird Rewards</h3>
                  <p className="text-gray-600 text-sm">
                    • <span className="font-bold text-purple-600 text-base">15% OFF</span> - Complete the survey<br/>
                    • <span className="font-bold text-purple-600 text-base">+10% OFF</span> - Leave your email<br/>
                    • <span className="font-bold text-pink-600 text-lg">Total: 25% OFF</span> when TypeSwitch launches!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Card 4 - Time & Access */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl p-5 border border-green-200 transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Flexible Participation</h3>
                  <p className="text-gray-600 text-sm">
                    • <span className="font-semibold">Quick survey:</span> 2-4 minutes (works on all devices)<br/>
                    • <span className="font-semibold">With typing test:</span> 5-7 minutes total (keyboard required)<br/>
                    • <span className="font-semibold">Mobile users:</span> Complete survey now, take test later on desktop
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">3</div>
              <div className="text-xs sm:text-sm text-gray-600">Languages</div>
              <div className="text-xs text-gray-500">(Hebrew, Arabic, Russian)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">25%</div>
              <div className="text-xs sm:text-sm text-gray-600">Max Discount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">Q2 2026</div>
              <div className="text-xs sm:text-sm text-gray-600">Launch Date</div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-2xl font-bold text-lg sm:text-xl hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">Start Survey →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>2-7 Minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Up to 25% OFF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;