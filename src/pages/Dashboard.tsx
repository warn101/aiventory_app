import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bookmark, 
  Star, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Heart,
  MessageCircle,
  Filter,
  Search,
  Grid,
  List,
  ChevronDown,
  X
} from 'lucide-react';
import { User, Tool } from '../types';
import ToolCard from '../components/ToolCard';


import ErrorBoundary from '../components/ErrorBoundary';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { db } from '../lib/supabase';

interface DashboardProps {
  user: User;
  tools: Tool[];
  onToolClick: (toolId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, tools, onToolClick }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reviews' | 'activity'>('bookmarks');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedTools, setBookmarkedTools] = useState<Tool[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    pricing: 'all',
    rating: 0,
    featured: false
  });

  const { bookmarkedTools: bookmarkedToolIds, loading: bookmarkHookLoading, getBookmarksWithTools } = useBookmarkContext();

  // Check if any filters are active
  const hasActiveFilters = filters.category !== 'all' || filters.pricing !== 'all' || filters.rating > 0 || filters.featured;

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilters && !target.closest('.filter-dropdown')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  // Load full tool data for bookmarked tools
  useEffect(() => {
    const loadBookmarkedTools = async () => {
      if (!user) {
        setBookmarkedTools([]);
        return;
      }

      try {
        setBookmarksLoading(true);
  
        
        const { data, error } = await db.getBookmarks(user.id);
        
        if (error) {
          console.error('❌ Dashboard: Bookmark loading failed:', error);
          setBookmarkedTools([]);
          return;
        }
        
        if (!data || data.length === 0) {
  
          setBookmarkedTools([]);
          return;
        }
        
        // Filter out bookmarks without tools data
        const validBookmarks = data.filter(bookmark => bookmark.tools);
        
        if (validBookmarks.length !== data.length) {
          console.warn('⚠️ Dashboard: Some bookmarks missing tool data:', {
            total: data.length,
            valid: validBookmarks.length,
            missing: data.length - validBookmarks.length
          });
        }
        
        // Transform the tools data
        const formattedTools = validBookmarks.map(bookmark => {
          // Handle case where tools might be an array or object
          const tool = Array.isArray(bookmark.tools) ? bookmark.tools[0] : bookmark.tools;
          
          return {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            pricing: tool.pricing,
            rating: tool.rating,
            reviews: tool.reviews_count || 0,
            tags: tool.tags || [],
            image: '/placeholder-tool.png', // Using placeholder since image_url removed from schema
            url: tool.website_url || '',
            featured: tool.featured || false,
            verified: tool.verified || false,
            addedDate: tool.created_at,
            lastUpdated: tool.updated_at
          };
        }) as Tool[];
        
        setBookmarkedTools(formattedTools);
  
        
      } catch (error) {
        console.error('💥 Dashboard: Exception loading bookmarks:', error);
        setBookmarkedTools([]);
      } finally {
        setBookmarksLoading(false);
      }
    };

    loadBookmarkedTools();

    // Listen for bookmark changes
    const handleBookmarkChange = () => {

      loadBookmarkedTools();
    };

    window.addEventListener('bookmarksChanged', handleBookmarkChange);
    
    return () => {
      window.removeEventListener('bookmarksChanged', handleBookmarkChange);
    };
  }, [user]);
  const recentActivity = [
    { type: 'bookmark', tool: 'ChatGPT', date: '2024-01-15' },
    { type: 'review', tool: 'Midjourney', date: '2024-01-14' },
    { type: 'like', tool: 'GitHub Copilot', date: '2024-01-13' },
  ];

  const stats = [
    { label: 'Bookmarked Tools', value: bookmarkedTools.length.toString(), icon: Bookmark, color: 'text-blue-600' },
    { label: 'Reviews Written', value: user.reviews?.length.toString() || '0', icon: MessageCircle, color: 'text-green-600' },
    { label: 'Tools Liked', value: '156', icon: Heart, color: 'text-red-600' },
    { label: 'Days Active', value: '45', icon: Calendar, color: 'text-purple-600' },
  ];

  const isLoading = bookmarksLoading || bookmarkHookLoading;
  const filteredBookmarks = bookmarkedTools.filter(tool => {
    // Add null checks to prevent crashes during filtering
    if (!tool || !tool.name) return false;
    
    // Search filter
    if (searchQuery) {
      const name = tool.name.toLowerCase();
      const description = (tool.description || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      
      if (!name.includes(query) && !description.includes(query)) {
        return false;
      }
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all' && tool.category !== filters.category) {
      return false;
    }
    
    // Pricing filter
    if (filters.pricing && filters.pricing !== 'all' && tool.pricing !== filters.pricing) {
      return false;
    }
    
    // Rating filter
    if (filters.rating && filters.rating > 0 && tool.rating < filters.rating) {
      return false;
    }
    
    // Featured filter
    if (filters.featured && !tool.featured) {
      return false;
    }
    
    return true;
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">Manage your AI tool collection and activity</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>



        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'bookmarks', label: 'Bookmarked Tools', icon: Bookmark },
                { id: 'reviews', label: 'My Reviews', icon: MessageCircle },
                { id: 'activity', label: 'Recent Activity', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookmarks' && (
              <div>

                
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search bookmarked tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative filter-dropdown">
                      <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors relative ${
                          showFilters || hasActiveFilters
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`} 
                        disabled={isLoading}
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filter</span>
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary-600 rounded-full"></span>
                        )}
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          showFilters ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {/* Filter Dropdown */}
                      {showFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[300px]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Filter Bookmarks</h3>
                            <button
                              onClick={() => setShowFilters(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Category Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                              <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="all">All Categories</option>
                                <option value="text-generation">Text Generation</option>
                                <option value="image-generation">Image Generation</option>
                                <option value="developer-tools">Developer Tools</option>
                                <option value="productivity">Productivity</option>
                                <option value="video-editing">Video Editing</option>
                                <option value="audio-tools">Audio Tools</option>
                                <option value="data-analysis">Data Analysis</option>
                                <option value="design-tools">Design Tools</option>
                              </select>
                            </div>
                            
                            {/* Pricing Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
                              <select
                                value={filters.pricing}
                                onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="all">All Pricing</option>
                                <option value="free">Free</option>
                                <option value="freemium">Freemium</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>
                            
                            {/* Rating Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                              <select
                                value={filters.rating}
                                onChange={(e) => setFilters({ ...filters, rating: Number(e.target.value) })}
                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value={0}>All Ratings</option>
                                <option value={4}>4+ Stars</option>
                                <option value={4.5}>4.5+ Stars</option>
                                <option value={4.8}>4.8+ Stars</option>
                              </select>
                            </div>
                            
                            {/* Featured Filter */}
                            <div>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={filters.featured}
                                  onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Featured tools only</span>
                              </label>
                            </div>
                            
                            {/* Clear Filters */}
                            <div className="pt-2 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  setFilters({
                                    category: 'all',
                                    pricing: 'all',
                                    rating: 0,
                                    featured: false
                                  });
                                }}
                                className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                              >
                                Clear All Filters
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        disabled={isLoading}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        disabled={isLoading}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Loading your bookmarks...</span>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredBookmarks.length === 0 && bookmarkedTools.length === 0 && (
                  <div className="text-center py-12">
                    <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
                    <p className="text-gray-600 mb-4">Start bookmarking tools you find interesting!</p>
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Explore Tools
                    </button>
                  </div>
                )}

                {/* No Search Results */}
                {!isLoading && filteredBookmarks.length === 0 && bookmarkedTools.length > 0 && searchQuery && (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms</p>
                  </div>
                )}

                {/* Bookmarked Tools */}
                {!isLoading && filteredBookmarks.length > 0 && (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBookmarks.map((tool, index) => {
                        // Add null check to prevent crashes
                        if (!tool || !tool.id || !tool.name) {
                          console.warn('⚠️ Dashboard: Skipping invalid tool data:', tool);
                          return null;
                        }
                        
                        return (
                          <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <ToolCard tool={tool} onToolClick={onToolClick} />
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookmarks.map((tool, index) => {
                        // Add null check to prevent crashes
                        if (!tool || !tool.id || !tool.name) {
                          console.warn('⚠️ Dashboard: Skipping invalid tool data in list view:', tool);
                          return null;
                        }
                        
                        return (
                          <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => onToolClick(tool.id)}
                          >
                            <img
                              src={tool.image || 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400'}
                              alt={tool.name || 'Tool'}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-1">{tool.description || 'No description available'}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span>{tool.rating || 0}</span>
                                </div>
                                <span className="capitalize">{tool.pricing || 'unknown'}</span>
                              </div>
                            </div>
                            <Bookmark className="h-5 w-5 text-primary-600 fill-current" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Reviews</h3>
                <p className="text-gray-600">Reviews you've written will appear here.</p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.type === 'bookmark' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'review' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {activity.type === 'bookmark' && <Bookmark className="h-4 w-4" />}
                      {activity.type === 'review' && <MessageCircle className="h-4 w-4" />}
                      {activity.type === 'like' && <Heart className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">
                        You {activity.type === 'bookmark' ? 'bookmarked' : activity.type === 'review' ? 'reviewed' : 'liked'} <span className="font-semibold">{activity.tool}</span>
                      </p>
                      <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      

      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;