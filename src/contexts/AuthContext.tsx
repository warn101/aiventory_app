import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  confirmEmail: (token: string) => Promise<{ data: any; error: any }>;
  isAuthenticated: () => boolean;
  rehydrateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Auth: Initializing authentication...');
        
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth: Error getting current session:', error);
          setUser(null);
          setSession(null);
        } else if (currentSession?.user) {
          console.log('Auth: User found, setting user state');
          setUser(currentSession.user);
          setSession(currentSession);
        } else {
          console.log('Auth: No user found');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Auth: Error during initialization:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth: State changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!session;
  };

  // Rehydrate session
  const rehydrateSession = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        setUser(null);
        setSession(null);
        return;
      }
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setUser(authUser);
        setSession(currentSession);
      }
    } catch (error) {
      console.error('Auth: Error during session rehydration:', error);
      setUser(null);
      setSession(null);
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return result;
    } catch (error) {
      console.error('Auth: Signin exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to sign in. Please check your credentials.' }
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      return result;
    } catch (error) {
      console.error('Auth: Signup exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to create account. Please try again.' }
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      const result = await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      return result;
    } catch (error) {
      console.error('Auth: Signout exception:', error);
      
      // Clear local state even on error
      setUser(null);
      setSession(null);
      
      return { 
        error: { message: 'Failed to sign out. Please try again.' }
      };
    } finally {
      setLoading(false);
    }
  };

  // Confirm email
  const confirmEmail = async (token: string) => {
    try {
      const result = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });
      
      return result;
    } catch (error) {
      console.error('Auth: Email confirmation exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to confirm email. Please try again.' }
      };
    }
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    error,
    signIn,
    signUp,
    signOut,
    confirmEmail,
    isAuthenticated,
    rehydrateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};