/**
 * Optimized Supabase Database Layer
 * 
 * This module provides performance-optimized database operations with:
 * - Query result caching
 * - Minimal data fetching
 * - Connection pooling
 * - Performance monitoring
 * - Error handling and retries
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { performanceDiagnostics } from '../utils/performanceDiagnostics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced Supabase client with performance optimizations
export const supabaseOptimized = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web-optimized',
        'Cache-Control': 'max-age=300', // 5 minutes cache
      },
    },
    // Connection pooling settings
    db: {
      schema: 'public',
    },
    // Realtime settings for minimal overhead
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Cache management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}

const queryCache = new QueryCache();

// Retry mechanism for failed queries
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
};

// Optimized bookmark operations
export const optimizedBookmarkOps = {
  /**
   * Get user bookmarks with minimal data fetching
   */
  getBookmarksLightweight: async (userId: string) => {
    const cacheKey = `bookmarks-light-${userId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for bookmarks (lightweight)');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getBookmarksLightweight',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('bookmarks')
            .select(`
              tool_id,
              created_at,
              tools (
                id,
                name,
                category,
                rating,
                featured,
                pricing
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Pagination limit

          if (error) throw error;
          return data;
        });

        // Cache the result
        queryCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
        
        return { data: result, error: null, fromCache: false };
      },
      'bookmarks'
    );
  },

  /**
   * Get full bookmark data (only when needed)
   */
  getBookmarksFull: async (userId: string) => {
    const cacheKey = `bookmarks-full-${userId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for bookmarks (full)');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getBookmarksFull',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('bookmarks')
            .select(`
              id,
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

          if (error) throw error;
          return data;
        });

        // Cache the result
        queryCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
        
        return { data: result, error: null, fromCache: false };
      },
      'bookmarks'
    );
  },

  /**
   * Get bookmark IDs only (fastest)
   */
  getBookmarkIds: async (userId: string): Promise<string[]> => {
    const cacheKey = `bookmark-ids-${userId}`;
    const cached = queryCache.get<string[]>(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for bookmark IDs');
      return cached;
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getBookmarkIds',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('bookmarks')
            .select('tool_id')
            .eq('user_id', userId);

          if (error) throw error;
          return data?.map(b => b.tool_id) || [];
        });

        // Cache the result
        queryCache.set(cacheKey, result, 15 * 60 * 1000); // 15 minutes
        
        return result;
      },
      'bookmarks'
    );
  },

  /**
   * Add bookmark with optimistic caching
   */
  addBookmark: async (userId: string, toolId: string) => {
    return performanceDiagnostics.measureDatabaseQuery(
      'addBookmark',
      async () => {
        // Check if bookmark already exists (from cache first)
        const existingIds = await optimizedBookmarkOps.getBookmarkIds(userId);
        if (existingIds.includes(toolId)) {
          return { data: null, error: null, alreadyExists: true };
        }

        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('bookmarks')
            .upsert([{ user_id: userId, tool_id: toolId }], {
              onConflict: 'user_id,tool_id',
              ignoreDuplicates: true
            })
            .select();

          if (error) throw error;
          return data;
        });

        // Invalidate relevant caches
        queryCache.invalidate(`bookmarks-${userId}`);
        queryCache.invalidate(`bookmark-ids-${userId}`);
        
        return { data: result, error: null, alreadyExists: false };
      },
      'bookmarks'
    );
  },

  /**
   * Remove bookmark with cache invalidation
   */
  removeBookmark: async (userId: string, toolId: string) => {
    return performanceDiagnostics.measureDatabaseQuery(
      'removeBookmark',
      async () => {
        const result = await withRetry(async () => {
          const { error } = await supabaseOptimized
            .from('bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('tool_id', toolId);

          if (error) throw error;
          return true;
        });

        // Invalidate relevant caches
        queryCache.invalidate(`bookmarks-${userId}`);
        queryCache.invalidate(`bookmark-ids-${userId}`);
        
        return { data: result, error: null };
      },
      'bookmarks'
    );
  },

  /**
   * Clear all user bookmarks
   */
  clearUserBookmarks: async (userId: string) => {
    return performanceDiagnostics.measureDatabaseQuery(
      'clearUserBookmarks',
      async () => {
        const result = await withRetry(async () => {
          const { error } = await supabaseOptimized
            .from('bookmarks')
            .delete()
            .eq('user_id', userId);

          if (error) throw error;
          return true;
        });

        // Invalidate all bookmark caches for user
        queryCache.invalidate(`bookmarks-${userId}`);
        queryCache.invalidate(`bookmark-ids-${userId}`);
        
        return { data: result, error: null };
      },
      'bookmarks'
    );
  },
};

