import FingerprintJS from '@fingerprintjs/fingerprintjs';

// הנחתי שקובץ ה-supabase שלך מייצא את הלקוח, אם לא, נצטרך להתאים את זה.
// בדרך כלל עדיף לייבא אותו ישירות.
import { supabase } from './supabase'; 

export interface DeviceInfo {
  fingerprint: string;
  ip: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
}

// זיהוי סוג המכשיר (ללא שינוי)
export const detectDevice = (): { type: 'mobile' | 'tablet' | 'desktop'; isMobile: boolean } => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                   (platform === 'macintel' && navigator.maxTouchPoints > 1);
  
  if (isMobile) return { type: 'mobile', isMobile: true };
  if (isTablet) return { type: 'tablet', isMobile: true };
  return { type: 'desktop', isMobile: false };
};

// קבלת fingerprint של המכשיר (ללא שינוי)
export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    return `fallback_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// קבלת כתובת IP (ללא שינוי)
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
};

// בדיקה אם המשתמש כבר מילא את השאלון
export const checkIfAlreadySubmitted = async (fingerprint: string, ip: string): Promise<boolean> => {
  try {
    // *** התיקון כאן ***
    const { data, error } = await supabase
      .from('survey_responses_v2') // <--- שונה לטבלה החדשה
      .select('id')
      .or(`device_fingerprint.eq.${fingerprint},ip_address.eq.${ip}`)
      .eq('survey_completed', true)
      .limit(1);
    
    if (error) {
      console.error('Error checking submission:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in checkIfAlreadySubmitted:', error);
    return false;
  }
};

// שמירת מידע על המכשיר
export const saveDeviceInfo = async (surveyId: string, deviceInfo: DeviceInfo): Promise<void> => {
  try {
    // *** והתיקון כאן ***
    const { error } = await supabase
      .from('survey_responses_v2') // <--- שונה לטבלה החדשה
      .update({
        ip_address: deviceInfo.ip,
        device_fingerprint: deviceInfo.fingerprint,
        device_type: deviceInfo.deviceType,
        survey_completed: true
      })
      .eq('id', surveyId);
    
    if (error) {
      console.error('Error saving device info:', error);
    }
  } catch (error) {
    console.error('Error in saveDeviceInfo:', error);
  }
};
