import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface DeviceInfo {
  fingerprint: string;
  ip: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
}

// זיהוי סוג המכשיר
export const detectDevice = (): { type: 'mobile' | 'tablet' | 'desktop'; isMobile: boolean } => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // בדיקה למובייל
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // בדיקה לטאבלט
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                   (platform === 'macintel' && navigator.maxTouchPoints > 1);
  
  if (isMobile) return { type: 'mobile', isMobile: true };
  if (isTablet) return { type: 'tablet', isMobile: true };
  return { type: 'desktop', isMobile: false };
};

// קבלת fingerprint של המכשיר
export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    // אם נכשל, נחזיר מזהה אקראי
    return `fallback_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// קבלת כתובת IP
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
    const { supabase } = await import('./supabase');
    
    const { data, error } = await supabase
      .from('survey_responses')
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
    const { supabase } = await import('./supabase');
    
    const { error } = await supabase
      .from('survey_responses')
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