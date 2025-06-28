import { createClient, Session } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { isValidUUID } from '../utils/uuidValidation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Improved logging for environment variables
console.log('Supabase Config:', {
  url: supabaseUrl ? `Set (${supabaseUrl.substring(0, 10)}...)` : 'Missing',
  key: supabaseAnonKey ? 'Set (key hidden for security)' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

// Enhanced Supabase client with WebContainer-safe configuration
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
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
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
        'Accept': 'application/json',
      },
      // WebContainer-safe fetch configuration
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          credentials: 'include', // Critical for WebContainer environments
          mode: 'cors',
          headers: {
            ...options.headers,
            'Accept': 'application/json',
          },
        });
      },
    },
  }
);

// Test connection with better error handling and timeout
(async () => {
  try {
    // Set a timeout for the connection test
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout')), 5000)
    );
    
    const connectionPromise = supabase.from('tools').select('count', { count: 'exact', head: true });
    
    // Race between the connection test and timeout
    const { count, error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
    
    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully. Tools count:', count);
    }
  } catch (err) {
    console.warn('⚠️ Supabase connection test error:', (err as Error).message);
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

// Enhanced database functions with proper error handling and UUID validation
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

      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tools query timeout')), 10000)
      );
      
      // Race between the query and timeout
      const result = await Promise.race([query, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Tools query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(id)) {
        console.warn('DB: Invalid UUID format for tool ID:', id);
        return { 
          data: null, 
          error: { message: 'Invalid tool ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('tools')
        .select('*')
        .eq('id', id)
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Tool query error:', result.error);
        throw result.error;
      }
      
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
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool creation timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('tools')
        .insert([tool])
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Detailed error:', result.error);
        throw result.error;
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(id)) {
        console.warn('DB: Invalid UUID format for tool ID:', id);
        return { 
          data: null, 
          error: { message: 'Invalid tool ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool update timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Tool update error:', result.error);
        throw result.error;
      }
      
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
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Categories query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('categories')
        .select('*')
        .order('name');
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Categories query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        return { 
          data: null, 
          error: { message: 'Invalid user ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Profile query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(profile.id)) {
        console.warn('DB: Invalid UUID format for user ID:', profile.id);
        return { 
          data: null, 
          error: { message: 'Invalid user ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Profile creation error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        return { 
          data: null, 
          error: { message: 'Invalid user ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Profile update error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        return { 
          data: [], 
          error: { message: 'Invalid user ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bookmarks fetch timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
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
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
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
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId) || !isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for user ID or tool ID:', { userId, toolId });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
        };
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

      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId) || !isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for user ID or tool ID:', { userId, toolId });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
        };
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
      
      console.log('✅ DB: Bookmark removed successfully');
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
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId) || !isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for user ID or tool ID:', { userId, toolId });
        return false;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for tool ID:', toolId);
        return { 
          data: [], 
          error: { message: 'Invalid tool ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Reviews query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('reviews')
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Reviews query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(review.user_id) || !isValidUUID(review.tool_id)) {
        console.warn('DB: Invalid UUID format for user ID or tool ID:', { userId: review.user_id, toolId: review.tool_id });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Review creation timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('reviews')
        .insert([review])
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Review creation error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        return { 
          data: [], 
          error: { message: 'Invalid user ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User reviews query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('reviews')
        .select(`
          *,
          tools (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: User reviews query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(reviewId)) {
        console.warn('DB: Invalid UUID format for review ID:', reviewId);
        return { 
          data: null, 
          error: { message: 'Invalid review ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Review update timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Review update error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(reviewId)) {
        console.warn('DB: Invalid UUID format for review ID:', reviewId);
        return { 
          data: null, 
          error: { message: 'Invalid review ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Review delete timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Review delete error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for tool ID:', toolId);
        return { 
          data: [], 
          error: { message: 'Invalid tool ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Likes query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('likes')
        .select('*')
        .eq('tool_id', toolId);
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Likes query error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId)) {
        console.warn('DB: Invalid UUID format for tool ID:', toolId);
        return { 
          data: { like_count: 0, user_liked: false }, 
          error: { message: 'Invalid tool ID format' }
        };
      }
      
      if (userId && !isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        userId = undefined; // Reset to undefined to avoid RPC errors
      }
      
      // For mock data or invalid UUIDs, return mock response
      if (!isValidUUID(toolId)) {
        return { 
          data: { like_count: Math.floor(Math.random() * 100), user_liked: false }, 
          error: null 
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool likes query timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .rpc('get_tool_likes', {
          tool_uuid: toolId,
          user_uuid: userId || null
        });
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Tool likes RPC error:', result.error);
        return { 
          data: { like_count: 0, user_liked: false }, 
          error: result.error
        };
      }
      
      return { 
        data: result.data || { like_count: 0, user_liked: false }, 
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId) || !isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for tool ID or user ID:', { toolId, userId });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Toggle like timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .rpc('toggle_like', {
          tool_uuid: toolId,
          user_uuid: userId
        });
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Toggle like RPC error:', result.error);
        return { 
          data: null, 
          error: result.error
        };
      }
      
      return { 
        data: result.data || { like_count: 0, user_liked: false }, 
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId) || !isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for tool ID or user ID:', { toolId, userId });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
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
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Add like timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('likes')
        .insert([{ user_id: userId, tool_id: toolId }])
        .select();
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Like add error:', result.error);
        throw result.error;
      }
      
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
      
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId) || !isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for tool ID or user ID:', { toolId, userId });
        return { 
          data: null, 
          error: { message: 'Invalid ID format' }
        };
      }
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Remove like timeout')), 10000)
      );
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('tool_id', toolId);
      
      // Race between the query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('DB: Like remove error:', result.error);
        throw result.error;
      }
      
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
      // Validate UUID format for Supabase queries
      if (!isValidUUID(toolId) || !isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for tool ID or user ID:', { toolId, userId });
        return false;
      }
      
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
      // Validate UUID format for Supabase queries
      if (!isValidUUID(userId)) {
        console.warn('DB: Invalid UUID format for user ID:', userId);
        return { 
          error: { message: 'Invalid user ID format' }
        };
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