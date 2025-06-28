import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Enhanced authentication hook with robust session management
 * Fixes session persistence and rehydration issues
 */
export const useAuthEnhanced = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  // Session rehydration function
  const rehydrateSession = useCallback(async () => {
    try {
      console.log('🔄 Auth: Rehydrating session...');
      
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth: Session rehydration error:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          initialized: true,
        });
        return;
      }

      if (session) {
        // Validate session is not expired
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;
        
        if (expiresAt > now) {
          console.log('✅ Auth: Valid session found, user authenticated');
          setAuthState({
            user: session.user,
            session,
            loading: false,
            initialized: true,
          });
        } else {
          console.log('⏰ Auth: Session expired, attempting refresh...');
          // Try to refresh the session
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            console.log('❌ Auth: Session refresh failed, user signed out');
            setAuthState({
              user: null,
              session: null,
              loading: false,
              initialized: true,
            });
          } else {
            console.log('✅ Auth: Session refreshed successfully');
            setAuthState({
              user: refreshedSession.user,
              session: refreshedSession,
              loading: false,
              initialized: true,
            });
          }
        }
      } else {
        console.log('ℹ️ Auth: No session found, user not authenticated');
        setAuthState({
          user: null,
          session: null,
          loading: false,
          initialized: true,
        });
      }
    } catch (error) {
      console.error('💥 Auth: Session rehydration failed:', error);
      setAuthState({
        user: null,
        session: null,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  useEffect(() => {
    // Initial session rehydration
    rehydrateSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth: State change event:', event, session?.user?.id);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ Auth: User signed in');
            setAuthState({
              user: session?.user || null,
              session,
              loading: false,
              initialized: true,
            });
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Auth: Token refreshed');
            setAuthState({
              user: session?.user || null,
              session,
              loading: false,
              initialized: true,
            });
            break;
            
          case 'SIGNED_OUT':
            console.log('🚪 Auth: User signed out');
            setAuthState({
              user: null,
              session: null,
              loading: false,
              initialized: true,
            });
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Auth: Password recovery initiated');
            break;
            
          case 'USER_UPDATED':
            console.log('👤 Auth: User updated');
            setAuthState(prev => ({
              ...prev,
              user: session?.user || prev.user,
              session: session || prev.session,
            }));
            break;
            
          default:
            console.log('ℹ️ Auth: Unknown event:', event);
        }
      }
    );

    // Periodic session check and refresh (every 5 minutes)
    const intervalId = setInterval(async () => {
      if (authState.initialized && authState.session) {
        console.log('🔄 Auth: Periodic session check...');
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = authState.session.expires_at || 0;
        if (expiresAt - now < 300) { // Less than 5 minutes until expiration
          console.log('🔄 Auth: Session nearing expiration, refreshing...');
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
          if (error || !refreshedSession) {
            console.error('❌ Auth: Periodic refresh failed:', error?.message);
            setAuthState({
              user: null,
              session: null,
              loading: false,
              initialized: true,
            });
          } else {
            console.log('✅ Auth: Session refreshed during periodic check');
            setAuthState({
              user: refreshedSession.user,
              session: refreshedSession,
              loading: false,
              initialized: true,
            });
          }
        }
      }
    }, 300000); // 5 minutes

    // Cleanup subscription and interval
    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [rehydrateSession, authState.initialized, authState.session]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      console.log('� Auth: Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Auth: Sign in failed:', error.message);
        setAuthState(prev => ({ ...prev, loading: false }));
        throw error;
      }
      
      console.log('✅ Auth: Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('💥 Auth: Sign in exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      console.log('�📝 Auth: Attempting sign up...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) {
        console.error('❌ Auth: Sign up failed:', error.message);
        setAuthState(prev => ({ ...prev, loading: false }));
        throw error;
      }
      
      console.log('✅ Auth: Sign up successful');
      return { data, error: null };
    } catch (error) {
      console.error('💥 Auth: Sign up exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      console.log('🚪 Auth: Attempting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Auth: Sign out failed:', error.message);
        throw error;
      }
      
      console.log('✅ Auth: Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('💥 Auth: Sign out exception:', error);
      // Even if signOut fails, clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        initialized: true,
      });
      return { error };
    }
  };

  // Utility function to check if user is authenticated
  const isAuthenticated = () => {
    return !!(authState.user && authState.session && authState.initialized);
  };

  // Utility function to get current session
  const getCurrentSession = () => {
    return authState.session;
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    isAuthenticated,
    getCurrentSession,
    signIn,
    signUp,
    signOut,
    rehydrateSession,
  };
};
