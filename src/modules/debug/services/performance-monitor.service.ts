/**
 * 性能监控服务
 *
 * 功能说明:
 * - 监控应用性能指标
 * - 记录数据库查询性能
 * - 监控外部API调用
 * - 提供性能分析和优化建议
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, Logger } from '@nestjs/common';
import { generateUUID } from 'src/utils';
import { PerformanceMetric } from '../interfaces/debug.interface';

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics: Map<string, PerformanceMetric> = new Map();
  private readonly maxMetrics = 1000; // 最大性能记录数
  private readonly retentionHours = 24; // 数据保留时间（小时）

  constructor() {
    // 定期清理过期数据
    setInterval(
      () => {
        this.cleanupExpiredMetrics();
      },
      60 * 60 * 1000,
    ); // 每小时清理一次
  }

  /**
   * 开始性能监控
   */
  startMonitoring(
    type: 'request' | 'database' | 'cache' | 'external',
    name: string,
    metadata?: Record<string, string | number | boolean>,
  ): string {
    const metricId = generateUUID();
    const metric: PerformanceMetric = {
      id: metricId,
      timestamp: new Date().toISOString(),
      type,
      name,
      duration: 0, // 初始值
      success: true, // 默认成功
      metadata: {
        ...metadata,
        startTime: Date.now(),
      },
    };

    this.metrics.set(metricId, metric);

    // 如果记录数超过限制，删除最旧的记录
    if (this.metrics.size > this.maxMetrics) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }

    return metricId;
  }

  /**
   * 完成性能监控
   */
  finishMonitoring(
    metricId: string,
    success: boolean = true,
    additionalMetadata?: Record<string, string | number | boolean>,
  ): void {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      return;
    }

    const startTime = Number(metric.metadata?.startTime) || Date.now();
    metric.duration = Date.now() - startTime;
    metric.success = success;
    metric.metadata = {
      ...metric.metadata,
      ...additionalMetadata,
      endTime: Date.now(),
    };

    delete metric.metadata.startTime; // 清理临时数据

    this.metrics.set(metricId, metric);

    // 记录慢查询或慢请求
    if (metric.duration > this.getSlowThreshold(metric.type)) {
      this.logger.warn(
        `慢${this.getTypeDisplayName(metric.type)}: ${metric.name} - ${metric.duration}ms`,
        { metric },
      );
    }
  }

  /**
   * 记录数据库查询性能
   */
  recordDatabaseQuery(
    query: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, string | number | boolean>,
  ): string {
    const metricId = generateUUID();
    const metric: PerformanceMetric = {
      id: metricId,
      timestamp: new Date().toISOString(),
      type: 'database',
      name: this.normalizeQuery(query),
      duration,
      success,
      metadata: {
        ...metadata,
        originalQuery: query,
        queryType: this.extractQueryType(query),
      },
    };

    this.metrics.set(metricId, metric);

    // 记录慢查询
    if (duration > this.getSlowThreshold('database')) {
      this.logger.warn(`🐌 慢查询: ${metric.name} - ${duration}ms`, { query, metadata });
    }

    return metricId;
  }

  /**
   * 记录缓存操作性能
   */
  recordCacheOperation(
    operation: 'get' | 'set' | 'del' | 'exists',
    key: string,
    duration: number,
    hit: boolean = true,
    metadata?: Record<string, string | number | boolean>,
  ): string {
    const metricId = generateUUID();
    const metric: PerformanceMetric = {
      id: metricId,
      timestamp: new Date().toISOString(),
      type: 'cache',
      name: `${operation}:${this.normalizeKey(key)}`,
      duration,
      success: hit,
      metadata: {
        ...metadata,
        operation,
        key: this.normalizeKey(key),
        hit,
      },
    };

    this.metrics.set(metricId, metric);
    return metricId;
  }

  /**
   * 记录外部API调用性能
   */
  recordExternalApiCall(
    url: string,
    method: string,
    duration: number,
    statusCode: number,
    success: boolean = true,
    metadata?: Record<string, string | number | boolean>,
  ): string {
    const metricId = generateUUID();
    const metric: PerformanceMetric = {
      id: metricId,
      timestamp: new Date().toISOString(),
      type: 'external',
      name: `${method} ${this.normalizeUrl(url)}`,
      duration,
      success,
      metadata: {
        ...metadata,
        url,
        method,
        statusCode,
      },
    };

    this.metrics.set(metricId, metric);

    // 记录慢API调用
    if (duration > this.getSlowThreshold('external')) {
      this.logger.warn(`🐌 慢API调用: ${metric.name} - ${duration}ms`, {
        url,
        statusCode,
        metadata,
      });
    }

    return metricId;
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(type?: 'request' | 'database' | 'cache' | 'external'): unknown {
    let metrics = Array.from(this.metrics.values());

    if (type) {
      metrics = metrics.filter((m) => m.type === type);
    }

    const total = metrics.length;
    const successful = metrics.filter((m) => m.success).length;
    const failed = total - successful;

    const durations = metrics.map((m) => m.duration);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;

    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

    // 计算百分位数
    const sortedDurations = durations.sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedDurations, 50);
    const p90 = this.getPercentile(sortedDurations, 90);
    const p95 = this.getPercentile(sortedDurations, 95);
    const p99 = this.getPercentile(sortedDurations, 99);

    // 慢操作统计
    const slowThreshold = type ? this.getSlowThreshold(type) : 1000;
    const slowOperations = metrics.filter((m) => m.duration > slowThreshold).length;

    return {
      type: type ?? 'all',
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      duration: {
        avg: avgDuration,
        min: minDuration,
        max: maxDuration,
        p50,
        p90,
        p95,
        p99,
      },
      slowOperations,
      slowOperationRate: total > 0 ? Math.round((slowOperations / total) * 100) : 0,
    };
  }

  /**
   * 获取最慢的操作
   */
  getSlowestOperations(
    limit: number = 10,
    type?: 'request' | 'database' | 'cache' | 'external',
  ): unknown[] {
    let metrics = Array.from(this.metrics.values());

    if (type) {
      metrics = metrics.filter((m) => m.type === type);
    }

    return metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map((metric) => ({
        id: metric.id,
        type: metric.type,
        name: metric.name,
        duration: metric.duration,
        timestamp: metric.timestamp,
        success: metric.success,
        metadata: metric.metadata,
      }));
  }

  /**
   * 获取性能趋势
   */
  getPerformanceTrends(
    hours: number = 24,
    type?: 'request' | 'database' | 'cache' | 'external',
  ): unknown[] {
    const now = Date.now();
    const startTime = now - hours * 60 * 60 * 1000;
    const interval = (hours * 60 * 60 * 1000) / 24; // 24个数据点

    const trends = [];

    for (let i = 0; i < 24; i++) {
      const periodStart = startTime + i * interval;
      const periodEnd = periodStart + interval;

      let periodMetrics = Array.from(this.metrics.values()).filter((metric) => {
        const metricTime = new Date(metric.timestamp).getTime();
        return metricTime >= periodStart && metricTime < periodEnd;
      });

      if (type) {
        periodMetrics = periodMetrics.filter((m) => m.type === type);
      }

      const durations = periodMetrics.map((m) => m.duration);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
          : 0;

      trends.push({
        timestamp: new Date(periodStart).toISOString(),
        count: periodMetrics.length,
        avgDuration,
        successCount: periodMetrics.filter((m) => m.success).length,
        errorCount: periodMetrics.filter((m) => !m.success).length,
      });
    }

    return trends;
  }

  /**
   * 清除所有数据
   */
  async clearData(): Promise<void> {
    this.metrics.clear();
    this.logger.log('🧹 性能监控数据已清除');
  }

  /**
   * 清理过期记录
   */
  private cleanupExpiredMetrics(): void {
    const cutoffTime = Date.now() - this.retentionHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [id, metric] of this.metrics.entries()) {
      if (new Date(metric.timestamp).getTime() < cutoffTime) {
        this.metrics.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`🗑️ 清理了 ${deletedCount} 条过期性能记录`);
    }
  }

  /**
   * 获取慢操作阈值
   */
  private getSlowThreshold(type: 'request' | 'database' | 'cache' | 'external'): number {
    const thresholds = {
      request: 1000, // 1秒
      database: 500, // 500毫秒
      cache: 100, // 100毫秒
      external: 2000, // 2秒
    };
    return thresholds[type];
  }

  /**
   * 获取类型显示名称
   */
  private getTypeDisplayName(type: 'request' | 'database' | 'cache' | 'external'): string {
    const names: Record<'request' | 'database' | 'cache' | 'external', string> = {
      request: '请求',
      database: '数据库查询',
      cache: '缓存操作',
      external: 'API调用',
    };
    return names[type] ?? type;
  }

  /**
   * 标准化数据库查询
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\b\d+\b/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .trim()
      .substring(0, 100);
  }

  /**
   * 提取查询类型
   */
  private extractQueryType(query: string): string {
    const upperQuery = query.toUpperCase().trim();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    if (upperQuery.startsWith('CREATE')) return 'CREATE';
    if (upperQuery.startsWith('DROP')) return 'DROP';
    if (upperQuery.startsWith('ALTER')) return 'ALTER';
    return 'OTHER';
  }

  /**
   * 标准化缓存键
   */
  private normalizeKey(key: string): string {
    return key.replace(/\b\d+\b/g, ':id').substring(0, 50);
  }

  /**
   * 标准化URL
   */
  private normalizeUrl(url: string): string {
    return url.split('?')[0].replace(/\/\d+/g, '/:id');
  }

  /**
   * 计算百分位数
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }
}
