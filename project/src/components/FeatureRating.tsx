import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const FeatureRating: React.FC<Props> = ({ onNext }) => {
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [topFeatures, setTopFeatures] = useState<string[]>([]);

  const features = [
    { id: 'mechanical', name: 'Mechanical Keyboard', description: 'Tactile feedback, durable switches', icon: '⌨️' },
    { id: 'rgbFull', name: 'Full RGB Lighting', description: 'Customizable colors for aesthetics', icon: '🌈' },
    { id: 'physicalSwitch', name: 'Physical Language Switch', description: 'Dedicated button to change languages', icon: '🔄' },
    { id: 'wireless', name: 'Wireless Connectivity', description: 'Bluetooth or USB dongle, no cables', icon: '📡' },
    { id: 'dynamicLight', name: 'Dynamic Language Lighting', description: 'Only active language keys light up', icon: '💡' },
    { id: 'modularKeys', name: 'Replaceable Keys', description: 'Swap keys for different languages or repair', icon: '🔧' },
    { id: 'wristRest', name: 'Ergonomic Wrist Rest', description: 'Padded support for comfort', icon: '🤲' },
    { id: 'shortcuts', name: 'Professional Shortcuts Area', description: 'Programmable keys for specific functions', icon: '⚡' },
    { id: 'volumeKnob', name: 'Rotary Encoder Knob', description: 'Precision volume control, scrolling', icon: '🎛️' }
  ];

  const handleRating = (featureId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [featureId]: rating }));
  };

  const toggleTopFeature = (featureId: string) => {
    setTopFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(f => f !== featureId);
      }
      if (prev.length < 2) {
        return [...prev, featureId];
      }
      // To allow changing selection when 2 are already selected
      const newSelection = [...prev];
      newSelection[1] = featureId;
      return newSelection;
    });
  };

  const handleSubmit = () => {
    if (Object.keys(ratings).length === features.length && topFeatures.length === 2) {
      onNext({ featureRatings: { ratings, topFeatures } });
    }
  };

  const allRated = Object.keys(ratings).length === features.length;
  const hasTopFeatures = topFeatures.length === 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Feature Evaluation</h2>
          <p className="text-lg text-gray-600">How important are these features for your ideal keyboard?</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map(feature => (
            <div key={feature.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center flex-1 min-w-[250px] mb-2 md:mb-0">
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{feature.name}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
                <div className="flex space-x-1 ml-auto">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button key={rating} onClick={() => handleRating(feature.id, rating)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full font-semibold transition transform hover:scale-110 ${ratings[feature.id] === rating ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Select your TOP 2 must-have features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {features.map(feature => {
              const isSelected = topFeatures.includes(feature.id);
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleTopFeature(feature.id)}
                  disabled={!isSelected && topFeatures.length >= 2}
                  className={`p-4 rounded-lg transition text-left relative ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50'}`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{feature.icon}</span>
                    <div className="font-semibold">{feature.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!allRated || !hasTopFeatures} className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50">
          Continue
        </button>
      </div>
    </div>
  );
};

export default FeatureRating;