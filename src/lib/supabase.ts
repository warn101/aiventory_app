import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, userData?: { name: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Tools
  getTools: async (filters?: {
    category?: string;
    pricing?: string;
    rating?: number;
    featured?: boolean;
    search?: string;
  }) => {
    let query = supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.pricing && filters.pricing !== 'all') {
      query = query.eq('pricing', filters.pricing);
    }

    if (filters?.rating && filters.rating > 0) {
      query = query.gte('rating', filters.rating);
    }

    if (filters?.featured) {
      query = query.eq('featured', true);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
    }

    return await query;
  },

  getTool: async (id: string) => {
    return await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();
  },

  createTool: async (tool: any) => {
    return await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();
  },

  updateTool: async (id: string, updates: any) => {
    return await supabase
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Categories
  getCategories: async () => {
    return await supabase
      .from('categories')
      .select('*')
      .order('name');
  },

  // User profiles
  getProfile: async (userId: string) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  },

  updateProfile: async (userId: string, updates: any) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  },

  // Bookmarks
  getBookmarks: async (userId: string) => {
    return await supabase
      .from('bookmarks')
      .select(`
        *,
        tools (*)
      `)
      .eq('user_id', userId);
  },

  addBookmark: async (userId: string, toolId: string) => {
    return await supabase
      .from('bookmarks')
      .insert([{ user_id: userId, tool_id: toolId }]);
  },

  removeBookmark: async (userId: string, toolId: string) => {
    return await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('tool_id', toolId);
  },

  isBookmarked: async (userId: string, toolId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('tool_id', toolId)
      .single();
    
    return !!data;
  },

  // Reviews
  getReviews: async (toolId: string) => {
    return await supabase
      .from('reviews')
      .select(`
        *,
        profiles (name, avatar_url)
      `)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false });
  },

  createReview: async (review: any) => {
    return await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
  },

  getUserReviews: async (userId: string) => {
    return await supabase
      .from('reviews')
      .select(`
        *,
        tools (name, image_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }
};