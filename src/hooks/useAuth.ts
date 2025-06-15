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

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial auth session...');
        const { user: authUser } = await auth.getCurrentUser();
        
        if (mounted) {
          if (authUser) {
            console.log('User found, loading profile...');
            await loadUserProfile(authUser);
          } else {
            console.log('No user found');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Loading user profile for:', authUser.id);
      
      // Try to get profile, bookmarks, and reviews in parallel
      const [profileResult, bookmarksResult, reviewsResult] = await Promise.allSettled([
        db.getProfile(authUser.id),
        db.getBookmarks(authUser.id),
        db.getUserReviews(authUser.id)
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value.data : [];
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data : [];

      console.log('Profile loaded:', { profile, bookmarks: bookmarks?.length, reviews: reviews?.length });

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.email?.split('@')[0] || 'User',
        email: profile?.email || authUser.email || '',
        avatar: profile?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`,
        bookmarks: bookmarks?.map(b => b.tool_id) || [],
        reviews: reviews || []
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
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
      console.log('Signing up user:', email);
      const { data, error } = await auth.signUp(email, password, { name });
      console.log('Signup result:', { data: !!data, error });
      return { data, error };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      const { data, error } = await auth.signIn(email, password);
      console.log('Signin result:', { data: !!data, error });
      return { data, error };
    } catch (error) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await auth.signOut();
      if (!error) {
        setUser(null);
      }
      return { error };
    } catch (error) {
      console.error('Signout error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Updating profile:', updates);
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
      console.error('Profile update error:', error);
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