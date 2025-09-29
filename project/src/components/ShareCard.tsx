import React, { useState } from 'react';
import { TypingMetrics } from '../types';
import { calculateOverallScore } from '../App'; // Import the centralized function

interface Props {
  metrics: TypingMetrics;
  onClose: () => void;
  selectedLanguage?: string;
  t: any; // Translation object
}

const ShareCard: React.FC<Props> = ({ metrics, onClose, selectedLanguage = 'Hebrew-English', t }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStep, setShareStep] = useState<'initial' | 'generated'>('initial');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState('');

  const finalScore = calculateOverallScore(metrics, (metrics as any).completionRate || 100);
  
  const shareTexts = {
    'Hebrew-English': {
      postLine1: 'עשיתי את מבחן ההקלדה של TypeSwitch.',
      postLine2: 'מסתבר שרמת ההקלדה שלי היא "{scoreLevel}" עם ציון כללי של {finalScore}/100.',
      postCta: '💡 בואו לבדוק את עצמכם ולעזור למחקר! כל תשובה עוזרת + 15% הנחה מיידית.',
      copyMessage: '✅ הטקסט הועתק! פשוט הדבק (Ctrl+V) אותו בפוסט.',
      isRTL: true
    },
    'Russian-English': {
      postLine1: 'Я прошёл тест на скорость печати от TypeSwitch.',
      postLine2: 'Оказывается, мой уровень — "{scoreLevel}" с общим баллом {finalScore}/100.',
      postCta: '💡 Проверьте себя и помогите исследованию! + 15% скидка сразу.',
      copyMessage: '✅ Text copied! Just paste (Ctrl+V) it into your post.',
      isRTL: false
    },
    'Arabic-English': {
      postLine1: 'لقد أجريت اختبار الكتابة من TypeSwitch.',
      postLine2: 'اتضح أن مستواي هو "{scoreLevel}" بنتيجة إجمالية {finalScore}/100.',
      postCta: '💡 اختبروا أنفسكم وساعدوا في البحث! كل إجابة تساعد + خصم 15% فوري.',
      copyMessage: '✅ Text copied! Just paste (Ctrl+V) it into your post.',
      isRTL: true
    }
  };

  const currentText = shareTexts[selectedLanguage] || shareTexts['Hebrew-English'];
  
  const getScoreLevelInfo = (score: number) => {
    if (score >= 85) return { level: 'Excellent!', color: '#22C55E', gradient: ['#6EE7B7', '#3B82F6'] };
    if (score >= 70) return { level: 'Good', color: '#3B82F6', gradient: ['#93C5FD', '#8B5CF6'] };
    if (score >= 55) return { level: 'Average', color: '#F59E0B', gradient: ['#FDE68A', '#F97316'] };
    if (score >= 40) return { level: 'Needs Improvement', color: '#F97316', gradient: ['#FDBA74', '#EF4444'] };
    return { level: 'Room to Grow', color: '#EF4444', gradient: ['#FCA5A5', '#D946EF'] };
  };
  
  const scoreLevelInfo = getScoreLevelInfo(finalScore);

  const generateImageWithCanvas = () => {
    setIsGenerating(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }
    canvas.width = 800;
    canvas.height = 1000;
    
    const gradient = ctx.createLinearGradient(0, 0, 800, 1000);
    gradient.addColorStop(0, scoreLevelInfo.gradient[0]);
    gradient.addColorStop(1, scoreLevelInfo.gradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, 40, 40, 720, 920, 20);
    ctx.fill();
    
    let yPos = 120;

    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = scoreLevelInfo.color;
    ctx.textAlign = 'center';
    ctx.fillText(scoreLevelInfo.level, 400, yPos);
    
    yPos += 70;
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText(`Overall Score: ${finalScore}/100`, 400, yPos);

    yPos += 100;
    const stats = [
      { label: 'Speed (WPM)', value: metrics.wpm },
      { label: 'Accuracy', value: `${metrics.accuracy}%` },
      { label: 'Mistakes', value: metrics.totalMistakesMade }
    ];
    let xPos = 100;
    stats.forEach(stat => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      roundRect(ctx, xPos, yPos, 200, 100, 15);
      ctx.fill();
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(stat.value), xPos + 100, yPos + 55);
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(stat.label, xPos + 100, yPos + 85);
      xPos += 220;
    });

    yPos += 150;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    roundRect(ctx, 100, yPos, 600, 80, 15);
    ctx.fill();
    ctx.fillStyle = '#1F2937';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Frustration Level:', 120, yPos + 48);
    const barColor = metrics.frustrationScore > 6 ? '#EF4444' : metrics.frustrationScore > 3 ? '#F59E0B' : '#22C55E';
    ctx.fillStyle = barColor;
    const barWidth = (400 * metrics.frustrationScore) / 10;
    roundRect(ctx, 320, yPos + 25, 360, 30, 15);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fill();
    roundRect(ctx, 320, yPos + 25, barWidth > 360 ? 360: barWidth, 30, 15);
    ctx.fillStyle = barColor;
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${metrics.frustrationScore}/10`, 320 + (barWidth > 360 ? 360: barWidth)/2, yPos + 46);
    
    yPos += 150;
    const shareUrl = "form.typeswitch.io";
    ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
    roundRect(ctx, 60, yPos, 680, 200, 20);
    ctx.fill();
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Help build the best multilingual keyboard!', 400, yPos + 60);
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('Get 15% OFF + 10% with email!', 400, yPos + 100);
    ctx.fillStyle = '#3B82F6';
    ctx.font = '36px system-ui, -apple-system, sans-serif';
    ctx.fillText(shareUrl, 400, yPos + 150);
    
    ctx.fillStyle = '#4B5563';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Join 1000+ testers shaping the future of typing', 400, 950);

    setImageUrl(canvas.toDataURL('image/png'));
    setShareStep('generated');
    setIsGenerating(false);
  };
  
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `typeswitch-results-${selectedLanguage}.png`;
    a.click();
  };

  const buildPostText = () => {
    const postLine2WithScore = currentText.postLine2
      .replace('{scoreLevel}', scoreLevelInfo.level)
      .replace('{finalScore}', String(finalScore));

    return [
      currentText.postLine1,
      postLine2WithScore,
      '', 
      currentText.postCta,
      '',
      'Test yourself: https://form.typeswitch.io'
    ].join('\n');
  };

  const shareToSocial = (platform: string) => {
    const postText = buildPostText();
    const siteUrl = 'https://form.typeswitch.io';

    navigator.clipboard.writeText(postText).then(() => {
      setCopySuccess(currentText.copyMessage);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });

    let url = '';
    const encodedText = encodeURIComponent(postText);
    const encodedUrl = encodeURIComponent(siteUrl);

    switch (platform) {
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`;
        break;
    }
    
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
        {/* *** FIX: Centered title with absolute positioned close button *** */}
        <div className="relative mb-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center w-full">
            {t.shareTitle || "Share Your Results"}
          </h2>
          <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {shareStep === 'initial' && (
           <>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Your results will include:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span>Your final score and title</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span>Your typing speed and accuracy</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span>A shareable image with 15% + 10% discount offer</li>
              </ul>
            </div>
            <button onClick={generateImageWithCanvas} disabled={isGenerating} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center">
              {isGenerating ? 'Creating your image...' : `📸 Generate Share Image in ${selectedLanguage.split('-')[0]}`}
            </button>
          </>
        )}

        {shareStep === 'generated' && (
          <>
            <div className="mb-4 max-h-96 overflow-y-auto rounded-lg shadow-lg border">
              <img src={imageUrl} alt="Your Results" className="w-full" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <h4 className="font-bold mb-1">{t.shareExplanationTitle}</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>{t.shareExplanation1}</li>
                    <li>{t.shareExplanation2}</li>
                    <li>{t.shareExplanation3}</li>
                </ul>
            </div>
            
            {copySuccess && (
               <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-center">
                <p className="text-sm text-green-800 font-semibold">{copySuccess}</p>
              </div>
            )}

            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => shareToSocial('linkedin')} className="bg-blue-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-900 transition">Share to LinkedIn</button>
                 <button onClick={() => shareToSocial('twitter')} className="bg-sky-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-sky-600 transition">Share to Twitter/X</button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => shareToSocial('facebook')} className="bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 transition">Share to Facebook</button>
                 <button onClick={() => shareToSocial('whatsapp')} className="bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition">Share to WhatsApp</button>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={downloadImage} className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t.downloadButton}
                  </button>
                   <button onClick={() => { setShareStep('initial'); setImageUrl(''); setCopySuccess(''); }} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition">
                    ← Back
                  </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareCard;
