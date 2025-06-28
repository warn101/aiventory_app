import React from 'react';

/**
 * Performance Diagnostics Utility
 * 
 * This utility helps identify performance bottlenecks in the dashboard
 * by measuring database query times, component render times, and network requests.
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface DatabaseQueryMetric extends PerformanceMetric {
  queryType: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  recordCount?: number;
  cacheHit?: boolean;
}

export interface ComponentRenderMetric extends PerformanceMetric {
  componentName: string;
  renderCount: number;
  propsChanged?: string[];
}

class PerformanceDiagnostics {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.logNavigationMetrics(navEntry);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.logResourceMetrics(resourceEntry);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  private logNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'TLS Handshake': entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      'Request': entry.responseStart - entry.requestStart,
      'Response': entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domContentLoadedEventStart - entry.responseEnd,
      'Resource Loading': entry.loadEventStart - entry.domContentLoadedEventStart,
      'Total Load Time': entry.loadEventEnd - entry.startTime,
    };

    console.group('🚀 Navigation Performance Metrics');
    Object.entries(metrics).forEach(([name, duration]) => {
      if (duration > 0) {
        const color = duration > 1000 ? 'color: red' : duration > 500 ? 'color: orange' : 'color: green';
        console.log(`%c${name}: ${duration.toFixed(2)}ms`, color);
      }
    });
    console.groupEnd();
  }

  private logResourceMetrics(entry: PerformanceResourceTiming) {
    // Only log slow resources or API calls
    const duration = entry.responseEnd - entry.requestStart;
    if (duration > 100 || entry.name.includes('/api/') || entry.name.includes('supabase')) {
      const color = duration > 1000 ? 'color: red' : duration > 500 ? 'color: orange' : 'color: blue';
      console.log(`%c📡 ${entry.name}: ${duration.toFixed(2)}ms`, color);
    }
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.push(metric);
    return name;
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found or already ended`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    this.logMetric(metric);
    return metric.duration;
  }

  /**
   * Measure a database query
   */
  async measureDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    table: string,
    queryType: DatabaseQueryMetric['queryType'] = 'select'
  ): Promise<T> {
    if (!this.isEnabled) return queryFn();

    const startTime = performance.now();
    const measureId = `db-${queryName}-${Date.now()}`;
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metric: DatabaseQueryMetric = {
        name: measureId,
        startTime,
        endTime,
        duration,
        queryType,
        table,
        recordCount: Array.isArray(result) ? result.length : 1,
        metadata: { queryName }
      };

      this.logDatabaseMetric(metric);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`%c❌ Database Query Failed: ${queryName} (${duration.toFixed(2)}ms)`, 'color: red', error);
      throw error;
    }
  }

  /**
   * Measure component render time
   */
  measureComponentRender(componentName: string, renderCount: number = 1, propsChanged?: string[]) {
    if (!this.isEnabled) return;

    const metric: ComponentRenderMetric = {
      name: `render-${componentName}`,
      componentName,
      renderCount,
      propsChanged,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0
    };

    // Use setTimeout to measure after render
    setTimeout(() => {
      metric.endTime = performance.now();
      metric.duration = metric.endTime! - metric.startTime;
      this.logComponentMetric(metric);
    }, 0);
  }

  private logMetric(metric: PerformanceMetric) {
    const duration = metric.duration!;
    const color = duration > 1000 ? 'color: red' : duration > 500 ? 'color: orange' : 'color: green';
    console.log(`%c⏱️ ${metric.name}: ${duration.toFixed(2)}ms`, color, metric.metadata);
  }

  private logDatabaseMetric(metric: DatabaseQueryMetric) {
    const duration = metric.duration!;
    const color = duration > 1000 ? 'color: red' : duration > 500 ? 'color: orange' : 'color: blue';
    const cacheStatus = metric.cacheHit ? '💾 (cached)' : '🌐 (fresh)';
    
    console.log(
      `%c🗄️ ${metric.queryType.toUpperCase()} ${metric.table}: ${duration.toFixed(2)}ms ${cacheStatus}`,
      color,
      {
        records: metric.recordCount,
        query: metric.metadata?.queryName
      }
    );
  }

  private logComponentMetric(metric: ComponentRenderMetric) {
    const duration = metric.duration!;
    const color = duration > 100 ? 'color: red' : duration > 50 ? 'color: orange' : 'color: green';
    
    console.log(
      `%c⚛️ ${metric.componentName} render #${metric.renderCount}: ${duration.toFixed(2)}ms`,
      color,
      metric.propsChanged ? { propsChanged: metric.propsChanged } : undefined
    );
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    slowQueries: DatabaseQueryMetric[];
    slowComponents: ComponentRenderMetric[];
    averageQueryTime: number;
  } {
    const dbMetrics = this.metrics.filter(m => m.name.startsWith('db-')) as DatabaseQueryMetric[];
    const componentMetrics = this.metrics.filter(m => m.name.startsWith('render-')) as ComponentRenderMetric[];
    
    const slowQueries = dbMetrics.filter(m => (m.duration || 0) > 500);
    const slowComponents = componentMetrics.filter(m => (m.duration || 0) > 100);
    
    const averageQueryTime = dbMetrics.length > 0 
      ? dbMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / dbMetrics.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      slowQueries,
      slowComponents,
      averageQueryTime
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Disable performance monitoring
   */
  disable() {
    this.isEnabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getSummary();
    
    return `
# Performance Diagnostic Report

## Summary
- Total Metrics: ${summary.totalMetrics}
- Slow Queries (>500ms): ${summary.slowQueries.length}
- Slow Components (>100ms): ${summary.slowComponents.length}
- Average Query Time: ${summary.averageQueryTime.toFixed(2)}ms

## Slow Queries
${summary.slowQueries.map(q => 
  `- ${q.table} ${q.queryType}: ${q.duration?.toFixed(2)}ms (${q.recordCount} records)`
).join('\n')}

## Slow Components
${summary.slowComponents.map(c => 
  `- ${c.componentName}: ${c.duration?.toFixed(2)}ms (render #${c.renderCount})`
).join('\n')}

## Recommendations
${this.generateRecommendations(summary)}
    `.trim();
  }

  private generateRecommendations(summary: ReturnType<typeof this.getSummary>): string {
    const recommendations: string[] = [];

    if (summary.averageQueryTime > 500) {
      recommendations.push('- Consider adding database indexes for frequently queried tables');
      recommendations.push('- Implement query result caching');
      recommendations.push('- Optimize SELECT queries to fetch only required fields');
    }

    if (summary.slowComponents.length > 0) {
      recommendations.push('- Add React.memo() to frequently re-rendering components');
      recommendations.push('- Use useCallback() and useMemo() for expensive computations');
      recommendations.push('- Consider component code splitting for large components');
    }

    if (summary.slowQueries.length > 3) {
      recommendations.push('- Implement pagination for large data sets');
      recommendations.push('- Use virtual scrolling for long lists');
      recommendations.push('- Consider background data prefetching');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Performance looks good! 🎉';
  }
}

// Global instance
export const performanceDiagnostics = new PerformanceDiagnostics();

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName: string, dependencies: any[] = []) => {
  const renderCount = React.useRef(0);
  const prevDeps = React.useRef(dependencies);
  
  React.useEffect(() => {
    renderCount.current++;
    
    // Detect which dependencies changed
    const changedDeps: string[] = [];
    dependencies.forEach((dep, index) => {
      if (prevDeps.current[index] !== dep) {
        changedDeps.push(`dep[${index}]`);
      }
    });
    
    performanceDiagnostics.measureComponentRender(
      componentName, 
      renderCount.current, 
      changedDeps.length > 0 ? changedDeps : undefined
    );
    
    prevDeps.current = dependencies;
  });
  
  return {
    renderCount: renderCount.current,
    logPerformance: () => performanceDiagnostics.generateReport()
  };
};

// Database query wrapper
export const withPerformanceMonitoring = {
  query: <T>(queryName: string, queryFn: () => Promise<T>, table: string) => 
    performanceDiagnostics.measureDatabaseQuery(queryName, queryFn, table),
    
  measure: (name: string, fn: () => any, metadata?: Record<string, any>) => {
    const measureId = performanceDiagnostics.startMeasure(name, metadata);
    try {
      const result = fn();
      performanceDiagnostics.endMeasure(measureId);
      return result;
    } catch (error) {
      performanceDiagnostics.endMeasure(measureId, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
};

// Export for global access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceDiagnostics = performanceDiagnostics;
}