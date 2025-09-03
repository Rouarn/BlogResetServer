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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
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

@ApiTags('🔧 调试面板')
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
  @ApiExcludeEndpoint()
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
  @ApiOperation({
    summary: '📊 获取调试面板总览信息',
    description: '获取系统运行状态的综合概览，包括系统指标、请求统计和错误摘要',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取调试信息',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time', description: '数据生成时间' },
        environment: { type: 'string', description: '运行环境' },
        systemMetrics: {
          type: 'object',
          description: '系统性能指标',
          properties: {
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', description: '已使用内存(MB)' },
                total: { type: 'number', description: '总内存(MB)' },
                external: { type: 'number', description: '外部内存(MB)' },
                rss: { type: 'number', description: 'RSS内存(MB)' },
              },
            },
            cpu: {
              type: 'object',
              properties: {
                user: { type: 'number', description: '用户CPU使用率' },
                system: { type: 'number', description: '系统CPU使用率' },
              },
            },
            uptime: { type: 'number', description: '运行时间(秒)' },
            nodeVersion: { type: 'string', description: 'Node.js版本' },
            platform: { type: 'string', description: '运行平台' },
          },
        },
        requestSummary: {
          type: 'object',
          description: '请求统计摘要',
        },
        errorSummary: {
          type: 'object',
          description: '错误统计摘要',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '服务器内部错误',
  })
  @Get('overview')
  async getOverview(): Promise<DebugInfo> {
    return this.debugService.getDebugInfo();
  }

  /**
   * 获取系统性能指标
   */
  @ApiOperation({
    summary: '💻 获取系统性能指标',
    description: '获取当前系统的内存、CPU使用情况和运行时信息',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取系统指标',
    schema: {
      type: 'object',
      properties: {
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number', description: '已使用内存(MB)', example: 128.5 },
            total: { type: 'number', description: '总内存(MB)', example: 1024 },
            external: { type: 'number', description: '外部内存(MB)', example: 32.1 },
            rss: { type: 'number', description: 'RSS内存(MB)', example: 256.8 },
          },
        },
        cpu: {
          type: 'object',
          properties: {
            user: { type: 'number', description: '用户CPU使用率(%)', example: 15.2 },
            system: { type: 'number', description: '系统CPU使用率(%)', example: 8.7 },
          },
        },
        uptime: { type: 'number', description: '系统运行时间(秒)', example: 86400 },
        nodeVersion: { type: 'string', description: 'Node.js版本', example: 'v18.17.0' },
        platform: { type: 'string', description: '运行平台', example: 'linux' },
      },
    },
  })
  @Get('metrics/system')
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.debugService.getSystemMetrics();
  }

  /**
   * 获取请求统计摘要
   */
  @ApiOperation({
    summary: '📈 获取请求统计摘要',
    description: '获取HTTP请求的统计信息，包括成功率、响应时间和热门端点',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取请求统计',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总请求数', example: 1250 },
        success: { type: 'number', description: '成功请求数', example: 1180 },
        error: { type: 'number', description: '错误请求数', example: 70 },
        averageResponseTime: { type: 'number', description: '平均响应时间(ms)', example: 125.5 },
        slowestRequest: {
          type: 'object',
          nullable: true,
          properties: {
            url: { type: 'string', example: '/api/users/search' },
            method: { type: 'string', example: 'POST' },
            duration: { type: 'number', example: 2500 },
          },
        },
        requestsPerMinute: { type: 'number', description: '每分钟请求数', example: 25.8 },
        topEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string', example: '/api/users' },
              count: { type: 'number', example: 150 },
              averageTime: { type: 'number', example: 85.2 },
            },
          },
        },
      },
    },
  })
  @Get('metrics/requests')
  async getRequestMetrics(): Promise<RequestSummary> {
    return this.debugService.getRequestSummary();
  }

  /**
   * 获取错误统计摘要
   */
  @ApiOperation({
    summary: '🚨 获取错误统计摘要',
    description: '获取系统错误的统计信息，包括错误分布和频发错误',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取错误统计',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总错误数', example: 45 },
        last24Hours: { type: 'number', description: '24小时内错误数', example: 12 },
        topErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Database connection timeout' },
              count: { type: 'number', example: 8 },
              lastOccurred: { type: 'string', format: 'date-time' },
            },
          },
        },
        errorsByStatus: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { '400': 15, '404': 20, '500': 10 },
        },
      },
    },
  })
  @Get('metrics/errors')
  async getErrorMetrics(): Promise<ErrorSummary> {
    return this.debugService.getErrorSummary();
  }

  /**
   * 获取最近的请求记录
   */
  @ApiOperation({
    summary: '📋 获取最近的请求记录',
    description: '获取最近的HTTP请求记录，包括请求详情和响应信息',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '返回记录数量限制',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取请求记录',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '请求ID' },
          timestamp: { type: 'string', format: 'date-time', description: '请求时间' },
          method: { type: 'string', description: 'HTTP方法', example: 'GET' },
          url: { type: 'string', description: '请求URL', example: '/api/users' },
          statusCode: { type: 'number', description: 'HTTP状态码', example: 200 },
          duration: { type: 'number', description: '响应时间(ms)', example: 125 },
          userAgent: { type: 'string', description: '用户代理' },
          ip: { type: 'string', description: '客户端IP', example: '192.168.1.100' },
          userId: { type: 'string', description: '用户ID' },
          requestSize: { type: 'number', description: '请求大小(字节)' },
          responseSize: { type: 'number', description: '响应大小(字节)' },
        },
      },
    },
  })
  @Get('requests')
  async getRecentRequests(@Query('limit') limit?: string): Promise<RequestTrackingRecord[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.requestTrackingService.getRecentRequests(limitNum);
  }

  /**
   * 查询请求记录
   */
  @ApiOperation({
    summary: '🔍 查询请求记录',
    description: '根据指定条件查询请求记录，支持多种过滤条件',
  })
  @ApiBody({
    description: '查询过滤条件',
    schema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description: 'HTTP方法过滤',
          example: 'GET',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        statusCode: {
          type: 'number',
          description: 'HTTP状态码过滤',
          example: 200,
        },
        minDuration: {
          type: 'number',
          description: '最小响应时间(ms)',
          example: 100,
        },
        maxDuration: {
          type: 'number',
          description: '最大响应时间(ms)',
          example: 5000,
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: '开始时间',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: '结束时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '成功查询请求记录',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/RequestTrackingRecord',
      },
    },
  })
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
  @ApiOperation({
    summary: '🚨 获取最近的错误记录',
    description: '获取最近发生的错误记录，包括错误详情和上下文信息',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '返回记录数量限制',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取错误记录',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '错误ID' },
          timestamp: { type: 'string', format: 'date-time', description: '错误发生时间' },
          level: {
            type: 'string',
            enum: ['error', 'warn', 'critical'],
            description: '错误级别',
          },
          message: { type: 'string', description: '错误消息' },
          stack: { type: 'string', description: '错误堆栈' },
          context: {
            type: 'object',
            properties: {
              requestId: { type: 'string', description: '请求ID' },
              userId: { type: 'string', description: '用户ID' },
              ip: { type: 'string', description: '客户端IP' },
              userAgent: { type: 'string', description: '用户代理' },
              method: { type: 'string', description: 'HTTP方法' },
              url: { type: 'string', description: '请求URL' },
              statusCode: { type: 'number', description: 'HTTP状态码' },
            },
          },
        },
      },
    },
  })
  @Get('errors')
  async getRecentErrors(@Query('limit') limit?: string): Promise<ErrorDiagnosticRecord[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.errorDiagnosticsService.getRecentErrors(limitNum);
  }

  /**
   * 查询错误记录
   */
  @ApiOperation({
    summary: '🔍 查询错误记录',
    description: '根据指定条件查询错误记录，支持按级别、消息和时间范围过滤',
  })
  @ApiBody({
    description: '错误查询过滤条件',
    schema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['error', 'warn', 'critical'],
          description: '错误级别过滤',
          example: 'error',
        },
        message: {
          type: 'string',
          description: '错误消息关键词过滤',
          example: 'database connection',
        },
        statusCode: {
          type: 'number',
          description: 'HTTP状态码过滤',
          example: 500,
        },
        userId: {
          type: 'string',
          description: '用户ID过滤',
          example: 'user123',
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: '开始时间',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: '结束时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '成功查询错误记录',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ErrorDiagnosticRecord',
      },
    },
  })
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
  @ApiOperation({
    summary: '📈 获取错误趋势分析',
    description: '获取指定时间范围内的错误趋势数据，包括错误数量的时间分布',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: 'number',
    description: '分析时间范围(小时)',
    example: 24,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取错误趋势数据',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: '时间戳',
            example: '2023-12-01T10:00:00.000Z',
          },
          count: {
            type: 'number',
            description: '该时间段的错误数量',
            example: 5,
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '🔍 获取错误详细信息',
    description: '根据错误ID获取详细的错误诊断记录信息',
  })
  @ApiParam({
    name: 'id',
    description: '错误记录ID',
    type: 'string',
    example: 'error-123456',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取错误详情',
    schema: {
      $ref: '#/components/schemas/ErrorDiagnosticRecord',
    },
  })
  @ApiResponse({
    status: 404,
    description: '错误记录不存在',
  })
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
  @ApiOperation({
    summary: '✅ 标记错误为已解决',
    description: '将指定的错误记录标记为已解决状态',
  })
  @ApiParam({
    name: 'id',
    description: '错误记录ID',
    type: 'string',
    example: 'error-123456',
  })
  @ApiResponse({
    status: 200,
    description: '成功标记错误为已解决',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '操作结果消息',
          example: '错误已标记为已解决',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '错误记录不存在',
  })
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
  @ApiOperation({
    summary: '📊 获取性能趋势分析',
    description: '获取指定时间范围内的性能趋势数据，包括响应时间、请求量和错误率',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: 'number',
    description: '分析时间范围(小时)',
    example: 24,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取性能趋势数据',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          description: '请求性能趋势',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              avgResponseTime: { type: 'number' },
              requestCount: { type: 'number' },
            },
          },
        },
        database: {
          type: 'array',
          description: '数据库性能趋势',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              avgQueryTime: { type: 'number' },
              queryCount: { type: 'number' },
            },
          },
        },
        cache: {
          type: 'array',
          description: '缓存性能趋势',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              hitRate: { type: 'number' },
              operations: { type: 'number' },
            },
          },
        },
        external: {
          type: 'array',
          description: '外部服务性能趋势',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              avgResponseTime: { type: 'number' },
              requestCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '🐌 获取最慢的操作',
    description: '获取各类操作中响应时间最长的记录，包括请求、数据库查询、缓存操作和外部服务调用',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '返回记录数量限制',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取最慢操作列表',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          description: '最慢的请求',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '请求URL', example: '/api/users/search' },
              method: { type: 'string', description: 'HTTP方法', example: 'POST' },
              avgDuration: { type: 'number', description: '平均响应时间(ms)', example: 2450.5 },
              count: { type: 'number', description: '请求次数', example: 125 },
            },
          },
        },
        database: {
          type: 'array',
          description: '最慢的数据库查询',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '查询语句' },
              avgDuration: { type: 'number', description: '平均执行时间(ms)' },
              count: { type: 'number', description: '执行次数' },
            },
          },
        },
        cache: {
          type: 'array',
          description: '最慢的缓存操作',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: '缓存键' },
              operation: { type: 'string', description: '操作类型' },
              avgDuration: { type: 'number', description: '平均执行时间(ms)' },
              count: { type: 'number', description: '操作次数' },
            },
          },
        },
        external: {
          type: 'array',
          description: '最慢的外部服务调用',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string', description: '服务名称' },
              endpoint: { type: 'string', description: '服务端点' },
              avgDuration: { type: 'number', description: '平均响应时间(ms)' },
              count: { type: 'number', description: '调用次数' },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '🗑️ 清除所有调试数据',
    description: '清除所有调试相关数据，包括请求记录、错误记录和性能指标',
  })
  @ApiResponse({
    status: 200,
    description: '成功清除调试数据',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '操作结果消息',
          example: '调试数据已清除',
        },
      },
    },
  })
  @Delete('data')
  async clearDebugData(): Promise<{ success: boolean; message: string }> {
    await this.debugService.clearDebugData();
    return { success: true, message: '调试数据已清除' };
  }

  /**
   * 清除请求追踪数据
   */
  @ApiOperation({
    summary: '🗑️ 清理请求记录',
    description: '清理所有过期的请求跟踪记录',
  })
  @ApiResponse({
    status: 200,
    description: '成功清理请求记录',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '操作结果消息',
          example: '请求追踪数据已清除',
        },
        clearedCount: {
          type: 'number',
          description: '清理的记录数量',
          example: 1250,
        },
      },
    },
  })
  @Delete('requests')
  async clearRequestData(): Promise<{ success: boolean; message: string }> {
    await this.requestTrackingService.clearData();
    return { success: true, message: '请求追踪数据已清除' };
  }

  /**
   * 清除错误诊断数据
   */
  @ApiOperation({
    summary: '🗑️ 清理错误记录',
    description: '清理所有过期的错误诊断记录',
  })
  @ApiResponse({
    status: 200,
    description: '成功清理错误记录',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '操作结果消息',
          example: '错误诊断数据已清除',
        },
        clearedCount: {
          type: 'number',
          description: '清理的记录数量',
          example: 85,
        },
      },
    },
  })
  @Delete('errors')
  async clearErrorData(): Promise<{ success: boolean; message: string }> {
    await this.errorDiagnosticsService.clearData();
    return { success: true, message: '错误诊断数据已清除' };
  }

  /**
   * 获取调试配置信息
   */
  @ApiOperation({
    summary: '⚙️ 获取调试配置',
    description: '获取当前的调试模块配置信息，包括各功能模块的启用状态和参数',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取调试配置',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: '调试模式是否启用', example: true },
        maxRecords: { type: 'number', description: '最大记录数', example: 1000 },
        retentionDays: { type: 'number', description: '数据保留天数', example: 7 },
        trackRequests: { type: 'boolean', description: '是否跟踪请求', example: true },
        trackErrors: { type: 'boolean', description: '是否跟踪错误', example: true },
        trackPerformance: { type: 'boolean', description: '是否跟踪性能', example: true },
        sensitiveFields: {
          type: 'array',
          items: { type: 'string' },
          description: '敏感字段列表',
          example: ['password', 'token', 'secret'],
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '💚 健康检查',
    description: '检查调试模块的运行状态和基本信息',
  })
  @ApiResponse({
    status: 200,
    description: '健康检查成功',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: '服务状态',
          example: 'ok',
          enum: ['ok', 'error'],
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: '检查时间',
          example: '2023-12-01T10:30:00.000Z',
        },
        uptime: {
          type: 'number',
          description: '系统运行时间(秒)',
          example: 86400,
        },
      },
    },
  })
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
