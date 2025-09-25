import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const FeatureRating: React.FC<Props> = ({ onNext }) => {
  const [awakeningSymptoms, setAwakeningSymptoms] = useState<string[]>([]);
  const [deepDive, setDeepDive] = useState({
    flowBreakerImpact: '',
    professionalImageImpact: '',
    highPaceChallenge: '', // This was missing from the UI
    copingMechanismText: '',
    copingMechanismNone: false,
  });

  const toggleSymptom = (symptom: string) => {
    setAwakeningSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(item => item !== symptom)
        : [...prev, symptom]
    );
  };

  const handleDeepDiveChange = (field: keyof typeof deepDive, value: any) => {
    setDeepDive(prev => ({...prev, [field]: value}));
  }

  const handleCopingMechanismCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setDeepDive(prev => ({
        ...prev,
        copingMechanismNone: isChecked,
        copingMechanismText: isChecked ? '' : prev.copingMechanismText,
    }));
  }

  // The validation logic is now complete because the UI for `highPaceChallenge` exists
  const isFormValid = deepDive.flowBreakerImpact && deepDive.professionalImageImpact && deepDive.highPaceChallenge && (deepDive.copingMechanismNone || deepDive.copingMechanismText.length > 0);

  const handleSubmit = () => {
    if (isFormValid) {
      onNext({ 
        awakening: { symptoms: awakeningSymptoms },
        deepDive: deepDive,
       });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">📝 Your Daily Typing Experience</h2>
          <p className="text-lg text-gray-600">Let's analyze your real-world scenarios.</p>
        </div>

        {/* --- STAGE 1: The Awakening --- */}
        <div className="mb-10">
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <h3 className="text-2xl font-bold text-blue-800">Stage 1: The Awakening</h3>
                <p className="text-base text-gray-700 mt-1">Think about a typical workday. Which of the following feel familiar? (Check all that apply)</p>
            </div>
            
            <div className="space-y-4">
              {/* Preemptive Checks */}
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">Preemptive Checks</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('glance_icon')} className="mt-1 mr-3 h-5 w-5"/><span>Before typing, I glance at the language icon (e.g., ENG/HEB) to be sure.</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('extra_shortcut')} className="mt-1 mr-3 h-5 w-5"/><span>I use the language shortcut (Alt+Shift) a few times "just in case".</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('type_and_check')} className="mt-1 mr-3 h-5 w-5"/><span>I type a word or two, then pause to see if they're in the right language.</span></label>
              </div>
              {/* Micro-Corrections */}
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">Micro-Corrections</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('delete_word')} className="mt-1 mr-3 h-5 w-5"/><span>I find myself deleting an entire word typed in the wrong language.</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('sent_wrong_lang')} className="mt-1 mr-3 h-5 w-5"/><span>I've sent a quick chat message, only to realize after that it was in the wrong language.</span></label>
              </div>
              {/* Mental Effort & Existing Solutions - ADDED */}
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">Mental Effort & Existing Solutions</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('mental_effort')} className="mt-1 mr-3 h-5 w-5"/><span>My brain has to actively remember the current language when switching windows.</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => toggleSymptom('use_3rd_party')} className="mt-1 mr-3 h-5 w-5"/><span>I have searched for or currently use third-party software to ease language switching.</span></label>
              </div>
            </div>
        </div>

         {/* --- STAGE 2: The Deep Dive --- */}
        <div className="space-y-8">
            <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold text-purple-800">Stage 2: The Deep Dive</h3>
                <p className="text-base text-gray-700 mt-1">Answer the following based on your experience.</p>
            </div>

            {/* Q 2.1 */}
            <div>
                <p className="font-semibold text-base">When you repeatedly start a sentence in the wrong language, what's the main cumulative effect?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'technical')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Wasted time retyping</button>
                    <button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'mental')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'mental' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Breaks my concentration</button>
                    <button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'emotional')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'emotional' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Growing frustration</button>
                    <button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'negligible')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'negligible' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Doesn't bother me</button>
                </div>
            </div>
            {/* Q 2.2 */}
            <div>
                 <p className="font-semibold text-base">You send a client a chat message in the wrong language. First thought?</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <button onClick={() => handleDeepDiveChange('professionalImageImpact', 'correction_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'correction_focus' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>"Ugh, fix it fast."</button>
                    <button onClick={() => handleDeepDiveChange('professionalImageImpact', 'recipient_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'recipient_focus' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>"Hope they understood."</button>
                    <button onClick={() => handleDeepDiveChange('professionalImageImpact', 'image_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'image_focus' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>"That looks unprofessional."</button>
                    <button onClick={() => handleDeepDiveChange('professionalImageImpact', 'acceptance_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'acceptance_focus' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>"It happens, no big deal."</button>
                 </div>
            </div>
             {/* Q 2.3 - ADDED TO FIX BUG */}
            <div>
                 <p className="font-semibold text-base">What's your biggest challenge when typing fast in multiple languages (e.g., transcribing a meeting)?</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <button onClick={() => handleDeepDiveChange('highPaceChallenge', 'speed_drop')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'speed_drop' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>My speed drops</button>
                    <button onClick={() => handleDeepDiveChange('highPaceChallenge', 'error_increase')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'error_increase' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>More errors</button>
                    <button onClick={() => handleDeepDiveChange('highPaceChallenge', 'cognitive_load')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'cognitive_load' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>High mental effort</button>
                    <button onClick={() => handleDeepDiveChange('highPaceChallenge', 'no_challenge')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'no_challenge' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>No significant challenge</button>
                 </div>
            </div>
             {/* Q 2.4 */}
            <div>
                 <p className="font-semibold text-base">Do you have a specific method or "trick" to minimize these errors?</p>
                 <textarea value={deepDive.copingMechanismText} onChange={(e) => handleDeepDiveChange('copingMechanismText', e.target.value)} disabled={deepDive.copingMechanismNone} placeholder="e.g., I always check the icon color, I use software X..." className="w-full mt-2 p-3 border rounded-lg text-base disabled:bg-gray-100"/>
                 <label className="flex items-center mt-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" checked={deepDive.copingMechanismNone} onChange={handleCopingMechanismCheckbox} className="mr-3 h-5 w-5"/><span>I don't have a specific method or solution.</span></label>
            </div>
        </div>

        <button onClick={handleSubmit} disabled={!isFormValid} className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isFormValid ? 'Continue' : 'Please complete all questions in Stage 2'}
        </button>
      </div>
    </div>
  );
};

export default FeatureRating;
