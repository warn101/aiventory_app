import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarkedTools, setBookmarkedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data } = await db.getBookmarks(user.id);
      setBookmarkedTools(data?.map(b => b.tool_id) || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (toolId: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const isCurrentlyBookmarked = bookmarkedTools.includes(toolId);
      
      if (isCurrentlyBookmarked) {
        const { error } = await db.removeBookmark(user.id, toolId);
        if (!error) {
          setBookmarkedTools(prev => prev.filter(id => id !== toolId));
        }
        return { error };
      } else {
        const { error } = await db.addBookmark(user.id, toolId);
        if (!error) {
          setBookmarkedTools(prev => [...prev, toolId]);
        }
        return { error };
      }
    } catch (error) {
      return { error };
    }
  };

  const isBookmarked = (toolId: string) => {
    return bookmarkedTools.includes(toolId);
  };

  useEffect(() => {
    if (user) {
      loadBookmarks();
    } else {
      setBookmarkedTools([]);
    }
  }, [user]);

  return {
    bookmarkedTools,
    loading,
    toggleBookmark,
    isBookmarked,
    refetch: loadBookmarks
  };
};