import { useState, useEffect, useCallback } from 'react';
import { db, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { isValidUUID } from '../utils/uuidValidation';

export interface Review {
  id: string;
  user_id: string;
  tool_id: string;
  rating: number;
  comment: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

export const useReviews = (toolId: string) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'highest_rated'>('newest');

  // Load reviews for the tool
  const loadReviews = useCallback(async () => {
    if (!toolId) return;

    try {
      setLoading(true);
      
      // For non-UUID tool IDs (mock data), return mock reviews
      if (!isValidUUID(toolId)) {
        console.log('Using mock review data for non-UUID tool ID:', toolId);
        const mockReviews = Array(3).fill(0).map((_, i) => ({
          id: `mock-review-${i}`,
          user_id: `mock-user-${i}`,
          tool_id: toolId,
          rating: 4 + Math.random(),
          comment: `This is a mock review ${i + 1} for testing purposes.`,
          helpful_count: Math.floor(Math.random() * 10),
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
          updated_at: new Date(Date.now() - i * 86400000).toISOString(),
          profiles: {
            name: `User ${i + 1}`,
            avatar_url: undefined
          }
        }));
        setReviews(mockReviews);
        
        // Set user review if user exists
        if (user) {
          const mockUserReview = {
            id: `mock-review-user`,
            user_id: user.id,
            tool_id: toolId,
            rating: 4.5,
            comment: "This is my mock review for testing purposes.",
            helpful_count: 3,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            profiles: {
              name: user.user_metadata?.name || 'Current User',
              avatar_url: undefined
            }
          };
          setUserReview(mockUserReview);
        } else {
          setUserReview(null);
        }
        
        return;
      }
      
      // Check if we have an active session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && user?.id) {
        console.warn('useReviews: No active session found, but user exists. Using cached data.');
        return;
      }
      
      const { data, error } = await db.getReviews(toolId);
      
      if (error) {
        console.error('Error loading reviews:', error);
        return;
      }

      const reviewsData = data || [];
      setReviews(reviewsData);

      // Find user's review if logged in
      if (user) {
        const userReviewData = reviewsData.find(review => review.user_id === user.id);
        setUserReview(userReviewData || null);
      }
    } catch (error) {
      console.error('Exception loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [toolId, user]);

  // Submit or update a review
  const submitReview = async (rating: number, comment: string) => {
    if (!user) {
      throw new Error('User must be logged in to submit a review');
    }

    // For non-UUID tool IDs (mock data), simulate review submission
    if (!isValidUUID(toolId)) {
      console.log('Simulating review submission for mock data tool ID:', toolId);
      const mockReview = {
        id: `mock-review-${Date.now()}`,
        user_id: user.id,
        tool_id: toolId,
        rating,
        comment,
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          name: user.user_metadata?.name || 'Current User',
          avatar_url: undefined
        }
      };
      
      setUserReview(mockReview);
      setReviews(prev => [mockReview, ...prev]);
      
      return { success: true, data: mockReview };
    }

    try {
      setSubmitting(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      const reviewData = {
        user_id: user.id,
        tool_id: toolId,
        rating,
        comment
      };

      const { data, error } = await db.createReview(reviewData);
      
      if (error) {
        throw new Error(error.message || 'Failed to submit review');
      }

      // Reload reviews to get updated data
      await loadReviews();
      
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing review
  const updateReview = async (rating: number, comment: string) => {
    if (!user || !userReview) {
      throw new Error('No existing review to update');
    }

    // For non-UUID tool IDs (mock data), simulate review update
    if (!isValidUUID(toolId) || !isValidUUID(userReview.id)) {
      console.log('Simulating review update for mock data:', toolId);
      const updatedReview = {
        ...userReview,
        rating,
        comment,
        updated_at: new Date().toISOString()
      };
      
      setUserReview(updatedReview);
      setReviews(prev => prev.map(r => 
        r.id === updatedReview.id ? updatedReview : r
      ));
      
      return { success: true, data: updatedReview };
    }

    try {
      setSubmitting(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      const { data, error } = await db.updateReview(userReview.id, {
        rating,
        comment,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update review');
      }

      // Reload reviews to get updated data
      await loadReviews();
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const deleteReview = async () => {
    if (!user || !userReview) {
      throw new Error('No review to delete');
    }

    // For non-UUID tool IDs (mock data), simulate review deletion
    if (!isValidUUID(toolId) || !isValidUUID(userReview.id)) {
      console.log('Simulating review deletion for mock data:', toolId);
      setUserReview(null);
      setReviews(prev => prev.filter(r => r.id !== userReview.id));
      return { success: true };
    }

    try {
      setSubmitting(true);
      
      // Check if we have an active session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }
      
      const { error } = await db.deleteReview(userReview.id);
      
      if (error) {
        throw new Error(error.message || 'Failed to delete review');
      }

      // Reload reviews to get updated data
      await loadReviews();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate review summary
  const getReviewSummary = useCallback((): ReviewSummary => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      const roundedRating = Math.round(review.rating);
      dist[roundedRating] = (dist[roundedRating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as { [key: number]: number });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      ratingDistribution
    };
  }, [reviews]);

  // Sort reviews
  const sortedReviews = useCallback(() => {
    const sorted = [...reviews];
    
    if (sortBy === 'newest') {
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      return sorted.sort((a, b) => b.rating - a.rating);
    }
  }, [reviews, sortBy]);

  // Check if user can review (logged in and hasn't reviewed yet)
  const canReview = user && !userReview;
  const canEditReview = user && userReview;

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return {
    reviews: sortedReviews(),
    loading,
    submitting,
    userReview,
    canReview,
    canEditReview,
    sortBy,
    setSortBy,
    submitReview,
    updateReview,
    deleteReview,
    getReviewSummary,
    refetch: loadReviews
  };
};