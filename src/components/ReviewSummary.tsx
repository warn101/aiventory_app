import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users } from 'lucide-react';
import { StarRating, CompactStarRating } from './StarRating';
import { useReviews } from '../hooks/useReviews';

interface ReviewSummaryProps {
  toolId: string;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  showReviewCount?: boolean;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  toolId,
  variant = 'default',
  className = '',
  showReviewCount = true
}) => {
  const { getReviewSummary, loading } = useReviews(toolId);
  const reviewSummary = getReviewSummary();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {variant === 'compact' ? (
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        )}
      </div>
    );
  }

  if (!reviewSummary || reviewSummary.totalReviews === 0) {
    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
          <CompactStarRating rating={0} />
          <span className="text-sm">No reviews</span>
        </div>
      );
    }
    
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-gray-400">
          <Star className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No reviews yet</p>
        </div>
      </div>
    );
  }

  const { averageRating, totalReviews, ratingDistribution } = reviewSummary;

  // Compact variant for tool cards
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CompactStarRating rating={averageRating} />
        <span className="text-sm text-gray-600">
          {averageRating.toFixed(1)}
          {showReviewCount && (
            <span className="text-gray-400 ml-1">({totalReviews})</span>
          )}
        </span>
      </div>
    );
  }

  // Default variant
  if (variant === 'default') {
    return (
      <motion.div 
        className={`flex items-center gap-3 ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} readonly size="md" />
          <div className="text-sm">
            <span className="font-semibold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            {showReviewCount && (
              <span className="text-gray-500 ml-1">
                ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Detailed variant with rating distribution
  return (
    <motion.div 
      className={`bg-gray-50 rounded-lg p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-6">
        {/* Overall rating */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} readonly size="lg" />
          <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-gray-600">{rating}</span>
                    <Star className="w-3 h-3 fill-current text-yellow-400" />
                  </div>
                  
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-yellow-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: rating * 0.1 }}
                    />
                  </div>
                  
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewSummary;
