import React from 'react';

interface Props {
  onNext: () => void;
  onAdminClick: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onNext, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-4xl w-full relative">
        {/* Admin Click Icon */}
        <div 
            onClick={onAdminClick}
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 cursor-pointer p-2 z-20"
            title="Admin Access"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Is Your Keyboard Working Against You?
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mt-6">
              Help us build the ultimate multilingual keyboard. Your feedback will shape its future.
            </p>
        </div>
        
        {/* Main Content Sections - Now in a single vertical column */}
        <div className="space-y-8">
            {/* 1. Shape the Future */}
            <div className="bg-gray-50 p-6 rounded-xl border transition-all hover:shadow-lg hover:border-blue-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
                    <span className="text-3xl mr-3">🎯</span> Shape the Future of Typing
                </h2>
                <p className="text-gray-700">
                    We're solving the small, daily frustrations of typing in multiple languages. Your answers will directly influence our product's core features and help thousands of professionals like you.
                </p>
            </div>

            {/* 2. The Process */}
            <div className="bg-gray-50 p-6 rounded-xl border transition-all hover:shadow-lg hover:border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">3 Simple Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-4xl mb-2">📝</div>
                        <h3 className="font-semibold text-gray-800">Quick Survey</h3>
                        <p className="text-sm text-gray-600">Answer a few questions about your typing habits (1-3 mins).</p>
                    </div>
                    <div>
                        <div className="text-4xl mb-2">⌨️</div>
                        <h3 className="font-semibold text-gray-800">Optional Challenge</h3>
                        <p className="text-sm text-gray-600">Take a 3-min typing test to analyze your skills.</p>
                    </div>
                    <div>
                        <div className="text-4xl mb-2">🎉</div>
                        <h3 className="font-semibold text-gray-800">Get Your Reward</h3>
                        <p className="text-sm text-gray-600">Receive your exclusive discount code for our launch.</p>
                    </div>
                </div>
            </div>

            {/* 3. The Reward */}
            <div className="bg-gray-50 p-6 rounded-xl border transition-all hover:shadow-lg hover:border-purple-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-3xl mr-3">🎁</span> A Thank You for Your Time
                </h2>
                <p className="text-gray-700 mb-4">As a token of our appreciation, you'll receive an exclusive early-bird discount in two parts:</p>
                <div className="flex flex-col items-center space-y-2">
                    <div className="bg-white p-3 rounded-md flex items-center w-full md:w-3/4 shadow-sm">
                        <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-md text-sm">15% OFF</span>
                        <span className="ml-4 text-gray-600">For completing the 3-minute survey.</span>
                    </div>
                    <div className="text-2xl font-light text-purple-500">+</div>
                    <div className="bg-white p-3 rounded-md flex items-center w-full md:w-3/4 shadow-sm">
                        <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-md text-sm">10% OFF</span>
                        <span className="ml-4 text-gray-600">For leaving your email for launch updates.</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Optional Typing Challenge Details */}
        <div className="bg-white p-6 rounded-xl mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Curious? Take the Optional Typing Challenge</h2>
            <p className="text-center text-gray-600 mb-4">See your multilingual skills in black and white. Our test provides a detailed personal report on:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-3xl">🚀</div>
                    <h4 className="font-semibold mt-1">True WPM</h4>
                    <p className="text-xs text-gray-500">Your speed when switching languages.</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-3xl">🎯</div>
                    <h4 className="font-semibold mt-1">Accuracy</h4>
                    <p className="text-xs text-gray-500">Language vs. standard errors breakdown.</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-3xl">⏳</div>
                    <h4 className="font-semibold mt-1">Wasted Time</h4>
                    <p className="text-xs text-gray-500">Estimate hours wasted annually on typing errors.</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-3xl">😤</div>
                    <h4 className="font-semibold mt-1">Frustration Score</h4>
                    <p className="text-xs text-gray-500">Based on pauses and repeated edits.</p>
                </div>
            </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-10">
            <button
              onClick={onNext}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-16 rounded-lg font-bold text-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Survey
            </button>
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>100% Anonymous</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    <span>Takes 1-3 Minutes</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
