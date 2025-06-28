import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth operations
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { name: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<boolean>;
  
  // Utility functions
  isAuthenticated: () => boolean;
  clearState: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,
  
  // State setters
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setError: (error) => set({ error }),
  
  // Auth operations
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Auth state will be updated via onAuthStateChange listener
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      set({ error: (error as Error).message });
      return { error: error as Error };
    } finally {
      set({ loading: false });
    }
  },
  
  signUp: async (email, password, metadata) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) throw error;
      
      // For email confirmation flow, user won't be set until confirmed
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      set({ error: (error as Error).message });
      return { error: error as Error };
    } finally {
      set({ loading: false });
    }
  },
  
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear state immediately for better UX
      get().clearState();
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      set({ error: (error as Error).message, loading: false });
      return { error: error as Error };
    }
  },
  
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Session refresh failed:', error);
        return false;
      }
      
      set({ 
        session: data.session,
        user: data.user,
      });
      
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  },
  
  // Utility functions
  isAuthenticated: () => {
    const state = get();
    return !!state.user && !!state.session && state.initialized;
  },
  
  clearState: () => {
    set({
      user: null,
      session: null,
      error: null,
      loading: false,
    });
  },
}));

// Initialize auth once at app startup
export const initAuth = async (): Promise<void> => {
  const store = useAuthStore.getState();
  
  try {
    console.log('🔐 Initializing auth...');
    store.setLoading(true);
    
    // Get existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw sessionError;
    }
    
    if (session) {
      console.log('✅ Session found, setting user');
      store.setUser(session.user);
      store.setSession(session);
    } else {
      console.log('ℹ️ No session found');
      store.clearState();
    }
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            store.setUser(session.user);
            store.setSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          store.clearState();
        } else if (event === 'USER_UPDATED') {
          if (session) {
            store.setUser(session.user);
            store.setSession(session);
          }
        }
      }
    );
    
    // Clean up function (not used in this context but good practice)
    const cleanup = () => {
      subscription.unsubscribe();
    };
    
  } catch (error) {
    console.error('Auth initialization error:', error);
    store.setError((error as Error).message);
    store.clearState();
  } finally {
    store.setInitialized(true);
    store.setLoading(false);
    console.log('🔐 Auth initialization complete');
  }
};

// Utility to check if session is about to expire and refresh if needed
export const ensureValidSession = async (): Promise<boolean> => {
  const { session, refreshSession } = useAuthStore.getState();
  
  if (!session) return false;
  
  // Check if session expires within 5 minutes (300 seconds)
  const expiresAt = session.expires_at || 0;
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutesFromNow = now + 300;
  
  if (expiresAt <= fiveMinutesFromNow) {
    console.log('Session expiring soon, refreshing...');
    return await refreshSession();
  }
  
  return true;
};