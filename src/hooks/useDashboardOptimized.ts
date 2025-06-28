import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { db, batchOps } from '../lib/supabaseOptimized';
import { performanceDiagnostics } from '../utils/performanceDiagnostics';
import type { Tool } from '../types';

interface DashboardData {
  bookmarkedTools: Tool[];
  userProfile: any;
  userReviews: any[];
  stats: {
    totalBookmarks: number;
    totalReviews: number;
    averageRating: number;
  };
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  performanceMetrics: {
    loadTime: number;
    cacheHits: number;
    apiCalls: number;
  };
}

interface UseDashboardOptimizedOptions {
  enableCaching?: boolean;
  enablePerformanceMonitoring?: boolean;
  refreshInterval?: number;
  preloadData?: boolean;
}

const CACHE_KEY_PROFILE = 'dashboard_profile_data';
const CACHE_KEY_BOOKMARKS = 'dashboard_bookmarks_data';
const CACHE_KEY_REVIEWS = 'dashboard_reviews_data';
const CACHE_DURATION_PROFILE = 30 * 60 * 1000; // 30 minutes for profile
const CACHE_DURATION_BOOKMARKS = 5 * 60 * 1000; // 5 minutes for bookmarks
const CACHE_DURATION_REVIEWS = 10 * 60 * 1000; // 10 minutes for reviews

