import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../hooks/useAuth';

interface LikeButtonProps {
  toolId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  onAuthRequired?: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  toolId,
  size = 'md',
  showCount = true,
  variant = 'default',
  className = '',
  onAuthRequired
}) => {
  const { user } = useAuth();
  const { likeCount: hookLikeCount, isLiked: hookIsLiked, canLike, loading, toggleLike } = useLikes(toolId);
  
  // Local state for UI control
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  
  // Initialize state from hook data on mount and when hook data changes
  useEffect(() => {
    if (hookLikeCount !== undefined && hookLikeCount !== null) {
      setLikeCount(hookLikeCount);
    }
    if (hookIsLiked !== undefined && hookIsLiked !== null) {
      setIsLiked(hookIsLiked);
    }
    console.log('LikeButton: Initializing state from hook:', {
      toolId,
      hookLikeCount,
      hookIsLiked,
      userId: user?.id
    });
  }, [hookLikeCount, hookIsLiked, toolId, user?.id]);
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('LikeButton: Local state updated for toolId:', toolId, {
      likeCount,
      isLiked,
      isToggling,
      canLike,
      userId: user?.id
    });
  }, [toolId, likeCount, isLiked, isToggling, canLike, user?.id]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  const handleClick = async () => {
    if (!canLike) {
      onAuthRequired?.();
      return;
    }

    if (isToggling) {
      console.log('LikeButton: Already toggling, ignoring click');
      return;
    }

    console.log('LikeButton: Handling click, current state:', { likeCount, isLiked, isToggling });

    // Store original state for potential revert
    const originalLikeCount = likeCount;
    const originalIsLiked = isLiked;

    try {
      setIsToggling(true);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
      
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      
      console.log('LikeButton: Optimistic update applied:', {
        from: { likeCount: originalLikeCount, isLiked: originalIsLiked },
        to: { likeCount: newLikeCount, isLiked: newIsLiked }
      });

      const result = await toggleLike();
      console.log('LikeButton: Toggle like result:', result);
      
      // Update with actual server data if available
      if (result?.data) {
        setLikeCount(result.data.like_count ?? newLikeCount);
        setIsLiked(result.data.user_liked ?? newIsLiked);
        console.log('LikeButton: Updated with server data:', result.data);
      }
      
    } catch (error) {
      console.error('LikeButton: Failed to toggle like, reverting:', error);
      // Revert optimistic update on error
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsToggling(false);
    }
  };

  const formatCount = (count: number | undefined | null) => {
    // Safe fallback for undefined/null values
    const safeCount = count ?? 0;
    
    if (typeof safeCount !== 'number' || isNaN(safeCount)) {
      console.warn('formatCount: Invalid count value:', count, 'for toolId:', toolId);
      return '0';
    }
    
    if (safeCount >= 1000000) {
      return `${(safeCount / 1000000).toFixed(1)}M`;
    } else if (safeCount >= 1000) {
      return `${(safeCount / 1000).toFixed(1)}K`;
    }
    return safeCount.toString();
  };

  if (variant === 'minimal') {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isToggling || loading}
        className={`
          flex items-center gap-1 transition-colors duration-200
          ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
          ${(isToggling || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {(isToggling || loading) ? (
          <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        ) : (
          <Heart 
            className={`${
              sizeClasses[size]
            } transition-all duration-200 ${
              isLiked ? 'fill-red-500 text-red-500' : 'fill-transparent text-gray-400'
            }`}
          />
        )}
        {showCount && (
          <span className="font-medium">
            {formatCount(likeCount)}
          </span>
        )}
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isToggling || loading}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-full
          transition-all duration-200
          ${isLiked 
            ? 'bg-red-50 text-red-600 border border-red-200' 
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          }
          ${(isToggling || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {(isToggling || loading) ? (
          <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        ) : (
          <Heart 
            className={`${
              sizeClasses[size]
            } transition-all duration-200 ${
              isLiked ? 'fill-red-500 text-red-500' : 'fill-transparent text-gray-400'
            }`}
          />
        )}
        {showCount && (
          <span className="text-xs font-medium">
            {formatCount(likeCount)}
          </span>
        )}
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      onClick={handleClick}
      disabled={isToggling || loading}
      className={`
        flex items-center gap-2 ${buttonSizeClasses[size]} rounded-lg
        transition-all duration-200 font-medium
        ${isLiked 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
        }
        ${(isToggling || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${!canLike ? 'opacity-75' : ''}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {(isToggling || loading) ? (
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      ) : (
        <Heart 
          className={`${
            sizeClasses[size]
          } transition-all duration-200 ${
            isLiked ? 'fill-white text-white' : 'fill-transparent text-gray-700'
          }`}
        />
      )}
      
      <span>
        {isLiked ? 'Liked' : 'Like'}
        {showCount && likeCount > 0 && (
          <span className="ml-1">({formatCount(likeCount)})</span>
        )}
      </span>
    </motion.button>
  );
};

// Simple like count display (read-only)
export const LikeCount: React.FC<{
  toolId: string;
  className?: string;
}> = ({ toolId, className = '' }) => {
  const { likeCount: rawLikeCount } = useLikes(toolId);
  
  // Safe fallback for undefined values
  const likeCount = rawLikeCount ?? 0;
  
  // Debug logging for invalid states
  React.useEffect(() => {
    if (!toolId) {
      console.warn('LikeCount: toolId is missing or invalid:', toolId);
    }
    if (rawLikeCount === undefined || rawLikeCount === null) {
      console.warn('LikeCount: likeCount is undefined for toolId:', toolId);
    }
  }, [toolId, rawLikeCount]);

  if (likeCount === 0) return null;

  const formatCount = (count: number) => {
    if (typeof count !== 'number' || isNaN(count)) {
      return '0';
    }
    return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString();
  };

  return (
    <div className={`flex items-center gap-1 text-gray-500 ${className}`}>
      <Heart className="w-4 h-4 fill-gray-400" />
      <span className="text-sm">
        {formatCount(likeCount)}
      </span>
    </div>
  );
};

export default LikeButton;