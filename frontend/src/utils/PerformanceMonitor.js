class PerformanceMonitor {
  constructor() {
    // Advanced metrics (from existing file)
    this.metrics = {
      pageLoad: {},
      componentRenders: new Map(),
      apiCalls: new Map(),
      memoryUsage: [],
      customMetrics: new Map()
    };
    
    // Simple tracking arrays (from new requirements)
    this.userInteractions = [];
    this.simpleMetrics = [];
    this.isMonitoring = false;
    
    this.observers = {
      performance: null,
      intersection: null,
      mutation: null
    };
    
    this.thresholds = {
      renderTime: 100, // ms
      apiResponse: 2000, // ms
      memoryUsage: 100 * 1024 * 1024, // 100MB
      bundleSize: 5 * 1024 * 1024 // 5MB
    };
    
    this.initialize();
  }

  initialize() {
    this.measurePageLoad();
    this.setupPerformanceObserver();
    this.monitorMemoryUsage();
    this.setupIntersectionObserver();
    this.analyzeBundleSize();
    
    // Start monitoring by default
    this.startMonitoring();
    
    // Report metrics periodically
    this.reportInterval = setInterval(() => {
      this.reportMetrics();
    }, 60000); // Every minute
  }

  // Simple API Methods (from new requirements)
  startMonitoring() {
    this.isMonitoring = true;
    console.log('Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
    
    // Clear interval when stopping
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  trackUserInteraction(action, data = {}) {
    if (!this.isMonitoring) return;

    const interaction = {
      action,
      timestamp: Date.now(),
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.userInteractions.push(interaction);
    console.log('User interaction tracked:', interaction);

    // Keep only last 100 interactions
    if (this.userInteractions.length > 100) {
      this.userInteractions.shift();
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('performance_interactions', JSON.stringify(this.userInteractions.slice(-50)));
    } catch (error) {
      console.warn('Failed to save interactions to localStorage:', error);
    }
  }

  trackPageView(route) {
    this.trackUserInteraction('page_view', { route });
  }

  recordMetric(metric) {
    if (!this.isMonitoring) return;

    const metricRecord = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now()
    };

    this.simpleMetrics.push(metricRecord);
    console.log('Metric recorded:', metricRecord);

    // Keep only last 50 metrics
    if (this.simpleMetrics.length > 50) {
      this.simpleMetrics.shift();
    }

    // Also store in advanced metrics if it's a custom metric
    this.metrics.customMetrics.set(metric.name, {
      value: metric.value,
      timestamp: Date.now()
    });
  }

  logError(error) {
    console.error('Performance Monitor - Error logged:', error);
    
    const errorData = {
      message: error.message || error,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    this.trackUserInteraction('error', errorData);
    
    // Record as metric too
    this.recordMetric({
      name: 'error_count',
      value: 1
    });
  }

  getMetrics() {
    return {
      // Simple metrics (for compatibility)
      interactions: this.userInteractions,
      metrics: this.simpleMetrics,
      
      // Advanced metrics
      advanced: {
        pageLoad: this.metrics.pageLoad,
        componentRenders: Array.from(this.metrics.componentRenders.entries()),
        apiCalls: Array.from(this.metrics.apiCalls.entries()),
        memoryUsage: this.metrics.memoryUsage,
        customMetrics: Array.from(this.metrics.customMetrics.entries())
      },
      
      // Summary
      summary: {
        totalInteractions: this.userInteractions.length,
        totalMetrics: this.simpleMetrics.length,
        isMonitoring: this.isMonitoring,
        lastActivity: this.userInteractions.length > 0 ? 
          this.userInteractions[this.userInteractions.length - 1].timestamp : null
      }
    };
  }

  // Advanced Performance Monitoring (from existing file)
  measurePageLoad() {
    window.addEventListener('load', () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        this.metrics.pageLoad = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          largestContentfulPaint: this.getLargestContentfulPaint(),
          cumulativeLayoutShift: this.getCumulativeLayoutShift(),
          firstInputDelay: this.getFirstInputDelay(),
          timeToInteractive: this.getTimeToInteractive()
        };

        // Track page load as user interaction
        this.trackUserInteraction('page_loaded', {
          loadTime: this.metrics.pageLoad.loadComplete,
          domContentLoaded: this.metrics.pageLoad.domContentLoaded
        });
      } catch (error) {
        console.warn('Failed to measure page load:', error);
      }
    });
  }

  getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : null;
    } catch (error) {
      return null;
    }
  }

  getFirstContentfulPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    } catch (error) {
      return null;
    }
  }

  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry ? lastEntry.startTime : null);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(null), 10000);
      } catch (error) {
        resolve(null);
      }
    });
  }

  getCumulativeLayoutShift() {
    let clsValue = 0;
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
    
    return clsValue;
  }

  getFirstInputDelay() {
    return new Promise((resolve) => {
      try {
        new PerformanceObserver((entryList) => {
          const firstEntry = entryList.getEntries()[0];
          resolve(firstEntry ? firstEntry.processingStart - firstEntry.startTime : null);
        }).observe({ entryTypes: ['first-input'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(null), 10000);
      } catch (error) {
        resolve(null);
      }
    });
  }

  getTimeToInteractive() {
    return new Promise((resolve) => {
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          resolve(performance.now());
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(performance.now()), 10000);
      } catch (error) {
        resolve(performance.now());
      }
    });
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.observers.performance = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });
        
        this.observers.performance.observe({ 
          entryTypes: ['measure', 'navigation', 'resource', 'longtask'] 
        });
      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }
    }
  }

  processPerformanceEntry(entry) {
    try {
      switch (entry.entryType) {
        case 'resource':
          this.trackResourceLoad(entry);
          break;
        case 'longtask':
          this.trackLongTask(entry);
          break;
        case 'measure':
          this.trackCustomMeasure(entry);
          break;
      }
    } catch (error) {
      console.warn('Error processing performance entry:', error);
    }
  }

  trackResourceLoad(entry) {
    if (entry.duration > this.thresholds.apiResponse) {
      console.warn(`Slow resource load: ${entry.name} took ${entry.duration}ms`);
      this.trackUserInteraction('slow_resource', {
        name: entry.name,
        duration: entry.duration
      });
    }
    
    // Track API calls specifically
    if (entry.name.includes('/api/')) {
      const apiPath = new URL(entry.name).pathname;
      if (!this.metrics.apiCalls.has(apiPath)) {
        this.metrics.apiCalls.set(apiPath, []);
      }
      this.metrics.apiCalls.get(apiPath).push({
        duration: entry.duration,
        timestamp: entry.startTime,
        success: entry.responseStatus < 400
      });

      // Track as user interaction
      this.trackUserInteraction('api_call', {
        path: apiPath,
        duration: entry.duration,
        success: entry.responseStatus < 400
      });
    }
  }

  trackLongTask(entry) {
    console.warn(`Long task detected: ${entry.duration}ms at ${entry.startTime}`);
    
    this.trackUserInteraction('long_task', {
      duration: entry.duration,
      startTime: entry.startTime
    });
    
    if (entry.duration > 100) {
      this.suggestOptimization('long-task', {
        duration: entry.duration,
        startTime: entry.startTime
      });
    }
  }

  trackCustomMeasure(entry) {
    this.metrics.customMetrics.set(entry.name, {
      duration: entry.duration,
      timestamp: entry.startTime
    });

    this.trackUserInteraction('custom_measure', {
      name: entry.name,
      duration: entry.duration
    });
  }

  // Component Performance Tracking
  trackComponentRender(componentName, renderTime) {
    if (!this.metrics.componentRenders.has(componentName)) {
      this.metrics.componentRenders.set(componentName, []);
    }
    
    this.metrics.componentRenders.get(componentName).push({
      duration: renderTime,
      timestamp: performance.now()
    });

    // Track as user interaction
    this.trackUserInteraction('component_render', {
      component: componentName,
      duration: renderTime
    });
    
    if (renderTime > this.thresholds.renderTime) {
      console.warn(`Slow component render: ${componentName} took ${renderTime}ms`);
      this.suggestOptimization('slow-component', {
        component: componentName,
        duration: renderTime
      });
    }
  }

  // Memory Usage Monitoring
  monitorMemoryUsage() {
    if ('memory' in performance) {
      const memoryInterval = setInterval(() => {
        if (!this.isMonitoring) return;

        try {
          const memInfo = performance.memory;
          const memoryData = {
            used: memInfo.usedJSHeapSize,
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            timestamp: Date.now()
          };

          this.metrics.memoryUsage.push(memoryData);
          
          // Keep only last 100 measurements
          if (this.metrics.memoryUsage.length > 100) {
            this.metrics.memoryUsage.shift();
          }

          // Track significant memory changes
          if (memInfo.usedJSHeapSize > this.thresholds.memoryUsage) {
            console.warn(`High memory usage: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            this.trackUserInteraction('high_memory_usage', {
              usedMB: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)
            });
            
            this.suggestOptimization('memory-usage', { 
              used: memInfo.usedJSHeapSize 
            });
          }
        } catch (error) {
          console.warn('Memory monitoring failed:', error);
        }
      }, 10000); // Every 10 seconds

      // Clear interval when monitoring stops
      const originalStop = this.stopMonitoring.bind(this);
      this.stopMonitoring = () => {
        clearInterval(memoryInterval);
        originalStop();
      };
    }
  }

  // Intersection Observer for Lazy Loading
  setupIntersectionObserver() {
    try {
      this.observers.intersection = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.trackViewportEntry(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
    } catch (error) {
      console.warn('Intersection Observer setup failed:', error);
    }
  }

  observeElement(element, name) {
    if (this.observers.intersection) {
      element.dataset.perfName = name;
      this.observers.intersection.observe(element);
    }
  }

  trackViewportEntry(element) {
    const name = element.dataset.perfName;
    if (name) {
      this.startMeasure(`viewport-${name}`);
      
      this.trackUserInteraction('element_visible', {
        element: name
      });
      
      // Measure when element is fully loaded
      if (element.complete || element.readyState === 'complete') {
        this.endMeasure(`viewport-${name}`);
      } else {
        element.addEventListener('load', () => {
          this.endMeasure(`viewport-${name}`);
        });
      }
    }
  }

  // Custom Performance Measurements
  startMeasure(name) {
    try {
      performance.mark(`${name}-start`);
    } catch (error) {
      console.warn('Failed to start measure:', error);
    }
  }

  endMeasure(name) {
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch (error) {
      console.warn('Failed to end measure:', error);
    }
  }

  // Bundle Size Analysis
  analyzeBundleSize() {
    try {
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      let analyzedCount = 0;
      
      scripts.forEach(script => {
        fetch(script.src, { method: 'HEAD' })
          .then(response => {
            const size = parseInt(response.headers.get('content-length') || '0');
            totalSize += size;
            analyzedCount++;
            
            if (analyzedCount === scripts.length) {
              this.trackUserInteraction('bundle_analysis', {
                totalSize,
                scriptCount: scripts.length,
                averageSize: totalSize / scripts.length
              });

              if (totalSize > this.thresholds.bundleSize) {
                this.suggestOptimization('large-bundle', { 
                  totalSize,
                  scriptCount: scripts.length 
                });
              }
            }
          })
          .catch(() => {
            analyzedCount++;
          });
      });
    } catch (error) {
      console.warn('Bundle size analysis failed:', error);
    }
  }

  // Optimization Suggestions
  suggestOptimization(type, data) {
    const suggestions = {
      'long-task': 'Consider breaking down long-running tasks or using Web Workers',
      'slow-component': 'Consider memoization, lazy loading, or virtualization',
      'memory-usage': 'Check for memory leaks and consider implementing cleanup',
      'large-bundle': 'Consider code splitting and lazy loading of components'
    };
    
    console.warn(`Performance Suggestion [${type}]:`, suggestions[type], data);
    
    this.trackUserInteraction('optimization_suggestion', {
      type,
      suggestion: suggestions[type],
      data
    });
    
    this.reportOptimizationSuggestion(type, data);
  }

  reportOptimizationSuggestion(type, data) {
    // Send to analytics service in production
    console.log('Optimization suggestion reported:', { type, data });
  }

  // Metrics Reporting
  reportMetrics() {
    if (!this.isMonitoring) return;

    try {
      const report = this.generateReport();
      
      // Send to analytics service
      console.log('Performance Report:', report);
      
      this.trackUserInteraction('metrics_reported', {
        reportSize: JSON.stringify(report).length,
        timestamp: Date.now()
      });
      
      this.sendToAnalytics(report);
    } catch (error) {
      console.error('Failed to generate performance report:', error);
    }
  }

  generateReport() {
    return {
      timestamp: Date.now(),
      pageLoad: this.metrics.pageLoad,
      slowComponents: this.getSlowComponents(),
      slowApiCalls: this.getSlowApiCalls(),
      memoryTrend: this.getMemoryTrend(),
      customMetrics: Object.fromEntries(this.metrics.customMetrics),
      recommendations: this.generateRecommendations(),
      userInteractions: this.userInteractions.slice(-10), // Last 10 interactions
      simpleMetrics: this.simpleMetrics.slice(-10) // Last 10 simple metrics
    };
  }

  getSlowComponents() {
    const slow = [];
    this.metrics.componentRenders.forEach((renders, name) => {
      if (renders.length > 0) {
        const avgTime = renders.reduce((sum, r) => sum + r.duration, 0) / renders.length;
        if (avgTime > this.thresholds.renderTime) {
          slow.push({ name, avgTime, count: renders.length });
        }
      }
    });
    return slow;
  }

  getSlowApiCalls() {
    const slow = [];
    this.metrics.apiCalls.forEach((calls, path) => {
      if (calls.length > 0) {
        const avgTime = calls.reduce((sum, c) => sum + c.duration, 0) / calls.length;
        if (avgTime > this.thresholds.apiResponse) {
          slow.push({ path, avgTime, count: calls.length });
        }
      }
    });
    return slow;
  }

  getMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return 'stable';
    
    const recent = this.metrics.memoryUsage.slice(-10);
    const trend = recent[recent.length - 1].used - recent[0].used;
    
    if (trend > 10 * 1024 * 1024) return 'increasing';
    if (trend < -10 * 1024 * 1024) return 'decreasing';
    return 'stable';
  }

  generateRecommendations() {
    const recommendations = [];
    
    try {
      // Check Core Web Vitals
      if (this.metrics.pageLoad.largestContentfulPaint > 2500) {
        recommendations.push('Optimize Largest Contentful Paint (LCP)');
      }
      
      if (this.metrics.pageLoad.cumulativeLayoutShift > 0.1) {
        recommendations.push('Reduce Cumulative Layout Shift (CLS)');
      }
      
      if (this.metrics.pageLoad.firstInputDelay > 100) {
        recommendations.push('Improve First Input Delay (FID)');
      }

      // Check user interactions
      const errorInteractions = this.userInteractions.filter(i => i.action === 'error');
      if (errorInteractions.length > 5) {
        recommendations.push('High error rate detected - investigate error sources');
      }
    } catch (error) {
      console.warn('Failed to generate recommendations:', error);
    }
    
    return recommendations;
  }

  sendToAnalytics(report) {
    // Integration with analytics services would go here
    // Example: Google Analytics, Mixpanel, DataDog, etc.
    try {
      // Placeholder for analytics integration
      if (window.gtag) {
        window.gtag('event', 'performance_report', {
          custom_parameter: JSON.stringify(report)
        });
      }
    } catch (error) {
      console.warn('Analytics reporting failed:', error);
    }
  }

  // Clear and Reset Methods
  clearMetrics() {
    this.metrics.componentRenders.clear();
    this.metrics.apiCalls.clear();
    this.metrics.memoryUsage = [];
    this.metrics.customMetrics.clear();
    this.userInteractions = [];
    this.simpleMetrics = [];
    
    console.log('All metrics cleared');
  }

  reset() {
    this.clearMetrics();
    this.stopMonitoring();
    console.log('Performance monitor reset');
  }

  // Utility Methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

export default new PerformanceMonitor();