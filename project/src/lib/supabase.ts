import { createClient } from '@supabase/supabase-js';
import { SurveyData } from '../types';

const SUPABASE_URL = 'https://raagydwyruvrayaclgbu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYWd5ZHd5cnV2cmF5YWNsZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTE0MDEsImV4cCI6MjA3MTcyNzQwMX0.ZgivHwYwPvqgayTPMoXNWiTH3lzizJ7boJrYV7NpMtY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SYNCHRONIZED SCORING ALGORITHM (40-100 range)
function calculateOverallScore(metrics: any): number {
  if (!metrics || metrics.wpm === undefined) return 0;
  
  const completionRate = (metrics as any).completionRate || 100;
  let score = 100; // Start from 100
  
  // 1. LANGUAGE ERRORS (most critical) - up to -25
  const languageErrorPenalty = Math.min(25, metrics.languageErrors * 2.5);
  score -= languageErrorPenalty;
  
  // 2. PUNCTUATION ERRORS - up to -10
  const punctuationPenalty = Math.min(10, metrics.punctuationErrors * 0.8);
  score -= punctuationPenalty;
  
  // 3. DELETIONS (only above 15) - up to -8
  if (metrics.deletions > 15) {
    const deletionPenalty = Math.min(8, (metrics.deletions - 15) * 0.4);
    score -= deletionPenalty;
  }
  
  // 4. COMPLETION - up to -10
  if (completionRate < 100) {
    const missingPercent = 100 - completionRate;
    const completionPenalty = Math.min(10, (missingPercent / 5) * 0.5);
    score -= completionPenalty;
  }
  
  // 5. SPEED (WPM) - bonus/penalty (-8 to +5)
  let speedAdjustment = 0;
  if (metrics.wpm >= 70) speedAdjustment = 5;
  else if (metrics.wpm >= 60) speedAdjustment = 2;
  else if (metrics.wpm >= 45) speedAdjustment = 0;
  else if (metrics.wpm >= 30) speedAdjustment = -3;
  else if (metrics.wpm >= 20) speedAdjustment = -5;
  else speedAdjustment = -8;
  score += speedAdjustment;
  
  // 6. TYPING FLOW (frustrationScore) - up to -5
  const flowPenalty = Math.min(5, metrics.frustrationScore * 0.5);
  score -= flowPenalty;
  
  // Floor: 40, Ceiling: 100
  return Math.max(40, Math.min(100, Math.round(score)));
}

export async function saveSurveyData(surveyData: SurveyData, discountCode: string) {
  try {
    console.log('Preparing data for Supabase...');
    console.log('Full survey data:', surveyData);
        
    const completionTime = Math.round((Date.now() - ((window as any).surveyStartTime || Date.now())) / 1000);
    
    const dataToSave = {
      // Demographics
      languages: surveyData.demographics?.languages || [],
      hours_typing: surveyData.demographics?.hoursTyping || null,
      occupation: surveyData.demographics?.occupation || null,
      keyboard_type: surveyData.demographics?.keyboardLayout || null,
      current_keyboard: surveyData.demographics?.keyboardPhysicalType || null,
      age: surveyData.demographics?.age || null,
      diagnosis: surveyData.demographics?.diagnosis || null,
      
      // Self Assessment
      difficulty_rating: surveyData.selfAssessment?.difficulty || null,
      errors_rating: surveyData.selfAssessment?.errors || null,
      language_switching_rating: surveyData.selfAssessment?.languageSwitching || null,
      frustration_rating: surveyData.selfAssessment?.frustration || null,
      
      // Metrics Summary
      total_wpm: surveyData.metrics?.wpm || null,
      total_accuracy: surveyData.metrics?.accuracy || null,
      total_errors: surveyData.metrics?.totalErrors || null,
      total_language_errors: surveyData.metrics?.languageErrors || null,
      total_punctuation_errors: surveyData.metrics?.punctuationErrors || null,
      total_deletions: surveyData.metrics?.deletions || null,
      total_corrections: surveyData.metrics?.corrections || null,
      total_language_switches: surveyData.metrics?.languageSwitches || null,
      frustration_score: surveyData.metrics?.frustrationScore || null,
      overall_score: calculateOverallScore(surveyData.metrics || {}),
      
      // Pain Point Data
      awakening_symptoms: surveyData.awakening?.symptoms || [],
      flow_breaker_impact: surveyData.deepDive?.flowBreakerImpact || null,
      professional_image_impact: surveyData.deepDive?.professionalImageImpact || null,
      high_pace_challenge: surveyData.deepDive?.highPaceChallenge || null,
      coping_mechanism_text: surveyData.deepDive?.copingMechanismText || null,
      coping_mechanism_none: surveyData.deepDive?.copingMechanismNone || false,
      overall_value_proposition: surveyData.epiphany?.overallValueProposition || null,
      feature_ranking: surveyData.epiphany?.rankedFeatures || [],
      final_feedback_text: surveyData.epiphany?.finalFeedbackText || null,
      
      // Analytics (NEW)
      screen_times: surveyData.screenTimes || {},
      drop_off_screen: surveyData.dropOffScreen || null,
      browser_closed_at: surveyData.browserClosedAt || null,
      
      // Additional info
      discount_code: discountCode,
      user_agent: navigator.userAgent,
      completion_time: completionTime,
      ip_country: await getCountry(),
      test_skipped: surveyData.testSkipped,
      test_completed: surveyData.testCompleted,
    };
    
    console.log('Final data being sent to Supabase:', dataToSave);
    
    const { data, error } = await supabase
      .from('survey_responses_v2') 
      .insert([dataToSave])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase response:', data);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Unexpected error in saveSurveyData:', error);
    return { success: false, error: 'Failed to save survey' };
  }
}

export async function saveEmailSubscription(email: string, surveyId?: string) {
  try {
    console.log('Saving email subscription:', email, 'for survey ID:', surveyId);
    
    if (!surveyId) {
      console.error('No survey ID provided');
      return { success: false };
    }
    
    const { error } = await supabase
      .from('survey_responses_v2')
      .update({ email })
      .eq('id', surveyId);
    
    if (error) {
      console.error('Error saving email:', error);
      return { success: false };
    }
    
    console.log('Email saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false };
  }
}

async function getCountry(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/country_name/');
    return await response.text();
  } catch {
    return 'Unknown';
  }
}

export async function deleteTestData() {
  try {
    console.log('Deleting test data...');
    
    const { data, error } = await supabase
      .from('survey_responses_v2')
      .delete()
      .or('overall_score.lt.30,completion_time.lt.60');
    
    if (error) {
      console.error('Error deleting test data:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Test data deleted successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in deleteTestData:', error);
    return { success: false, error: 'Failed to delete test data' };
  }
}

export async function getAllSurveyResponses() {
  try {
    const { data, error } = await supabase
      .from('survey_responses_v2')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching survey responses:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error };
  }
}

export async function deleteSurveyResponses(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('survey_responses_v2')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error('Error deleting survey responses:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}
