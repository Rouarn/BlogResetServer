/**
 * WebSocket 拦截器
 *
 * 功能说明:
 * - 统一处理 WebSocket 请求和响应
 * - 记录请求日志和性能指标
 * - 格式化响应数据
 * - 添加请求追踪和监控
 *
 * 特点:
 * - 支持请求/响应数据转换
 * - 详细的性能监控
 * - 统一的响应格式
 * - 可配置的日志级别
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { Socket } from 'socket.io';
import type { WebSocketResponse, AuthenticatedSocket } from '../interfaces';

/**
 * WebSocket 请求上下文
 */
interface WebSocketContext {
  /** Socket 连接 */
  socket: AuthenticatedSocket;
  /** 事件名称 */
  event: string;
  /** 请求数据 */
  data: unknown;
  /** 请求开始时间 */
  startTime: number;
  /** 请求ID */
  requestId: string;
  /** 用户ID */
  userId?: string;
}

/**
 * WebSocket 拦截器
 *
 * 拦截所有 WebSocket 请求和响应，提供统一的处理逻辑
 */
@Injectable()
export class WebSocketInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebSocketInterceptor.name);
  private requestCounter = 0;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 拦截 WebSocket 请求
   * @param context 执行上下文
   * @param next 调用处理器
   * @returns Observable
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const wsContext = this.extractWebSocketContext(context);

    // 记录请求开始
    this.logRequestStart(wsContext);

    return next.handle().pipe(
      // 处理成功响应
      map((data) => this.handleSuccessResponse(wsContext, data)),

      // 记录请求完成
      tap((response) => this.logRequestComplete(wsContext, response)),

      // 处理异常
      catchError((error) => this.handleErrorResponse(wsContext, error)),
    );
  }

  /**
   * 提取 WebSocket 上下文信息
   * @param context 执行上下文
   * @returns WebSocket 上下文
   */
  private extractWebSocketContext(context: ExecutionContext): WebSocketContext {
    const socket = context.switchToWs().getClient<AuthenticatedSocket>();
    const data = context.switchToWs().getData();
    const pattern = context.switchToWs().getPattern();

    const requestId = this.generateRequestId();
    const event = typeof pattern === 'string' ? pattern : 'unknown';
    const userId = socket.user?.id;

    return {
      socket,
      event,
      data,
      startTime: Date.now(),
      requestId,
      userId,
    };
  }

  /**
   * 处理成功响应
   * @param context WebSocket 上下文
   * @param data 响应数据
   * @returns 格式化的响应
   */
  private handleSuccessResponse(
    context: WebSocketContext,
    data: unknown,
  ): WebSocketResponse<unknown> {
    // 如果数据已经是标准格式，直接返回
    if (this.isWebSocketResponse(data)) {
      return data;
    }

    // 格式化响应数据
    const response: WebSocketResponse<unknown> = {
      success: true,
      data,
      timestamp: Date.now(),
      requestId: context.requestId,
    };

    // 添加元数据
    if (this.shouldIncludeMetadata(context)) {
      response.metadata = {
        event: context.event,
        processingTime: Date.now() - context.startTime,
        socketId: context.socket.id,
        userId: context.userId,
      };
    }

    return response;
  }

  /**
   * 处理错误响应
   * @param context WebSocket 上下文
   * @param error 错误对象
   * @returns Observable 错误
   */
  private handleErrorResponse(context: WebSocketContext, error: unknown): Observable<never> {
    // 记录错误
    this.logRequestError(context, error);

    // 格式化错误响应
    const errorResponse: WebSocketResponse<null> = {
      success: false,
      data: null,
      error: this.formatError(error),
      timestamp: Date.now(),
      requestId: context.requestId,
    };

    // 添加错误元数据
    if (this.shouldIncludeMetadata(context)) {
      errorResponse.metadata = {
        event: context.event,
        processingTime: Date.now() - context.startTime,
        socketId: context.socket.id,
        userId: context.userId,
        errorType: this.getErrorType(error),
      };
    }

    // 发送错误响应给客户端
    this.sendErrorToClient(context.socket, errorResponse);

    // 继续抛出错误，让异常过滤器处理
    return throwError(() => error as Error);
  }

  /**
   * 记录请求开始
   * @param context WebSocket 上下文
   */
  private logRequestStart(context: WebSocketContext): void {
    if (this.shouldLogRequest(context)) {
      this.logger.log(`WebSocket 请求开始: ${context.event}`, {
        requestId: context.requestId,
        event: context.event,
        socketId: context.socket.id,
        userId: context.userId,
        clientIp: context.socket.handshake.address,
        userAgent: context.socket.handshake.headers['user-agent'],
        data: this.sanitizeLogData(context.data),
        timestamp: new Date(context.startTime).toISOString(),
      });
    }
  }

  /**
   * 记录请求完成
   * @param context WebSocket 上下文
   * @param response 响应数据
   */
  private logRequestComplete(context: WebSocketContext, response: unknown): void {
    const processingTime = Date.now() - context.startTime;

    if (this.shouldLogRequest(context)) {
      this.logger.log(`WebSocket 请求完成: ${context.event} (${processingTime}ms)`, {
        requestId: context.requestId,
        event: context.event,
        socketId: context.socket.id,
        userId: context.userId,
        processingTime,
        responseSize: this.getResponseSize(response),
        timestamp: new Date().toISOString(),
      });
    }

    // 记录性能指标
    this.recordPerformanceMetrics(context, processingTime);
  }

  /**
   * 记录请求错误
   * @param context WebSocket 上下文
   * @param error 错误对象
   */
  private logRequestError(context: WebSocketContext, error: unknown): void {
    const processingTime = Date.now() - context.startTime;
    const errorObj = error as Error;

    this.logger.error(`WebSocket 请求失败: ${context.event} (${processingTime}ms)`, {
      requestId: context.requestId,
      event: context.event,
      socketId: context.socket.id,
      userId: context.userId,
      processingTime,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送错误响应给客户端
   * @param socket Socket 连接
   * @param errorResponse 错误响应
   */
  private sendErrorToClient(socket: Socket, errorResponse: WebSocketResponse<null>): void {
    try {
      socket.emit('error', errorResponse);
    } catch (sendError) {
      this.logger.error(
        `发送错误响应失败: ${(sendError as Error).message}`,
        (sendError as Error).stack,
      );
    }
  }

  /**
   * 生成请求ID
   * @returns 请求ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (++this.requestCounter).toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    return `ws_${timestamp}_${counter}_${random}`;
  }

  /**
   * 判断是否为 WebSocket 响应格式
   * @param data 数据
   * @returns 是否为 WebSocket 响应
   */
  private isWebSocketResponse(data: unknown): data is WebSocketResponse<unknown> {
    return data !== null && typeof data === 'object' && 'success' in data && 'timestamp' in data;
  }

  /**
   * 判断是否应该包含元数据
   * @param context WebSocket 上下文
   * @returns 是否包含元数据
   */
  private shouldIncludeMetadata(_context: WebSocketContext): boolean {
    // 在开发环境或调试模式下包含元数据
    return (
      this.configService.get<string>('NODE_ENV') === 'development' ||
      this.configService.get<boolean>('app.websocket.includeMetadata', false)
    );
  }

  /**
   * 判断是否应该记录请求日志
   * @param context WebSocket 上下文
   * @returns 是否记录日志
   */
  private shouldLogRequest(context: WebSocketContext): boolean {
    // 跳过心跳和健康检查事件
    const skipEvents = ['ping', 'pong', 'heartbeat', 'health'];

    if (skipEvents.includes(context.event)) {
      return false;
    }

    // 根据日志级别决定
    const logLevel = this.configService.get<string>('app.websocket.logLevel', 'info');

    return logLevel === 'debug' || logLevel === 'verbose';
  }

  /**
   * 格式化错误信息
   * @param error 错误对象
   * @returns 格式化的错误
   */
  private formatError(error: unknown): {
    code: string;
    message: string;
    details?: unknown;
    timestamp: number;
  } {
    const timestamp = Date.now();

    if (error instanceof Error) {
      return {
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message || '发生了未知错误',
        details:
          this.configService.get<string>('NODE_ENV') === 'development' ? error.stack : undefined,
        timestamp,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        code: (errorObj.code as string) || 'UNKNOWN_ERROR',
        message: (errorObj.message as string) || '发生了未知错误',
        details: errorObj.details,
        timestamp,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: typeof error === 'string' ? error : '发生了未知错误',
      timestamp,
    };
  }

  /**
   * 获取错误类型
   * @param error 错误对象
   * @returns 错误类型
   */
  private getErrorType(error: unknown): string {
    if (error instanceof Error) {
      return error.constructor.name;
    }

    return typeof error;
  }

  /**
   * 获取响应大小（估算）
   * @param response 响应数据
   * @returns 响应大小（字节）
   */
  private getResponseSize(response: unknown): number {
    try {
      return JSON.stringify(response).length;
    } catch {
      return 0;
    }
  }

  /**
   * 清理日志数据，移除敏感信息
   * @param data 原始数据
   * @returns 清理后的数据
   */
  private sanitizeLogData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data } as Record<string, unknown>;
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'credential',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 记录性能指标
   * @param context WebSocket 上下文
   * @param processingTime 处理时间
   */
  private recordPerformanceMetrics(context: WebSocketContext, processingTime: number): void {
    // 记录慢请求
    const slowRequestThreshold = this.configService.get<number>(
      'app.websocket.slowRequestThreshold',
      1000,
    );

    if (processingTime > slowRequestThreshold) {
      this.logger.warn(`WebSocket 慢请求检测: ${context.event} (${processingTime}ms)`, {
        requestId: context.requestId,
        event: context.event,
        socketId: context.socket.id,
        userId: context.userId,
        processingTime,
        threshold: slowRequestThreshold,
      });
    }

    // 这里可以集成其他监控系统，如 Prometheus、DataDog 等
    // 例如：this.metricsService.recordWebSocketRequest(context.event, processingTime);
  }
}
