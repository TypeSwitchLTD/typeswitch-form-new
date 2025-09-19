import React, { useState, useEffect, useRef } from 'react';
import { ErrorDetail, KeystrokeEvent, TypingMetrics } from '../types';

interface Props {
  exerciseNumber: number;
  onComplete: (data: any) => void;
  selectedLanguage: string;
}

const exercises = {
  'Arabic-English': [
    {
      title: "Exercise 1 - Purchasing Email",
      text: `لفريق المشتريات،
بناءً على الـ RFQ الذي نشرناه، تلقينا عروضاً من 12 مورداً، معظمهم من APAC وأوروبا.
حالياً Top 3 موردين:
1. Ycon DevOps & ALM: استشارات مهنية
2. Kabri: مورد فرعي
3. CocoLemon: موزع
أطلب فحص شروط الدفع بشكل عاجل (NET 30/60/90) وأوقات التسليم.
آخر موعد للتنفيذ 15/07/2025.
مدير المشتريات - Purchasing Manager`
    }
  ],
  'Hebrew-English': [
    {
      title: "Exercise 1 - Purchasing Email",
      text: `לצוות הרכש,
בהמשך ל-RFQ שפרסמנו, קיבלנו הצעות מ-12 ספקים, רובם מ-APAC ואירופה.
כרגע Top 3 ספקים:
1. Ycon DevOps & ALM: יעוץ מקצועי
2. Kabri: ספק משנה
3. CocoLemon: מפיץ
מבקש לבדוק בדחיפות תנאי תשלום (NET 30/60/90) וזמני אספקה.
תאריך אחרון לביצוע 15/07/2025.
מנהל רכש - Purchasing Manager`
    }
  ],
  'Russian-English': [
    {
      title: "Exercise 1 - Purchasing Email",
      text: `Команде закупок,
В продолжение опубликованного RFQ мы получили предложения от 12 поставщиков, в основном из APAC и Европы.
Сейчас Top 3 поставщика:
1. Ycon DevOps & ALM: профессиональный консалтинг
2. Kabri: субподрядчик
3. CocoLemon: дистрибьютор
Прошу срочно проверить условия оплаты (NET 30/60/90) и сроки поставки.
Крайний срок выполнения 15/07/2025.
Заместитель начальника отдела снабжения - CSCO`
    }
  ]
};

