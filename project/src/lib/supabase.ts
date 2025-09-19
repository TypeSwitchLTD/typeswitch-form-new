import { createClient } from '@supabase/supabase-js';
import { SurveyData } from '../types';

// Your Supabase credentials
const SUPABASE_URL = 'https://raagydwyruvrayaclgbu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYWd5ZHd5cnV2cmF5YWNsZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTE0MDEsImV4cCI6MjA3MTcyNzQwMX0.ZgivHwYwPvqgayTPMoXNWiTH3lzizJ7boJrYV7NpMtY';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to calculate overall score
function calculateOverallScore(metrics: any): number {
  let score = 100;
  
  // WPM scoring (max 30 points penalty)
  if (metrics.wpm < 20) score -= 30;
  else if (metrics.wpm < 30) score -= 25;
  else if (metrics.wpm < 40) score -= 18;
  else if (metrics.wpm < 50) score -= 10;
  else if (metrics.wpm < 60) score -= 5;
  
  // Accuracy scoring (max 30 points penalty)
  if (metrics.accuracy < 70) score -= 30;
  else if (metrics.accuracy < 80) score -= 25;
  else if (metrics.accuracy < 85) score -= 20;
  else if (metrics.accuracy < 90) score -= 15;
  else if (metrics.accuracy < 95) score -= 10;
  else if (metrics.accuracy < 98) score -= 5;
  
  // Language switches scoring (max 15 points penalty)
  if (metrics.languageSwitches > 20) score -= 15;
  else if (metrics.languageSwitches > 15) score -= 12;
  else if (metrics.languageSwitches > 10) score -= 8;
  else if (metrics.languageSwitches > 5) score -= 4;
  
  // Total mistakes scoring (max 15 points penalty)
  if (metrics.totalMistakesMade > 80) score -= 15;
  else if (metrics.totalMistakesMade > 60) score -= 12;
  else if (metrics.totalMistakesMade > 40) score -= 8;
  else if (metrics.totalMistakesMade > 20) score -= 4;
  
  // Frustration scoring (max 15 points penalty)
  if (metrics.frustrationScore > 8) score -= 15;
  else if (metrics.frustrationScore > 6) score -= 12;
  else if (metrics.frustrationScore > 4) score -= 8;
  else if (metrics.frustrationScore > 2) score -= 4;
  
  return Math.max(1, Math.min(100, score));
}

// Function to save survey data - FIXED VERSION
export async function saveSurveyData(surveyData: SurveyData, discountCode: string) {
  try {
    console.log('📊 Preparing data for Supabase...');
    console.log('Full survey data:', surveyData);
    console.log('Purchase decision:', surveyData.purchaseDecision);
    
    // Calculate total time
    const completionTime = Math.round((Date.now() - ((window as any).surveyStartTime || Date.now())) / 1000);
    
    // Prepare data for database with proper validation
    const dataToSave = {
      // Demographics
      languages: surveyData.demographics?.languages || [],
      hours_typing: surveyData.demographics?.hoursTyping || '',
      occupation: surveyData.demographics?.occupation || '',
      keyboard_type: surveyData.demographics?.keyboardType || '',
      current_keyboard: surveyData.demographics?.currentKeyboard || '',
      age: surveyData.demographics?.age || '',
      diagnosis: surveyData.demographics?.diagnosis || '',
      
      // Self Assessment
      difficulty_rating: surveyData.selfAssessment?.difficulty || 0,
      errors_rating: surveyData.selfAssessment?.errors || 0,
      language_switching_rating: surveyData.selfAssessment?.languageSwitching || 0,
      frustration_rating: surveyData.selfAssessment?.frustration || 0,
      
      // Metrics Summary
      total_wpm: surveyData.metrics?.wpm || 0,
      total_accuracy: surveyData.metrics?.accuracy || 0,
      total_errors: surveyData.metrics?.totalErrors || 0,
      total_language_errors: surveyData.metrics?.languageErrors || 0,
      total_punctuation_errors: surveyData.metrics?.punctuationErrors || 0,
      total_deletions: surveyData.metrics?.deletions || 0,
      total_corrections: surveyData.metrics?.corrections || 0,
      total_language_switches: surveyData.metrics?.languageSwitches || 0,
      frustration_score: surveyData.metrics?.frustrationScore || 0,
      overall_score: calculateOverallScore(surveyData.metrics || {}),
      
      // Feature Ratings
      feature_ratings: surveyData.featureRatings?.ratings || {},
      top_features: surveyData.featureRatings?.topFeatures || [],
      
      // Purchase Decision - FIXED WITH VALIDATION
      purchase_priorities: surveyData.purchaseDecision?.priorities || {},
      where_to_buy: surveyData.purchaseDecision?.whereToBuy || [],
      price_range: surveyData.purchaseDecision?.priceRange || '',
      other_problem: surveyData.purchaseDecision?.otherProblem || '',
      
      // Additional info
      discount_code: discountCode,
      user_agent: navigator.userAgent,
      completion_time: completionTime,
      ip_country: await getCountry()
    };
    
    console.log('📤 Final data being sent to Supabase:', dataToSave);
    console.log('Purchase priorities:', dataToSave.purchase_priorities);
    console.log('Where to buy:', dataToSave.where_to_buy);
    console.log('Price range:', dataToSave.price_range);
    
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([dataToSave])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase response:', data);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ Unexpected error in saveSurveyData:', error);
    return { success: false, error: 'Failed to save survey' };
  }
}

// Function to save email subscription
export async function saveEmailSubscription(email: string, surveyId?: string) {
  try {
    console.log('📧 Saving email subscription:', email, 'for survey ID:', surveyId);
    
    if (!surveyId) {
      console.error('No survey ID provided');
      return { success: false };
    }
    
    const { error } = await supabase
      .from('survey_responses')
      .update({ email })
      .eq('id', surveyId);
    
    if (error) {
      console.error('Error saving email:', error);
      return { success: false };
    }
    
    console.log('✅ Email saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false };
  }
}

// Helper to get user's country (optional)
async function getCountry(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/country_name/');
    return await response.text();
  } catch {
    return 'Unknown';
  }
}

// Function to delete test data (for admin use)
export async function deleteTestData() {
  try {
    console.log('🗑️ Deleting test data...');
    
    const { data, error } = await supabase
      .from('survey_responses')
      .delete()
      .or('overall_score.lt.30,completion_time.lt.60');
    
    if (error) {
      console.error('❌ Error deleting test data:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Test data deleted successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error in deleteTestData:', error);
    return { success: false, error: 'Failed to delete test data' };
  }
}

// Function to get all survey responses (for admin)
export async function getAllSurveyResponses() {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
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

// Function to delete specific survey responses (for admin)
export async function deleteSurveyResponses(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
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