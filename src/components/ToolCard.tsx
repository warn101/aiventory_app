import React, { useState, useEffect } from 'react';
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
import { useBookmarks } from '../hooks/useBookmarks';

interface ToolCardProps {
  tool: Tool;
  onToolClick?: (toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onToolClick }) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

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
    if (onToolClick) {
      onToolClick(tool.id);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setBookmarkLoading(true);
    await toggleBookmark(tool.id);
    setBookmarkLoading(false);
  };

  const toolIsBookmarked = isBookmarked(tool.id);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image & Actions */}
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <img
            src={tool.image}
            alt={tool.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
                toolIsBookmarked 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white/80 text-gray-600 border-white/20 hover:bg-white'
              } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bookmark className="h-4 w-4" fill={toolIsBookmarked ? 'currentColor' : 'none'} />
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
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPricingBadge(tool.pricing)}`}>
            {tool.pricing.charAt(0).toUpperCase() + tool.pricing.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {tool.name}
          </h3>
          <div className="flex items-center space-x-1 text-sm">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="font-medium text-gray-900">{tool.rating}</span>
            <span className="text-gray-500">({formatNumber(tool.reviews)})</span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tool.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {tool.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
              +{tool.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(tool.addedDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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