import React, { useState, useMemo } from 'react';

interface Props {
  onNext: (data: any) => void;
  t: any; // Translation object
}

const DemographicsScreen: React.FC<Props> = ({ onNext, t }) => {
  const [demographics, setDemographics] = useState({
    languages: [] as string[],
    hoursTyping: '',
    occupation: '',
    keyboardType: '',
    keyboardTypeOther: '',
    currentKeyboard: [] as string[],
    useMultipleKeyboards: false,
    age: '',
    diagnosis: ''
  });

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const languageOptions = [
    'Arabic-English',
    'Hebrew-English', 
    'Russian-English'
  ];

  // FIX: Keyboard types are now generated from the translation prop 't'
  const keyboardTypes = useMemo(() => {
    if (!t.keyboardTypeOptions) return [];
    return Object.entries(t.keyboardTypeOptions).map(([value, label]) => ({
        value,
        label: label as string,
    }));
  }, [t]);


  const isFormValid = demographics.languages.length > 0 && 
                     demographics.hoursTyping && 
                     demographics.occupation && 
                     demographics.currentKeyboard.length > 0 &&
                     demographics.age &&
                     (demographics.keyboardType && (demographics.keyboardType !== 'other' || demographics.keyboardTypeOther));

  const handleSubmit = () => {
    setAttemptedSubmit(true);
    if (isFormValid) {
      const finalKeyboardType = demographics.keyboardType === 'other' 
        ? demographics.keyboardTypeOther 
        : demographics.keyboardType;

      onNext({ 
        demographics: {
          ...demographics,
          keyboardType: finalKeyboardType,
          currentKeyboard: demographics.useMultipleKeyboards 
            ? demographics.currentKeyboard 
            : demographics.currentKeyboard.slice(0, 1)
        }
      });
    }
  };

  const selectLanguage = (lang: string) => {
    setDemographics(prev => ({
      ...prev,
      languages: [lang]
    }));
  };

  const toggleKeyboard = (keyboard: string) => {
    if (demographics.useMultipleKeyboards) {
      setDemographics(prev => ({
        ...prev,
        currentKeyboard: prev.currentKeyboard.includes(keyboard)
          ? prev.currentKeyboard.filter(k => k !== keyboard)
          : prev.currentKeyboard.length < 3 
            ? [...prev.currentKeyboard, keyboard]
            : prev.currentKeyboard
      }));
    } else {
      setDemographics(prev => ({
        ...prev,
        currentKeyboard: [keyboard]
      }));
    }
  };

  const handleMultipleKeyboardsChange = (checked: boolean) => {
    setDemographics(prev => ({
      ...prev,
      useMultipleKeyboards: checked,
      currentKeyboard: checked ? prev.currentKeyboard : prev.currentKeyboard.slice(0, 1)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{t.title}</h2>
        
        <div className="space-y-4">
          {attemptedSubmit && !isFormValid && (
            <div className="p-3 my-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p className="font-bold">{t.validationError}</p>
            </div>
          )}

          {/* Languages */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qLangPair} <span className="text-red-500">{t.required}</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {languageOptions.map(lang => (
                <button
                  key={lang}
                  onClick={() => selectLanguage(lang)}
                  className={`p-2 rounded-lg transition text-left text-sm ${
                    demographics.languages[0] === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Hours typing */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qHours} <span className="text-red-500">{t.required}</span>
            </label>
            <select
              value={demographics.hoursTyping}
              onChange={(e) => setDemographics({...demographics, hoursTyping: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">{t.selectDefault}</option>
              {Object.entries(t.hoursOptions).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qOccupation} <span className="text-red-500">{t.required}</span>
            </label>
            <select
              value={demographics.occupation}
              onChange={(e) => setDemographics({...demographics, occupation: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">{t.selectDefault}</option>
               {Object.entries(t.occupationOptions).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>
          </div>

          {/* Current Keyboard Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qKeyboardType} <span className="text-red-500">{t.required}</span>
            </label>
            
            <div className="mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.useMultipleKeyboards}
                  onChange={(e) => handleMultipleKeyboardsChange(e.target.checked)}
                  className="me-2 h-4 w-4"
                />
                <span className="text-sm text-gray-600">{t.multiKeyboard}</span>
              </label>
            </div>

            <div className="space-y-1">
              {keyboardTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => toggleKeyboard(type.value)}
                  disabled={!demographics.useMultipleKeyboards && demographics.currentKeyboard.length > 0 && !demographics.currentKeyboard.includes(type.value)}
                  className={`w-full p-2 rounded-lg transition text-left text-sm ${
                    demographics.currentKeyboard.includes(type.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {type.label}
                  {demographics.useMultipleKeyboards && demographics.currentKeyboard.includes(type.value) && (
                    <span className="ms-2 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            {demographics.useMultipleKeyboards && (
              <p className="text-xs text-gray-500 mt-1">
                {t.multiKeyboardDesc(demographics.currentKeyboard.length)}
              </p>
            )}
          </div>

          {/* Keyboard layout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qKeyboardLayout} <span className="text-red-500">{t.required}</span>
              <span className="text-xs text-gray-500 ms-1">{t.qKeyboardLayoutDesc}</span>
            </label>
            <select
              value={demographics.keyboardType}
              onChange={(e) => setDemographics({...demographics, keyboardType: e.target.value, keyboardTypeOther: ''})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">{t.selectDefault}</option>
              <option value="QWERTY">QWERTY</option>
              <option value="other">Other</option>
            </select>
            
            {demographics.keyboardType === 'other' && (
              <input
                type="text"
                value={demographics.keyboardTypeOther}
                onChange={(e) => setDemographics({...demographics, keyboardTypeOther: e.target.value})}
                placeholder={t.keyboardLayoutOtherPlaceholder}
                className="w-full mt-2 p-2 border rounded-lg text-sm"
              />
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qAge} <span className="text-red-500">{t.required}</span>
            </label>
            <select
              value={demographics.age}
              onChange={(e) => setDemographics({...demographics, age: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">{t.selectDefault}</option>
              {Object.entries(t.ageOptions).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t.qDiagnosis}
            </label>
            <p className="text-xs text-gray-600 mb-2">
              {t.qDiagnosisDesc}
            </p>
            <select
              value={demographics.diagnosis}
              onChange={(e) => setDemographics({...demographics, diagnosis: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">{t.selectDefault}</option>
              {Object.entries(t.diagnosisOptions).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
            disabled={!isFormValid}
          >
            {isFormValid ? t.continueButton : t.validationError}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemographicsScreen;
