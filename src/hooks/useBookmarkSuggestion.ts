import { useState, useEffect, useCallback } from 'react';
import { Tool } from '../types';
import { useAuth } from './useAuth';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { db } from '../lib/supabase';
import { Database } from '../types/database';
import {
  BookmarkSuggestion,
  getBookmarkSuggestionForUser,
  analyzeUserInterests,
  suggestBookmark
} from '../utils/bookmarkSuggestion';

type DatabaseReview = Database['public']['Tables']['reviews']['Row'];

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bookmarks: string[];
  reviews: DatabaseReview[];
}

export interface UseBookmarkSuggestionReturn {
  getSuggestion: (tool: Tool) => Promise<BookmarkSuggestion>;
  getSuggestionSync: (tool: Tool) => BookmarkSuggestion;
  loading: boolean;
  userInterests: ReturnType<typeof analyzeUserInterests> | null;
  refreshUserData: () => Promise<void>;
}

export const useBookmarkSuggestion = (): UseBookmarkSuggestionReturn => {
  const { user } = useAuth() as { user: AuthUser | null };
  const { bookmarkedTools: bookmarkedToolIds, loading: bookmarksLoading } = useBookmarkContext();
  const [loading, setLoading] = useState(false);
  const [bookmarkedTools, setBookmarkedTools] = useState<Tool[]>([]);
  const [reviewedTools, setReviewedTools] = useState<Tool[]>([]);
  const [userInterests, setUserInterests] = useState<ReturnType<typeof analyzeUserInterests> | null>(null);

  // Load full tool data for bookmarked tools
  const loadBookmarkedTools = useCallback(async () => {
    if (!user || bookmarkedToolIds.length === 0) {
      setBookmarkedTools([]);
      return;
    }

    try {
      setLoading(true);
      const { data: bookmarkData } = await db.getBookmarks(user.id);
      
      if (bookmarkData) {
        const tools = bookmarkData
          .filter(bookmark => bookmark.tools) // Filter out bookmarks without tool data
          .map(bookmark => {
            // Type assertion to handle Supabase's nested object structure
            const tool = bookmark.tools as any;
            return {
              id: tool?.id || '',
              name: tool?.name || '',
              description: tool?.description || '',
              category: tool?.category || '',
              pricing: tool?.pricing || 'free',
              rating: tool?.rating || 0,
              reviews: tool?.reviews_count || 0,
              tags: tool?.tags || [],
              image: '', // Will be handled by image system
              url: tool?.website_url || '',
              featured: tool?.featured || false,
              verified: tool?.verified || false,
              addedDate: tool?.created_at || new Date().toISOString(),
              lastUpdated: tool?.updated_at || new Date().toISOString()
            };
          }) as Tool[];
        
        setBookmarkedTools(tools);
      }
    } catch (error) {
      console.error('Error loading bookmarked tools:', error);
      setBookmarkedTools([]);
    } finally {
      setLoading(false);
    }
  }, [user, bookmarkedToolIds]);

  // Load tools that user has reviewed
  const loadReviewedTools = useCallback(async () => {
    if (!user) {
      setReviewedTools([]);
      return;
    }

    try {
      const { data: reviews } = await db.getUserReviews(user.id);
      
      if (reviews) {
        // Get unique tool IDs from reviews
        const reviewedToolIds = [...new Set(reviews.map(review => review.tool_id))];
        
        // Fetch tool details for reviewed tools
        const toolPromises = reviewedToolIds.map(async (toolId) => {
          const { data: tool } = await db.getTool(toolId);
          return tool;
        });
        
        const tools = (await Promise.all(toolPromises))
          .filter(Boolean)
          .map(tool => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            pricing: tool.pricing,
            rating: tool.rating,
            reviews: tool.reviews_count,
            tags: tool.tags,
            image: '', // Will be handled by image system
            url: tool.website_url,
            featured: tool.featured,
            verified: tool.verified,
            addedDate: tool.created_at,
            lastUpdated: tool.updated_at
          })) as Tool[];
        
        setReviewedTools(tools);
      }
    } catch (error) {
      console.error('Error loading reviewed tools:', error);
      setReviewedTools([]);
    }
  }, [user]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    await Promise.all([loadBookmarkedTools(), loadReviewedTools()]);
  }, [loadBookmarkedTools, loadReviewedTools]);

  // Update user interests when data changes
  useEffect(() => {
    if (bookmarkedTools.length > 0 || reviewedTools.length > 0) {
      const interests = analyzeUserInterests(bookmarkedTools, reviewedTools);
      setUserInterests(interests);
    } else {
      setUserInterests(null);
    }
  }, [bookmarkedTools, reviewedTools]);

  // Load data when user or bookmarks change
  useEffect(() => {
    if (user && !bookmarksLoading) {
      refreshUserData();
    }
  }, [user, bookmarksLoading, refreshUserData]);

  // Async suggestion function (loads fresh data if needed)
  const getSuggestion = useCallback(async (tool: Tool): Promise<BookmarkSuggestion> => {
    if (!user) {
      return {
        shouldSuggest: false,
        message: 'Sign in to get personalized recommendations!',
        confidence: 0,
        reasons: []
      };
    }

    // Ensure we have fresh data
    if (bookmarkedTools.length === 0 && reviewedTools.length === 0 && bookmarkedToolIds.length > 0) {
      await refreshUserData();
    }

    return getBookmarkSuggestionForUser(tool, user, bookmarkedTools, reviewedTools);
  }, [user, bookmarkedTools, reviewedTools, bookmarkedToolIds, refreshUserData]);

  // Sync suggestion function (uses cached data)
  const getSuggestionSync = useCallback((tool: Tool): BookmarkSuggestion => {
    if (!user) {
      return {
        shouldSuggest: false,
        message: 'Sign in to get personalized recommendations!',
        confidence: 0,
        reasons: []
      };
    }

    if (!userInterests) {
      return {
        shouldSuggest: false,
        message: 'Building your preferences...',
        confidence: 0,
        reasons: []
      };
    }

    const isAlreadyBookmarked = user.bookmarks.includes(tool.id);
    
    if (isAlreadyBookmarked) {
      return {
        shouldSuggest: false,
        message: "You've already bookmarked this tool!",
        confidence: 0,
        reasons: []
      };
    }

    // Use the suggestion utility with cached user interests
    return suggestBookmark(tool, userInterests, isAlreadyBookmarked);
  }, [user, userInterests]);

  return {
    getSuggestion,
    getSuggestionSync,
    loading: loading || bookmarksLoading,
    userInterests,
    refreshUserData
  };
};