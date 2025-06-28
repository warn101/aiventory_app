import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Edit3, Trash2, X } from 'lucide-react';
import { StarRating } from './StarRating';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';

interface ReviewFormProps {
  toolId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  toolId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const { userReview, canReview, canEditReview, submitting, submitReview, updateReview, deleteReview } = useReviews(toolId);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  // Initialize form with existing review data when editing
  useEffect(() => {
    if (userReview && isEditing) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
    setErrors({});
  }, [userReview, isEditing]);

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long';
    } else if (comment.trim().length > 1000) {
      newErrors.comment = 'Review must be less than 1000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isEditing && userReview) {
        await updateReview(rating, comment.trim());
      } else {
        await submitReview(rating, comment.trim());
      }
      
      // Reset form
      setRating(0);
      setComment('');
      setIsEditing(false);
      setErrors({});
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit review:', error);
      // You could show a toast notification here
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReview();
      setShowDeleteConfirm(false);
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleCancel = () => {
    setRating(userReview?.rating || 0);
    setComment(userReview?.comment || '');
    setIsEditing(false);
    setErrors({});
    onCancel?.();
  };

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">Please log in to write a review.</p>
      </div>
    );
  }

  // Show existing review with edit option
  if (userReview && !isEditing) {
    return (
      <motion.div 
        className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Your Review</h4>
            <StarRating rating={userReview.rating} readonly size="sm" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
              title="Edit review"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm leading-relaxed">
          {userReview.comment}
        </p>
        
        <p className="text-xs text-gray-500 mt-2">
          {userReview.updated_at !== userReview.created_at ? 'Updated' : 'Posted'} on{' '}
          {new Date(userReview.updated_at || userReview.created_at).toLocaleDateString()}
        </p>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">Delete Review</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to delete your review? This action cannot be undone.</p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Show form for new review or editing
  if (canReview || (canEditReview && isEditing)) {
    return (
      <motion.form 
        onSubmit={handleSubmit}
        className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </h4>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarRating 
            rating={rating}
            onRatingChange={setRating}
            size="lg"
          />
          {errors.rating && (
            <p className="text-red-600 text-xs mt-1">{errors.rating}</p>
          )}
        </div>
        
        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this tool..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment ? (
              <p className="text-red-600 text-xs">{errors.comment}</p>
            ) : (
              <p className="text-gray-500 text-xs">
                Minimum 10 characters
              </p>
            )}
            <p className="text-gray-400 text-xs">
              {comment.length}/1000
            </p>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex gap-3 justify-end">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            type="submit"
            disabled={submitting || rating === 0 || !comment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className="w-4 h-4" />
            {submitting 
              ? (isEditing ? 'Updating...' : 'Submitting...') 
              : (isEditing ? 'Update Review' : 'Submit Review')
            }
          </motion.button>
        </div>
      </motion.form>
    );
  }

  return null;
};

export default ReviewForm;