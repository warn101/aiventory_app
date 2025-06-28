import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Zap, TrendingUp } from 'lucide-react';

// Loading skeleton components
const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}>
    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
  </div>
);

const SkeletonToolCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-12"></div>
        </div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </div>
    </div>
  </motion.div>
);

const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </motion.div>
    ))}
  </div>
);

const DashboardLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-96"></div>
        </div>
      </motion.div>

      {/* Stats Skeleton */}
      <SkeletonStats />

      {/* Filters Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-4 animate-pulse">
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-36"></div>
        </div>
      </motion.div>

      {/* Tools Grid Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonToolCard key={i} />
        ))}
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2"
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Loading dashboard...</span>
      </motion.div>
    </div>
  </div>
);

// Performance loading indicator
const PerformanceLoader = ({ metrics }: { metrics?: { loadTime: number; cacheHits: number; apiCalls: number } }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
  >
    <div className="flex items-center space-x-3 mb-3">
      <Zap className="w-5 h-5 text-yellow-500" />
      <span className="font-semibold text-gray-900 dark:text-white">Performance Monitor</span>
    </div>
    
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Load Time:</span>
        <span className="font-mono text-gray-900 dark:text-white">
          {metrics?.loadTime ? `${metrics.loadTime.toFixed(0)}ms` : 'Measuring...'}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
        <span className="font-mono text-green-600 dark:text-green-400">
          {metrics?.cacheHits ?? 0}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
        <span className="font-mono text-blue-600 dark:text-blue-400">
          {metrics?.apiCalls ?? 0}
        </span>
      </div>
    </div>
    
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          {metrics?.loadTime && metrics.loadTime < 100 ? 'Optimal Performance' : 'Loading...'}
        </span>
      </div>
    </div>
  </motion.div>
);

// Error boundary component
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Dashboard Error
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Something went wrong while loading your dashboard. This might be a temporary issue.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  this.props.onRetry?.();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
            
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded border overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Main suspense wrapper
interface DashboardSuspenseProps {
  children: React.ReactNode;
  showPerformanceMonitor?: boolean;
  performanceMetrics?: { loadTime: number; cacheHits: number; apiCalls: number };
  onRetry?: () => void;
}

export const DashboardSuspense: React.FC<DashboardSuspenseProps> = ({
  children,
  showPerformanceMonitor = false,
  performanceMetrics,
  onRetry
}) => {
  return (
    <DashboardErrorBoundary onRetry={onRetry}>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {children}
        
        <AnimatePresence>
          {showPerformanceMonitor && (
            <PerformanceLoader metrics={performanceMetrics} />
          )}
        </AnimatePresence>
      </Suspense>
    </DashboardErrorBoundary>
  );
};

// Lazy loading wrapper for dashboard components
export const withDashboardSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    showPerformanceMonitor?: boolean;
    onRetry?: () => void;
  } = {}
) => {
  const WrappedComponent = (props: P) => (
    <DashboardSuspense
      showPerformanceMonitor={options.showPerformanceMonitor}
      onRetry={options.onRetry}
    >
      <Component {...props} />
    </DashboardSuspense>
  );
  
  WrappedComponent.displayName = `withDashboardSuspense(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default DashboardSuspense;

// Export skeleton components for reuse
export {
  DashboardLoadingSkeleton,
  SkeletonCard,
  SkeletonToolCard,
  SkeletonStats,
  PerformanceLoader,
  DashboardErrorBoundary
};