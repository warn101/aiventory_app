import { createClient, Session } from '@supabase/supabase-js';
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
  console.error('VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

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

// Test connection with better error handling
(async () => {
  try {
    const { count, error } = await supabase.from('tools').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
    } else {
      console.log('Supabase connected successfully. Tools count:', count);
    }
  } catch (err) {
    console.warn('Supabase connection test error:', (err as Error).message);
  }
})();

// Auth helpers with improved error handling
export const auth = {
  signUp: async (email: string, password: string, userData?: { name: string }) => {
    try {
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
    } catch (err) {
      console.error('Auth: Signup exception:', err);
      return { 
        data: null, 
        error: { message: 'Network error during signup. Please try again.' }
      };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log('🔑 Auth: Starting sign-in process for:', email);
      console.log('🧹 Auth: Clearing stale sessions...');
      
      // Step 1: Clear any stale sessions before attempting sign-in
      await auth.clearStaleSession();
      console.log('✅ Auth: Stale sessions cleared');
      
      // Step 2: Attempt sign-in with fresh state
      console.log('🚀 Auth: Attempting Supabase sign-in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('📊 Auth: Supabase response:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorCode: error?.message,
        userId: data?.user?.id
      });
      
      // Step 3: Validate the session was properly established
      if (data.session && !error) {
        console.log('🔍 Auth: Validating session...');
        const isValidSession = await auth.validateSession(data.session);
        if (!isValidSession) {
          console.warn('❌ Auth: Session validation failed, clearing and retrying');
          await auth.clearStaleSession();
          return { 
            data: null, 
            error: { message: 'Session validation failed. Please try again.' }
          };
        }
        console.log('✅ Auth: Session validation passed');
      }
      
      if (error) {
        console.error('❌ Auth: Sign-in failed:', error);
      } else {
        console.log('🎉 Auth: Sign-in successful!');
      }
      
      return { data, error };
    } catch (err) {
      console.error('💥 Auth: Signin exception:', err);
      // Clear any partial session state on error
      await auth.clearStaleSession();
      return { 
        data: null, 
        error: { message: 'Network error during signin. Please try again.' }
      };
    }
  },

  signOut: async () => {
    try {
      console.log('🚪 Auth: Starting sign-out process...');
      
      // Step 1: Sign out from Supabase
      console.log('🔓 Auth: Calling Supabase signOut...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('⚠️ Auth: Supabase signOut had error:', error.message);
      } else {
        console.log('✅ Auth: Supabase signOut successful');
      }
      
      // Step 2: Force clear all auth-related storage (even if signOut had errors)
      console.log('🧹 Auth: Clearing all auth storage...');
      await auth.clearAllAuthStorage();
      console.log('✅ Auth: All auth storage cleared');
      
      console.log('🎉 Auth: Sign-out process completed');
      return { error };
    } catch (err) {
      console.error('💥 Auth: Signout exception:', err);
      // Always clear storage even on exception
      console.log('🧹 Auth: Clearing storage after exception...');
      await auth.clearAllAuthStorage();
      return { 
        error: { message: 'Network error during signout. Please try again.' }
      };
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Auth: Current user:', { userId: user?.id, error: error?.message });
      return { user, error };
    } catch (err) {
      console.error('Auth: Get current user exception:', err);
      return { 
        user: null, 
        error: { message: 'Failed to get current user' }
      };
    }
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Session management utilities
  clearStaleSession: async () => {
    try {
      console.log('Auth: Clearing stale session...');
      
      // Check if there's a current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Validate if session is actually valid
        const isValid = await auth.validateSession(session);
        if (!isValid) {
          console.log('Auth: Found stale session, clearing...');
          await supabase.auth.signOut({ scope: 'local' }); // Local signout only
          await auth.clearAllAuthStorage();
        }
      }
      
      // Clear any orphaned localStorage entries
      await auth.clearAllAuthStorage();
      
    } catch (err) {
      console.warn('Auth: Error clearing stale session:', err);
      // Force clear storage even on error
      await auth.clearAllAuthStorage();
    }
  },

  validateSession: async (session: any) => {
    try {
      // Check if session is expired
      if (session.expires_at && Date.now() / 1000 > session.expires_at) {
        console.log('Auth: Session expired');
        return false;
      }
      
      // Verify session with server
      const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
      
      if (error || !user) {
        console.log('Auth: Session validation failed:', error?.message);
        return false;
      }
      
      return true;
    } catch (err) {
      console.warn('Auth: Session validation error:', err);
      return false;
    }
  },

  clearAllAuthStorage: async () => {
    try {
      console.log('Auth: Clearing all auth storage...');
      
      // Clear Supabase-specific localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.auth.token') || 
                   key.startsWith('sb-') || 
                   key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Auth: Removed localStorage key: ${key}`);
      });
      
      // Clear sessionStorage as well
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('supabase.auth.token') || 
                   key.startsWith('sb-') || 
                   key.includes('supabase'))) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`Auth: Removed sessionStorage key: ${key}`);
      });
      
    } catch (err) {
      console.warn('Auth: Error clearing auth storage:', err);
    }
  },

  // Development utility for manual session clearing
  devClearAllAuth: async () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Auth: devClearAllAuth is only available in development mode');
      return;
    }
    
    console.log('Auth: [DEV] Manually clearing all authentication data...');
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all storage
      await auth.clearAllAuthStorage();
      
      // Clear all localStorage and sessionStorage (nuclear option)
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Auth: [DEV] All authentication data cleared. Reload the page.');
      
      // Optionally reload the page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Auth: [DEV] Error during manual clear:', err);
    }
  },

  verifyOtp: async (params: { token_hash: string; type: string }) => {
    try {
      console.log('Auth: Verifying OTP token');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: params.token_hash,
        type: params.type as 'signup'
      });
      console.log('Auth: OTP verification result:', { success: !!data.user, error: error?.message });
      return { data, error };
    } catch (err) {
      console.error('Auth: OTP verification exception:', err);
      return { 
        data: null, 
        error: { message: 'Network error during email confirmation. Please try again.' }
      };
    }
  }
};

// Optimized bookmark functions with performance improvements
export const getBookmarks = async (userId: string) => {
  try {
    console.log('🔍 DB: Fetching bookmarks for user:', userId);
    
    // Directly fetch bookmarks without redundant auth checks
    const result = await supabase
      .from('bookmarks')
      .select(`
        id,
        user_id,
        tool_id,
        created_at,
        tools (
          id,
          name,
          description,
          category,
          pricing,
          rating,
          reviews_count,
          tags,
          website_url,
          featured,
          verified,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      console.error('❌ DB: Supabase query error:', result.error);
      throw result.error;
    }
    
    console.log('✅ DB: Bookmarks fetched successfully:', result.data?.length || 0);
    return result;
    
  } catch (err) {
    console.error('💥 DB: Bookmarks query exception:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err : new Error('Failed to fetch bookmarks from database')
    };
  }
};

