// src/components/FeatureRating.tsx

import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  t: any; // Translation object
}

// *** FIX: Added all new symptom keys to their respective groups ***
const group1_symptoms = ['glance_icon', 'extra_shortcut', 'type_and_check', 'preventive_none'];
const group2_symptoms = ['delete_word', 'wrong_punctuation', 'sent_wrong_lang', 'delete_line', 'go_back_fix', 'caps_lock_error', 'micro_none'];
const group3_symptoms = [
  'mental_effort', 'shortcut_conflict', 'use_3rd_party', 
  'avoid_multilingual', 'use_separate_apps', 'self_talk', 'shortcut_memory', 'none_of_above'
];

const FeatureRating: React.FC<Props> = ({ onNext, t }) => {
  const [awakeningSymptoms, setAwakeningSymptoms] = useState<string[]>([]);
  const [deepDive, setDeepDive] = useState({
    flowBreakerImpact: '',
    professionalImageImpact: '',
    highPaceChallenge: '',
    copingMechanismText: '',
    copingMechanismNone: false,
  });

  // *** FIX: Replaced simple toggle with a new, smarter handler for symptom selection ***
  const handleSymptomToggle = (symptom: string) => {
    setAwakeningSymptoms(prev => {
      let newSelection = [...prev];
      let group: string[] | null = null;
      let noneOptionKey: string | null = null;

      if (group1_symptoms.includes(symptom)) {
        group = group1_symptoms;
        noneOptionKey = 'preventive_none';
      } else if (group2_symptoms.includes(symptom)) {
        group = group2_symptoms;
        noneOptionKey = 'micro_none';
      } else if (group3_symptoms.includes(symptom)) {
        group = group3_symptoms;
        noneOptionKey = 'none_of_above';
      }

      if (!group) return prev; // Should not happen, but a safe fallback

      const isNoneOption = symptom === noneOptionKey;

      // Get current selections from the same group
      const currentGroupSelections = prev.filter(s => group!.includes(s));

      if (isNoneOption) {
        // If "none" is already selected, deselect it. Otherwise, select only "none" for this group.
        if (currentGroupSelections.includes(symptom)) {
          return prev.filter(s => s !== symptom);
        } else {
          const otherGroupsSelections = prev.filter(s => !group!.includes(s));
          return [...otherGroupsSelections, symptom];
        }
      } else {
        // If a regular option is toggled
        let newGroupSelections = currentGroupSelections.filter(s => s !== noneOptionKey); // Ensure "none" is deselected
        
        if (newGroupSelections.includes(symptom)) {
          newGroupSelections = newGroupSelections.filter(s => s !== symptom); // Deselect
        } else {
          newGroupSelections.push(symptom); // Select
        }
        
        const otherGroupsSelections = prev.filter(s => !group!.includes(s));
        return [...otherGroupsSelections, ...newGroupSelections];
      }
    });
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

  const isGroup1Valid = group1_symptoms.some(symptom => awakeningSymptoms.includes(symptom));
  const isGroup2Valid = group2_symptoms.some(symptom => awakeningSymptoms.includes(symptom));
  const isGroup3Valid = group3_symptoms.some(symptom => awakeningSymptoms.includes(symptom));
  const isStage1Valid = isGroup1Valid && isGroup2Valid && isGroup3Valid;
  
  const isStage2Valid = deepDive.flowBreakerImpact && 
                        deepDive.professionalImageImpact && 
                        deepDive.highPaceChallenge && 
                        (deepDive.copingMechanismNone || deepDive.copingMechanismText.length > 0);
  const isFormValid = isStage1Valid && isStage2Valid;

  const getGroupsLeftCount = () => {
      let count = 0;
      if (!isGroup1Valid) count++;
      if (!isGroup2Valid) count++;
      if (!isGroup3Valid) count++;
      return count;
  }

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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h2>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <div className="mb-10">
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <h3 className="text-2xl font-bold text-blue-800">{t.stage1Title}</h3>
                <p className="text-base text-gray-700 mt-1">{t.stage1Desc}</p>
                <p className="text-sm text-gray-600 mt-1">{t.stage1Instruction}</p>
            </div>
            
            {!isStage1Valid && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-400 rounded-lg">
                <p className="text-orange-800 font-medium text-sm">
                  {t.validationWarning(getGroupsLeftCount())}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">{t.group1Title}</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('glance_icon')} checked={awakeningSymptoms.includes('glance_icon')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_glance_icon}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('extra_shortcut')} checked={awakeningSymptoms.includes('extra_shortcut')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_extra_shortcut}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('type_and_check')} checked={awakeningSymptoms.includes('type_and_check')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_type_and_check}</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('preventive_none')} checked={awakeningSymptoms.includes('preventive_none')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_preventive_none}</span></label>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">{t.group2Title}</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('delete_word')} checked={awakeningSymptoms.includes('delete_word')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_delete_word}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('wrong_punctuation')} checked={awakeningSymptoms.includes('wrong_punctuation')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_wrong_punctuation}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('sent_wrong_lang')} checked={awakeningSymptoms.includes('sent_wrong_lang')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_sent_wrong_lang}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('delete_line')} checked={awakeningSymptoms.includes('delete_line')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_delete_line}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('go_back_fix')} checked={awakeningSymptoms.includes('go_back_fix')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_go_back_fix}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('caps_lock_error')} checked={awakeningSymptoms.includes('caps_lock_error')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_caps_lock_error}</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('micro_none')} checked={awakeningSymptoms.includes('micro_none')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_micro_none}</span></label>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-lg text-gray-800 mb-2">{t.group3Title}</div>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('mental_effort')} checked={awakeningSymptoms.includes('mental_effort')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_mental_effort}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('shortcut_conflict')} checked={awakeningSymptoms.includes('shortcut_conflict')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_shortcut_conflict}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('use_3rd_party')} checked={awakeningSymptoms.includes('use_3rd_party')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_use_3rd_party}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('avoid_multilingual')} checked={awakeningSymptoms.includes('avoid_multilingual')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_avoid_multilingual}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('use_separate_apps')} checked={awakeningSymptoms.includes('use_separate_apps')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_use_separate_apps}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('self_talk')} checked={awakeningSymptoms.includes('self_talk')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_self_talk}</span></label>
                  <label className="flex items-start mb-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('shortcut_memory')} checked={awakeningSymptoms.includes('shortcut_memory')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_shortcut_memory}</span></label>
                  <label className="flex items-start p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" onChange={() => handleSymptomToggle('none_of_above')} checked={awakeningSymptoms.includes('none_of_above')} className="mt-1 me-3 h-5 w-5"/><span>{t.symptom_none_of_above}</span></label>
              </div>
            </div>
        </div>

        {/* Stage 2 remains unchanged */}
        <div className="space-y-8">
            <div className="p-4 bg-purple-50 rounded-lg"><h3 className="text-2xl font-bold text-purple-800">{t.stage2Title}</h3><p className="text-sm text-gray-600 mt-1">{t.stage2Desc}</p></div>
            <div className="bg-gray-50 rounded-lg p-4 border"><p className="text-sm text-gray-500 mb-2">{t.scenario1Title}</p><p className="font-semibold text-base mb-3">{t.scenario1Desc}<span className="text-red-500">*</span></p>{!deepDive.flowBreakerImpact && (<div className="mb-3 text-xs text-red-500">{t.requiredOption}</div>)}<div className="grid grid-cols-2 md:grid-cols-4 gap-3"><button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'technical')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'technical' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario1Opt1}</button><button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'mental')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'mental' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario1Opt2}</button><button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'emotional')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'emotional' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario1Opt3}</button><button onClick={() => handleDeepDiveChange('flowBreakerImpact', 'negligible')} className={`p-3 rounded-lg text-base transition ${deepDive.flowBreakerImpact === 'negligible' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario1Opt4}</button></div></div>
            <div className="bg-gray-50 rounded-lg p-4 border"><p className="text-sm text-gray-500 mb-2">{t.scenario2Title}</p><p className="font-semibold text-base mb-3">{t.scenario2Desc}<span className="text-red-500">*</span></p>{!deepDive.professionalImageImpact && (<div className="mb-3 text-xs text-red-500">{t.requiredOption}</div>)}<div className="grid grid-cols-2 md:grid-cols-4 gap-3"><button onClick={() => handleDeepDiveChange('professionalImageImpact', 'correction_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'correction_focus' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario2Opt1}</button><button onClick={() => handleDeepDiveChange('professionalImageImpact', 'recipient_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'recipient_focus' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario2Opt2}</button><button onClick={() => handleDeepDiveChange('professionalImageImpact', 'image_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'image_focus' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario2Opt3}</button><button onClick={() => handleDeepDiveChange('professionalImageImpact', 'acceptance_focus')} className={`p-3 rounded-lg text-base transition ${deepDive.professionalImageImpact === 'acceptance_focus' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario2Opt4}</button></div></div>
            <div className="bg-gray-50 rounded-lg p-4 border"><p className="text-sm text-gray-500 mb-2">{t.scenario3Title}</p><p className="font-semibold text-base mb-3">{t.scenario3Desc}<span className="text-red-500">*</span></p>{!deepDive.highPaceChallenge && (<div className="mb-3 text-xs text-red-500">{t.requiredOption}</div>)}<div className="grid grid-cols-2 md:grid-cols-4 gap-3"><button onClick={() => handleDeepDiveChange('highPaceChallenge', 'speed_drop')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'speed_drop' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario3Opt1}</button><button onClick={() => handleDeepDiveChange('highPaceChallenge', 'error_increase')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'error_increase' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario3Opt2}</button><button onClick={() => handleDeepDiveChange('highPaceChallenge', 'cognitive_load')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'cognitive_load' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario3Opt3}</button><button onClick={() => handleDeepDiveChange('highPaceChallenge', 'no_challenge')} className={`p-3 rounded-lg text-base transition ${deepDive.highPaceChallenge === 'no_challenge' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border'}`}>{t.scenario3Opt4}</button></div></div>
            <div className="bg-gray-50 rounded-lg p-4 border"><p className="font-semibold text-base mb-3">{t.copingMechanismTitle}</p><textarea value={deepDive.copingMechanismText} onChange={(e) => handleDeepDiveChange('copingMechanismText', e.target.value)} disabled={deepDive.copingMechanismNone} placeholder={t.copingMechanismPlaceholder} className="w-full mt-2 p-3 border rounded-lg text-base disabled:bg-gray-100" /><label className="flex items-center mt-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><input type="checkbox" checked={deepDive.copingMechanismNone} onChange={handleCopingMechanismCheckbox} className="me-3 h-5 w-5"/><span>{t.copingMechanismNone}</span></label></div>
        </div>

        <button onClick={handleSubmit} disabled={!isFormValid} className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isFormValid ? t.continueButton : t.stage1Instruction }
        </button>
      </div>
    </div>
  );
};

export default FeatureRating;
