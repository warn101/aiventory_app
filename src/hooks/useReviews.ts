import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
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

    try {
      setSubmitting(true);
      
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

    try {
      setSubmitting(true);
      
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

    try {
      setSubmitting(true);
      
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
      dist[review.rating] = (dist[review.rating] || 0) + 1;
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

// Add missing review functions to db object
declare module '../lib/supabase' {
  interface DB {
    updateReview: (reviewId: string, updates: any) => Promise<any>;
    deleteReview: (reviewId: string) => Promise<any>;
  }
}