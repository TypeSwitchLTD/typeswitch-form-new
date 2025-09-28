// src/lib/deviceTracking.ts

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from './supabase';

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
  
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
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

// *** THE FIX IS HERE ***
// Checks if user has submitted AND returns the discount code string or null
export const checkIfAlreadySubmitted = async (fingerprint: string, ip: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses_v2')
      .select('discount_code') // FIX: Select the actual discount code
      .or(`device_fingerprint.eq.${fingerprint},ip_address.eq.${ip}`)
      .eq('survey_completed', true)
      .limit(1)
      .maybeSingle(); // Use maybeSingle for a cleaner result object
    
    if (error) {
      console.error('Error checking submission:', error);
      return null;
    }
    
    // FIX: Return the code string itself, or null if no record was found
    return data ? data.discount_code : null;
  } catch (error) {
    console.error('Error in checkIfAlreadySubmitted:', error);
    return null;
  }
};

// שמירת מידע על המכשיר
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
