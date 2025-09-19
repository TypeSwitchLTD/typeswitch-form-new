import React, { useState } from 'react';

interface Props {
  discountCode: string;
}

const ThankYou: React.FC<Props> = ({ discountCode }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSubmit = () => {
    if (email) {
      console.log('Email submitted:', email);
      alert('Thank you! We\'ll notify you when the product launches.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Thank you for participating!</h1>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <p className="text-gray-700 mb-4">Your discount code:</p>
          <div className="flex items-center justify-center space-x-2">
            <code className="bg-white px-4 py-2 rounded-lg text-xl font-mono font-bold text-blue-600">
              {discountCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Save this code to receive 10% off when the product launches.
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Want updates? (Optional)</h3>
          <div className="flex space-x-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleEmailSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Subscribe
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-gray-600">
            This survey helped us better understand the needs of multilingual typists.
            <br />
            Our product will revolutionize the way people work with keyboards!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;