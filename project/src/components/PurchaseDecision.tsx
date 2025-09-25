import React, { useState, useMemo } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const PurchaseDecision: React.FC<Props> = ({ onNext }) => {
  const [answers, setAnswers] = useState({
    overallValueProposition: '',
    rankedFeatures: [] as string[],
    finalFeedbackText: '',
    noFinalFeedback: false,
  });

  const handleOptionChange = (field: keyof Omit<typeof answers, 'rankedFeatures'>, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFeatureClick = (featureId: string) => {
    setAnswers(prev => {
        const currentRanked = prev.rankedFeatures;
        if (currentRanked.includes(featureId)) {
            return prev;
        }
        if (currentRanked.length < 3) {
            return { ...prev, rankedFeatures: [...currentRanked, featureId] };
        }
        return prev;
    });
  };

  const resetRanking = () => {
    setAnswers(prev => ({ ...prev, rankedFeatures: [] }));
  };

  const handleNoFeedbackCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAnswers(prev => ({
        ...prev,
        noFinalFeedback: isChecked,
        finalFeedbackText: isChecked ? '' : prev.finalFeedbackText
    }));
  };

  const isFormValid = answers.overallValueProposition && answers.rankedFeatures.length === 3 && (answers.finalFeedbackText.length > 0 || answers.noFinalFeedback);

  const handleSubmit = () => {
    if (isFormValid) {
        onNext({ epiphany: answers });
    }
  };

  const benefits = [
    { id: 'productivity', icon: '🚀', title: 'Productivity Boost', description: 'Save time and get more done.' },
    { id: 'focus', icon: '🧠', title: 'Uninterrupted Flow', description: 'Stay focused without losing your train of thought.' },
    { id: 'control', icon: '😌', title: 'Effortless Control', description: 'Feel in command of your keyboard, not fighting it.' },
    { id: 'communication', icon: '💬', title: 'Clearer Communication', description: 'Reduce errors and communicate more professionally.' },
  ];
  
  const rankingOptions = useMemo(() => [
        { id: 'mechanical', icon: '⌨️', label: 'Mechanical Keyboard', description: 'For a precise and fast typing feel.' },
        { id: 'physical_switch', icon: '🔄', label: 'Dedicated Physical Language Switch', description: 'To always know for certain which language you are in.' },
        { id: 'auto_detection', icon: '✨', label: 'Automatic Language Detection', description: 'A smart mechanism that switches the language for you as you type.' },
        { id: 'dynamic_lighting', icon: '💡', label: 'Dynamic Backlighting', description: 'Smart lighting that only illuminates the keys for the active language.' },
        { id: 'wireless', icon: '📡', label: 'Stable Wireless Connectivity', description: 'For a clean, cable-free workspace.' },
        { id: 'mic', icon: '🎙️', label: 'High-Quality Built-in Mic', description: 'With a dedicated button to activate the OS\'s Dictation feature.' },
        { id: 'wrist_rest', icon: '🤲', label: 'Ergonomic Wrist Rest', description: 'For comfort during long work sessions.' },
        { id: 'programmable_keys', icon: '⚙️', label: 'Programmable Keys', description: 'To create custom shortcuts for a perfect workflow.' },
        { id: 'rotary_knob', icon: '🎛️', label: 'Rotary Knob', description: 'For quick control over volume, scrolling, or other actions.' },
        { id: 'visual_display', icon: '🖥️', label: 'On-Keyboard Visual Display', description: 'To clearly show the active language and other stats.' },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl w-full">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">💡 The Ideal Solution</h2>
            <p className="text-lg text-gray-600">Let's define what the perfect keyboard looks like for you.</p>
        </div>
        
        <div className="space-y-8">
            {/* Question 3.1 */}
            <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">What's the SINGLE greatest benefit?</h3>
                <p className="text-gray-600 mb-4">Imagine a 'smart' keyboard that solves all your language-switching issues. What would be the biggest win for you?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.map(benefit => (
                        <button 
                            key={benefit.id}
                            onClick={() => handleOptionChange('overallValueProposition', benefit.id)} 
                            className={`p-4 rounded-lg text-left transition-all transform hover:scale-105 border-2 ${answers.overallValueProposition === benefit.id ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-white hover:bg-blue-50 border-gray-200'}`}
                        >
                            <div className="flex items-center">
                                <span className="text-3xl mr-4">{benefit.icon}</span>
                                <div>
                                    <div className="font-bold text-lg">{benefit.title}</div>
                                    <p className={`text-sm ${answers.overallValueProposition === benefit.id ? 'text-blue-100' : 'text-gray-600'}`}>{benefit.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question 3.2 - Revamped with all options */}
            <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">Which solutions sound most appealing?</h3>
                        <p className="text-gray-600">Click to rank your top 3. First click is 1st choice.</p>
                    </div>
                    <button onClick={resetRanking} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Reset</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rankingOptions.map(option => {
                        const rank = answers.rankedFeatures.indexOf(option.id) + 1;
                        const isRanked = rank > 0;
                        const isDisabled = !isRanked && answers.rankedFeatures.length >= 3;

                        return (
                            <button 
                                key={option.id}
                                onClick={() => handleFeatureClick(option.id)}
                                disabled={isDisabled}
                                className={`p-4 rounded-lg text-left transition-all border-2 relative h-full ${
                                    isRanked ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 
                                    isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-blue-50 border-gray-200'
                                }`}
                            >
                                {isRanked && (
                                    <span className="absolute top-2 right-2 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                                        {rank}
                                    </span>
                                )}
                                <div className="flex items-start">
                                    <span className="text-2xl mr-3">{option.icon}</span>
                                    <div>
                                        <div className="font-semibold">{option.label}</div>
                                        <p className={`text-sm ${isRanked ? 'text-blue-100' : 'text-gray-600'}`}>{option.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Question 3.3 - Updated */}
            <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">This is your chance to make an impact.</h3>
                <p className="text-gray-600 mb-4">If you could change ONE thing about how your keyboard handles languages, what would it be?</p>
                <textarea 
                    value={answers.finalFeedbackText} 
                    onChange={(e) => handleOptionChange('finalFeedbackText', e.target.value)} 
                    disabled={answers.noFinalFeedback}
                    placeholder="Share your most important idea here..." 
                    className="w-full mt-2 p-3 border-2 border-gray-300 rounded-lg text-base disabled:bg-gray-200" 
                    rows={4} 
                />
                <label className="flex items-center mt-3 p-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={answers.noFinalFeedback}
                        onChange={handleNoFeedbackCheck}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">I don't have anything to add.</span>
                </label>
            </div>
        </div>

        <button onClick={handleSubmit} disabled={!isFormValid} className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isFormValid ? 'Complete Survey' : 'Please fill all fields to continue'}
        </button>
      </div>
    </div>
  );
};

export default PurchaseDecision;
