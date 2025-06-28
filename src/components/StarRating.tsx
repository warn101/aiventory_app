import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const displayRating = isHovering ? hoverRating : rating;
  const isInteractive = !readonly && onRatingChange;

  const handleStarClick = (starRating: number) => {
    if (isInteractive) {
      onRatingChange!(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (isInteractive) {
      setHoverRating(starRating);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setIsHovering(false);
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className={`flex items-center gap-0.5 ${
          isInteractive ? 'cursor-pointer' : 'cursor-default'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const isFilled = starNumber <= displayRating;
          const isPartiallyFilled = 
            !Number.isInteger(displayRating) && 
            starNumber === Math.ceil(displayRating) && 
            starNumber > displayRating;

          return (
            <motion.div
              key={starNumber}
              className="relative"
              whileHover={isInteractive ? { scale: 1.1 } : {}}
              whileTap={isInteractive ? { scale: 0.95 } : {}}
              transition={{ duration: 0.1 }}
            >
              <Star
                className={`${
                  sizeClasses[size]
                } transition-colors duration-150 ${
                  isInteractive ? 'hover:text-yellow-400' : ''
                } ${
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 fill-transparent'
                }`}
                onClick={() => handleStarClick(starNumber)}
                onMouseEnter={() => handleStarHover(starNumber)}
              />
              
              {/* Partial fill for non-integer ratings */}
              {isPartiallyFilled && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ 
                    width: `${(displayRating - Math.floor(displayRating)) * 100}%` 
                  }}
                >
                  <Star
                    className={`${
                      sizeClasses[size]
                    } text-yellow-400 fill-yellow-400`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
      
      {isInteractive && isHovering && (
        <span className="text-sm text-gray-500 ml-2">
          {hoverRating} star{hoverRating !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

// Compact star rating for tool cards
export const CompactStarRating: React.FC<{
  rating: number;
  reviewCount?: number;
  className?: string;
}> = ({ rating, reviewCount, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const isFilled = starNumber <= rating;
          const isPartiallyFilled = 
            !Number.isInteger(rating) && 
            starNumber === Math.ceil(rating) && 
            starNumber > rating;

          return (
            <div key={starNumber} className="relative">
              <Star
                className={`w-3 h-3 ${
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 fill-transparent'
                }`}
              />
              
              {/* Partial fill for non-integer ratings */}
              {isPartiallyFilled && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ 
                    width: `${(rating - Math.floor(rating)) * 100}%` 
                  }}
                >
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <span className="text-xs text-gray-600">
        {rating > 0 ? rating.toFixed(1) : '0.0'}
        {reviewCount !== undefined && (
          <span className="text-gray-400 ml-1">({reviewCount})</span>
        )}
      </span>
    </div>
  );
};

export default StarRating;