import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from './supabase';

export interface DeviceInfo {
  fingerprint: string;
  ip: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
}

// This interface defines the new return type for our check function
export interface SubmissionCheckResult {
  submitted: boolean;
  surveyId: string | null;
  discountCode: string | null;
}

// The following functions remain untouched
export const detectDevice = (): { type: 'mobile' | 'tablet' | 'desktop'; isMobile: boolean } => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
  if (isMobile) return { type: 'mobile', isMobile: true };
  if (isTablet) return { type: 'tablet', isMobile: true };
  return { type: 'desktop', isMobile: false };
};

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

// *** THE SURGICAL CHANGE IS HERE ***
// The function now returns an object with details instead of just a boolean.
export const checkIfAlreadySubmitted = async (fingerprint: string, ip: string): Promise<SubmissionCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses_v2')
      .select('id, discount_code') // Fetching the ID and code
      .or(`device_fingerprint.eq.${fingerprint},ip_address.eq.${ip}`)
      .eq('survey_completed', true)
      .limit(1)
      .single(); // Using .single() is more efficient for one expected row
    
    if (error || !data) {
      if (error && error.code !== 'PGRST116') { // Ignore 'exact one row not found' error
          console.error('Error checking submission:', error);
      }
      return { submitted: false, surveyId: null, discountCode: null };
    }
    
    // If data is found, return it
    return { submitted: true, surveyId: data.id, discountCode: data.discount_code };

  } catch (error) {
    console.error('Error in checkIfAlreadySubmitted:', error);
    return { submitted: false, surveyId: null, discountCode: null };
  }
};

// This function remains the same, only pointing to the v2 table
export const saveDeviceInfo = async (surveyId: string, deviceInfo: DeviceInfo): Promise<void> => {
  try {
    const { error } = await supabase
      .from('survey_responses_v2')
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
