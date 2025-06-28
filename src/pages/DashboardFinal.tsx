import React, { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Bookmark, 
  TrendingUp, 
  Users, 
  Zap,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useDashboardOptimized from '../hooks/useDashboardOptimized';
import { DashboardSuspense, SkeletonStats } from '../components/DashboardSuspense';
import { usePerformanceMonitor } from '../utils/performanceDiagnostics';
import type { Tool } from '../types';

// Lazy load heavy components
const ToolCard = lazy(() => import('../components/ToolCard'));

// Memoized components for performance
const MemoizedToolCard = React.memo(({ tool, onBookmarkToggle }: { 
  tool: Tool; 
  onBookmarkToggle: (toolId: string, isBookmarked: boolean) => void;
}) => (
  <Suspense fallback={<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />}>
    <ToolCard 
      tool={tool} 
      onBookmarkToggle={onBookmarkToggle}
    />
  </Suspense>
));

const StatCard = React.memo(({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  color = 'blue' 
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  change?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {change}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      </div>
    </motion.div>
  );
});

const FilterButton = React.memo(({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
));

const PerformanceIndicator = React.memo(({ 
  metrics, 
  isOptimal 
}: { 
  metrics: { loadTime: number; cacheHits: number; apiCalls: number };
  isOptimal: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`fixed top-4 right-4 px-3 py-2 rounded-full text-sm font-medium shadow-lg z-50 ${
      isOptimal
        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      <Zap className="w-4 h-4" />
      <span>{metrics.loadTime.toFixed(0)}ms</span>
      {metrics.cacheHits > 0 && (
        <span className="text-xs opacity-75">({metrics.cacheHits} cached)</span>
      )}
    </div>
  </motion.div>
));

interface DashboardFinalProps {
  enablePerformanceMonitoring?: boolean;
  enableAdvancedCaching?: boolean;
  showPerformancePanel?: boolean;
}

const DashboardFinal: React.FC<DashboardFinalProps> = ({
  enablePerformanceMonitoring = true,
  enableAdvancedCaching = true,
  showPerformancePanel = false
}) => {
  const { user } = useAuth();
  const performanceMonitor = usePerformanceMonitor('dashboard');
  
  // Use optimized dashboard hook
  const {
    data,
    bookmarkedTools,
    stats,
    loading,
    error,
    refreshData,
    performanceMetrics,
    performanceReport,
    updateBookmarkOptimistic,
    isDataStale,
    hasData,
    isEmpty
  } = useDashboardOptimized({
    enableCaching: enableAdvancedCaching,
    enablePerformanceMonitoring,
    preloadData: true
  });

  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'rating'>('recent');
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(12); // Initial number of tools to display
  const LOAD_MORE_INCREMENT = 12; // Number of tools to load each time

  // Memoized filtered and sorted tools (all tools)
  const allFilteredAndSortedTools = useMemo(() => {
    if (!bookmarkedTools) return [];

    let filtered = bookmarkedTools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort tools
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return filtered;
  }, [bookmarkedTools, searchQuery, selectedCategory, sortBy]);

  // Tools to display (with pagination)
  const displayedTools = useMemo(() => {
    return allFilteredAndSortedTools.slice(0, displayedCount);
  }, [allFilteredAndSortedTools, displayedCount]);

  // Check if there are more tools to load
  const hasMoreTools = allFilteredAndSortedTools.length > displayedCount;

  // Load more function
  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + LOAD_MORE_INCREMENT);
  };

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchQuery, selectedCategory, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!bookmarkedTools) return [];
    const cats = [...new Set(bookmarkedTools.map(tool => tool.category).filter(Boolean))];
    return ['all', ...cats];
  }, [bookmarkedTools]);

  // Handle bookmark toggle with optimistic updates
  const handleBookmarkToggle = useCallback((toolId: string, isBookmarked: boolean) => {
    updateBookmarkOptimistic(toolId, isBookmarked);
  }, [updateBookmarkOptimistic]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Loading state
  if (loading && !hasData) {
    return (
      <DashboardSuspense 
        showPerformanceMonitor={enablePerformanceMonitoring}
        performanceMetrics={performanceMetrics}
      >
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <SkeletonStats />
        </div>
      </DashboardSuspense>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardSuspense 
      showPerformanceMonitor={enablePerformanceMonitoring}
      performanceMetrics={performanceMetrics}
      onRetry={handleRefresh}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your bookmarked AI tools and discover new ones
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {isDataStale && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Data is stale</span>
                  </motion.button>
                )}
                
                <button
                  onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Performance Indicator */}
          {enablePerformanceMonitoring && performanceReport && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Performance: {performanceReport.isOptimal ? 'Optimal' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <StatCard
                icon={Bookmark}
                title="Bookmarked Tools"
                value={stats.totalBookmarks}
                color="blue"
              />
              <StatCard
                icon={Star}
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                title="Reviews Written"
                value={stats.totalReviews}
                color="purple"
              />
            </motion.div>
          )}

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookmarked tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'rating')}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                </select>

                {/* View Mode */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Panel */}
          {showPerformancePanel && showPerformanceDetails && performanceMetrics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performance Metrics
                </h3>
                <button
                  onClick={() => setShowPerformanceDetails(false)}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Load Time:</span>
                  <span className="ml-2 font-medium">{performanceMetrics.loadTime.toFixed(0)}ms</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
                  <span className="ml-2 font-medium">{performanceMetrics.cacheHits}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
                  <span className="ml-2 font-medium">{performanceMetrics.apiCalls}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tools Grid/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isEmpty ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No bookmarked tools yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start exploring and bookmark your favorite AI tools
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Explore Tools
                </button>
              </div>
            ) : allFilteredAndSortedTools.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tools found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <div className={`${
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }`}>
                  <AnimatePresence mode="popLayout">
                    {displayedTools.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <MemoizedToolCard
                          tool={tool}
                          onBookmarkToggle={handleBookmarkToggle}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Load More Button */}
                {hasMoreTools && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mt-8"
                  >
                    <button
                      onClick={handleLoadMore}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Load More ({allFilteredAndSortedTools.length - displayedCount} remaining)
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardSuspense>
  );
};

export default DashboardFinal;