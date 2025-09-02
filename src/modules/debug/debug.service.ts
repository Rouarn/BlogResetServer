/**
 * 调试服务核心类
 *
 * 功能说明:
 * - 统一管理调试数据的收集、存储和查询
 * - 提供调试面板所需的各种数据接口
 * - 集成请求追踪、错误诊断等功能
 * - 支持实时数据推送和历史数据查询
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DebugInfo,
  ErrorSummary,
  RequestSummary,
  SystemMetrics,
} from './interfaces/debug.interface';
import { ErrorDiagnosticsService } from './services/error-diagnostics.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { RequestTrackingService } from './services/request-tracking.service';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);
  private readonly isDebugEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestTrackingService: RequestTrackingService,
    private readonly errorDiagnosticsService: ErrorDiagnosticsService,
    private readonly performanceMonitorService: PerformanceMonitorService,
  ) {
    this.isDebugEnabled = this.configService.get<string>('app.environment') === 'development';
    if (this.isDebugEnabled) {
      this.logger.log(`       调试模块已启用`);
    }
  }

  /**
   * 获取调试面板总览信息
   */
  async getDebugInfo(): Promise<DebugInfo> {
    if (!this.isDebugEnabled) {
      throw new Error('调试功能仅在开发环境下可用');
    }

    const [systemMetrics, requestSummary, errorSummary] = await Promise.all([
      this.getSystemMetrics(),
      this.getRequestSummary(),
      this.getErrorSummary(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('app.environment') ?? 'development',
      systemMetrics,
      requestSummary,
      errorSummary,
    };
  }

  /**
   * 获取系统性能指标
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * 获取请求统计摘要
   */
  async getRequestSummary(): Promise<RequestSummary> {
    return this.requestTrackingService.getRequestSummary();
  }

  /**
   * 获取错误统计摘要
   */
  async getErrorSummary(): Promise<ErrorSummary> {
    return this.errorDiagnosticsService.getErrorSummary();
  }

  /**
   * 获取最近的请求记录
   */
  async getRecentRequests(limit: number = 50): Promise<unknown[]> {
    return this.requestTrackingService.getRecentRequests(limit);
  }

  /**
   * 获取最近的错误记录
   */
  async getRecentErrors(limit: number = 50): Promise<unknown[]> {
    return this.errorDiagnosticsService.getRecentErrors(limit);
  }

  /**
   * 获取性能趋势数据
   */
  async getPerformanceTrends(
    hours: number = 24,
  ): Promise<{ requests: unknown[]; database: unknown[]; cache: unknown[]; external: unknown[] }> {
    return {
      requests: this.performanceMonitorService.getPerformanceTrends(hours, 'request'),
      database: this.performanceMonitorService.getPerformanceTrends(hours, 'database'),
      cache: this.performanceMonitorService.getPerformanceTrends(hours, 'cache'),
      external: this.performanceMonitorService.getPerformanceTrends(hours, 'external'),
    };
  }

  /**
   * 获取最慢的操作
   */
  async getSlowestOperations(
    limit: number = 10,
  ): Promise<{ requests: unknown[]; database: unknown[]; cache: unknown[]; external: unknown[] }> {
    return {
      requests: this.performanceMonitorService.getSlowestOperations(limit, 'request'),
      database: this.performanceMonitorService.getSlowestOperations(limit, 'database'),
      cache: this.performanceMonitorService.getSlowestOperations(limit, 'cache'),
      external: this.performanceMonitorService.getSlowestOperations(limit, 'external'),
    };
  }

  /**
   * 清除调试数据
   */
  async clearDebugData(): Promise<void> {
    if (!this.isDebugEnabled) {
      throw new Error('调试功能仅在开发环境下可用');
    }

    await Promise.all([
      this.requestTrackingService.clearData(),
      this.errorDiagnosticsService.clearData(),
      this.performanceMonitorService.clearData(),
    ]);

    this.logger.log('调试数据已清除');
  }

  /**
   * 检查调试功能是否启用
   */
  isEnabled(): boolean {
    return this.isDebugEnabled;
  }
}
