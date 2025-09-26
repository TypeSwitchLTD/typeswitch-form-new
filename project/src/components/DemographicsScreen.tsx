import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const DemographicsScreen: React.FC<Props> = ({ onNext }) => {
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

  const languageOptions = [
    'Arabic-English',
    'Hebrew-English', 
    'Russian-English'
  ];

  const keyboardTypes = [
    { value: 'mechanical', label: 'Mechanical (Cherry MX, gaming keyboards)' },
    { value: 'ergonomic', label: 'Ergonomic (Split layout, curved design)' },
    { value: 'wireless', label: 'Wireless/Bluetooth (Portable, no cables)' },
    { value: 'membrane', label: 'Membrane (Standard office keyboards)' },
    { value: 'laptop', label: 'Laptop/Built-in (Came with computer)' }
  ];

  const handleSubmit = () => {
    const finalKeyboardType = demographics.keyboardType === 'other' 
      ? demographics.keyboardTypeOther 
      : demographics.keyboardType;

    if (demographics.languages.length > 0 && 
        demographics.hoursTyping && 
        demographics.occupation && 
        demographics.currentKeyboard.length > 0 &&
        demographics.age &&
        finalKeyboardType) {
      onNext({ 
        demographics: {
          ...demographics,
          keyboardType: finalKeyboardType,
          currentKeyboard: demographics.useMultipleKeyboards 
            ? demographics.currentKeyboard 
            : [demographics.currentKeyboard[0]]
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

  const isFormValid = demographics.languages.length > 0 && 
                     demographics.hoursTyping && 
                     demographics.occupation && 
                     demographics.currentKeyboard.length > 0 &&
                     demographics.age &&
                     (demographics.keyboardType && (demographics.keyboardType !== 'other' || demographics.keyboardTypeOther));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Initial Setup</h2>
        
        <div className="space-y-4">
          {/* Languages */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Which language pair do you type in? <span className="text-red-500">*</span>
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
              How many hours per day do you type? <span className="text-red-500">*</span>
            </label>
            <select
              value={demographics.hoursTyping}
              onChange={(e) => setDemographics({...demographics, hoursTyping: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="less-1">Less than 1 hour</option>
              <option value="1-3">1-3 hours</option>
              <option value="3-5">3-5 hours</option>
              <option value="5-8">5-8 hours</option>
              <option value="8+">8+ hours</option>
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Field of work? <span className="text-red-500">*</span>
            </label>
            <select
              value={demographics.occupation}
              onChange={(e) => setDemographics({...demographics, occupation: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="student">Student</option>
              <option value="tech">Tech / Programming</option>
              <option value="sales">Sales</option>
              <option value="purchasing">Purchasing</option>
              <option value="translation">Translation</option>
              <option value="education">Education</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Current Keyboard Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What type of keyboard do you currently use? <span className="text-red-500">*</span>
            </label>
            
            <div className="mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.useMultipleKeyboards}
                  onChange={(e) => handleMultipleKeyboardsChange(e.target.checked)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-600">I use multiple keyboards</span>
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
                    <span className="ml-2 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            {demographics.useMultipleKeyboards && (
              <p className="text-xs text-gray-500 mt-1">
                Select up to 3 keyboards ({demographics.currentKeyboard.length}/3 selected)
              </p>
            )}
          </div>

          {/* Keyboard layout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Keyboard layout? <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-1">(The physical arrangement of keys on your keyboard)</span>
            </label>
            <select
              value={demographics.keyboardType}
              onChange={(e) => setDemographics({...demographics, keyboardType: e.target.value, keyboardTypeOther: ''})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="QWERTY">QWERTY</option>
              <option value="other">Other</option>
            </select>
            
            {demographics.keyboardType === 'other' && (
              <input
                type="text"
                value={demographics.keyboardTypeOther}
                onChange={(e) => setDemographics({...demographics, keyboardTypeOther: e.target.value})}
                placeholder="Please specify your keyboard layout (e.g., AZERTY, DVORAK, etc.)..."
                className="w-full mt-2 p-2 border rounded-lg text-sm"
              />
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age? <span className="text-red-500">*</span>
            </label>
            <select
              value={demographics.age}
              onChange={(e) => setDemographics({...demographics, age: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="under-18">Under 18</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46-55">46-55</option>
              <option value="55+">55+</option>
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Have you been diagnosed with:
            </label>
            <p className="text-xs text-gray-600 mb-2">
              (Optional but important for our research)
            </p>
            <select
              value={demographics.diagnosis}
              onChange={(e) => setDemographics({...demographics, diagnosis: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="adhd">ADHD</option>
              <option value="dyslexia">Dyslexia</option>
              <option value="other">Other learning disability</option>
              <option value="undiagnosed">Not diagnosed but suspect attention difficulties</option>
              <option value="none">None</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isFormValid ? 'Please fill all required fields' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemographicsScreen;
