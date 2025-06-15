import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  // Provide fallback values for development
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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
      // Use the custom search function we created
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const result = await query;
    
    if (result.error) {
      console.error('Error fetching tools:', result.error);
    }
    
    return result;
  },

  getTool: async (id: string) => {
    const result = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();
      
    if (result.error) {
      console.error('Error fetching tool:', result.error);
    }
    
    return result;
  },

  createTool: async (tool: any) => {
    const result = await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();
      
    if (result.error) {
      console.error('Error creating tool:', result.error);
    }
    
    return result;
  },

  updateTool: async (id: string, updates: any) => {
    const result = await supabase
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (result.error) {
      console.error('Error updating tool:', result.error);
    }
    
    return result;
  },

  // Categories
  getCategories: async () => {
    const result = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (result.error) {
      console.error('Error fetching categories:', result.error);
    }
    
    return result;
  },

  // User profiles
  getProfile: async (userId: string) => {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (result.error) {
      console.error('Error fetching profile:', result.error);
    }
    
    return result;
  },

  updateProfile: async (userId: string, updates: any) => {
    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (result.error) {
      console.error('Error updating profile:', result.error);
    }
    
    return result;
  },

  // Bookmarks
  getBookmarks: async (userId: string) => {
    const result = await supabase
      .from('bookmarks')
      .select(`
        *,
        tools (*)
      `)
      .eq('user_id', userId);
      
    if (result.error) {
      console.error('Error fetching bookmarks:', result.error);
    }
    
    return result;
  },

  addBookmark: async (userId: string, toolId: string) => {
    const result = await supabase
      .from('bookmarks')
      .insert([{ user_id: userId, tool_id: toolId }]);
      
    if (result.error) {
      console.error('Error adding bookmark:', result.error);
    }
    
    return result;
  },

  removeBookmark: async (userId: string, toolId: string) => {
    const result = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('tool_id', toolId);
      
    if (result.error) {
      console.error('Error removing bookmark:', result.error);
    }
    
    return result;
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
    const result = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (name, avatar_url)
      `)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false });
      
    if (result.error) {
      console.error('Error fetching reviews:', result.error);
    }
    
    return result;
  },

  createReview: async (review: any) => {
    const result = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
      
    if (result.error) {
      console.error('Error creating review:', result.error);
    }
    
    return result;
  },

  getUserReviews: async (userId: string) => {
    const result = await supabase
      .from('reviews')
      .select(`
        *,
        tools (name, image_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (result.error) {
      console.error('Error fetching user reviews:', result.error);
    }
    
    return result;
  }
};