interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface PageLoadMetrics {
  navigationStart: number
  domContentLoaded: number
  loadComplete: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private isClient = typeof window !== 'undefined'

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    if (this.isClient) {
      this.initializeWebVitals()
      this.monitorPageLoad()
    }
  }

  public recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)
    this.logMetric(metric)

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(`${name}_duration`, duration, { unit: 'milliseconds' })
    }
  }

  public async measureAsyncOperation<T>(
    name: string, 
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - startTime
      
      this.recordMetric(`${name}_duration`, duration, {
        ...tags,
        status: 'success',
        unit: 'milliseconds'
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric(`${name}_duration`, duration, {
        ...tags,
        status: 'error',
        unit: 'milliseconds'
      })
      
      throw error
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  public getPageLoadMetrics(): PageLoadMetrics | null {
    if (!this.isClient || !performance.timing) {
      return null
    }

    const timing = performance.timing
    
    return {
      navigationStart: timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstContentfulPaint: this.getWebVital('FCP'),
      largestContentfulPaint: this.getWebVital('LCP'),
      cumulativeLayoutShift: this.getWebVital('CLS'),
      firstInputDelay: this.getWebVital('FID')
    }
  }

  private initializeWebVitals() {
    if (!this.isClient) return

    // Monitor Core Web Vitals
    this.observeWebVital('largest-contentful-paint', 'LCP')
    this.observeWebVital('first-input', 'FID')
    this.observeWebVital('layout-shift', 'CLS')
    
    // Monitor other important metrics
    this.observeWebVital('first-contentful-paint', 'FCP')
    this.observeWebVital('time-to-first-byte', 'TTFB')
  }

  private observeWebVital(entryType: string, metricName: string) {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === entryType) {
            let value = 0
            
            if ('value' in entry) {
              value = entry.value
            } else if ('startTime' in entry) {
              value = entry.startTime
            }

            this.recordMetric(`web_vital_${metricName}`, value, {
              type: 'web_vital',
              metric: metricName
            })
          }
        }
      })

      observer.observe({ entryTypes: [entryType] })
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error)
    }
  }

  private monitorPageLoad() {
    if (!this.isClient) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = this.getPageLoadMetrics()
        if (metrics) {
          this.recordMetric('page_load_complete', metrics.loadComplete, {
            type: 'navigation'
          })
        }
      }, 0)
    })

    document.addEventListener('DOMContentLoaded', () => {
      const timing = performance.timing
      const domLoadTime = timing.domContentLoadedEventEnd - timing.navigationStart
      
      this.recordMetric('dom_content_loaded', domLoadTime, {
        type: 'navigation'
      })
    })
  }

  private getWebVital(name: string): number | undefined {
    const metric = this.metrics.find(m => m.name === `web_vital_${name}`)
    return metric?.value
  }

  private logMetric(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', {
        name: metric.name,
        value: `${metric.value.toFixed(2)}${metric.tags?.unit || ''}`,
        tags: metric.tags
      })
    }

    // In production, you could send metrics to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric)
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Placeholder for analytics service integration
    // Could integrate with Google Analytics, Mixpanel, etc.
    console.debug('Analytics metric:', metric.name, metric.value)
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Helper functions for common use cases
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.measureAsyncOperation(`api_${name}`, apiCall, {
    category: 'api'
  })
}

export const measureComponentRender = (componentName: string) => {
  return performanceMonitor.startTimer(`component_${componentName}_render`)
}

export const measureDatabaseQuery = async <T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.measureAsyncOperation(`db_${queryName}`, query, {
    category: 'database'
  })
}