export function useDashboardOptimized(options: UseDashboardOptimizedOptions = {}) {
  const {
    enableCaching = true,
    enablePerformanceMonitoring = true,
    refreshInterval = 0,
    preloadData = true
  } = options;

  const { user } = useAuth();
  const { bookmarks, loading: bookmarksLoading, refreshBookmarks } = useBookmarkContext();
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    performanceMetrics: {
      loadTime: 0,
      cacheHits: 0,
      apiCalls: 0
    }
  });

  const diagnostics = useMemo(() => 
    enablePerformanceMonitoring ? performanceDiagnostics : null, 
    [enablePerformanceMonitoring]
  );

  // Cache management for profile
  const getCachedProfile = useCallback((): any | null => {
    if (!enableCaching) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY_PROFILE);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION_PROFILE;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY_PROFILE);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to parse cached profile data:', error);
      localStorage.removeItem(CACHE_KEY_PROFILE);
      return null;
    }
  }, [enableCaching]);

  const setCachedProfile = useCallback((data: any) => {
    if (!enableCaching) return;
    
    try {
      localStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache profile data:', error);
    }
  }, [enableCaching]);

  // Cache management for bookmarks
  const getCachedBookmarks = useCallback((): Tool[] | null => {
    if (!enableCaching) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY_BOOKMARKS);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION_BOOKMARKS;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY_BOOKMARKS);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to parse cached bookmarks data:', error);
      localStorage.removeItem(CACHE_KEY_BOOKMARKS);
      return null;
    }
  }, [enableCaching]);

  const setCachedBookmarks = useCallback((data: Tool[]) => {
    if (!enableCaching) return;
    
    try {
      localStorage.setItem(CACHE_KEY_BOOKMARKS, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache bookmarks data:', error);
    }
  }, [enableCaching]);

  // Cache management for reviews
  const getCachedReviews = useCallback((): any[] | null => {
    if (!enableCaching) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY_REVIEWS);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION_REVIEWS;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY_REVIEWS);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to parse cached reviews data:', error);
      localStorage.removeItem(CACHE_KEY_REVIEWS);
      return null;
    }
  }, [enableCaching]);

  const setCachedReviews = useCallback((data: any[]) => {
    if (!enableCaching) return;
    
    try {
      localStorage.setItem(CACHE_KEY_REVIEWS, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache reviews data:', error);
    }
  }, [enableCaching]);

  // Load dashboard data with performance monitoring
  const loadDashboardData = useCallback(async (useCache = true): Promise<void> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    const startTime = performance.now();
    let cacheHits = 0;
    let apiCalls = 0;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Try cache first for profile data (longer cache duration)
      let profile = useCache ? getCachedProfile() : null;
      let bookmarks: Tool[] | null = useCache ? getCachedBookmarks() : null;
      let reviews: any[] | null = useCache ? getCachedReviews() : null;

      if (profile && bookmarks && reviews) {
        if (diagnostics) {
          diagnostics.startMeasure('dashboard_cache_hit');
        }
        cacheHits += 3;
        const finalData: DashboardData = {
          bookmarkedTools: bookmarks,
          userProfile: profile,
          userReviews: reviews,
          stats: {
            totalBookmarks: bookmarks.length,
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
              ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
              : 0
          }
        };
        setState(prev => ({
          ...prev,
          data: finalData,
          loading: false,
          lastUpdated: new Date(),
          performanceMetrics: {
            loadTime: performance.now() - startTime,
            cacheHits,
            apiCalls
          }
        }));
        
        if (diagnostics) {
          diagnostics.endMeasure('dashboard_cache_hit');
        }
        return;
      }

      // Load fresh data using the existing batch operation
      if (diagnostics) {
        diagnostics.startMeasure('dashboard_load', { queryType: 'SELECT', table: 'dashboard' });
      }

      // Use the batch operations directly from the imported batchOps
      const dashboardData = await batchOps.loadDashboardData(user.id);
      apiCalls++;

      if (diagnostics) {
        diagnostics.endMeasure('dashboard_load');
      }

      // Extract data from the result objects
      bookmarks = Array.isArray(dashboardData.bookmarks.data) ? dashboardData.bookmarks.data : [];
      reviews = Array.isArray(dashboardData.reviews.data) ? dashboardData.reviews.data : [];
      profile = dashboardData.profile.data;

      // Calculate stats
      const stats = {
        totalBookmarks: bookmarks.length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
          : 0
      };

      const finalData: DashboardData = {
        bookmarkedTools: bookmarks,
        userProfile: profile,
        userReviews: reviews,
        stats
      };

      // Cache the data separately
      setCachedProfile(profile);
      setCachedBookmarks(bookmarks);
      setCachedReviews(reviews);

      const loadTime = performance.now() - startTime;

      setState(prev => ({
        ...prev,
        data: finalData,
        loading: false,
        lastUpdated: new Date(),
        performanceMetrics: {
          loadTime,
          cacheHits,
          apiCalls
        }
      }));

      if (diagnostics) {
        diagnostics.startMeasure('dashboard_fresh_load');
        diagnostics.endMeasure('dashboard_fresh_load');
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));

      if (diagnostics) {
        diagnostics.startMeasure('dashboard_error');
        diagnostics.endMeasure('dashboard_error');
      }
    }
  }, [user?.id, getCachedProfile, getCachedBookmarks, getCachedReviews, setCachedProfile, setCachedBookmarks, setCachedReviews, diagnostics]);

  // Refresh data (bypass cache)
  const refreshData = useCallback(() => {
    return loadDashboardData(false);
  }, [loadDashboardData]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY_PROFILE);
    localStorage.removeItem(CACHE_KEY_BOOKMARKS);
    localStorage.removeItem(CACHE_KEY_REVIEWS);
  }, []);

  // Optimistic bookmark update
  const updateBookmarkOptimistic = useCallback((toolId: string, isBookmarked: boolean) => {
    setState(prev => {
      if (!prev.data) return prev;
      
      let updatedTools: Tool[];
      
      if (isBookmarked) {
        // Remove from bookmarks
        updatedTools = prev.data.bookmarkedTools.filter(tool => tool.id !== toolId);
      } else {
        // This would require the tool data, which we might not have
        // In practice, this should be handled by the BookmarkContext
        updatedTools = prev.data.bookmarkedTools;
      }
      
      return {
        ...prev,
        data: {
          ...prev.data,
          bookmarkedTools: updatedTools,
          stats: {
            ...prev.data.stats,
            totalBookmarks: updatedTools.length
          }
        }
      };
    });
    
    // Invalidate cache since data changed
    invalidateCache();
  }, [invalidateCache]);

  // Filter and search functionality
  const filteredTools = useMemo(() => {
    if (!state.data?.bookmarkedTools) return [];
    return state.data.bookmarkedTools;
  }, [state.data?.bookmarkedTools]);

  // Performance metrics
  const performanceReport = useMemo(() => {
    if (!diagnostics) return null;
    
    return {
      ...state.performanceMetrics,
      cacheHitRate: state.performanceMetrics.apiCalls > 0 
        ? (state.performanceMetrics.cacheHits / (state.performanceMetrics.cacheHits + state.performanceMetrics.apiCalls)) * 100
        : 0,
      isOptimal: state.performanceMetrics.loadTime < 100, // Under 100ms is optimal
      recommendations: [
        state.performanceMetrics.loadTime > 500 && 'Consider enabling caching',
        state.performanceMetrics.cacheHits === 0 && 'Cache not being utilized',
        state.performanceMetrics.apiCalls > 3 && 'Too many API calls, consider batching'
      ].filter(Boolean)
    };
  }, [state.performanceMetrics, diagnostics]);

  // Initial load
  useEffect(() => {
    if (user?.id && preloadData) {
      loadDashboardData();
    }
  }, [user?.id, preloadData, loadDashboardData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadDashboardData(false); // Bypass cache for auto-refresh
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadDashboardData]);

  // Sync with bookmark context changes
  useEffect(() => {
    if (!bookmarksLoading && state.data) {
      // Update local state when bookmarks change
      setState(prev => {
        if (!prev.data) return prev;
        
        return {
          ...prev,
          data: {
            ...prev.data,
            stats: {
              ...prev.data.stats,
              totalBookmarks: bookmarks.length
            }
          }
        };
      });
    }
  }, [bookmarks.length, bookmarksLoading, state.data]);

  return {
    // Data
    data: state.data,
    bookmarkedTools: filteredTools,
    userProfile: state.data?.userProfile,
    userReviews: state.data?.userReviews,
    stats: state.data?.stats,
    
    // State
    loading: state.loading || bookmarksLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Actions
    refreshData,
    invalidateCache,
    updateBookmarkOptimistic,
    
    // Performance
    performanceMetrics: state.performanceMetrics,
    performanceReport,
    
    // Utils
    isDataStale: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() > CACHE_DURATION_BOOKMARKS : true,
    hasData: !!state.data,
    isEmpty: state.data ? state.data.bookmarkedTools.length === 0 : false
  };
}

// Hook for performance monitoring only
export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    cacheEfficiency: 0
  });

  const measurePageLoad = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        pageLoadTime: endTime - startTime
      }));
    };
  }, []);

  const measureApiCall = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: endTime - startTime
      }));
    };
  }, []);

  const measureRender = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime
      }));
    };
  }, []);

  return {
    metrics,
    measurePageLoad,
    measureApiCall,
    measureRender
  };
}

export default useDashboardOptimized;