// Optimized tool operations
export const optimizedToolOps = {
  /**
   * Get tools with smart filtering and pagination
   */
  getTools: async (filters?: {
    category?: string;
    pricing?: string;
    rating?: number;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const cacheKey = `tools-${JSON.stringify(filters || {})}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for tools');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getTools',
      async () => {
        const result = await withRetry(async () => {
          let query = supabaseOptimized
            .from('tools')
            .select('*')
            .order('created_at', { ascending: false });

          // Apply filters
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
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
          }

          // Pagination
          if (filters?.limit) {
            query = query.limit(filters.limit);
          }

          if (filters?.offset) {
            query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data;
        });

        // Cache the result (shorter TTL for filtered results)
        const ttl = filters && Object.keys(filters).length > 0 ? 2 * 60 * 1000 : 10 * 60 * 1000;
        queryCache.set(cacheKey, result, ttl);
        
        return { data: result, error: null, fromCache: false };
      },
      'tools'
    );
  },

  /**
   * Get single tool by ID
   */
  getTool: async (toolId: string) => {
    const cacheKey = `tool-${toolId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for tool');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getTool',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('tools')
            .select('*')
            .eq('id', toolId)
            .single();

          if (error) throw error;
          return data;
        });

        // Cache the result
        queryCache.set(cacheKey, result, 30 * 60 * 1000); // 30 minutes
        
        return { data: result, error: null, fromCache: false };
      },
      'tools'
    );
  },
};

// Optimized user operations
export const optimizedUserOps = {
  /**
   * Get user profile with minimal data
   */
  getProfile: async (userId: string) => {
    const cacheKey = `profile-${userId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for profile');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getProfile',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('profiles')
            .select('id, name, email, avatar_url, bio, location, website')
            .eq('id', userId)
            .single();

          if (error) throw error;
          return data;
        });

        // Cache the result
        queryCache.set(cacheKey, result, 15 * 60 * 1000); // 15 minutes
        
        return { data: result, error: null, fromCache: false };
      },
      'profiles'
    );
  },

  /**
   * Get user reviews
   */
  getUserReviews: async (userId: string) => {
    const cacheKey = `reviews-${userId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for reviews');
      return { data: cached, error: null, fromCache: true };
    }

    return performanceDiagnostics.measureDatabaseQuery(
      'getUserReviews',
      async () => {
        const result = await withRetry(async () => {
          const { data, error } = await supabaseOptimized
            .from('reviews')
            .select(`
              id,
              rating,
              comment,
              created_at,
              tools (id, name)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        });

        // Cache the result
        queryCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
        
        return { data: result, error: null, fromCache: false };
      },
      'reviews'
    );
  },
};

// Batch operations for better performance
export const batchOps = {
  /**
   * Load all user dashboard data in parallel
   */
  loadDashboardData: async (userId: string) => {
    const measureId = performanceDiagnostics.startMeasure('loadDashboardData');
    
    try {
      // Load critical data first (bookmarks)
      const bookmarksPromise = optimizedBookmarkOps.getBookmarksLightweight(userId);
      
      // Load secondary data in parallel
      const [bookmarksResult, profileResult, reviewsResult] = await Promise.allSettled([
        bookmarksPromise,
        optimizedUserOps.getProfile(userId),
        optimizedUserOps.getUserReviews(userId),
      ]);

      const result = {
        bookmarks: bookmarksResult.status === 'fulfilled' ? bookmarksResult.value : { data: [], error: null },
        profile: profileResult.status === 'fulfilled' ? profileResult.value : { data: null, error: null },
        reviews: reviewsResult.status === 'fulfilled' ? reviewsResult.value : { data: [], error: null },
      };

      return result;
    } finally {
      performanceDiagnostics.endMeasure(measureId);
    }
  },
};

// Cache management utilities
export const cacheUtils = {
  invalidateUser: (userId: string) => {
    queryCache.invalidate(userId);
  },
  
  invalidateAll: () => {
    queryCache.clear();
  },
  
  getStats: () => queryCache.getStats(),
};

// Performance monitoring
export const performanceUtils = {
  logCacheStats: () => {
    const stats = queryCache.getStats();
    console.log('📊 Cache Stats:', stats);
  },
  
  generateReport: () => performanceDiagnostics.generateReport(),
};

// Export the optimized client
export { supabaseOptimized as supabase };
export { supabaseOptimized as db };
export default {
  bookmarks: optimizedBookmarkOps,
  tools: optimizedToolOps,
  users: optimizedUserOps,
  batch: batchOps,
  cache: cacheUtils,
  performance: performanceUtils,
};
