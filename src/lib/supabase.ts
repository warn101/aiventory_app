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

// Export database operations
export const db = {
  // ... existing db operations
};