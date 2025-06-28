import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Bookmark, 
  ExternalLink, 
  Shield, 
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Clock
} from 'lucide-react';
import { Tool } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { useLikes } from '../hooks/useLikes';
import { ReviewSummary } from './ReviewSummary';
import { LikeButton } from './LikeButton';

interface ToolCardProps {
  tool: Tool;
  onToolClick?: (toolId: string) => void;
  onBookmarkToggle?: (toolId: string, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
  onClick?: () => void;
  viewMode?: "grid" | "list";
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, 
  onToolClick, 
  onBookmarkToggle, 
  isBookmarked: propIsBookmarked, 
  onClick,
  viewMode
}) => {
  // Early return if tool data is invalid to prevent crashes
  if (!tool || !tool.id || !tool.name) {
    console.warn('⚠️ ToolCard: Invalid tool data received:', tool);
    return null;
  }

  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarkContext();
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showAlreadySaved, setShowAlreadySaved] = useState(false);

  const getPricingBadge = (pricing: string) => {
    const styles = {
      free: 'bg-green-100 text-green-800 border-green-200',
      freemium: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return styles[pricing as keyof typeof styles] || styles.free;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (onToolClick) {
      onToolClick(tool.id);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setBookmarkLoading(true);
    
    if (onBookmarkToggle) {
      // Use the provided callback
      const currentlyBookmarked = propIsBookmarked ?? isBookmarked(tool.id);
      onBookmarkToggle(tool.id, !currentlyBookmarked);
    } else {
      // Use the context method
      const result = await toggleBookmark(tool.id);
      
      // Show feedback for already bookmarked tools
      if (result?.alreadyExists) {
        setShowAlreadySaved(true);
        
        // Reset the feedback after 3 seconds
        setTimeout(() => {
          setShowAlreadySaved(false);
        }, 3000);
      }
    }
    
    setBookmarkLoading(false);
  };

  const toolIsBookmarked = propIsBookmarked ?? isBookmarked(tool.id);
  const isGridView = viewMode === "grid" || !viewMode;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer ${isGridView ? '' : 'flex flex-col md:flex-row'}`}
      onClick={handleCardClick}
    >
      {/* Image & Actions */}
      <div className={`relative ${isGridView ? '' : 'flex-shrink-0 w-full md:w-1/3'}`}>
        <div className={`${isGridView ? 'aspect-video' : 'h-full'} bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden`}>
          <img
            src={tool.image}
            alt={tool.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400';
            }}
          />
        </div>
        
        {/* Overlay Actions */}
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {user && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmarkClick}
              disabled={bookmarkLoading}
              className={`${showAlreadySaved ? 'px-3 py-2' : 'p-2'} rounded-full backdrop-blur-md border transition-all duration-300 ${
                showAlreadySaved
                  ? 'bg-green-500 text-white border-green-500'
                  : toolIsBookmarked 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'bg-white/80 text-gray-600 border-white/20 hover:bg-white'
              } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showAlreadySaved ? (
                <span className="text-xs font-medium whitespace-nowrap">Already saved!</span>
              ) : (
                <Bookmark className="h-4 w-4" fill={toolIsBookmarked ? 'currentColor' : 'none'} />
              )}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-white/80 text-gray-600 border border-white/20 backdrop-blur-md hover:bg-white transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {tool.featured && (
            <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium border border-yellow-200">
              <Sparkles className="h-3 w-3" />
              <span>Featured</span>
            </div>
          )}
          {tool.verified && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
              <Shield className="h-3 w-3" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* Pricing Badge */}
        <div className="absolute bottom-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPricingBadge(tool.pricing || 'free')}`}>
            {(tool.pricing || 'free').charAt(0).toUpperCase() + (tool.pricing || 'free').slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`${isGridView ? 'p-6' : 'p-4 flex-grow'}`}>
        <div className={`flex ${isGridView ? 'items-start' : 'items-center'} justify-between mb-3`}>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {tool.name}
          </h3>
          <ReviewSummary 
            toolId={tool.id} 
            variant="compact" 
            showReviewCount={true}
          />
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {tool.description || 'No description available'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(tool.tags || []).slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {(tool.tags || []).length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
              +{(tool.tags || []).length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{tool.addedDate ? new Date(tool.addedDate).toLocaleDateString() : 'Unknown date'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <LikeButton 
              toolId={tool.id}
              size="sm"
              variant="minimal"
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View reviews"
            >
              <MessageCircle className="h-4 w-4" />
            </motion.button>

            <motion.a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <span>Try Now</span>
              <ExternalLink className="h-3 w-3" />
            </motion.a>
          </div>
        </div>
      </div>
      

    </motion.div>
  );
};

export default ToolCard;
