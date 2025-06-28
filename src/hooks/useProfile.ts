import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { ensureValidSession } from '../store/authStore';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user, initialized, loading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadProfile = useCallback(async () => {
    // Don't attempt to load if auth is not initialized or user is not available
    if (!initialized || authLoading || !user) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure session is valid before making request
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('Session is invalid. Please sign in again.');
      }
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, initialized, authLoading]);
  
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) {
      setError('User not authenticated');
      return { error: new Error('User not authenticated') };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure session is valid before making request
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('Session is invalid. Please sign in again.');
      }
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { data: null, error: new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Load profile when user changes or auth initializes
  useEffect(() => {
    if (user && initialized && !authLoading) {
      loadProfile();
    } else if (!user && initialized) {
      // Clear profile when user is not authenticated
      setProfile(null);
    }
  }, [user, initialized, authLoading, loadProfile]);
  
  return {
    profile,
    loading: loading || authLoading || !initialized,
    error,
    updateProfile,
    refreshProfile: loadProfile,
  };
};

export default useProfile;