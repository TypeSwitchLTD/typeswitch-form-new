import React, { useState } from 'react';
 
interface Props {
  onNext: (data: any) => void;
  t: any; // Translation object
}

const DemographicsScreen: React.FC<Props> = ({ onNext, t }) => {
  const [demographics, setDemographics] = useState({
    languages: [] as string[],
    hoursTyping: '',
    occupation: '',
    // *** FIX: Renamed state for clarity and to match database schema intent ***
    keyboardPhysicalType: [] as string[], // For 'membrane', 'mechanical' etc. Maps to DB 'current_keyboard'
    keyboardLayout: '',                  // For 'QWERTY', 'AZERTY' etc. Maps to DB 'keyboard_type'
    keyboardLayoutOther: '',
    useMultipleKeyboards: false,
    age: '',
    diagnosis: [] as string[]
  });

  const languageOptions = {
    'Arabic-English': 'Arabic + English',
    'Hebrew-English': 'Hebrew + English',
    'Russian-English': 'Russian + English'
  };

  const handleSubmit = () => {
    // Combine layout and other layout into a single field before sending
    const finalDemographics = {
      ...demographics,
      keyboardLayout: demographics.keyboardLayout === 'other'
        ? demographics.keyboardLayoutOther
        : demographics.keyboardLayout,
    };

    // The onNext function sends the whole demographics object
    onNext({ demographics: finalDemographics });
  };

  const selectLanguage = (lang: string) => {
    setDemographics(prev => ({
      ...prev,
      languages: [lang]
    }));
  };

  const toggleKeyboardPhysicalType = (keyboard: string) => {
    if (demographics.useMultipleKeyboards) {
      setDemographics(prev => ({
        ...prev,
        keyboardPhysicalType: prev.keyboardPhysicalType.includes(keyboard)
          ? prev.keyboardPhysicalType.filter(k => k !== keyboard)
          : prev.keyboardPhysicalType.length < 3
            ? [...prev.keyboardPhysicalType, keyboard]
            : prev.keyboardPhysicalType
      }));
    } else {
      setDemographics(prev => ({
        ...prev,
        keyboardPhysicalType: [keyboard]
      }));
    }
  };

  const handleMultipleKeyboardsChange = (checked: boolean) => {
    setDemographics(prev => ({
      ...prev,
      useMultipleKeyboards: checked,
      keyboardPhysicalType: checked ? prev.keyboardPhysicalType : prev.keyboardPhysicalType.slice(0, 1)
    }));
  };

  const handleDiagnosisChange = (value: string) => {
    setDemographics(prev => {
      const currentDiagnoses = prev.diagnosis || [];
      // Special case for 'none'
      if (value === 'none') {
        return { ...prev, diagnosis: currentDiagnoses.includes('none') ? [] : ['none'] };
      }

      let newDiagnoses = currentDiagnoses.filter(d => d !== 'none'); // Remove 'none' if other options are selected

      if (newDiagnoses.includes(value)) {
        newDiagnoses = newDiagnoses.filter(d => d !== value);
      } else {
        newDiagnoses.push(value);
      }

      return { ...prev, diagnosis: newDiagnoses };
    });
  };

  const isFormValid = demographics.languages.length > 0 &&
                     demographics.hoursTyping &&
                     demographics.occupation &&
                     demographics.keyboardPhysicalType.length > 0 &&
                     demographics.age &&
                     (demographics.keyboardLayout && (demographics.keyboardLayout !== 'other' || demographics.keyboardLayoutOther));

  if (!t.title) {
    return <div>Loading translations...</div>; // Defensive check
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{t.title}</h2>

        <div className="space-y-4">
          {/* Languages */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qLangPair} <span className="text-red-500">{t.required}</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(languageOptions).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => selectLanguage(key)}
                  className={`p-2 rounded-lg transition text-left text-sm ${
                    demographics.languages[0] === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {label as string}
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
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
              <option value="">{t.selectDefault}</option>
              {Object.entries(t.hoursOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label as string}</option>
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
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
              <option value="">{t.selectDefault}</option>
              {Object.entries(t.occupationOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label as string}</option>
              ))}
            </select>
          </div>

          {/* Current Keyboard Physical Type */}
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
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t.multiKeyboard}</span>
              </label>
            </div>

            <div className="space-y-1">
              {Object.entries(t.keyboardTypeOptions).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleKeyboardPhysicalType(key)}
                  disabled={!demographics.useMultipleKeyboards && demographics.keyboardPhysicalType.length > 0 && !demographics.keyboardPhysicalType.includes(key)}
                  className={`w-full p-2 rounded-lg transition text-left text-sm ${
                    demographics.keyboardPhysicalType.includes(key)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {label as string}
                </button>
              ))}
            </div>

            {demographics.useMultipleKeyboards && (
              <p className="text-xs text-gray-500 mt-1">
                {t.multiKeyboardDesc(demographics.keyboardPhysicalType.length)}
              </p>
            )}
          </div>

          {/* Keyboard layout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.qKeyboardLayout} <span className="text-red-500">{t.required}</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">{t.qKeyboardLayoutDesc}</p>
            <select
              value={demographics.keyboardLayout}
              onChange={(e) => setDemographics({...demographics, keyboardLayout: e.target.value, keyboardLayoutOther: ''})}
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
              <option value="">{t.selectDefault}</option>
              <option value="QWERTY">QWERTY</option>
              <option value="other">Other</option>
            </select>

            {demographics.keyboardLayout === 'other' && (
              <input
                type="text"
                value={demographics.keyboardLayoutOther}
                onChange={(e) => setDemographics({...demographics, keyboardLayoutOther: e.target.value})}
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
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
                <option value="">{t.selectDefault}</option>
                {Object.entries(t.ageOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label as string}</option>
                ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.qDiagnosis}</label>
            <p className="text-xs text-gray-600 mb-2">{t.qDiagnosisDesc}</p>
            <div className="space-y-2 p-2 border rounded-lg">
              {Object.entries(t.diagnosisOptions).map(([key, label]) => (
                <label key={key} className="flex items-center cursor-pointer p-1 rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    // *** FIX: Added margin-right for spacing ***
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    value={key}
                    checked={demographics.diagnosis.includes(key)}
                    onChange={() => handleDiagnosisChange(key)}
                  />
                  <span className="text-sm text-gray-800">{label as string}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFormValid ? t.continueButton : t.validationError}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemographicsScreen;
