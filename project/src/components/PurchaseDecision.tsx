import React, { useState, useMemo } from 'react';

interface Props {
  onNext: (data: any) => void;
  t: any; // Translation object
}

const PurchaseDecision: React.FC<Props> = ({ onNext, t }) => {
  // Defensive check: If translations are not provided, render an error message instead of crashing.
  if (!t) {
    return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg text-center">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Component Error</h2>
                <p className="text-gray-600">
                    The translation data for the 'Purchase Decision' screen could not be loaded.
                    This is a critical error. Please go back and try again.
                </p>
            </div>
        </div>
    );
  }
    
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

  const benefits = useMemo(() => [
    { id: 'productivity', icon: '🚀', title: t.benefit_productivity_title, description: t.benefit_productivity_desc },
    { id: 'focus', icon: '🧠', title: t.benefit_focus_title, description: t.benefit_focus_desc },
    { id: 'control', icon: '😌', title: t.benefit_control_title, description: t.benefit_control_desc },
    { id: 'communication', icon: '💬', title: t.benefit_communication_title, description: t.benefit_communication_desc },
  ], [t]);
  
  const rankingOptions = useMemo(() => [
        { id: 'mechanical', icon: '⌨️', label: t.feature_mechanical, description: t.feature_mechanical_desc },
        { id: 'physical_switch', icon: '🔄', label: t.feature_physical_switch, description: t.feature_physical_switch_desc },
        { id: 'auto_detection', icon: '✨', label: t.feature_auto_detection, description: t.feature_auto_detection_desc },
        { id: 'dynamic_lighting', icon: '💡', label: t.feature_dynamic_lighting, description: t.feature_dynamic_lighting_desc },
        { id: 'wireless', icon: '📡', label: t.feature_wireless, description: t.feature_wireless_desc },
        { id: 'mic', icon: '🎙️', label: t.feature_mic, description: t.feature_mic_desc },
        { id: 'wrist_rest', icon: '🤲', label: t.feature_wrist_rest, description: t.feature_wrist_rest_desc },
        { id: 'programmable_keys', icon: '⚙️', label: t.feature_programmable_keys, description: t.feature_programmable_keys_desc },
        { id: 'rotary_knob', icon: '🎛️', label: t.feature_rotary_knob, description: t.feature_rotary_knob_desc },
        { id: 'visual_display', icon: '🖥️', label: t.feature_visual_display, description: t.feature_visual_display_desc },
  ], [t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl w-full">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h2>
            <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>
        
        <div className="space-y-8">
            {/* Question 3.1 */}
            <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{t.q1Title}</h3>
                <p className="text-gray-600 mb-4">{t.q1Desc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.map(benefit => (
                        <button 
                            key={benefit.id}
                            onClick={() => handleOptionChange('overallValueProposition', benefit.id)} 
                            className={`p-4 rounded-lg text-left transition-all transform hover:scale-105 border-2 ${answers.overallValueProposition === benefit.id ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-white hover:bg-blue-50 border-gray-200'}`}
                        >
                            <div className="flex items-center">
                                <span className="text-3xl me-4">{benefit.icon}</span>
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
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">{t.q2Title}</h3>
                        <p className="text-gray-600">{t.q2Desc}</p>
                    </div>
                    <button onClick={resetRanking} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">{t.reset}</button>
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
                                    <span className="text-2xl me-3">{option.icon}</span>
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
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{t.q3Title}</h3>
                <p className="text-gray-600 mb-4">{t.q3Desc}</p>
                <textarea 
                    value={answers.finalFeedbackText} 
                    onChange={(e) => handleOptionChange('finalFeedbackText', e.target.value)} 
                    disabled={answers.noFinalFeedback}
                    placeholder={t.q3Placeholder}
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
                    <span className="ms-3 text-gray-700">{t.q3Checkbox}</span>
                </label>
            </div>
        </div>

        <button onClick={handleSubmit} disabled={!isFormValid} className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isFormValid ? t.submitButton : t.submitButtonError}
        </button>
      </div>
    </div>
  );
};

export default PurchaseDecision;
