# 🔧 Supabase Authentication & Session Management Fix

## 🎯 Root Cause Analysis

The authentication issues you're experiencing stem from several problems:

1. **Missing Supabase Client Configuration**: The client lacks proper session persistence and auto-refresh settings
2. **Inadequate Session Rehydration**: No proper session recovery after page reload
3. **Race Conditions**: Storage operations may execute before session is fully restored
4. **Missing Auth State Synchronization**: Components may not wait for auth state to stabilize

## ✅ Complete Solution

### 1. Enhanced Supabase Client Configuration

Update your `src/lib/supabase.ts` to include proper session management:

```typescript
import { createClient, Session } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced Supabase client with proper session management
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Enable automatic session persistence
      persistSession: true,
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Detect session in URL (for email confirmations)
      detectSessionInUrl: true,
      // Storage key for session data
      storageKey: 'supabase.auth.token',
      // Use localStorage for session persistence
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        },
      },
    },
    // Global configuration
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  }
);
```

### 2. Robust Auth Hook with Proper Session Rehydration

Replace your `useAuth` hook with this enhanced version:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuth = () => {
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
        setAuthState(prev => ({ ...prev, loading: false, initialized: true }));
        return;
      }

      if (session) {
        console.log('✅ Auth: Session rehydrated successfully');
        setAuthState({
          user: session.user,
          session,
          loading: false,
          initialized: true,
        });
      } else {
        console.log('ℹ️ Auth: No session found');
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
        console.log('🔔 Auth: State change event:', event);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            console.log('✅ Auth: User signed in or token refreshed');
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

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [rehydrateSession]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ Auth: Sign in failed:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ Auth: Sign up failed:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('❌ Auth: Sign out failed:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    signIn,
    signUp,
    signOut,
    rehydrateSession,
  };
};
```

### 3. Enhanced Storage Upload with Session Validation

Update your `src/lib/supabaseStorage.ts` to ensure valid sessions:

```typescript
import { supabase } from './supabase';

// Enhanced upload function with session validation
export const uploadToSupabaseStorage = async (
  file: File,
  bucket: 'avatars' | 'tools',
  folder?: string
) => {
  try {
    // Step 1: Validate current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required. Please sign in again.');
    }

    // Step 2: Verify session is not expired
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        throw new Error('Session expired. Please sign in again.');
      }
    }

    // Step 3: Get current user to ensure authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User authentication failed. Please sign in again.');
    }

    // Step 4: Proceed with file upload
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    
    const basePath = folder ? `${user.id}/${folder}` : user.id;
    const filePath = `${basePath}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
};
```

### 4. App-Level Auth Provider

Create an auth context provider for your app:

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
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
```

### 5. Component Usage Pattern

Use this pattern in components that need authentication:

```typescript
import { useAuthContext } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, session, loading, initialized } = useAuthContext();
  
  // Wait for auth to initialize
  if (!initialized || loading) {
    return <div>Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!user || !session) {
    return <div>Please sign in to continue</div>;
  }
  
  // Component logic here
  return <div>Authenticated content</div>;
};
```

## 🎯 Best Practices Summary

1. **Always check `initialized` before checking `user`**
2. **Use session validation before critical operations**
3. **Handle token refresh gracefully**
4. **Provide clear loading states**
5. **Implement proper error boundaries**
6. **Use the auth context provider at app level**

## 🔧 Implementation Steps

1. Update `supabase.ts` with enhanced client configuration
2. Replace `useAuth` hook with the robust version
3. Update storage functions with session validation
4. Wrap your app with `AuthProvider`
5. Update components to use `useAuthContext`
6. Test session persistence across page reloads
7. Test file uploads after session refresh

This solution ensures:
- ✅ Robust session persistence
- ✅ Automatic token refresh
- ✅ Proper session rehydration
- ✅ Storage operations with valid sessions
- ✅ Clear loading and error states