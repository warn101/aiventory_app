import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { performanceDiagnostics, usePerformanceMonitor } from '../utils/performanceDiagnostics';

interface DashboardProps {
  user: User;
  tools: Tool[];
  onToolClick: (toolId: string) => void;
}

// Memoized components for better performance
const MemoizedToolCard = React.memo(ToolCard, (prevProps, nextProps) => {
  return (
    prevProps.tool.id === nextProps.tool.id &&
    prevProps.isBookmarked === nextProps.isBookmarked
  );
});

const LoadingSkeleton = React.memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    ))}
  </div>
));

const StatCard = React.memo(({ stat }: { stat: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-md p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
      </div>
      <div className={`p-3 rounded-full bg-gray-100`}>
        <stat.icon className={`h-6 w-6 ${stat.color}`} />
      </div>
    </div>
  </motion.div>
));

const FilterDropdown = React.memo(({ 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters, 
  hasActiveFilters 
}: {
  filters: any;
  setFilters: (filters: any) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;
}) => (
  <div className="relative filter-dropdown">
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
        hasActiveFilters
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Filter className="h-4 w-4" />
      <span>Filters</span>
      {hasActiveFilters && (
        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          !
        </span>
      )}
      <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
    </button>

    {showFilters && (
      <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="productivity">Productivity</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Writing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
            <select
              value={filters.pricing}
              onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pricing</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating: {filters.rating}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={filters.featured}
              onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured tools only
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => {
                setFilters({
                  category: 'all',
                  pricing: 'all',
                  rating: 0,
                  featured: false
                });
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
));

const DashboardOptimized: React.FC<DashboardProps> = ({ user, tools, onToolClick }) => {
  // Performance monitoring
  const { renderCount } = usePerformanceMonitor('Dashboard', [user.id]);
  
  // State management
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reviews' | 'activity'>('bookmarks');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    pricing: 'all',
    rating: 0,
    featured: false
  });

  // Use optimized bookmark context (no additional fetching needed)
  const { 
    bookmarkedTools: bookmarkedToolIds, 
    loading: bookmarkLoading, 
    bookmarksWithTools,
    refreshBookmarks,
    loadMoreBookmarks,
    hasMoreBookmarks
  } = useBookmarkContext();

  // Memoized computations
  const hasActiveFilters = useMemo(() => 
    filters.category !== 'all' || 
    filters.pricing !== 'all' || 
    filters.rating > 0 || 
    filters.featured,
    [filters]
  );

  const filteredBookmarks = useMemo(() => {
    if (!bookmarksWithTools) return [];
    
    return bookmarksWithTools.filter(tool => {
      // Null checks
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
      if (filters.category !== 'all' && tool.category !== filters.category) {
        return false;
      }
      
      // Pricing filter
      if (filters.pricing !== 'all' && tool.pricing !== filters.pricing) {
        return false;
      }
      
      // Rating filter
      if (filters.rating > 0 && tool.rating < filters.rating) {
        return false;
      }
      
      // Featured filter
      if (filters.featured && !tool.featured) {
        return false;
      }
      
      return true;
    });
  }, [bookmarksWithTools, searchQuery, filters]);

  const stats = useMemo(() => [
    { 
      label: 'Bookmarked Tools', 
      value: bookmarkedToolIds.length.toString(), 
      icon: Bookmark, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Reviews Written', 
      value: user.reviews?.length.toString() || '0', 
      icon: MessageCircle, 
      color: 'text-green-600' 
    },
    { 
      label: 'Tools Liked', 
      value: '156', // This should come from a likes context
      icon: Heart, 
      color: 'text-red-600' 
    },
    { 
      label: 'Days Active', 
      value: '45', // This should be calculated from user creation date
      icon: Calendar, 
      color: 'text-purple-600' 
    },
  ], [bookmarkedToolIds.length, user.reviews?.length]);

  const recentActivity = useMemo(() => [
    { type: 'bookmark', tool: 'ChatGPT', date: '2024-01-15' },
    { type: 'review', tool: 'Midjourney', date: '2024-01-14' },
    { type: 'like', tool: 'GitHub Copilot', date: '2024-01-13' },
  ], []);

  // Event handlers
  const handleRefresh = useCallback(async (event?: React.MouseEvent) => {
    // Prevent any default behavior that might cause navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const measureId = performanceDiagnostics.startMeasure('dashboard-refresh');
    try {
      // Ensure we only refresh data without affecting navigation
      await refreshBookmarks();
      console.log('✅ Dashboard: Refresh completed successfully');
    } catch (error) {
      console.error('❌ Dashboard: Refresh failed:', error);
    } finally {
      performanceDiagnostics.endMeasure(measureId);
    }
  }, [refreshBookmarks]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilters && !target.closest('.filter-dropdown')) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Dashboard rendered ${renderCount} times for user ${user.id}`);
      console.log(`📊 Showing ${filteredBookmarks.length} of ${bookmarkedToolIds.length} bookmarks`);
    }
  }, [renderCount, user.id, filteredBookmarks.length, bookmarkedToolIds.length]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Manage your bookmarked AI tools and discover new ones.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
                { id: 'reviews', label: 'Reviews', icon: MessageCircle },
                { id: 'activity', label: 'Activity', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'bookmarks' && (
            <div>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search bookmarks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <FilterDropdown
                    filters={filters}
                    setFilters={setFilters}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    disabled={bookmarkLoading}
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {bookmarkLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  
                  <div className="flex border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookmarks Content */}
              {bookmarkLoading ? (
                <LoadingSkeleton />
              ) : filteredBookmarks.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {bookmarkedToolIds.length === 0 ? 'No bookmarks yet' : 'No bookmarks match your filters'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {bookmarkedToolIds.length === 0 
                      ? 'Start exploring AI tools and bookmark your favorites!' 
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setFilters({
                          category: 'all',
                          pricing: 'all',
                          rating: 0,
                          featured: false
                        });
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                  }>
                    {filteredBookmarks.map((tool) => (
                      <MemoizedToolCard
                        key={tool.id}
                        tool={tool}
                        onClick={() => onToolClick(tool.id)}
                        isBookmarked={true}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                  {hasMoreBookmarks && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadMoreBookmarks}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Coming Soon</h3>
              <p className="text-gray-600">Your reviews and ratings will appear here.</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'bookmark' && <Bookmark className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'review' && <MessageCircle className="h-5 w-5 text-green-600" />}
                      {activity.type === 'like' && <Heart className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        You {activity.type === 'bookmark' ? 'bookmarked' : activity.type === 'review' ? 'reviewed' : 'liked'} <span className="font-medium">{activity.tool}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardOptimized;
