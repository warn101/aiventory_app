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

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('Auth: Getting initial session...');
        
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        const authPromise = auth.getCurrentUser();
        
        const { user: authUser } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (mounted) {
          if (authUser) {
            console.log('Auth: User found, loading profile...');
            await loadUserProfile(authUser);
          } else {
            console.log('Auth: No user found');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth: Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: State changed:', event, session?.user?.id);
      
      if (mounted) {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    // Fallback timeout to ensure loading stops
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth: Fallback timeout - stopping loading');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Auth: Loading user profile for:', authUser.id);
      
      // Try to get profile, bookmarks, and reviews with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 2000)
      );
      
      const profilePromise = Promise.allSettled([
        db.getProfile(authUser.id),
        db.getBookmarks(authUser.id),
        db.getUserReviews(authUser.id)
      ]);

      const results = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      const [profileResult, bookmarksResult, reviewsResult] = results;

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value.data : [];
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data : [];

      console.log('Auth: Profile loaded:', { profile, bookmarks: bookmarks?.length, reviews: reviews?.length });

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.email?.split('@')[0] || 'User',
        email: profile?.email || authUser.email || '',
        avatar: profile?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: bookmarks?.map((b: any) => b.tool_id) || [],
        reviews: reviews || []
      });
    } catch (error) {
      console.error('Auth: Error loading user profile:', error);
      // Fallback user data
      setUser({
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: [],
        reviews: []
      });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Auth: Signing up user:', email);
      const { data, error } = await auth.signUp(email, password, { name });
      console.log('Auth: Signup result:', { data: !!data, error });
      return { data, error };
    } catch (error) {
      console.error('Auth: Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Auth: Signing in user:', email);
      const { data, error } = await auth.signIn(email, password);
      console.log('Auth: Signin result:', { data: !!data, error });
      return { data, error };
    } catch (error) {
      console.error('Auth: Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Auth: Signing out user');
      const { error } = await auth.signOut();
      if (!error) {
        setUser(null);
      }
      return { error };
    } catch (error) {
      console.error('Auth: Signout error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Auth: Updating profile:', updates);
      const { data, error } = await db.updateProfile(user.id, {
        name: updates.name,
        email: updates.email,
        avatar_url: updates.avatar,
      });

      if (!error && data) {
        setUser({ ...user, ...updates });
      }

      return { data, error };
    } catch (error) {
      console.error('Auth: Profile update error:', error);
      return { data: null, error };
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