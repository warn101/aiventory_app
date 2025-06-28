import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Filter, Clock, Star, ThumbsUp } from 'lucide-react';
import { StarRating } from './StarRating';
import { useReviews } from '../hooks/useReviews';
import { Review } from '../hooks/useReviews';

interface ReviewListProps {
  toolId: string;
  className?: string;
  showTitle?: boolean;
  maxReviews?: number;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS = [
  { value: 'newest' as SortOption, label: 'Newest First', icon: Clock },
  { value: 'highest' as SortOption, label: 'Highest Rated', icon: Star },
  { value: 'lowest' as SortOption, label: 'Lowest Rated', icon: Star },
  { value: 'oldest' as SortOption, label: 'Oldest First', icon: Clock },
];

export const ReviewList: React.FC<ReviewListProps> = ({
  toolId,
  className = '',
  showTitle = true,
  maxReviews
}) => {
  const { reviews, loading } = useReviews(toolId);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Sort reviews based on selected option
  const sortedAndFilteredReviews = React.useMemo(() => {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);
  const displayedReviews = maxReviews && !showAllReviews 
    ? sortedAndFilteredReviews.slice(0, maxReviews)
    : sortedAndFilteredReviews;
  const hasMoreReviews = maxReviews && sortedAndFilteredReviews.length > maxReviews;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
        )}
        <div className="text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience with this tool!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with title and sort */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews ({reviews.length})
          </h3>
          
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {SORT_OPTIONS.find(option => option.value === sortBy)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${
                showSortDropdown ? 'rotate-180' : ''
              }`} />
            </button>
            
            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]"
                >
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        <AnimatePresence>
          {displayedReviews.map((review: Review, index: number) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.profiles?.avatar_url ? (
                    <img
                      src={review.profiles.avatar_url}
                      alt={review.profiles.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(review.profiles?.name || 'Anonymous')}
                    </div>
                  )}
                </div>
                
                {/* Review content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 truncate">
                        {review.profiles?.name || 'Anonymous'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} readonly size="sm" />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                        {review.updated_at !== review.created_at && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment */}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  
                  {/* Helpful count (if available) */}
                  {review.helpful_count > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-sm text-gray-500">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful_count} found this helpful</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more button */}
      {hasMoreReviews && !showAllReviews && (
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowAllReviews(true)}
            className="px-6 py-2 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
          >
            Show {sortedAndFilteredReviews.length - maxReviews!} more reviews
          </button>
        </motion.div>
      )}
      
      {/* Show less button */}
      {showAllReviews && maxReviews && (
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowAllReviews(false)}
            className="px-6 py-2 text-gray-600 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            Show less
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ReviewList;