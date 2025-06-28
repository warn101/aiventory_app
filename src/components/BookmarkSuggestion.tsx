import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, Sparkles, TrendingUp, Target, Star } from 'lucide-react';
import { Tool } from '../types';
import { useBookmarkSuggestion } from '../hooks/useBookmarkSuggestion';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { useAuth } from '../hooks/useAuth';
import { BookmarkSuggestion as BookmarkSuggestionType } from '../utils/bookmarkSuggestion';

interface BookmarkSuggestionProps {
  tool: Tool;
  className?: string;
  variant?: 'card' | 'inline' | 'tooltip';
  showOnlyWhenSuggested?: boolean;
}

const BookmarkSuggestion: React.FC<BookmarkSuggestionProps> = ({
  tool,
  className = '',
  variant = 'card',
  showOnlyWhenSuggested = true
}) => {
  const { user } = useAuth();
  const { getSuggestionSync } = useBookmarkSuggestion();
  const { isBookmarked, toggleBookmark } = useBookmarkContext();
  const [suggestion, setSuggestion] = useState<BookmarkSuggestionType | null>(null);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Get suggestion when component mounts or tool changes
  useEffect(() => {
    if (user && tool) {
      const suggestionResult = getSuggestionSync(tool);
      setSuggestion(suggestionResult);
      
      if (showOnlyWhenSuggested) {
        setShowSuggestion(suggestionResult.shouldSuggest);
      } else {
        setShowSuggestion(true);
      }
    } else {
      setSuggestion(null);
      setShowSuggestion(false);
    }
  }, [user, tool, getSuggestionSync, showOnlyWhenSuggested]);

  const handleBookmark = async () => {
    if (!user || isBookmarking) return;
    
    setIsBookmarking(true);
    try {
      const result = await toggleBookmark(tool.id);
      
      // Handle already exists case
      if (result?.alreadyExists) {
  
        // Still hide suggestion since user attempted to bookmark
        if (suggestion?.shouldSuggest) {
          setShowSuggestion(false);
        }
        return;
      }
      
      // Hide suggestion after successful bookmark
      if (suggestion?.shouldSuggest) {
        setShowSuggestion(false);
      }
    } catch (error) {
      console.error('Error bookmarking tool:', error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const getIcon = () => {
    if (!suggestion) return <Bookmark className="h-4 w-4" />;
    
    const { reasons } = suggestion;
    const firstReason = reasons[0] || '';
    
    if (firstReason.includes('trending')) {
      return <TrendingUp className="h-4 w-4" />;
    } else if (firstReason.includes('category') || firstReason.includes('Similar')) {
      return <Target className="h-4 w-4" />;
    } else if (firstReason.includes('rating')) {
      return <Star className="h-4 w-4" />;
    } else {
      return <Sparkles className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'from-green-500 to-emerald-600';
    if (confidence >= 0.6) return 'from-blue-500 to-cyan-600';
    if (confidence >= 0.4) return 'from-yellow-500 to-orange-600';
    return 'from-gray-500 to-gray-600';
  };

  if (!suggestion || !showSuggestion || !user) {
    return null;
  }

  const isToolBookmarked = isBookmarked(tool.id);

  // Card variant - full suggestion card
  if (variant === 'card') {
    return (
      <AnimatePresence>
        {showSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-r ${getConfidenceColor(suggestion.confidence)} p-4 rounded-xl text-white shadow-lg ${className}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon()}
                  <span className="font-semibold text-sm opacity-90">
                    Bookmark Suggestion
                  </span>
                  <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    {Math.round(suggestion.confidence * 100)}% match
                  </div>
                </div>
                
                <p className="text-sm mb-3 leading-relaxed">
                  {suggestion.message}
                </p>
                
                {suggestion.reasons.length > 1 && (
                  <div className="text-xs opacity-80 mb-3">
                    <span className="font-medium">Why: </span>
                    {suggestion.reasons.slice(1, 3).join(' • ')}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleBookmark}
                disabled={isBookmarking || isToolBookmarked}
                className="ml-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 p-2 rounded-lg flex items-center gap-1 text-sm font-medium"
              >
                {isBookmarking ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : isToolBookmarked ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isToolBookmarked ? 'Saved' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant - compact suggestion
  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {showSuggestion && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`flex items-center gap-2 text-sm ${className}`}
          >
            <div className={`bg-gradient-to-r ${getConfidenceColor(suggestion.confidence)} p-1 rounded-full`}>
              {getIcon()}
            </div>
            <span className="text-gray-700 flex-1">{suggestion.message}</span>
            <button
              onClick={handleBookmark}
              disabled={isBookmarking || isToolBookmarked}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isBookmarking ? 'Saving...' : isToolBookmarked ? 'Saved' : 'Save'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Tooltip variant - minimal suggestion
  if (variant === 'tooltip') {
    return (
      <AnimatePresence>
        {showSuggestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-0 right-0 bg-gradient-to-r ${getConfidenceColor(suggestion.confidence)} text-white p-2 rounded-lg shadow-lg z-10 max-w-xs ${className}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getIcon()}
              <span className="text-xs font-semibold">Suggested for you</span>
            </div>
            <p className="text-xs leading-relaxed">{suggestion.message}</p>
            <button
              onClick={handleBookmark}
              disabled={isBookmarking || isToolBookmarked}
              className="mt-2 w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 py-1 px-2 rounded text-xs font-medium"
            >
              {isBookmarking ? 'Saving...' : isToolBookmarked ? 'Saved' : 'Bookmark'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
};

export default BookmarkSuggestion;