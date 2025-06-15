import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth, db } from '../lib/supabase';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bookmarks: string[];
  reviews: any[];
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('Auth: Initializing authentication...');
        
        // Get initial session without timeout - let Supabase handle its own timeouts
        const { user: authUser, error } = await auth.getCurrentUser();
        
        if (!mounted) return;

        if (error) {
          console.warn('Auth: Error getting current user:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (authUser) {
          console.log('Auth: User found, loading profile...');
          await loadUserProfile(authUser);
        } else {
          console.log('Auth: No user found');
          setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth: Error during initialization:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
        console.log('Auth: State changed:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            console.log('Auth: User authenticated, loading profile...');
            await loadUserProfile(session.user);
          } else {
            console.log('Auth: User signed out');
            setUser(null);
          }
        } catch (error) {
          console.error('Auth: Error handling auth state change:', error);
          if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
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

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Auth: Loading user profile for:', authUser.id);
      
      // Load profile data with graceful error handling
      const [profileResult, bookmarksResult, reviewsResult] = await Promise.allSettled([
        db.getProfile(authUser.id),
        db.getBookmarks(authUser.id),
        db.getUserReviews(authUser.id)
      ]);

      // Extract data from settled promises
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const bookmarks = bookmarksResult.status === 'fulfilled' ? profileResult.value.data || [] : [];
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
        bookmarks: bookmarks.map((b: any) => b.tool_id) || [],
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
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Auth: Signing up user:', email);
      setLoading(true);
      
      const { data, error } = await auth.signUp(email, password, { name });
      
      if (error) {
        console.error('Auth: Signup error:', error);
        return { data: null, error };
      }

      console.log('Auth: Signup successful');
      return { data, error: null };
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
      console.log('Auth: Signing in user:', email);
      setLoading(true);
      
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        console.error('Auth: Signin error:', error);
        return { data: null, error };
      }

      console.log('Auth: Signin successful');
      return { data, error: null };
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

  const signOut = async () => {
    try {
      console.log('Auth: Signing out user');
      
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('Auth: Signout error:', error);
        return { error };
      }

      console.log('Auth: Signout successful');
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Auth: Signout exception:', error);
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

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };
};