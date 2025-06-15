import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Test connection
supabase.from('tools').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connected successfully. Tools count:', count);
    }
  });

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, userData?: { name: string }) => {
    console.log('Auth: Signing up user');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    console.log('Auth: Signup result:', { success: !!data.user, error: error?.message });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    console.log('Auth: Signing in user');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    console.log('Auth: Signin result:', { success: !!data.user, error: error?.message });
    return { data, error };
  },

  signOut: async () => {
    console.log('Auth: Signing out user');
    const { error } = await supabase.auth.signOut();
    console.log('Auth: Signout result:', { error: error?.message });
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Auth: Current user:', { userId: user?.id, error: error?.message });
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
    console.log('DB: Getting tools with filters:', filters);
    
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
    
    console.log('DB: Tools query result:', { 
      count: result.data?.length || 0, 
      error: result.error?.message 
    });
    
    return result;
  },

  getTool: async (id: string) => {
    console.log('DB: Getting tool:', id);
    const result = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();
      
    console.log('DB: Tool query result:', { 
      found: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  createTool: async (tool: any) => {
    console.log('DB: Creating tool:', tool.name);
    const result = await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();
      
    console.log('DB: Tool creation result:', { 
      success: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  updateTool: async (id: string, updates: any) => {
    console.log('DB: Updating tool:', id);
    const result = await supabase
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    console.log('DB: Tool update result:', { 
      success: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  // Categories
  getCategories: async () => {
    console.log('DB: Getting categories');
    const result = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    console.log('DB: Categories query result:', { 
      count: result.data?.length || 0, 
      error: result.error?.message 
    });
    
    return result;
  },

  // User profiles
  getProfile: async (userId: string) => {
    console.log('DB: Getting profile for user:', userId);
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('DB: Profile query result:', { 
      found: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  updateProfile: async (userId: string, updates: any) => {
    console.log('DB: Updating profile for user:', userId);
    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    console.log('DB: Profile update result:', { 
      success: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  // Bookmarks
  getBookmarks: async (userId: string) => {
    console.log('DB: Getting bookmarks for user:', userId);
    const result = await supabase
      .from('bookmarks')
      .select(`
        *,
        tools (*)
      `)
      .eq('user_id', userId);
      
    console.log('DB: Bookmarks query result:', { 
      count: result.data?.length || 0, 
      error: result.error?.message 
    });
    
    return result;
  },

  addBookmark: async (userId: string, toolId: string) => {
    console.log('DB: Adding bookmark:', { userId, toolId });
    const result = await supabase
      .from('bookmarks')
      .insert([{ user_id: userId, tool_id: toolId }]);
      
    console.log('DB: Bookmark add result:', { 
      success: !result.error, 
      error: result.error?.message 
    });
    
    return result;
  },

  removeBookmark: async (userId: string, toolId: string) => {
    console.log('DB: Removing bookmark:', { userId, toolId });
    const result = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('tool_id', toolId);
      
    console.log('DB: Bookmark remove result:', { 
      success: !result.error, 
      error: result.error?.message 
    });
    
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
    console.log('DB: Getting reviews for tool:', toolId);
    const result = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (name, avatar_url)
      `)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false });
      
    console.log('DB: Reviews query result:', { 
      count: result.data?.length || 0, 
      error: result.error?.message 
    });
    
    return result;
  },

  createReview: async (review: any) => {
    console.log('DB: Creating review');
    const result = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
      
    console.log('DB: Review creation result:', { 
      success: !!result.data, 
      error: result.error?.message 
    });
    
    return result;
  },

  getUserReviews: async (userId: string) => {
    console.log('DB: Getting reviews for user:', userId);
    const result = await supabase
      .from('reviews')
      .select(`
        *,
        tools (name, image_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    console.log('DB: User reviews query result:', { 
      count: result.data?.length || 0, 
      error: result.error?.message 
    });
    
    return result;
  }
};