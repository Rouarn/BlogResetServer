/**
 * 请求追踪服务
 *
 * 功能说明:
 * - 记录和分析所有HTTP请求
 * - 提供请求性能统计和分析
 * - 支持请求历史查询和过滤
 * - 自动清理过期数据
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, Logger } from '@nestjs/common';
import { generateUUID } from 'src/utils';
import { RequestTrackingRecord, RequestSummary } from '../interfaces/debug.interface';

@Injectable()
export class RequestTrackingService {
  private readonly logger = new Logger(RequestTrackingService.name);
  private readonly requests: Map<string, RequestTrackingRecord> = new Map();
  private readonly maxRecords = 1000; // 最大记录数
  private readonly retentionHours = 24; // 数据保留时间（小时）

  constructor() {
    // 定期清理过期数据
    setInterval(
      () => {
        this.cleanupExpiredRecords();
      },
      60 * 60 * 1000,
    ); // 每小时清理一次
  }

  /**
   * 开始追踪请求
   */
  startTracking(req: Record<string, unknown>): string {
    const requestId = generateUUID();
    const record: RequestTrackingRecord = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method as string,
      url: req.url as string,
      statusCode: 0, // 初始状态
      duration: 0,
      userAgent: (req.headers as Record<string, string>)?.['user-agent'],
      ip: (req.ip as string) ?? (req.connection as { remoteAddress?: string })?.remoteAddress,
      userId: (req.user as { id?: string })?.id,
      requestSize: this.calculateRequestSize(req),
      headers: this.sanitizeHeaders((req.headers as Record<string, string>) || {}),
      query: req.query as Record<string, string | string[]>,
      body: this.sanitizeBody((req.body as Record<string, unknown>) || {}),
    };

    this.requests.set(requestId, record);

    // 如果记录数超过限制，删除最旧的记录
    if (this.requests.size > this.maxRecords) {
      const oldestKey = this.requests.keys().next().value;
      this.requests.delete(oldestKey);
    }

    return requestId;
  }

  /**
   * 完成请求追踪
   */
  finishTracking(
    requestId: string,
    statusCode: number,
    startTime: number,
    response?: Record<string, unknown>,
    error?: string,
  ): void {
    const record = this.requests.get(requestId);
    if (!record) {
      return;
    }

    record.statusCode = statusCode;
    record.duration = Date.now() - startTime;
    record.responseSize = response ? this.calculateResponseSize(response) : 0;
    record.response = response ? this.sanitizeResponse(response) : undefined;
    record.error = error;

    this.requests.set(requestId, record);
  }

  /**
   * 获取请求统计摘要
   */
  getRequestSummary(): RequestSummary {
    const records = Array.from(this.requests.values());
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const total = records.length;
    const success = records.filter((r) => r.statusCode >= 200 && r.statusCode < 400).length;
    const error = records.filter((r) => r.statusCode >= 400).length;

    const durations = records.filter((r) => r.duration > 0).map((r) => r.duration);
    const averageResponseTime =
      durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;

    const slowestRequest =
      records.filter((r) => r.duration > 0).sort((a, b) => b.duration - a.duration)[0] ?? null;

    const recentRequests = records.filter((r) => new Date(r.timestamp).getTime() > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;

    // 统计热门端点
    const endpointStats = new Map<string, { count: number; totalTime: number }>();
    records.forEach((record) => {
      const endpoint = `${record.method} ${this.normalizeUrl(record.url)}`;
      const stats = endpointStats.get(endpoint) ?? { count: 0, totalTime: 0 };
      stats.count++;
      if (record.duration > 0) {
        stats.totalTime += record.duration;
      }
      endpointStats.set(endpoint, stats);
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        averageTime: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      success,
      error,
      averageResponseTime,
      slowestRequest: slowestRequest
        ? {
            url: slowestRequest.url,
            method: slowestRequest.method,
            duration: slowestRequest.duration,
          }
        : null,
      requestsPerMinute,
      topEndpoints,
    };
  }

  /**
   * 获取最近的请求记录
   */
  getRecentRequests(limit: number = 50): RequestTrackingRecord[] {
    return Array.from(this.requests.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 根据条件查询请求记录
   */
  queryRequests(filters: {
    method?: string;
    statusCode?: number;
    minDuration?: number;
    maxDuration?: number;
    startTime?: string;
    endTime?: string;
  }): RequestTrackingRecord[] {
    let records = Array.from(this.requests.values());

    if (filters.method) {
      records = records.filter((r) => r.method === filters.method);
    }

    if (filters.statusCode) {
      records = records.filter((r) => r.statusCode === filters.statusCode);
    }

    if (filters.minDuration) {
      records = records.filter((r) => r.duration >= filters.minDuration!);
    }

    if (filters.maxDuration) {
      records = records.filter((r) => r.duration <= filters.maxDuration!);
    }

    if (filters.startTime) {
      const startTime = new Date(filters.startTime).getTime();
      records = records.filter((r) => new Date(r.timestamp).getTime() >= startTime);
    }

    if (filters.endTime) {
      const endTime = new Date(filters.endTime).getTime();
      records = records.filter((r) => new Date(r.timestamp).getTime() <= endTime);
    }

    return records.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * 清除所有数据
   */
  async clearData(): Promise<void> {
    this.requests.clear();
    this.logger.log('请求追踪数据已清除');
  }

  /**
   * 清理过期记录
   */
  private cleanupExpiredRecords(): void {
    const cutoffTime = Date.now() - this.retentionHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [id, record] of this.requests.entries()) {
      if (new Date(record.timestamp).getTime() < cutoffTime) {
        this.requests.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`清理了 ${deletedCount} 条过期请求记录`);
    }
  }

  /**
   * 计算请求大小
   */
  private calculateRequestSize(req: Record<string, unknown>): number {
    try {
      return JSON.stringify({
        headers: req.headers,
        query: req.query,
        body: req.body,
      }).length;
    } catch {
      return 0;
    }
  }

  /**
   * 计算响应大小
   */
  private calculateResponseSize(response: Record<string, unknown>): number {
    try {
      return JSON.stringify(response).length;
    } catch {
      return 0;
    }
  }

  /**
   * 清理敏感请求头
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 清理敏感请求体
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 清理敏感响应数据
   */
  private sanitizeResponse(response: Record<string, unknown>): Record<string, unknown> {
    if (!response || typeof response !== 'object') {
      return response;
    }

    const sensitiveFields = ['token', 'secret', 'key', 'password'];
    const sanitized = { ...response };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 标准化URL（移除查询参数和动态参数）
   */
  private normalizeUrl(url: string): string {
    return url.split('?')[0].replace(/\/\d+/g, '/:id');
  }
}
