import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { ensureValidSession } from '../store/authStore';
import { Tool } from '../types';

export const useBookmarks = () => {
  const { user, initialized, loading: authLoading } = useAuthStore();
  const [bookmarkedTools, setBookmarkedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for bookmarks with full tool data
  const [bookmarksWithToolsCache, setBookmarksWithToolsCache] = useState<Tool[]>([]);
  const [bookmarksWithToolsLoading, setBookmarksWithToolsLoading] = useState(false);
  
  const loadBookmarks = useCallback(async () => {
    // Don't attempt to load if auth is not initialized or user is not available
    if (!initialized || authLoading || !user) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure session is valid before making request
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('Session is invalid. Please sign in again.');
      }
      
      console.log('🔍 Loading bookmarks for user:', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select('tool_id')
        .eq('user_id', user.id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      const toolIds = data?.map(bookmark => bookmark.tool_id) || [];
      setBookmarkedTools(toolIds);
      console.log(`✅ Loaded ${toolIds.length} bookmarks`);
      
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      setBookmarkedTools([]);
    } finally {
      setLoading(false);
    }
  }, [user, initialized, authLoading]);
  
  const getBookmarksWithTools = useCallback(async (): Promise<Tool[]> => {
    if (!user) {
      return [];
    }
    
    try {
      setBookmarksWithToolsLoading(true);
      
      // Ensure session is valid before making request
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('Session is invalid. Please sign in again.');
      }
      
      console.log('🔍 Loading bookmarks with tool data for user:', user.id);
      
      const { data, error: fetchError } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Transform the data to match the Tool interface
      const tools = data
        ?.filter(bookmark => bookmark.tools) // Filter out any bookmarks without tool data
        .map(bookmark => {
          const tool = bookmark.tools;
          return {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            pricing: tool.pricing,
            rating: tool.rating || 0,
            reviews: tool.reviews_count || 0,
            tags: tool.tags || [],
            image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400', // Placeholder
            url: tool.website_url,
            featured: tool.featured || false,
            verified: tool.verified || false,
            addedDate: tool.created_at,
            lastUpdated: tool.updated_at
          };
        }) as Tool[] || [];
      
      setBookmarksWithToolsCache(tools);
      console.log(`✅ Loaded ${tools.length} bookmarks with tool data`);
      
      return tools;
    } catch (err) {
      console.error('Error loading bookmarks with tools:', err);
      return [];
    } finally {
      setBookmarksWithToolsLoading(false);
    }
  }, [user]);
  
  const toggleBookmark = useCallback(async (toolId: string) => {
    if (!user) {
      setError('User not authenticated');
      return { error: new Error('User not authenticated') };
    }
    
    try {
      // Ensure session is valid before making request
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('Session is invalid. Please sign in again.');
      }
      
      const isCurrentlyBookmarked = bookmarkedTools.includes(toolId);
      
      // Optimistic update
      if (isCurrentlyBookmarked) {
        setBookmarkedTools(prev => prev.filter(id => id !== toolId));
      } else {
        setBookmarkedTools(prev => [...prev, toolId]);
      }
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('tool_id', toolId);
        
        if (deleteError) {
          // Revert optimistic update
          setBookmarkedTools(prev => [...prev, toolId]);
          throw deleteError;
        }
      } else {
        // Add bookmark
        const { error: insertError } = await supabase
          .from('bookmarks')
          .insert([{ user_id: user.id, tool_id: toolId }]);
        
        if (insertError) {
          // Revert optimistic update
          setBookmarkedTools(prev => prev.filter(id => id !== toolId));
          throw insertError;
        }
      }
      
      // Invalidate bookmarks with tools cache
      setBookmarksWithToolsCache([]);
      
      return { error: null };
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle bookmark';
      setError(errorMessage);
      return { error: new Error(errorMessage) };
    }
  }, [user, bookmarkedTools]);
  
  // Load bookmarks when user changes or auth initializes
  useEffect(() => {
    if (user && initialized && !authLoading) {
      loadBookmarks();
    } else if (!user && initialized) {
      // Clear bookmarks when user is not authenticated
      setBookmarkedTools([]);
      setBookmarksWithToolsCache([]);
    }
  }, [user, initialized, authLoading, loadBookmarks]);
  
  return {
    bookmarkedTools,
    loading: loading || authLoading || !initialized,
    error,
    loadBookmarks,
    getBookmarksWithTools,
    bookmarksWithToolsLoading,
    toggleBookmark,
    isBookmarked: (toolId: string) => bookmarkedTools.includes(toolId)
  };
};

export default useBookmarks;