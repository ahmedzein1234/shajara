/**
 * Metrics Collection
 * Tracks application performance and usage metrics
 * Integrates with Cloudflare Analytics and custom dashboards
 */

import { logger } from './logger';

export interface Metric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

export interface PerformanceMetrics {
  requestDuration: number;
  dbQueryDuration: number;
  dbQueryCount: number;
  externalApiDuration: number;
  externalApiCount: number;
  cacheHits: number;
  cacheMisses: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private flushInterval: number;
  private maxBatchSize: number;

  constructor(flushInterval = 60000, maxBatchSize = 100) {
    this.flushInterval = flushInterval;
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, unit: Metric['unit'], tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    });

    // Auto-flush if batch is full
    if (this.metrics.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, 'ms', tags);
  }

  /**
   * Record a counter metric
   */
  increment(name: string, count: number = 1, tags?: Record<string, string>): void {
    this.record(name, count, 'count', tags);
  }

  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, unit: Metric['unit'], tags?: Record<string, string>): void {
    this.record(name, value, unit, tags);
  }

  /**
   * Time an async operation
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.timing(name, performance.now() - start, { ...tags, success: 'true' });
      return result;
    } catch (error) {
      this.timing(name, performance.now() - start, { ...tags, success: 'false' });
      throw error;
    }
  }

  /**
   * Flush metrics to Cloudflare Analytics
   */
  flush(): void {
    if (this.metrics.length === 0) return;

    // Log metrics summary for Cloudflare Workers Logs
    const summary = this.summarize();
    logger.info('Metrics flush', { metrics: summary });

    // Clear metrics
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  private summarize(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; sum: number; min: number; max: number }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
      }
      summary[metric.name].count++;
      summary[metric.name].sum += metric.value;
      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value);
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value);
    }

    // Convert sum to avg
    const result: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    for (const [name, data] of Object.entries(summary)) {
      result[name] = {
        count: data.count,
        avg: data.sum / data.count,
        min: data.min,
        max: data.max,
      };
    }

    return result;
  }

  /**
   * Get current metrics (for debugging)
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }
}

// Pre-defined metric names
export const METRICS = {
  // HTTP Metrics
  REQUEST_DURATION: 'http.request.duration',
  REQUEST_COUNT: 'http.request.count',
  REQUEST_ERROR: 'http.request.error',

  // Database Metrics
  DB_QUERY_DURATION: 'db.query.duration',
  DB_QUERY_COUNT: 'db.query.count',
  DB_QUERY_ERROR: 'db.query.error',

  // Cache Metrics
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  CACHE_SET: 'cache.set',

  // AI API Metrics
  AI_REQUEST_DURATION: 'ai.request.duration',
  AI_REQUEST_COUNT: 'ai.request.count',
  AI_TOKEN_COUNT: 'ai.tokens.count',

  // Business Metrics
  TREE_CREATED: 'business.tree.created',
  PERSON_ADDED: 'business.person.added',
  USER_REGISTERED: 'business.user.registered',
  USER_LOGIN: 'business.user.login',

  // Error Metrics
  ERROR_COUNT: 'error.count',
  ERROR_UNHANDLED: 'error.unhandled',
} as const;

/**
 * Request-scoped metrics tracker
 */
export class RequestMetrics {
  private startTime: number;
  private dbQueries: { duration: number; query: string }[] = [];
  private apiCalls: { service: string; duration: number; success: boolean }[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.startTime = performance.now();
  }

  recordDbQuery(duration: number, query: string): void {
    this.dbQueries.push({ duration, query });
  }

  recordApiCall(service: string, duration: number, success: boolean): void {
    this.apiCalls.push({ service, duration, success });
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get final metrics summary
   */
  getSummary(): PerformanceMetrics {
    const requestDuration = performance.now() - this.startTime;
    const dbQueryDuration = this.dbQueries.reduce((sum, q) => sum + q.duration, 0);
    const externalApiDuration = this.apiCalls.reduce((sum, c) => sum + c.duration, 0);

    return {
      requestDuration,
      dbQueryDuration,
      dbQueryCount: this.dbQueries.length,
      externalApiDuration,
      externalApiCount: this.apiCalls.length,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  /**
   * Flush metrics to collector
   */
  flush(collector: MetricsCollector, tags?: Record<string, string>): void {
    const summary = this.getSummary();

    collector.timing(METRICS.REQUEST_DURATION, summary.requestDuration, tags);

    if (summary.dbQueryCount > 0) {
      collector.timing(METRICS.DB_QUERY_DURATION, summary.dbQueryDuration, tags);
      collector.increment(METRICS.DB_QUERY_COUNT, summary.dbQueryCount, tags);
    }

    if (summary.externalApiCount > 0) {
      collector.timing(METRICS.AI_REQUEST_DURATION, summary.externalApiDuration, tags);
      collector.increment(METRICS.AI_REQUEST_COUNT, summary.externalApiCount, tags);
    }

    if (summary.cacheHits > 0) {
      collector.increment(METRICS.CACHE_HIT, summary.cacheHits, tags);
    }

    if (summary.cacheMisses > 0) {
      collector.increment(METRICS.CACHE_MISS, summary.cacheMisses, tags);
    }
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

// Helper to create request-scoped metrics
export function createRequestMetrics(): RequestMetrics {
  return new RequestMetrics();
}

export default metrics;
