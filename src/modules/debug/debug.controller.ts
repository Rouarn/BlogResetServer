/**
 * 调试面板控制器
 *
 * 功能说明:
 * - 提供调试面板的API端点
 * - 支持实时数据查询和历史数据分析
 * - 提供系统监控和性能分析接口
 * - 仅在开发环境下可用
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Public } from 'src/common/decorators';
import { DebugService } from './debug.service';
import { DevelopmentGuard } from './guards/development.guard';
import {
  DebugConfig,
  DebugInfo,
  ErrorDiagnosticRecord,
  ErrorSummary,
  RequestSummary,
  RequestTrackingRecord,
  SystemMetrics,
} from './interfaces/debug.interface';
import { ErrorDiagnosticsService } from './services/error-diagnostics.service';
import { RequestTrackingService } from './services/request-tracking.service';

@Controller({ path: 'debug' })
@Public()
@UseGuards(DevelopmentGuard)
export class DebugController {
  constructor(
    private readonly debugService: DebugService,
    private readonly requestTrackingService: RequestTrackingService,
    private readonly errorDiagnosticsService: ErrorDiagnosticsService,
  ) {}

  /**
   * 调试面板页面
   */
  @Get('panel')
  async getDebugPanel(@Res() res: Response): Promise<void> {
    try {
      const htmlPath = join(__dirname, 'views', 'debug-panel.html');
      const html = readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '调试面板加载失败',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 获取调试面板总览信息
   */
  @Get('overview')
  async getOverview(): Promise<DebugInfo> {
    return this.debugService.getDebugInfo();
  }

  /**
   * 获取系统性能指标
   */
  @Get('metrics/system')
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.debugService.getSystemMetrics();
  }

  /**
   * 获取请求统计摘要
   */
  @Get('metrics/requests')
  async getRequestMetrics(): Promise<RequestSummary> {
    return this.debugService.getRequestSummary();
  }

  /**
   * 获取错误统计摘要
   */
  @Get('metrics/errors')
  async getErrorMetrics(): Promise<ErrorSummary> {
    return this.debugService.getErrorSummary();
  }

  /**
   * 获取最近的请求记录
   */
  @Get('requests')
  async getRecentRequests(@Query('limit') limit?: string): Promise<RequestTrackingRecord[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.requestTrackingService.getRecentRequests(limitNum);
  }

  /**
   * 查询请求记录
   */
  @Post('requests/query')
  async queryRequests(
    @Body()
    filters: {
      method?: string;
      statusCode?: number;
      minDuration?: number;
      maxDuration?: number;
      startTime?: string;
      endTime?: string;
    },
  ): Promise<RequestTrackingRecord[]> {
    return this.requestTrackingService.queryRequests(filters);
  }

  /**
   * 获取最近的错误记录
   */
  @Get('errors')
  async getRecentErrors(@Query('limit') limit?: string): Promise<ErrorDiagnosticRecord[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.errorDiagnosticsService.getRecentErrors(limitNum);
  }

  /**
   * 查询错误记录
   */
  @Post('errors/query')
  async queryErrors(
    @Body()
    filters: {
      level?: 'error' | 'warn' | 'critical';
      message?: string;
      statusCode?: number;
      userId?: string;
      startTime?: string;
      endTime?: string;
    },
  ): Promise<ErrorDiagnosticRecord[]> {
    return this.errorDiagnosticsService.queryErrors(filters);
  }

  /**
   * 获取错误趋势数据
   */
  @Get('errors/trends')
  async getErrorTrends(
    @Query('hours') hours?: string,
  ): Promise<{ timestamp: string; count: number }[]> {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.errorDiagnosticsService.getErrorTrends(hoursNum);
  }

  /**
   * 获取错误详情
   */
  @Get('errors/:id')
  async getErrorDetail(@Param('id') id: string): Promise<ErrorDiagnosticRecord | null> {
    const error = this.errorDiagnosticsService.getErrorDetail(id);
    if (!error) {
      throw new HttpException('错误记录不存在', HttpStatus.NOT_FOUND);
    }
    return error;
  }

  /**
   * 标记错误为已解决
   */
  @Post('errors/:id/resolve')
  async resolveError(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const success = this.errorDiagnosticsService.markErrorAsResolved(id);
    if (!success) {
      throw new HttpException('错误记录不存在', HttpStatus.NOT_FOUND);
    }
    return { success: true, message: '错误已标记为已解决' };
  }

  /**
   * 获取性能趋势数据
   */
  @Get('performance/trends')
  async getPerformanceTrends(
    @Query('hours') hours?: string,
  ): Promise<{ requests: unknown[]; database: unknown[]; cache: unknown[]; external: unknown[] }> {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    const trends = await this.debugService.getPerformanceTrends(hoursNum);

    return trends;
  }

  /**
   * 获取最慢的操作
   */
  @Get('performance/slowest')
  async getSlowestOperations(
    @Query('limit') limit?: string,
  ): Promise<{ requests: unknown[]; database: unknown[]; cache: unknown[]; external: unknown[] }> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const slowest = await this.debugService.getSlowestOperations(limitNum);

    return slowest;
  }

  /**
   * 清除所有调试数据
   */
  @Delete('data')
  async clearDebugData(): Promise<{ success: boolean; message: string }> {
    await this.debugService.clearDebugData();
    return { success: true, message: '调试数据已清除' };
  }

  /**
   * 清除请求追踪数据
   */
  @Delete('requests')
  async clearRequestData(): Promise<{ success: boolean; message: string }> {
    await this.requestTrackingService.clearData();
    return { success: true, message: '请求追踪数据已清除' };
  }

  /**
   * 清除错误诊断数据
   */
  @Delete('errors')
  async clearErrorData(): Promise<{ success: boolean; message: string }> {
    await this.errorDiagnosticsService.clearData();
    return { success: true, message: '错误诊断数据已清除' };
  }

  /**
   * 获取调试配置信息
   */
  @Get('config')
  async getDebugConfig(): Promise<DebugConfig> {
    return {
      enabled: this.debugService.isEnabled(),
      maxRecords: 1000,
      retentionDays: 7,
      trackRequests: true,
      trackErrors: true,
      trackPerformance: true,
      sensitiveFields: ['password', 'token', 'secret'],
    };
  }

  /**
   * 健康检查端点
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