const TypingExercise: React.FC<Props> = ({ exerciseNumber, onComplete, selectedLanguage }) => {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [keystrokes, setKeystrokes] = useState<KeystrokeEvent[]>([]);
  const [deletions, setDeletions] = useState(0);
  const [languageSwitches, setLanguageSwitches] = useState(0);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState<number>(0);
  const [lastLanguage, setLastLanguage] = useState<'hebrew' | 'arabic' | 'english' | 'russian' | null>(null);
  const [allMistakes, setAllMistakes] = useState<Set<number>>(new Set());
  const [correctedMistakes, setCorrectedMistakes] = useState<Set<number>>(new Set());
  const [punctuationMistakes, setPunctuationMistakes] = useState(0);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pasteHandler = useRef<((e: ClipboardEvent) => void) | null>(null);
  const copyHandler = useRef<((e: ClipboardEvent) => void) | null>(null);
  const cutHandler = useRef<((e: ClipboardEvent) => void) | null>(null);

  const exerciseSet = exercises[selectedLanguage] || exercises['Hebrew-English'];
  const exercise = exerciseSet[exerciseNumber - 1];
  
  const isRTL = selectedLanguage === 'Hebrew-English' || selectedLanguage === 'Arabic-English';

  const punctuationConfusions = [
    ['.', ','], [',', '.'],
    ['(', ')'], [')', '('],
    ['-', '_'], ['_', '-'],
    ['/', '\\'], ['\\', '/'],
    [';', ':'], [':', ';'],
    ['!', '?'], ['?', '!']
  ];

  const normalizeText = (text: string) => {
    return text.trim();
  };

  const normalizedExerciseText = normalizeText(exercise.text);

  const cleanup = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (pasteHandler.current) {
      document.removeEventListener('paste', pasteHandler.current);
      pasteHandler.current = null;
    }
    if (copyHandler.current) {
      document.removeEventListener('copy', copyHandler.current);
      copyHandler.current = null;
    }
    if (cutHandler.current) {
      document.removeEventListener('cut', cutHandler.current);
      cutHandler.current = null;
    }
  };

  const resetExerciseState = () => {
    setUserInput('');
    setStartTime(Date.now());
    setLastKeystrokeTime(Date.now());
    setDeletions(0);
    setLanguageSwitches(0);
    setKeystrokes([]);
    setAllMistakes(new Set());
    setCorrectedMistakes(new Set());
    setLastLanguage(null);
    setPunctuationMistakes(0);
    setCheatingDetected(false);
    setWarningShown(false);
    textareaRef.current?.focus();
  };

  const handleCheatingDetected = (message: string) => {
    if (!warningShown) {
      setWarningShown(true); 
      alert(message);
      resetExerciseState();
    }
  };

  const detectSuspiciousPattern = (currentInput: string): boolean => {
    // Check for repeated characters (5+ same chars)
    const last5Chars = currentInput.slice(-5);
    if (last5Chars.length === 5 && new Set(last5Chars).size === 1) {
      handleCheatingDetected('⚠️ Please type the actual text, not the same character repeatedly!');
      return true;
    }

    // Check for keyboard mashing patterns
    const last20Chars = currentInput.slice(-20).toLowerCase();
    const mashingPatterns = [
      /[שדגכעיחלך]{8,}/,  // Hebrew keyboard mashing
      /[שגדךלכחףךלדשגחכ]{8,}/,  // The exact pattern you mentioned
      /[асдфжклэ]{8,}/,   // Russian keyboard mashing
      /[asdfghjkl]{8,}/,  // English home row
      /[qwertyuiop]{8,}/, // English top row
      /[zxcvbnm]{8,}/,    // English bottom row
      /[;lkjdfsa]{8,}/,   // Random semicolon patterns
      /([שדגכ])\1{3,}/,   // Hebrew repeated patterns
      /([асдф])\1{3,}/,   // Russian repeated patterns
    ];

    for (const pattern of mashingPatterns) {
      if (pattern.test(last20Chars)) {
        handleCheatingDetected('⚠️ Invalid typing detected! Please type the actual text. The exercise will restart.');
        return true;
      }
    }

    // Check for alternating two characters (ababab pattern)
    if (last20Chars.length >= 6) {
      const last6 = last20Chars.slice(-6);
      if (last6[0] === last6[2] && last6[2] === last6[4] &&
          last6[1] === last6[3] && last6[3] === last6[5] &&
          last6[0] !== last6[1]) {
        handleCheatingDetected('⚠️ Please type the actual text, not random patterns!');
        return true;
      }
    }

    // Check if no real words in last 30 characters
    const last30 = currentInput.slice(-30);
    const hasVowels = /[aeiouאהוי]/i.test(last30);
    const hasConsonants = /[bcdfghjklmnpqrstvwxyzבגדזחטכלמנספצקרשת]/i.test(last30);
    
    if (last30.length >= 20 && (!hasVowels || !hasConsonants)) {
      handleCheatingDetected('⚠️ Please type real words from the text!');
      return true;
    }

    return false;
  };

  const detectLanguage = (char: string): 'hebrew' | 'arabic' | 'english' | 'russian' | null => {
    if (/[א-ת]/.test(char)) return 'hebrew';
    if (/[\u0600-\u06FF]/.test(char)) return 'arabic';
    if (/[а-яА-Я]/.test(char)) return 'russian';
    if (/[a-zA-Z]/.test(char)) return 'english';
    return null;
  };

  const checkLanguageConsistency = (newValue: string) => {
    const chars = newValue.slice(-5).split('');
    let wrongLangChars = 0;
    
    const expectedLangs = selectedLanguage.split('-').map(l => l.toLowerCase());
    
    for (const char of chars) {
      const charLang = detectLanguage(char);
      if (charLang) {
        const isWrongLang = !expectedLangs.includes(charLang);
        if (isWrongLang) {
          wrongLangChars++;
        }
      }
    }
    
    if (wrongLangChars >= 5) {
      handleCheatingDetected('⚠️ Wrong language detected! Please type in the correct languages. The exercise will restart.');
    }
  };

  useEffect(() => {
    resetExerciseState();
    return cleanup;
  }, [exerciseNumber]);

  useEffect(() => {
    pasteHandler.current = (e: ClipboardEvent) => {
      e.preventDefault();
      handleCheatingDetected('⚠️ Copy/Paste is not allowed! Please type the text manually.');
      return false;
    };
    
    copyHandler.current = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    
    cutHandler.current = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('paste', pasteHandler.current);
    document.addEventListener('copy', copyHandler.current);
    document.addEventListener('cut', cutHandler.current);

    return cleanup;
  }, []);

  const isPunctuationConfusion = (expected: string, actual: string): boolean => {
    return punctuationConfusions.some(([a, b]) => 
      (expected === a && actual === b) || (expected === b && actual === a)
    );
  };

  const detectErrors = (input: string): ErrorDetail[] => {
    const errors: ErrorDetail[] = [];
    const normalizedInput = normalizeText(input);
    const expectedChars = normalizedExerciseText.split('');
    const actualChars = normalizedInput.split('');
    let localPunctuationMistakes = 0;

    for (let i = 0; i < actualChars.length; i++) {
      if (i >= expectedChars.length) break;
      
      const expected = expectedChars[i];
      const actual = actualChars[i];

      if (expected !== actual) {
        let errorType: 'language' | 'punctuation' | 'typo' = 'typo';
        
        const expectedLang = detectLanguage(expected);
        const actualLang = detectLanguage(actual);
        
        if (expectedLang && actualLang && expectedLang !== actualLang) {
          errorType = 'language';
        }
        else if (/[.,!?;:\-(){}[\]"'•%/\\–_]/.test(expected) || /[.,!?;:\-(){}[\]"'•%/\\–_]/.test(actual)) {
          errorType = 'punctuation';
          if (isPunctuationConfusion(expected, actual)) {
            localPunctuationMistakes++;
          }
        }

        errors.push({
          position: i,
          expected,
          actual,
          type: errorType,
          timestamp: Date.now()
        });
      }
    }

    setPunctuationMistakes(localPunctuationMistakes);
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (warningShown) return;
    
    const newValue = e.target.value;
    const oldValue = userInput;
    const currentTime = Date.now();
    const delay = currentTime - lastKeystrokeTime;

    if (newValue.length < oldValue.length) {
      setDeletions(prev => prev + (oldValue.length - newValue.length));
      
      const oldErrors = detectErrors(oldValue);
      const newErrors = detectErrors(newValue);
      
      const oldErrorPositions = new Set(oldErrors.map(e => e.position));
      const newErrorPositions = new Set(newErrors.map(e => e.position));
      
      for (const pos of oldErrorPositions) {
        if (!newErrorPositions.has(pos) && allMistakes.has(pos)) {
          setCorrectedMistakes(prev => new Set(prev).add(pos));
        }
      }
    }

    if (newValue.length > oldValue.length) {
      // Check for suspicious patterns first
      if (detectSuspiciousPattern(newValue)) {
        return;
      }

      const newChar = newValue.slice(-1);
      const currentLang = detectLanguage(newChar);
      
      if (currentLang && lastLanguage && currentLang !== lastLanguage) {
        setLanguageSwitches(prev => prev + 1);
      }
      
      if (currentLang) {
        setLastLanguage(currentLang);
      }

      const normalizedNew = normalizeText(newValue);
      const position = normalizedNew.length - 1;
      const expectedChar = normalizedExerciseText[position];
      
      if (expectedChar && normalizedNew[position] !== expectedChar) {
        setAllMistakes(prev => new Set(prev).add(position));
      }
      
      // Check for wrong language
      checkLanguageConsistency(newValue);
    }

    setKeystrokes(prev => [...prev, {
      key: newValue.slice(-1) || 'backspace',
      timestamp: currentTime,
      position: newValue.length,
      isBackspace: newValue.length < oldValue.length,
      delay
    }]);

    setLastKeystrokeTime(currentTime);
    setUserInput(newValue);
  };

  const calculateMetrics = (): TypingMetrics => {
    const normalizedInput = normalizeText(userInput);
    const errors = detectErrors(userInput);
    const languageErrors = errors.filter(e => e.type === 'language').length;
    const punctuationErrors = errors.filter(e => e.type === 'punctuation').length;
    
    const corrections = correctedMistakes.size;
    
    const timeInMinutes = Math.max(0.1, (Date.now() - startTime) / 60000);
    const words = normalizedInput.split(/\s+/).filter(w => w.length > 0).length;
    const rawWPM = words / timeInMinutes;
    
    let wpm = Math.round(rawWPM * 0.85);
    if (cheatingDetected) {
      wpm = Math.max(0, Math.round(wpm * 0.3));
    }
    wpm = Math.max(0, Math.min(150, wpm));
    
    const totalChars = normalizedInput.length;
    const correctChars = Math.max(0, totalChars - errors.length);
    let accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    
    if (cheatingDetected) {
      accuracy = Math.max(0, accuracy - 30);
    }
    
    const validDelays = keystrokes.map(k => k.delay).filter(d => d < 5000 && d > 0);
    const averageDelay = validDelays.length > 0 
      ? Math.round(validDelays.reduce((a, b) => a + b, 0) / validDelays.length)
      : 0;
    
    const frustrationFactors = [
      Math.min(2, errors.length * 0.15),
      Math.min(2, allMistakes.size * 0.1),
      Math.min(1.5, deletions * 0.1),
      Math.min(1, corrections * 0.03),
      Math.min(1.5, languageSwitches * 0.15),
      Math.min(1, punctuationMistakes * 0.15),
      averageDelay > 3000 ? 1.5 : (averageDelay > 2000 ? 0.75 : 0),
      cheatingDetected ? 3 : 0
    ];
    
    const frustrationScore = Math.round(
      Math.min(10, frustrationFactors.reduce((a, b) => a + b, 0))
    );

    return {
      totalErrors: errors.length,
      languageErrors,
      punctuationErrors,
      deletions,
      corrections,
      languageSwitches,
      averageDelay,
      frustrationScore,
      totalMistakesMade: allMistakes.size,
      finalErrors: errors.length,
      accuracy,
      wpm
    };
  };

  const handleComplete = () => {
    const metrics = calculateMetrics();
    
    const normalizedInput = normalizeText(userInput);
    if (normalizedInput.length < normalizedExerciseText.length * 0.5) {
      alert('Please type at least 50% of the text to continue.');
      return;
    }
    
    if (cheatingDetected && metrics.accuracy < 50) {
      alert('⚠️ Invalid test detected! Please restart and type the actual text.');
      resetExerciseState();
      return;
    }
    
    cleanup();
    
    onComplete({
      exercises: [{
        exerciseNumber,
        text: exercise.text,
        userInput,
        timeSpent: Date.now() - startTime,
        errors: detectErrors(userInput),
        deletions,
        corrections: metrics.corrections,
        languageSwitches,
        metrics,
        cheatingDetected
      }],
      metrics
    });
  };

  const renderTextComparison = () => {
    const normalizedInput = normalizeText(userInput);
    const expectedChars = normalizedExerciseText.split('');
    const actualChars = normalizedInput.split('');
    
    return expectedChars.map((char, index) => {
      let className = 'text-gray-400';
      let style: React.CSSProperties = {};
      
      if (index < actualChars.length) {
        if (actualChars[index] === char) {
          className = 'text-green-600';
          style = { fontWeight: 'bold' };
        } else {
          // Enhanced error highlighting with light red background
          className = 'text-red-600';
          style = { 
            fontWeight: 'bold',
            backgroundColor: '#FEE2E2',
            padding: '0 2px',
            borderRadius: '2px'
          };
        }
      }
      
      if (char === '\n') {
        return <br key={index} />;
      }
      
      return (
        <span key={index} className={className} style={style}>
          {char}
        </span>
      );
    });
  };

  const progress = Math.min(100, (normalizeText(userInput).length / normalizedExerciseText.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-xl p-4 max-w-6xl w-full" style={{ maxHeight: '95vh' }}>
        <h2 className="text-lg font-bold text-gray-800 mb-2">{exercise.title}</h2>
        
        {cheatingDetected && (
          <div className="mb-2 p-2 bg-red-100 border border-red-400 rounded-lg">
            <p className="text-red-700 text-sm font-semibold">
              ⚠️ Suspicious activity detected! Please type the actual text.
            </p>
          </div>
        )}
        
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Progress: {Math.round(progress)}%</p>
        </div>

        <div className="mb-3 p-3 bg-gray-50 rounded-lg" style={{ maxHeight: '35vh', overflowY: 'auto' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {renderTextComparison()}
          </p>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Type the email here:
          </label>
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            onPaste={(e) => {
              e.preventDefault();
              handleCheatingDetected('⚠️ Paste is not allowed! Please type manually.');
            }}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            className="w-full p-3 border-2 border-gray-300 rounded-lg font-mono text-sm leading-relaxed resize-none focus:border-blue-500 focus:outline-none bg-white"
            rows={7}
            placeholder="Start typing the email..."
            dir={isRTL ? 'rtl' : 'ltr'}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            style={{ lineHeight: '1.6' }}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span>Characters: {normalizeText(userInput).length} / {normalizedExerciseText.length}</span>
          </div>
          
          <button
            onClick={handleComplete}
            disabled={normalizeText(userInput).length < normalizedExerciseText.length * 0.5}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Exercise
          </button>
        </div>
        
        {normalizeText(userInput).length < normalizedExerciseText.length * 0.5 && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            Type at least 50% to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default TypingExercise;
