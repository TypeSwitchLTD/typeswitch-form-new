// src/components/TypingExercise.tsx

import React, { useState, useEffect, useRef } from 'react';
import { ErrorDetail, KeystrokeEvent, TypingMetrics } from '../types';

interface Props {
  chosenExercise: string;
  onComplete: (data: any) => void;
  onBack: () => void;
  selectedLanguage: string;
  t: any; // Translation object
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
    },
    {
      title: "Exercise 2 - Student Article",
      text: `מחקרי הדמיה הראו כי אזורים במוח מופעלים באופן שונה בקרב בעלי ADHD, לרוב באקטיבציה נמוכה יותר.
נמצא כי אזורים שונים הינם בעלי נפח קטן יותר בהשוואה לקבוצות ביקורת (Bush, 2011).
המבנים המעורבים ב-ADHD מצויים באזורים כמו ה-Dorsolateral Prefrontal Cortex (DLPFC) וה-dorsal Anterior Cingulate Cortex (dACC).
אזורים אלה מיוחסים גם לתפקודים ניהוליים (Executive Functions) כמו תכנון וגילוי טעויות.
הראיות המצטברות מספקות תמיכה נרחבת לכך ש-ADHD הנה הפרעה נוירולוגית המערבת תפקודים מוחיים מורכבים.`
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

const punctuationRegex = /[.,!?;:\-(){}[\]"'•%/\\–_=+`~@#$^*<>|]/;


const TypingExercise: React.FC<Props> = ({ chosenExercise, onComplete, onBack, selectedLanguage, t }) => {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [keystrokes, setKeystrokes] = useState<KeystrokeEvent[]>([]);
  const [deletions, setDeletions] = useState(0);
  const [languageSwitches, setLanguageSwitches] = useState(0);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState<number>(0);
  const [lastLanguage, setLastLanguage] = useState<'hebrew' | 'arabic' | 'english' | 'russian' | null>(null);
  const [allMistakes, setAllMistakes] = useState<Set<number>>(new Set());
  const [correctedMistakes, setCorrectedMistakes] = useState<Set<number>>(new Set());

  const [realTimeLanguageErrors, setRealTimeLanguageErrors] = useState(0);
  const [realTimePunctuationErrors, setRealTimePunctuationErrors] = useState(0);

  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pasteHandler = useRef<((e: ClipboardEvent) => void) | null>(null);
  const copyHandler = useRef<((e: ClipboardEvent) => void) | null>(null);
  const cutHandler = useRef<((e: ClipboardEvent) => void) | null>(null);

  const exerciseSet = exercises[selectedLanguage] || exercises['Hebrew-English'];
  const exerciseIndex = chosenExercise === 'student_article' ? 1 : 0;
  const exercise = exerciseSet[exerciseIndex] || exerciseSet[0];

  const isRTL = selectedLanguage === 'Hebrew-English' || selectedLanguage === 'Arabic-English';

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
    setRealTimeLanguageErrors(0);
    setRealTimePunctuationErrors(0);
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
    const last5Chars = currentInput.slice(-5);
    if (last5Chars.length === 5 && new Set(last5Chars).size === 1) {
      handleCheatingDetected('⚠️ Please type the actual text, not the same character repeatedly!');
      return true;
    }

    const last20Chars = currentInput.slice(-20).toLowerCase();
    const mashingPatterns = [
      /[שדגכעיחלך]{8,}/,
      /[שגדךלכחףךלדשגחכ]{8,}/,
      /[асдфжклэ]{8,}/,
      /[asdfghjkl]{8,}/,
      /[qwertyuiop]{8,}/,
      /[zxcvbnm]{8,}/,
      /[;lkjdfsa]{8,}/,
      /([שדגכ])\1{3,}/,
      /([асдф])\1{3,}/,
    ];

    for (const pattern of mashingPatterns) {
      if (pattern.test(last20Chars)) {
        handleCheatingDetected('⚠️ Invalid typing detected! Please type the actual text. The exercise will restart.');
        return true;
      }
    }

    if (last20Chars.length >= 6) {
      const last6 = last20Chars.slice(-6);
      if (last6[0] === last6[2] && last6[2] === last6[4] &&
          last6[1] === last6[3] && last6[3] === last6[5] &&
          last6[0] !== last6[1]) {
        handleCheatingDetected('⚠️ Please type the actual text, not random patterns!');
        return true;
      }
    }

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
        if (!expectedLangs.includes(charLang)) wrongLangChars++;
      }
    }
    if (wrongLangChars >= 5) {
      handleCheatingDetected('⚠️ Wrong language detected! Please type in the correct languages. The exercise will restart.');
    }
  };

  const detectFinalErrors = (input: string): ErrorDetail[] => {
    const errors: ErrorDetail[] = [];
    const normalizedInput = normalizeText(input);
    const expectedChars = normalizedExerciseText.split('');
    const actualChars = normalizedInput.split('');
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
        } else if (punctuationRegex.test(expected) || punctuationRegex.test(actual)) {
          errorType = 'punctuation';
        }
        errors.push({ position: i, expected, actual, type: errorType, timestamp: Date.now() });
      }
    }
    return errors;
  };

  useEffect(() => {
    resetExerciseState();
    return cleanup;
  }, [chosenExercise, selectedLanguage]);

  useEffect(() => {
    const preventPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleCheatingDetected('⚠️ Copy/Paste is not allowed! Please type the text manually.');
    };
    document.addEventListener('paste', preventPaste);
    return () => {
      document.removeEventListener('paste', preventPaste);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (warningShown) return;
    const newValue = e.target.value;
    const oldValue = userInput;
    const currentTime = Date.now();
    const delay = currentTime - lastKeystrokeTime;

    if (newValue.length < oldValue.length) {
      setDeletions(prev => prev + (oldValue.length - newValue.length));
    }

    if (newValue.length > oldValue.length) {
      if (detectSuspiciousPattern(newValue)) return;
      const newChar = newValue.slice(-1);
      const currentLang = detectLanguage(newChar);
      if (currentLang && lastLanguage && currentLang !== lastLanguage) {
        setLanguageSwitches(prev => prev + 1);
      }
      if (currentLang) setLastLanguage(currentLang);

      const position = normalizeText(newValue).length - 1;
      const expectedChar = normalizedExerciseText[position];
      if (expectedChar && newValue.slice(-1) !== expectedChar) {
        setAllMistakes(prev => new Set(prev).add(position));
        const expectedLang = detectLanguage(expectedChar);
        const actualLang = detectLanguage(newValue.slice(-1));
        if (expectedLang && actualLang && expectedLang !== actualLang) {
          setRealTimeLanguageErrors(prev => prev + 1);
        } else if (punctuationRegex.test(expectedChar) || punctuationRegex.test(newValue.slice(-1))) {
          setRealTimePunctuationErrors(prev => prev + 1);
        }
      }
      checkLanguageConsistency(newValue);
    }

    setKeystrokes(prev => [...prev, { key: newValue.slice(-1) || 'backspace', timestamp: currentTime, position: newValue.length, isBackspace: newValue.length < oldValue.length, delay }]);
    setLastKeystrokeTime(currentTime);
    setUserInput(newValue);
  };

  const calculateMetrics = (): TypingMetrics => {
    const normalizedInput = normalizeText(userInput);
    const finalErrors = detectFinalErrors(userInput);
    const timeInMinutes = Math.max(0.1, (Date.now() - startTime) / 60000);
    const words = normalizedInput.split(/\s+/).filter(Boolean).length;
    let wpm = Math.round(words / timeInMinutes);
    wpm = Math.max(0, Math.min(150, wpm));
    let accuracy = normalizedInput.length > 0 ? Math.round(((normalizedInput.length - finalErrors.length) / normalizedInput.length) * 100) : 100;
    accuracy = Math.max(0, accuracy);

    const validDelays = keystrokes.map(k => k.delay).filter(d => d < 5000 && d > 0);
    const averageDelay = validDelays.length > 0 ? Math.round(validDelays.reduce((a, b) => a + b, 0) / validDelays.length) : 0;

    const frustrationFactors = [
      Math.min(2, finalErrors.length * 0.15),
      Math.min(2, allMistakes.size * 0.1),
      Math.min(1.5, deletions * 0.1),
      Math.min(1, correctedMistakes.size * 0.03),
      Math.min(1.5, languageSwitches * 0.15),
      Math.min(1, realTimePunctuationErrors * 0.15),
      averageDelay > 3000 ? 1.5 : (averageDelay > 2000 ? 0.75 : 0),
    ];
    const frustrationScore = Math.round(Math.min(10, frustrationFactors.reduce((a, b) => a + b, 0)));

    return {
      totalErrors: finalErrors.length,
      languageErrors: realTimeLanguageErrors,
      punctuationErrors: realTimePunctuationErrors,
      deletions,
      corrections: correctedMistakes.size,
      languageSwitches,
      averageDelay,
      frustrationScore,
      totalMistakesMade: allMistakes.size,
      finalErrors: finalErrors.length,
      accuracy,
      wpm,
    };
  };

  const handleComplete = () => {
    const metrics = calculateMetrics();
    const completionRate = (normalizeText(userInput).length / normalizedExerciseText.length) * 100;
    if (completionRate < 60) {
      alert('Please type at least 60% of the text to continue.');
      return;
    }
    cleanup();
    onComplete({
      exercises: [{
        text: exercise.text,
        userInput,
        timeSpent: Date.now() - startTime,
        errors: detectFinalErrors(userInput),
        deletions,
        corrections: metrics.corrections,
        languageSwitches,
        metrics: { ...metrics, completionRate: Math.round(completionRate) },
        cheatingDetected
      }],
      metrics: { ...metrics, completionRate: Math.round(completionRate) }
    });
  };

  const renderTextComparison = () => {
    const expectedChars = normalizedExerciseText.split('');
    return expectedChars.map((char, index) => {
      let className = 'text-gray-400';
      if (index < userInput.length) {
        if (userInput[index] === char) {
          className = 'text-green-600 font-bold';
        } else {
          className = 'text-red-600 bg-red-100';
        }
      }
      if (char === '\n') return <br key={index} />;
      return <span key={index} className={className}>{char}</span>;
    });
  };

  const progress = Math.min(100, (normalizeText(userInput).length / normalizedExerciseText.length) * 100);

  const buttonOrder = isRTL
    ? [
        <button key="complete" onClick={handleComplete} disabled={progress < 60} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50">
          {t.completeButton}
        </button>,
        <button key="back" onClick={onBack} className="bg-gray-500 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:bg-gray-600 transition">
          {t.backButton || 'Back'}
        </button>,
      ]
    : [
        <button key="back" onClick={onBack} className="bg-gray-500 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:bg-gray-600 transition">
          {t.backButton || 'Back'}
        </button>,
        <button key="complete" onClick={handleComplete} disabled={progress < 60} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50">
          {t.completeButton}
        </button>,
      ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl p-4 max-w-6xl w-full flex flex-col" style={{ height: 'calc(100vh - 2rem)', maxHeight: '900px' }}>
        
        {/* Header */}
        <div className="flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{t.title}</h2>
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-1">{t.progress} {Math.round(progress)}%</p>
          </div>
        </div>

        {/* Content Area (flexible and scrollable) */}
        <div className="flex-grow flex flex-col min-h-0 space-y-3">
          {/* Top text display area */}
          <div className="p-3 bg-gray-50 rounded-lg font-mono text-base leading-relaxed whitespace-pre-wrap overflow-y-auto" style={{ direction: isRTL ? 'rtl' : 'ltr', flexBasis: '40%' }}>
            {renderTextComparison()}
          </div>
          
          {/* Bottom typing area */}
          <div className="flex flex-col" style={{ flexBasis: '60%' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">{t.instruction}</label>
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              className="w-full p-3 border-2 border-gray-300 rounded-lg font-mono text-lg resize-none focus:border-blue-500 focus:outline-none bg-white flex-grow"
              placeholder={t.subtitle}
              dir={isRTL ? 'rtl' : 'ltr'}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center mt-4 flex-shrink-0 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-between'}`}>
          {isRTL ? (
            <>
              <button onClick={handleComplete} disabled={progress < 60} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50">
                {t.completeButton}
              </button>
              <button onClick={onBack} className="bg-gray-500 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:bg-gray-600 transition ml-3">
                {t.backButton || 'Back'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onBack} className="bg-gray-500 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:bg-gray-600 transition">
                {t.backButton || 'Back'}
              </button>
              <button onClick={handleComplete} disabled={progress < 60} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition">
                {t.completeButton}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingExercise;