// Legacy function for backward compatibility
export const fetchBookmarks = async (userId: string) => {
  try {
    const { data, error } = await getBookmarks(userId);
    if (error) throw error;
    return data?.map(bookmark => bookmark.tool_id) || [];
  } catch (error) {
    console.error('Database error in fetchBookmarks:', error);
    throw error;
  }
};

// Database helpers with improved error handling
export const db = {
  // Expose the supabase client for direct access
  supabase,

  // Tools
  getTools: async (filters?: {
    category?: string;
    pricing?: string;
    rating?: number;
    featured?: boolean;
    search?: string;
  }) => {
    try {
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
      

      
      return result;
    } catch (err) {
      console.error('DB: Tools query exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to fetch tools from database' }
      };
    }
  },

  getTool: async (id: string) => {
    try {
      console.log('DB: Getting tool:', id);
      const result = await supabase
        .from('tools')
        .select('*')
        .eq('id', id)
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Tool query exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to fetch tool from database' }
      };
    }
  },

  createTool: async (tool: Database['public']['Tables']['tools']['Insert']) => {
    try {
      console.log('DB: Creating tool with data:', tool);
      console.log('DB: Current user session:', await supabase.auth.getSession());
      
      const result = await supabase
        .from('tools')
        .insert([tool])
        .select()
        .single();
        

      
      if (result.error) {
        console.error('DB: Detailed error:', result.error);
      }
      
      return result;
    } catch (err) {
      console.error('DB: Tool creation exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to create tool in database' }
      };
    }
  },

  updateTool: async (id: string, updates: Database['public']['Tables']['tools']['Update']) => {
    try {
      console.log('DB: Updating tool:', id);
      const result = await supabase
        .from('tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Tool update exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to update tool in database' }
      };
    }
  },

  // Categories
  getCategories: async () => {
    try {
      console.log('DB: Getting categories');
      const result = await supabase
        .from('categories')
        .select('*')
        .order('name');
        

      
      return result;
    } catch (err) {
      console.error('DB: Categories query exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to fetch categories from database' }
      };
    }
  },

  // User profiles
  getProfile: async (userId: string) => {
    try {
      console.log('DB: Getting profile for user:', userId);
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Profile query exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to fetch profile from database' }
      };
    }
  },

  createProfile: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
    try {
      console.log('DB: Creating profile for user:', profile.id);
      const result = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Profile creation exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to create profile in database' }
      };
    }
  },

  updateProfile: async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
    try {
      console.log('DB: Updating profile for user:', userId);
      const result = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Profile update exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to update profile in database' }
      };
    }
  },

  // Bookmarks
  getBookmarks: async (userId: string) => {
    try {
      console.log('🔍 DB: Fetching bookmarks for user:', userId);
      
      // Directly fetch bookmarks without redundant auth checks
      const result = await supabase
        .from('bookmarks')
        .select(`
          id,
          user_id,
          tool_id,
          created_at,
          tools (
            id,
            name,
            description,
            category,
            pricing,
            rating,
            reviews_count,
            tags,
            website_url,
            featured,
            verified,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (result.error) {
        console.error('❌ DB: Supabase query error:', result.error);
        throw result.error;
      }
      
      console.log('✅ DB: Bookmarks fetched successfully:', result.data?.length || 0);
      return result;
      
    } catch (err) {
      console.error('💥 DB: Bookmarks query exception:', err);
      return { 
        data: [], 
        error: err instanceof Error ? err : new Error('Failed to fetch bookmarks from database')
      };
    }
  },

  addBookmark: async (userId: string, toolId: string) => {
    try {
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated:', sessionError);
        return { data: [], error: new Error('User not authenticated') };
      }
      
      // First check if bookmark already exists
      const existingBookmark = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .single();
      
      if (existingBookmark.data) {
        console.log('✅ DB: Bookmark already exists');
        return {
          data: [existingBookmark.data],
          error: null,
          alreadyExists: true
        };
      }
      

      // Use upsert to handle race conditions
      const result = await supabase
        .from('bookmarks')
        .upsert([{ user_id: userId, tool_id: toolId }], {
          onConflict: 'user_id,tool_id',
          ignoreDuplicates: false
        })
        .select();
        

      
      // Check for silent failures
      if (!result.error && (!result.data || result.data.length === 0)) {
        console.warn('⚠️ DB: Silent failure detected - no rows inserted despite no error');
        return {
          data: null,
          error: { message: 'Silent failure: Bookmark not inserted (likely RLS policy violation)' }
        };
      }
      
      return result;
    } catch (err) {
      console.error('💥 DB: Bookmark add exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to add bookmark to database' }
      };
    }
  },

  removeBookmark: async (userId: string, toolId: string) => {
    try {
      console.log('🗑️ DB: Removing bookmark for user:', userId, 'tool:', toolId);

      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated:', sessionError);
        return { data: [], error: new Error('User not authenticated') };
      }

      const result = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('tool_id', toolId);
        
      if (result.error) {
        console.error('❌ DB: Remove bookmark error:', result.error);
        throw result.error;
      }
      
      console.log('✅ DB: Bookmark removed successfully:', result.data);
      return result;
    } catch (err) {
      console.error('💥 DB: Bookmark remove exception:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Failed to remove bookmark from database')
      };
    }
  },

  isBookmarked: async (userId: string, toolId: string) => {
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .single();
      
      return !!data;
    } catch (err) {
      console.error('DB: Bookmark check exception:', err);
      return false;
    }
  },

  // Reviews
  getReviews: async (toolId: string) => {
    try {
      console.log('DB: Getting reviews for tool:', toolId);
      const result = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });
        

      
      return result;
    } catch (err) {
      console.error('DB: Reviews query exception:', err);
      return { 
        data: [], 
        error: { message: 'Failed to fetch reviews from database' }
      };
    }
  },

  createReview: async (review: Database['public']['Tables']['reviews']['Insert']) => {
    try {
      console.log('DB: Creating review');
      const result = await supabase
        .from('reviews')
        .insert([review])
        .select()
        .single();
        

      
      return result;
    } catch (err) {
      console.error('DB: Review creation exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to create review in database' }
      };
    }
  },

  getUserReviews: async (userId: string) => {
    try {
      console.log('DB: Getting reviews for user:', userId);
      
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated:', sessionError);
        return { data: [], error: new Error('User not authenticated') };
      }
      
      const result = await supabase
        .from('reviews')
        .select(`
          *,
          tools (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        

      
      return result;
    } catch (err) {
      console.error('DB: User reviews query exception:', err);
      return { 
        data: [], 
        error: { message: 'Failed to fetch user reviews from database' }
      };
    }
  },

  updateReview: async (reviewId: string, updates: Database['public']['Tables']['reviews']['Update']) => {
    try {
      console.log('DB: Updating review:', reviewId);
      const result = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();
        
      return result;
    } catch (err) {
      console.error('DB: Review update exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to update review in database' }
      };
    }
  },

  deleteReview: async (reviewId: string) => {
    try {
      console.log('DB: Deleting review:', reviewId);
      const result = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
        
      return result;
    } catch (err) {
      console.error('DB: Review delete exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to delete review from database' }
      };
    }
  },

  // Likes
  getLikes: async (toolId: string) => {
    try {
      console.log('DB: Getting likes for tool:', toolId);
      const result = await supabase
        .from('likes')
        .select('*')
        .eq('tool_id', toolId);
        
      return result;
    } catch (err) {
      console.error('DB: Likes query exception:', err);
      return { 
        data: [], 
        error: { message: 'Failed to fetch likes from database' }
      };
    }
  },

  getToolLikes: async (toolId: string, userId?: string) => {
    try {
      console.log('DB: Getting tool likes count and user status:', toolId, userId);
      
      // Check auth state for user-specific queries
      if (userId) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('❌ DB: User not authenticated for likes query:', sessionError);
          // Return default data instead of error for better UX
          return { 
            data: { like_count: 0, user_liked: false }, 
            error: null
          };
        }
      }
      
      const { data, error } = await supabase
        .rpc('get_tool_likes', {
          tool_uuid: toolId,
          user_uuid: userId || null
        });
        
      if (error) {
        console.error('DB: Tool likes RPC error:', error);
        return { 
          data: { like_count: 0, user_liked: false }, 
          error 
        };
      }
      
      return { 
        data: data || { like_count: 0, user_liked: false }, 
        error: null 
      };
    } catch (err) {
      console.error('DB: Tool likes query exception:', err);
      return { 
        data: { like_count: 0, user_liked: false }, 
        error: { message: 'Failed to fetch tool likes from database' }
      };
    }
  },

  toggleLike: async (toolId: string, userId: string) => {
    try {
      console.log('DB: Toggling like for tool:', toolId, 'user:', userId);
      
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated for toggle like:', sessionError);
        return { 
          data: null, 
          error: new Error('User not authenticated') 
        };
      }
      
      const { data, error } = await supabase
        .rpc('toggle_like', {
          tool_uuid: toolId,
          user_uuid: userId
        });
        
      if (error) {
        console.error('DB: Toggle like RPC error:', error);
        return { 
          data: null, 
          error 
        };
      }
      
      return { 
        data: data || { like_count: 0, user_liked: false }, 
        error: null 
      };
    } catch (err) {
      console.error('DB: Toggle like exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to toggle like in database' }
      };
    }
  },

  addLike: async (userId: string, toolId: string) => {
    try {
      console.log('DB: Adding like for tool:', toolId, 'user:', userId);
      
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated for add like:', sessionError);
        return { 
          data: null, 
          error: new Error('User not authenticated') 
        };
      }
      
      // Check if like already exists
      const existingLike = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .single();
      
      if (existingLike.data) {
        return {
          data: [existingLike.data],
          error: null,
          alreadyExists: true
        };
      }
      
      const result = await supabase
        .from('likes')
        .insert([{ user_id: userId, tool_id: toolId }])
        .select();
        
      return result;
    } catch (err) {
      console.error('DB: Like add exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to add like to database' }
      };
    }
  },

  removeLike: async (userId: string, toolId: string) => {
    try {
      console.log('DB: Removing like for tool:', toolId, 'user:', userId);
      
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated for remove like:', sessionError);
        return { 
          data: null, 
          error: new Error('User not authenticated') 
        };
      }
      
      const result = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('tool_id', toolId);
        
      return result;
    } catch (err) {
      console.error('DB: Like remove exception:', err);
      return { 
        data: null, 
        error: { message: 'Failed to remove like from database' }
      };
    }
  },

  isLiked: async (userId: string, toolId: string) => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .single();
      
      return !!data;
    } catch (err) {
      console.error('DB: Like check exception:', err);
      return false;
    }
  },

  clearUserBookmarks: async (userId: string) => {
    try {
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ DB: User not authenticated for clear bookmarks:', sessionError);
        return { error: new Error('User not authenticated') };
      }
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing bookmarks:', error);
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Database error in clearUserBookmarks:', error);
      throw error;
    }
  }
};