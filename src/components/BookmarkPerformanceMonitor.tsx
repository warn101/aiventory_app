import React, { useState, useEffect } from 'react';
import { useBookmarkContext } from '../contexts/BookmarkContext';

interface PerformanceMetrics {
  fetchCount: number;
  lastFetchTime: number;
  cacheHits: number;
  cacheMisses: number;
  averageLoadTime: number;
  totalLoadTime: number;
}

const BookmarkPerformanceMonitor: React.FC<{ showDetails?: boolean }> = ({ 
  showDetails = false 
}) => {
  const { loading, initialized, bookmarkedTools } = useBookmarkContext();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fetchCount: 0,
    lastFetchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLoadTime: 0,
    totalLoadTime: 0
  });
  const [startTime, setStartTime] = useState<number | null>(null);

  // Monitor loading state changes
  useEffect(() => {
    if (loading && !startTime) {
      setStartTime(Date.now());
    } else if (!loading && startTime) {
      const loadTime = Date.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        fetchCount: prev.fetchCount + 1,
        lastFetchTime: loadTime,
        totalLoadTime: prev.totalLoadTime + loadTime,
        averageLoadTime: (prev.totalLoadTime + loadTime) / (prev.fetchCount + 1)
      }));
      setStartTime(null);
    }
  }, [loading, startTime]);

  // Listen for cache events
  useEffect(() => {
    const handleCacheHit = () => {
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
    };

    const handleCacheMiss = () => {
      setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
    };

    // Listen for console logs to detect cache usage
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('📦 Bookmark: Using cached data')) {
        handleCacheHit();
      } else if (message.includes('🚀 Bookmark: Fetching fresh data')) {
        handleCacheMiss();
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm z-50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            loading ? 'bg-yellow-400 animate-pulse' : 
            initialized ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          <span>
            {loading ? 'Loading...' : 
             initialized ? `${bookmarkedTools.length} bookmarks` : 'Not loaded'}
          </span>
          {metrics.lastFetchTime > 0 && (
            <span className="text-gray-300">({metrics.lastFetchTime}ms)</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm z-50 min-w-64">
      <h3 className="font-semibold mb-2 text-blue-400">📊 Bookmark Performance</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${
            loading ? 'text-yellow-400' : 
            initialized ? 'text-green-400' : 'text-gray-400'
          }`}>
            {loading ? 'Loading' : initialized ? 'Ready' : 'Not loaded'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Bookmarks:</span>
          <span className="font-medium text-blue-300">{bookmarkedTools.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Fetch Count:</span>
          <span className="font-medium">{metrics.fetchCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hits:</span>
          <span className="font-medium text-green-300">{metrics.cacheHits}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Misses:</span>
          <span className="font-medium text-red-300">{metrics.cacheMisses}</span>
        </div>
        
        {metrics.lastFetchTime > 0 && (
          <div className="flex justify-between">
            <span>Last Load:</span>
            <span className="font-medium">{metrics.lastFetchTime}ms</span>
          </div>
        )}
        
        {metrics.averageLoadTime > 0 && (
          <div className="flex justify-between">
            <span>Avg Load:</span>
            <span className="font-medium">{Math.round(metrics.averageLoadTime)}ms</span>
          </div>
        )}
        
        {metrics.cacheHits + metrics.cacheMisses > 0 && (
          <div className="flex justify-between">
            <span>Cache Rate:</span>
            <span className="font-medium text-green-300">
              {Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          💡 Tip: Cache hits = instant loading
        </div>
      </div>
    </div>
  );
};

export default BookmarkPerformanceMonitor;