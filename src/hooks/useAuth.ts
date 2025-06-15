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
    // Get initial session
    const getInitialSession = async () => {
      const { user: authUser } = await auth.getCurrentUser();
      if (authUser) {
        await loadUserProfile(authUser);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile } = await db.getProfile(authUser.id);
      const { data: bookmarks } = await db.getBookmarks(authUser.id);
      const { data: reviews } = await db.getUserReviews(authUser.id);

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
    const { data, error } = await auth.signUp(email, password, { name });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (!error) {
      setUser(null);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
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