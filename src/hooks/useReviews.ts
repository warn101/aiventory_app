import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import { useAuth } from './useAuth';
import { isValidUUID, isMockData } from '../utils/uuidValidation';

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

    // Skip Supabase query for mock data IDs
    if (isMockData(toolId)) {
      console.log('Using mock data for reviews, skipping Supabase query for ID:', toolId);
      // Set mock reviews data
      const mockReviews: Review[] = [
        {
          id: `mock-review-1-${toolId}`,
          user_id: 'mock-user-1',
          tool_id: toolId,
          rating: 4,
          comment: 'This is a great tool! Very useful for my workflow.',
          helpful_count: 12,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            name: 'John Doe',
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'
          }
        },
        {
          id: `mock-review-2-${toolId}`,
          user_id: 'mock-user-2',
          tool_id: toolId,
          rating: 5,
          comment: 'Absolutely love this! Changed the way I work with AI.',
          helpful_count: 8,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            name: 'Jane Smith',
            avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
          }
        }
      ];
      
      setReviews(mockReviews);
      
      // Set user review if current user matches a mock review
      if (user) {
        const userMockReview = mockReviews.find(review => review.user_id === user.id);
        setUserReview(userMockReview || null);
      }
      
      setLoading(false);
      return;
    }

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

    // Mock data handling
    if (isMockData(toolId)) {
      console.log('Using mock data, simulating review submission for ID:', toolId);
      
      // Create a mock review
      const mockReview: Review = {
        id: `mock-review-${Date.now()}`,
        user_id: user.id,
        tool_id: toolId,
        rating,
        comment,
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          name: user.name,
          avatar_url: user.avatar
        }
      };
      
      // Update local state
      setUserReview(mockReview);
      setReviews(prev => [mockReview, ...prev.filter(r => r.user_id !== user.id)]);
      
      return { success: true, data: mockReview };
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

    // Mock data handling
    if (isMockData(toolId)) {
      console.log('Using mock data, simulating review update for ID:', toolId);
      
      // Update the mock review
      const updatedReview: Review = {
        ...userReview,
        rating,
        comment,
        updated_at: new Date().toISOString()
      };
      
      // Update local state
      setUserReview(updatedReview);
      setReviews(prev => prev.map(r => 
        r.id === userReview.id ? updatedReview : r
      ));
      
      return { success: true, data: updatedReview };
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

    // Mock data handling
    if (isMockData(toolId)) {
      console.log('Using mock data, simulating review deletion for ID:', toolId);
      
      // Update local state
      setUserReview(null);
      setReviews(prev => prev.filter(r => r.id !== userReview.id));
      
      return { success: true };
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