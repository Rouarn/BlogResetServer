/**
 * 错误诊断服务
 *
 * 功能说明:
 * - 收集和分析应用错误信息
 * - 提供错误统计和趋势分析
 * - 支持错误分类和优先级管理
 * - 自动清理过期错误记录
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, Logger } from '@nestjs/common';
import { generateUUID } from 'src/utils';
import { ErrorDiagnosticRecord, ErrorSummary } from '../interfaces/debug.interface';

@Injectable()
export class ErrorDiagnosticsService {
  private readonly logger = new Logger(ErrorDiagnosticsService.name);
  private readonly errors: Map<string, ErrorDiagnosticRecord> = new Map();
  private readonly maxRecords = 500; // 最大错误记录数
  private readonly retentionDays = 7; // 错误记录保留天数

  constructor() {
    // 定期清理过期数据
    setInterval(
      () => {
        this.cleanupExpiredRecords();
      },
      6 * 60 * 60 * 1000,
    ); // 每6小时清理一次
  }

  /**
   * 记录错误
   */
  recordError(
    level: 'error' | 'warn' | 'critical',
    message: string,
    stack?: string,
    context?: {
      requestId?: string;
      userId?: string;
      ip?: string;
      userAgent?: string;
      method?: string;
      url?: string;
      statusCode?: number;
    },
    metadata?: Record<string, any>,
  ): string {
    const errorId = generateUUID();
    const record: ErrorDiagnosticRecord = {
      id: errorId,
      timestamp: new Date().toISOString(),
      level,
      message,
      stack,
      context: context ?? {},
      metadata,
    };

    this.errors.set(errorId, record);

    // 如果记录数超过限制，删除最旧的记录
    if (this.errors.size > this.maxRecords) {
      const oldestKey = this.errors.keys().next().value;
      this.errors.delete(oldestKey);
    }

    // 记录到日志
    const logMessage = `[${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'critical':
        this.logger.error(logMessage, stack);
        break;
      case 'error':
        this.logger.error(logMessage, stack);
        break;
      case 'warn':
        this.logger.warn(logMessage);
        break;
    }

    return errorId;
  }

  /**
   * 获取错误统计摘要
   */
  getErrorSummary(): ErrorSummary {
    const records = Array.from(this.errors.values());
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const total = records.length;
    const last24Hours = records.filter(
      (r) => new Date(r.timestamp).getTime() > twentyFourHoursAgo,
    ).length;

    // 统计错误消息频率
    const errorCounts = new Map<string, { count: number; lastOccurred: string }>();
    records.forEach((record) => {
      const key = this.normalizeErrorMessage(record.message);
      const existing = errorCounts.get(key) ?? { count: 0, lastOccurred: record.timestamp };
      existing.count++;
      if (new Date(record.timestamp) > new Date(existing.lastOccurred)) {
        existing.lastOccurred = record.timestamp;
      }
      errorCounts.set(key, existing);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: data.lastOccurred,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 按状态码统计错误
    const errorsByStatus: Record<number, number> = {};
    records.forEach((record) => {
      if (record.context.statusCode) {
        const statusCode = record.context.statusCode;
        errorsByStatus[statusCode] = (errorsByStatus[statusCode] || 0) + 1;
      }
    });

    return {
      total,
      last24Hours,
      topErrors,
      errorsByStatus,
    };
  }

  /**
   * 获取最近的错误记录
   */
  getRecentErrors(limit: number = 50): ErrorDiagnosticRecord[] {
    return Array.from(this.errors.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 根据条件查询错误记录
   */
  queryErrors(filters: {
    level?: 'error' | 'warn' | 'critical';
    message?: string;
    statusCode?: number;
    userId?: string;
    startTime?: string;
    endTime?: string;
  }): ErrorDiagnosticRecord[] {
    let records = Array.from(this.errors.values());

    if (filters.level) {
      records = records.filter((r) => r.level === filters.level);
    }

    if (filters.message) {
      const searchTerm = filters.message.toLowerCase();
      records = records.filter((r) => r.message.toLowerCase().includes(searchTerm));
    }

    if (filters.statusCode) {
      records = records.filter((r) => r.context.statusCode === filters.statusCode);
    }

    if (filters.userId) {
      records = records.filter((r) => r.context.userId === filters.userId);
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
   * 获取错误趋势数据
   */
  getErrorTrends(hours: number = 24): {
    timestamp: string;
    count: number;
    criticalCount: number;
    errorCount: number;
    warnCount: number;
  }[] {
    const now = Date.now();
    const startTime = now - hours * 60 * 60 * 1000;
    const interval = (hours * 60 * 60 * 1000) / 24; // 24个数据点

    const trends: {
      timestamp: string;
      count: number;
      criticalCount: number;
      errorCount: number;
      warnCount: number;
    }[] = [];

    for (let i = 0; i < 24; i++) {
      const periodStart = startTime + i * interval;
      const periodEnd = periodStart + interval;

      const periodErrors = Array.from(this.errors.values()).filter((error) => {
        const errorTime = new Date(error.timestamp).getTime();
        return errorTime >= periodStart && errorTime < periodEnd;
      });

      trends.push({
        timestamp: new Date(periodStart).toISOString(),
        count: periodErrors.length,
        criticalCount: periodErrors.filter((e) => e.level === 'critical').length,
        errorCount: periodErrors.filter((e) => e.level === 'error').length,
        warnCount: periodErrors.filter((e) => e.level === 'warn').length,
      });
    }

    return trends;
  }

  /**
   * 获取错误详情
   */
  getErrorDetail(errorId: string): ErrorDiagnosticRecord | null {
    return this.errors.get(errorId) ?? null;
  }

  /**
   * 标记错误为已解决
   */
  markErrorAsResolved(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) {
      return false;
    }

    error.metadata = {
      ...error.metadata,
      resolved: true,
      resolvedAt: new Date().toISOString(),
    };

    this.errors.set(errorId, error);
    return true;
  }

  /**
   * 清除所有数据
   */
  async clearData(): Promise<void> {
    this.errors.clear();
    this.logger.log('错误诊断数据已清除');
  }

  /**
   * 清理过期记录
   */
  private cleanupExpiredRecords(): void {
    const cutoffTime = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [id, record] of this.errors.entries()) {
      if (new Date(record.timestamp).getTime() < cutoffTime) {
        this.errors.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`清理了 ${deletedCount} 条过期错误记录`);
    }
  }

  /**
   * 标准化错误消息（用于分组统计）
   */
  private normalizeErrorMessage(message: string): string {
    // 移除动态内容，如ID、时间戳等
    return message
      .replace(/\b\d+\b/g, 'N') // 数字替换为N
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID') // UUID替换
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP') // 时间戳替换
      .trim();
  }
}
