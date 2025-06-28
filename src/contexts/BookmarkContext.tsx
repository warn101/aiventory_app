import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db } from '../lib/supabase';
import { useAuthContext } from './AuthContext';
import { Tool } from '../types';

interface BookmarkContextType {
  // Core state
  bookmarkedTools: string[];
  bookmarksWithTools: Tool[];
  bookmarks: string[]; // Alias for bookmarkedTools
  loading: boolean;
  error: string | null;
  initialized: boolean;
  hasMoreBookmarks: boolean;
  
  // Actions
  toggleBookmark: (toolId: string) => Promise<{ error?: Error; alreadyExists?: boolean }>;
  isBookmarked: (toolId: string) => boolean;
  refreshBookmarks: () => Promise<void>;
  clearAllBookmarks: () => Promise<void>;
  loadMoreBookmarks: () => void;
  
  // Performance helpers
  prefetchBookmarks: () => Promise<void>;
  getBookmarksWithTools: () => Promise<Tool[]>;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let bookmarkCache: {
  data: string[];
  timestamp: number;
  userId: string;
} | null = null;

// Global state to prevent multiple simultaneous fetches
let fetchPromise: Promise<void> | null = null;

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [bookmarkedTools, setBookmarkedTools] = useState<string[]>([]);
  const [bookmarksWithTools, setBookmarksWithTools] = useState<Tool[]>([]);
  const [displayedBookmarks, setDisplayedBookmarks] = useState<Tool[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMoreBookmarks, setHasMoreBookmarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const BATCH_SIZE = 8;

  // Check if cache is valid
  const isCacheValid = useCallback((userId: string) => {
    if (!bookmarkCache || bookmarkCache.userId !== userId) return false;
    return Date.now() - bookmarkCache.timestamp < CACHE_DURATION;
  }, []);

  // Core fetch function with caching and deduplication
  const fetchBookmarks = useCallback(async (force = false) => {
    if (!user?.id) {
      setBookmarkedTools([]);
      setBookmarksWithTools([]);
      setDisplayedBookmarks([]);
      setHasMoreBookmarks(false);
      setInitialized(true);
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!force && isCacheValid(user.id)) {
      console.log('📦 Bookmark: Using cached data');
      setBookmarkedTools(bookmarkCache!.data);
      setInitialized(true);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchPromise && !force) {
      console.log('⏳ Bookmark: Waiting for existing fetch');
      await fetchPromise;
      return;
    }

    console.log('🚀 Bookmark: Fetching fresh data for user:', user.id);
    
    fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await db.getBookmarks(user.id);
        
        if (fetchError) {
          throw fetchError;
        }
        
        const toolIds = data?.map(b => b.tool_id) || [];
        
        // Update cache
        bookmarkCache = {
          data: toolIds,
          timestamp: Date.now(),
          userId: user.id
        };
        
        setBookmarkedTools(toolIds);
        console.log('✅ Bookmark: Fetched', toolIds.length, 'bookmarks');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bookmarks';
        console.error('❌ Bookmark: Fetch failed:', errorMessage);
        setError(errorMessage);
        setBookmarkedTools([]);
      } finally {
        setLoading(false);
        setInitialized(true);
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  }, [user?.id, isCacheValid]);

  // Prefetch function for early loading
  const prefetchBookmarks = useCallback(async () => {
    if (!user?.id || isCacheValid(user.id)) return;
    console.log('🔄 Bookmark: Prefetching...');
    await fetchBookmarks();
  }, [user?.id, fetchBookmarks, isCacheValid]);

  // Get bookmarks with full tool data
  const getBookmarksWithTools = useCallback(async (): Promise<Tool[]> => {
    if (!user?.id) return [];
    
    try {
      const { data, error: fetchError } = await db.getBookmarks(user.id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      const rawTools = data?.map(bookmark => bookmark.tools).filter(Boolean).flat() || [];
      // Map raw tools to ensure all required Tool properties are present
      const tools = rawTools.map((tool: any) => ({
        ...tool,
        reviews: tool.reviews || [],
        image: tool.image || '',
        url: tool.website_url || tool.url || '',
        addedDate: tool.created_at || '',
        lastUpdated: tool.updated_at || ''
      })) as Tool[];
      setBookmarksWithTools(tools);
      setHasMoreBookmarks(tools.length > BATCH_SIZE);
      setDisplayedBookmarks(tools.slice(0, BATCH_SIZE));
      setCurrentBatch(1);
      return tools;
      
    } catch (err) {
      console.error('❌ Bookmark: Failed to get tools:', err);
      return [];
    }
  }, [user?.id]);

  // Toggle bookmark with optimistic updates
  const toggleBookmark = useCallback(async (toolId: string) => {
    if (!user?.id) {
      const error = new Error('User not authenticated');
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      const isCurrentlyBookmarked = bookmarkedTools.includes(toolId);
      
      // Optimistic update
      if (isCurrentlyBookmarked) {
        setBookmarkedTools(prev => prev.filter(id => id !== toolId));
      } else {
        setBookmarkedTools(prev => [...prev, toolId]);
      }
      
      // Update cache immediately
      if (bookmarkCache && bookmarkCache.userId === user.id) {
        if (isCurrentlyBookmarked) {
          bookmarkCache.data = bookmarkCache.data.filter(id => id !== toolId);
        } else {
          bookmarkCache.data = [...bookmarkCache.data, toolId];
        }
      }
      
      // Perform actual database operation
      if (isCurrentlyBookmarked) {
        const { error: deleteError } = await db.removeBookmark(user.id, toolId);
        if (deleteError) {
          // Revert optimistic update on error
          setBookmarkedTools(prev => [...prev, toolId]);
          if (bookmarkCache && bookmarkCache.userId === user.id) {
            bookmarkCache.data = [...bookmarkCache.data, toolId];
          }
          throw deleteError;
        }
      } else {
        const result = await db.addBookmark(user.id, toolId);
        const { error: insertError } = result;
        const alreadyExists = 'alreadyExists' in result ? result.alreadyExists : false;
        
        if (insertError) {
          // Revert optimistic update on error
          setBookmarkedTools(prev => prev.filter(id => id !== toolId));
          if (bookmarkCache && bookmarkCache.userId === user.id) {
            bookmarkCache.data = bookmarkCache.data.filter(id => id !== toolId);
          }
          throw insertError;
        }
        
        if (alreadyExists) {
          return { alreadyExists: true };
        }
      }
      
      // Dispatch global event for UI updates
      window.dispatchEvent(new CustomEvent('bookmarksChanged', { 
        detail: { action: isCurrentlyBookmarked ? 'removed' : 'added', toolId } 
      }));
      
      return {};
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle bookmark';
      console.error('❌ Bookmark: Toggle failed:', errorMessage);
      setError(errorMessage);
      return { error: new Error(errorMessage) };
    }
  }, [user?.id, bookmarkedTools]);

  // Clear all bookmarks
  const clearAllBookmarks = useCallback(async () => {
    if (!user?.id) {
      setError('Please sign in to manage bookmarks');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to clear all bookmarks? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await db.clearUserBookmarks(user.id);
      
      setBookmarkedTools([]);
      setBookmarksWithTools([]);
      
      // Clear cache
      if (bookmarkCache && bookmarkCache.userId === user.id) {
        bookmarkCache.data = [];
      }
      
      window.dispatchEvent(new CustomEvent('allBookmarksCleared'));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear bookmarks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if tool is bookmarked
  const isBookmarked = useCallback((toolId: string) => {
    return bookmarkedTools.includes(toolId);
  }, [bookmarkedTools]);

  // Refresh bookmarks (force fetch)
  const refreshBookmarks = useCallback(async () => {
    await fetchBookmarks(true);
    setCurrentBatch(0);
    setDisplayedBookmarks([]);
    setHasMoreBookmarks(false);
  }, [fetchBookmarks]);

  // Load more bookmarks
  const loadMoreBookmarks = useCallback(() => {
    if (!hasMoreBookmarks) return;
    const nextBatchStart = currentBatch * BATCH_SIZE;
    const nextBatchEnd = nextBatchStart + BATCH_SIZE;
    const nextBookmarks = bookmarksWithTools.slice(nextBatchStart, nextBatchEnd);
    setDisplayedBookmarks(prev => [...prev, ...nextBookmarks]);
    setCurrentBatch(currentBatch + 1);
    setHasMoreBookmarks(nextBatchEnd < bookmarksWithTools.length);
  }, [currentBatch, bookmarksWithTools, hasMoreBookmarks]);

  // Initialize bookmarks when user changes
  useEffect(() => {
    if (user?.id) {
      fetchBookmarks();
    } else {
      setBookmarkedTools([]);
      setBookmarksWithTools([]);
      setInitialized(true);
      bookmarkCache = null;
    }
  }, [user?.id, fetchBookmarks]);

  // Prefetch on user login (after a short delay)
  useEffect(() => {
    if (user?.id && !initialized) {
      const timer = setTimeout(() => {
        prefetchBookmarks();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, initialized, prefetchBookmarks]);

  const value: BookmarkContextType = {
    bookmarkedTools,
    bookmarksWithTools: displayedBookmarks,
    bookmarks: bookmarkedTools, // Alias for compatibility
    loading,
    error,
    initialized,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks,
    clearAllBookmarks,
    prefetchBookmarks,
    getBookmarksWithTools,
    loadMoreBookmarks,
    hasMoreBookmarks
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

// Hook to use bookmark context
export const useBookmarkContext = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider');
  }
  return context;
};

// Backward compatibility hook
export const useBookmarks = () => {
  return useBookmarkContext();
};