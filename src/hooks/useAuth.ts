import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth, db, supabase } from '../lib/supabase';
import { Database } from '../types/database';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bookmarks: string[];
  reviews: Database['public']['Tables']['reviews']['Row'][];
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        console.log('Auth: Initializing authentication...');
        
        // Get current session - trust Supabase completely
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.warn('Auth: Error getting current session:', error);
          setUser(null);
          setSession(null);
        } else if (currentSession?.user) {
          const authUser = currentSession.user;
          setSession(currentSession);
          console.log('Auth: User found, creating basic user object...');
          // Create basic user object immediately from auth data
          const basicUser: AuthUser = {
            id: authUser.id,
            name: (authUser.user_metadata as any)?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
            bookmarks: [],
            reviews: []
          };
          
          // Set user immediately so they're authenticated
          setUser(basicUser);
          
          // Load profile data asynchronously without blocking
          loadUserProfileAsync(authUser);
        } else {
          console.log('Auth: No user found');
          setUser(null);
        }
        
        // Always set loading to false and initialized to true
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Auth: Error during initialization:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener - trust Supabase completely
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth: State changed:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            console.log('Auth: Session found, creating basic user object...');
            // Set session immediately
            setSession(session);
            
            // Create basic user object immediately
            const basicUser: AuthUser = {
              id: session.user.id,
              name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
              bookmarks: [],
              reviews: []
            };
            
            // Set user immediately
            setUser(basicUser);
            
            // Load profile data asynchronously
            loadUserProfileAsync(session.user);
          } else {
            console.log('Auth: User signed out or no session');
            setUser(null);
            setSession(null);
            // Clear any remaining auth data on sign out
            if (event === 'SIGNED_OUT') {
              await auth.clearAllAuthStorage();
            }
          }
        } catch (error) {
          console.error('Auth: Error handling auth state change:', error);
          // Clear problematic session data on error
          await auth.clearStaleSession();
          setUser(null);
        } finally {
          // Always reset loading state
          setLoading(false);
        }
      });

      authSubscription = subscription;
    };

    // Initialize auth and set up listener
    initializeAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Track ongoing profile requests to prevent duplicates
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const REQUEST_DEBOUNCE_MS = 1000; // 1 second debounce

  // Async profile loading that doesn't block authentication
  const loadUserProfileAsync = async (authUser: User) => {
    // Prevent duplicate requests for the same user
    if (loadingProfileId === authUser.id) {
      console.log('Auth: Profile already loading for:', authUser.id);
      return;
    }

    // Debounce requests to prevent overwhelming Supabase
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_DEBOUNCE_MS) {
      console.log('Auth: Request debounced, waiting...');
      setTimeout(() => loadUserProfileAsync(authUser), REQUEST_DEBOUNCE_MS);
      return;
    }
    setLastRequestTime(now);

    try {
      setLoadingProfileId(authUser.id);
      setProfileLoading(true);
      console.log('Auth: Loading user profile asynchronously for:', authUser.id);
      
      // Load profile data with graceful error handling
      const [profileResult, bookmarksResult, reviewsResult] = await Promise.allSettled([
        db.getProfile(authUser.id),
        db.getBookmarks(authUser.id),
        db.getUserReviews(authUser.id)
      ]);

      // Extract data from settled promises
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value.data || [] : [];
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data || [] : [];

      // Log any errors but don't fail the entire process
      if (profileResult.status === 'rejected') {
        console.warn('Auth: Profile fetch failed:', profileResult.reason);
      }
      if (bookmarksResult.status === 'rejected') {
        console.warn('Auth: Bookmarks fetch failed:', bookmarksResult.reason);
      }
      if (reviewsResult.status === 'rejected') {
        console.warn('Auth: Reviews fetch failed:', reviewsResult.reason);
      }

      console.log('Auth: Profile data loaded:', { 
        hasProfile: !!profile, 
        bookmarksCount: bookmarks.length, 
        reviewsCount: reviews.length 
      });

      const userData: AuthUser = {
        id: authUser.id,
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: profile?.email || authUser.email || '',
        avatar: profile?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: bookmarks.map(b => b.tool_id),
        reviews: reviews
      };

      // Update user with full profile data
      setUser(userData);
    } catch (error) {
      console.error('Auth: Error loading user profile asynchronously:', error);
      // Don't clear user on profile loading error - keep them authenticated
    } finally {
      setProfileLoading(false);
      setLoadingProfileId(null);
    }
  };

  const loadUserProfile = async (authUser: User) => {
    // Prevent duplicate requests for the same user
    if (loadingProfileId === authUser.id) {
      console.log('Auth: Profile already loading for:', authUser.id);
      return;
    }

    // Debounce requests to prevent overwhelming Supabase
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_DEBOUNCE_MS) {
      console.log('Auth: Request debounced, waiting...');
      setTimeout(() => loadUserProfile(authUser), REQUEST_DEBOUNCE_MS);
      return;
    }
    setLastRequestTime(now);
    
    try {
      setLoadingProfileId(authUser.id);
      console.log('Auth: Loading user profile for:', authUser.id);
      
      // Load profile data with graceful error handling
      const [profileResult, bookmarksResult, reviewsResult] = await Promise.allSettled([
        db.getProfile(authUser.id),
        db.getBookmarks(authUser.id),
        db.getUserReviews(authUser.id)
      ]);

      // Extract data from settled promises
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value.data || [] : [];
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data || [] : [];

      // Log any errors but don't fail the entire process
      if (profileResult.status === 'rejected') {
        console.warn('Auth: Profile fetch failed:', profileResult.reason);
      }
      if (bookmarksResult.status === 'rejected') {
        console.warn('Auth: Bookmarks fetch failed:', bookmarksResult.reason);
      }
      if (reviewsResult.status === 'rejected') {
        console.warn('Auth: Reviews fetch failed:', reviewsResult.reason);
      }

      console.log('Auth: Profile data loaded:', { 
        hasProfile: !!profile, 
        bookmarksCount: bookmarks.length, 
        reviewsCount: reviews.length 
      });

      const userData: AuthUser = {
        id: authUser.id,
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: profile?.email || authUser.email || '',
        avatar: profile?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: bookmarks.map((b: Database['public']['Tables']['bookmarks']['Row']) => b.tool_id) || [],
        reviews: reviews || []
      };

      setUser(userData);

      // Create profile if it doesn't exist (fire and forget)
      if (!profile && profileResult.status === 'fulfilled') {
        console.log('Auth: Creating new profile for user');
        db.createProfile({
          id: authUser.id,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.avatar
        }).catch(createError => {
          console.warn('Auth: Failed to create profile:', createError);
        });
      }

    } catch (error) {
      console.error('Auth: Error loading user profile:', error);
      
      // Create fallback user data
      const fallbackUser: AuthUser = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: [],
        reviews: []
      };

      setUser(fallbackUser);
    } finally {
      setLoadingProfileId(null);
    }
  };

  // Function to rehydrate session (refresh current user data)
  const rehydrateSession = async () => {
    try {
      const { user: authUser, error } = await auth.getCurrentUser();
      if (error) {
        console.warn('Auth: Error rehydrating session:', error);
        setUser(null);
        return;
      }
      
      if (authUser) {
        await loadUserProfile(authUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth: Error during session rehydration:', error);
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Auth: Signing up user:', email);
      setLoading(true);
      
      const result = await auth.signUp(email, password, { name });
      
      if (result.error) {
        console.error('Auth: Signup error:', result.error);
        return { data: null, error: result.error };
      }

      console.log('Auth: Signup successful');
      return { data: result.data, error: null };
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

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🎯 useAuth: Starting sign-in for:', email);
      setLoading(true);
      
      console.log('⏱️ useAuth: Starting auth.signIn...');
      
      // Trust Supabase completely - no manual timeouts
      const result = await auth.signIn(email, password);
      
      console.log('📋 useAuth: Auth result received:', {
        hasData: !!result.data,
        hasError: !!result.error,
        errorMessage: result.error?.message
      });
      
      if (result.error) {
        console.error('❌ useAuth: Signin error:', result.error);
        return { data: null, error: result.error };
      }

      console.log('🎉 useAuth: Signin successful, auth state should update automatically');
      return { data: result.data, error: null };
    } catch (error) {
      console.error('💥 useAuth: Signin exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to sign in. Please check your credentials.' }
      };
    } finally {
      console.log('🏁 useAuth: Setting loading to false');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🎯 useAuth: Starting sign-out process...');
      
      // Use the enhanced signOut method with storage clearing
      console.log('📞 useAuth: Calling auth.signOut...');
      const { error } = await auth.signOut();
      
      // Always clear local user state, even if signOut had errors
      console.log('🧹 useAuth: Clearing local user state...');
      setUser(null);
      console.log('✅ useAuth: Local user state cleared');
      
      if (error) {
        console.error('❌ useAuth: Signout error:', error);
        return { error };
      }

      console.log('🎉 useAuth: Signout successful, user should be signed out');
      return { error: null };
    } catch (error) {
      console.error('💥 useAuth: Signout exception:', error);
      // Always clear local state on exception
      console.log('🧹 useAuth: Clearing local state after exception...');
      setUser(null);
      return { 
        error: { message: 'Failed to sign out. Please try again.' }
      };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Auth: Updating profile:', updates);
      
      const profileUpdates = {
        name: updates.name,
        email: updates.email,
        avatar_url: updates.avatar,
      };

      const { data, error } = await db.updateProfile(user.id, profileUpdates);

      if (error) {
        console.error('Auth: Profile update error:', error);
        return { data: null, error };
      }

      // Update local user state
      setUser({ ...user, ...updates });
      console.log('Auth: Profile updated successfully');
      
      return { data, error: null };
    } catch (error) {
      console.error('Auth: Profile update exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to update profile. Please try again.' }
      };
    }
  };

  const confirmEmail = async (token: string) => {
    try {
      console.log('Auth: Confirming email with token');
      
      const result = await auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (result.error) {
        console.error('Auth: Email confirmation error:', result.error);
        return { data: null, error: result.error };
      }

      console.log('Auth: Email confirmed successfully');
      
      // Load user profile after confirmation
      if (result.data && result.data.user) {
        await loadUserProfile(result.data.user);
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Auth: Email confirmation exception:', error);
      return { 
        data: null, 
        error: { message: 'Failed to confirm email. Please try again.' }
      };
    }
  };

  return {
    user,
    session,
    loading,
    profileLoading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    confirmEmail,
    isAuthenticated,
    rehydrateSession
  };
};