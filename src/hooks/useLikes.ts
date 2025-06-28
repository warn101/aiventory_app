import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '../lib/supabase';

export interface LikeData {
  like_count: number;
  user_liked: boolean;
}

export const useLikes = (toolId: string) => {
  const { user } = useAuth();
  const [likeData, setLikeData] = useState<LikeData>({ like_count: 0, user_liked: false });
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  
  // Debug logging for invalid toolId
  React.useEffect(() => {
    if (!toolId || typeof toolId !== 'string' || toolId.trim() === '') {
      console.warn('useLikes: Invalid toolId provided:', toolId);
    }
  }, [toolId]);

  // Load like data for the tool
  const loadLikes = useCallback(async () => {
    if (!toolId) return;

    try {
      setLoading(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await db.supabase.auth.getSession();
      if (!session && user?.id) {
        console.warn('useLikes: No active session found, but user exists. Using cached data.');
        return;
      }
      
      const { data, error } = await db.getToolLikes(toolId, user?.id);
      
      if (error) {
        console.error('Error loading likes:', error);
        return;
      }

      setLikeData(data || { like_count: 0, user_liked: false });
    } catch (error) {
      console.error('Exception loading likes:', error);
    } finally {
      setLoading(false);
    }
  }, [toolId, user?.id]);

  // Toggle like status (like/unlike)
  const toggleLike = async () => {
    if (!user) {
      throw new Error('User must be logged in to like tools');
    }

    // Store original data for potential revert
    const originalData = { ...likeData };

    try {
      setToggling(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await db.supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      // Optimistic update
      const optimisticData = {
        like_count: likeData.user_liked ? likeData.like_count - 1 : likeData.like_count + 1,
        user_liked: !likeData.user_liked
      };
      setLikeData(optimisticData);

      console.log('Toggling like - Original:', originalData, 'Optimistic:', optimisticData);

      const { data, error } = await db.toggleLike(toolId, user.id);
      
      if (error) {
        console.error('Toggle like error, reverting to original:', originalData);
        // Revert optimistic update on error
        setLikeData(originalData);
        throw new Error(error.message || 'Failed to toggle like');
      }

      // Update with actual data from server
      if (data) {
        console.log('Toggle like success, updating with server data:', data);
        setLikeData(data);
      } else {
        console.warn('No data returned from toggle like, refetching...');
        // If no data returned, refetch to ensure consistency
        await loadLikes();
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling like:', error);
      // Ensure we revert to original state on any error
      setLikeData(originalData);
      throw error;
    } finally {
      setToggling(false);
    }
  };

  // Add like (alternative to toggle)
  const addLike = async () => {
    if (!user) {
      throw new Error('User must be logged in to like tools');
    }

    if (likeData.user_liked) {
      return { success: true, alreadyLiked: true };
    }

    try {
      setToggling(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await db.supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      // Optimistic update
      const optimisticData = {
        like_count: likeData.like_count + 1,
        user_liked: true
      };
      setLikeData(optimisticData);

      const result = await db.addLike(user.id, toolId);
      
      if (result.error) {
        // Revert optimistic update on error
        setLikeData(likeData);
        throw new Error(result.error.message || 'Failed to add like');
      }

      // Reload to get accurate count
      await loadLikes();
      
      return { success: true, alreadyExists: 'alreadyExists' in result ? result.alreadyExists : false };
    } catch (error) {
      console.error('Error adding like:', error);
      throw error;
    } finally {
      setToggling(false);
    }
  };

  // Remove like (alternative to toggle)
  const removeLike = async () => {
    if (!user) {
      throw new Error('User must be logged in to unlike tools');
    }

    if (!likeData.user_liked) {
      return { success: true, notLiked: true };
    }

    try {
      setToggling(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await db.supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      // Optimistic update
      const optimisticData = {
        like_count: Math.max(0, likeData.like_count - 1),
        user_liked: false
      };
      setLikeData(optimisticData);

      const { error } = await db.removeLike(user.id, toolId);
      
      if (error) {
        // Revert optimistic update on error
        setLikeData(likeData);
        throw new Error(error.message || 'Failed to remove like');
      }

      // Reload to get accurate count
      await loadLikes();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    } finally {
      setToggling(false);
    }
  };

  // Check if user has liked this tool
  const isLiked = likeData.user_liked;
  const likeCount = likeData.like_count;

  // Check if user can like (logged in)
  const canLike = !!user;

  useEffect(() => {
    // Only load likes if we have a valid toolId
    if (toolId) {
      loadLikes();
    }
  }, [loadLikes, toolId]);

  // Listen for auth changes to reload likes
  useEffect(() => {
    if (user) {
      loadLikes();
    } else {
      // Reset like data when user logs out
      setLikeData({ like_count: likeData.like_count, user_liked: false });
    }
  }, [user, loadLikes]);

  return {
    likeCount,
    isLiked,
    canLike,
    loading,
    toggling,
    toggleLike,
    addLike,
    removeLike,
    refetch: loadLikes
  };
};

// Hook for getting multiple tools' like counts efficiently
export const useMultipleLikes = (toolIds: string[]) => {
  const { user } = useAuth();
  const [likesData, setLikesData] = useState<{ [toolId: string]: LikeData }>({});
  const [loading, setLoading] = useState(false);

  const loadMultipleLikes = useCallback(async () => {
    if (!toolIds.length) return;

    try {
      setLoading(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await db.supabase.auth.getSession();
      if (!session && user?.id) {
        console.warn('useMultipleLikes: No active session found, but user exists. Using cached data.');
        return;
      }
      
      const promises = toolIds.map(toolId => 
        db.getToolLikes(toolId, user?.id)
      );
      
      const results = await Promise.all(promises);
      
      const newLikesData: { [toolId: string]: LikeData } = {};
      toolIds.forEach((toolId, index) => {
        const result = results[index];
        newLikesData[toolId] = result.data || { like_count: 0, user_liked: false };
      });
      
      setLikesData(newLikesData);
    } catch (error) {
      console.error('Exception loading multiple likes:', error);
    } finally {
      setLoading(false);
    }
  }, [toolIds, user?.id]);

  useEffect(() => {
    loadMultipleLikes();
  }, [loadMultipleLikes]);

  return {
    likesData,
    loading,
    refetch: loadMultipleLikes
  };
};