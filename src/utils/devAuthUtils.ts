/**
 * Development-only utilities for debugging Supabase authentication issues
 * These functions should NEVER be used in production
 */

import { auth } from '../lib/supabase';

/**
 * Development-only: Clear all Supabase authentication data
 * Use this when you need to completely reset auth state during development
 * 
 * Usage in browser console:
 * import('./utils/devAuthUtils').then(utils => utils.devClearAllAuth())
 */
export const devClearAllAuth = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('devClearAllAuth: This function is disabled in production');
    return;
  }

  console.log('🧹 DEV: Clearing all Supabase auth data...');
  
  try {
    // Use the utility function from supabase.ts
    await auth.devClearAllAuth();
    
    console.log('✅ DEV: All auth data cleared successfully');
    console.log('🔄 DEV: Please refresh the page to see changes');
  } catch (error) {
    console.error('❌ DEV: Error clearing auth data:', error);
  }
};

/**
 * Development-only: Log current authentication state
 * Useful for debugging session issues
 */
export const devLogAuthState = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('devLogAuthState: This function is disabled in production');
    return;
  }

  console.log('🔍 DEV: Current auth state:');
  
  try {
    const { user } = await auth.getCurrentUser();
    console.log('User:', user);
    
    // Log localStorage keys related to Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    console.log('Supabase localStorage keys:', supabaseKeys);
    
    // Log sessionStorage keys related to Supabase
    const supabaseSessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    console.log('Supabase sessionStorage keys:', supabaseSessionKeys);
    
  } catch (error) {
    console.error('❌ DEV: Error getting auth state:', error);
  }
};

/**
 * Development-only: Test sign-in/sign-out cycle
 * Useful for testing authentication flow
 */
export const devTestAuthCycle = async (email: string, password: string): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('devTestAuthCycle: This function is disabled in production');
    return;
  }

  console.log('🧪 DEV: Testing auth cycle...');
  
  try {
    // Clear any existing session
    await devClearAllAuth();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to sign in
    console.log('🔑 DEV: Attempting sign in...');
    const signInResult = await auth.signIn(email, password);
    
    if (signInResult.error) {
      console.error('❌ DEV: Sign in failed:', signInResult.error);
      return;
    }
    
    console.log('✅ DEV: Sign in successful');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to sign out
    console.log('🚪 DEV: Attempting sign out...');
    const signOutResult = await auth.signOut();
    
    if (signOutResult.error) {
      console.error('❌ DEV: Sign out failed:', signOutResult.error);
      return;
    }
    
    console.log('✅ DEV: Sign out successful');
    console.log('🎉 DEV: Auth cycle test completed successfully');
    
  } catch (error) {
    console.error('❌ DEV: Auth cycle test failed:', error);
  }
};

// Make functions available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).devAuthUtils = {
    clearAll: devClearAllAuth,
    logState: devLogAuthState,
    testCycle: devTestAuthCycle
  };
  
  console.log('🛠️ DEV: Auth utilities available at window.devAuthUtils');
  console.log('   - window.devAuthUtils.clearAll() - Clear all auth data');
  console.log('   - window.devAuthUtils.logState() - Log current auth state');
  console.log('   - window.devAuthUtils.testCycle(email, password) - Test auth cycle');
}