/**
 * WebSocket 异常过滤器
 *
 * 功能说明:
 * - 捕获和处理 WebSocket 异常
 * - 统一异常响应格式
 * - 防止异常影响系统正常运行
 * - 提供详细的错误日志
 *
 * 特点:
 * - 支持多种异常类型处理
 * - 异常安全，不会导致连接断开
 * - 详细的错误日志记录
 * - 用户友好的错误消息
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { WebSocketError } from '../interfaces';

/**
 * WebSocket 异常过滤器
 *
 * 捕获所有 WebSocket 相关异常并进行统一处理
 */
@Catch()
export class WebSocketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  /**
   * 捕获异常并处理
   * @param exception 异常对象
   * @param host 参数主机
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    try {
      const client = host.switchToWs().getClient<Socket>();
      const data = host.switchToWs().getData();

      // 记录异常信息
      this.logException(exception, client, data);

      // 处理不同类型的异常
      const errorResponse = this.handleException(exception, client);

      // 发送错误响应给客户端
      this.sendErrorResponse(client, errorResponse);
    } catch (filterError) {
      // 过滤器本身的异常处理
      this.logger.error(
        `WebSocket 异常过滤器处理失败: ${(filterError as Error).message}`,
        (filterError as Error).stack,
      );
    }
  }

  /**
   * 处理不同类型的异常
   * @param exception 异常对象
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleException(exception: unknown, client: Socket): WebSocketError {
    // WebSocket 异常
    if (exception instanceof WsException) {
      return this.handleWsException(exception, client);
    }

    // HTTP 异常（可能从其他地方传播过来）
    if (this.isHttpException(exception)) {
      return this.handleHttpException(exception, client);
    }

    // JWT 相关异常
    if (this.isJwtException(exception)) {
      return this.handleJwtException(exception, client);
    }

    // 验证异常
    if (this.isValidationException(exception)) {
      return this.handleValidationException(exception, client);
    }

    // 数据库异常
    if (this.isDatabaseException(exception)) {
      return this.handleDatabaseException(exception, client);
    }

    // 网络异常
    if (this.isNetworkException(exception)) {
      return this.handleNetworkException(exception, client);
    }

    // 未知异常
    return this.handleUnknownException(exception, client);
  }

  /**
   * 处理 WebSocket 异常
   * @param exception WsException
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleWsException(exception: WsException, _client: Socket): WebSocketError {
    const error = exception.getError();

    if (typeof error === 'object' && error !== null) {
      // 如果错误已经是标准格式
      const errorObj = error as Record<string, unknown>;
      return {
        code: (errorObj.code as string) || 'WS_ERROR',
        message: (errorObj.message as string) || '发生了未知的 WebSocket 错误',
        details: errorObj.details,
        timestamp: Date.now(),
      };
    }

    return {
      code: 'WS_ERROR',
      message: typeof error === 'string' ? error : '发生了未知的 WebSocket 错误',
      timestamp: Date.now(),
    };
  }

  /**
   * 处理 HTTP 异常
   * @param exception HTTP 异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleHttpException(exception: unknown, _client: Socket): WebSocketError {
    const httpException = exception as { getStatus(): number; getResponse(): unknown };
    const status = httpException.getStatus();
    const response = httpException.getResponse();

    let message = '发生了 HTTP 错误';
    const details = response;

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      message = (responseObj.message as string) || message;
    } else if (typeof response === 'string') {
      message = response;
    }

    return {
      code: `HTTP_${status}`,
      message,
      details,
      timestamp: Date.now(),
    };
  }

  /**
   * 处理 JWT 异常
   * @param exception JWT 异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleJwtException(exception: unknown, _client: Socket): WebSocketError {
    const error = exception as Error;

    let code = 'JWT_ERROR';
    let message = '认证令牌错误';

    if (error.name === 'TokenExpiredError') {
      code = 'TOKEN_EXPIRED';
      message = '认证令牌已过期';
    } else if (error.name === 'JsonWebTokenError') {
      code = 'INVALID_TOKEN';
      message = '认证令牌无效';
    } else if (error.name === 'NotBeforeError') {
      code = 'TOKEN_NOT_ACTIVE';
      message = '认证令牌尚未生效';
    }

    return {
      code,
      message,
      details: error.message,
      timestamp: Date.now(),
    };
  }

  /**
   * 处理验证异常
   * @param exception 验证异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleValidationException(exception: unknown, _client: Socket): WebSocketError {
    const error = exception as { message: string; details?: unknown };

    return {
      code: 'VALIDATION_ERROR',
      message: '数据验证失败',
      details: (error as { details?: unknown }).details || (error as Error).message,
      timestamp: Date.now(),
    };
  }

  /**
   * 处理数据库异常
   * @param exception 数据库异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleDatabaseException(exception: unknown, _client: Socket): WebSocketError {
    const _error = exception as Error;

    // 不向客户端暴露具体的数据库错误信息
    return {
      code: 'DATABASE_ERROR',
      message: '数据处理失败，请稍后重试',
      timestamp: Date.now(),
    };
  }

  /**
   * 处理网络异常
   * @param exception 网络异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleNetworkException(exception: unknown, _client: Socket): WebSocketError {
    const _error = exception as Error;

    return {
      code: 'NETWORK_ERROR',
      message: '网络连接异常，请检查网络状态',
      timestamp: Date.now(),
    };
  }

  /**
   * 处理未知异常
   * @param exception 未知异常
   * @param client WebSocket 客户端
   * @returns 错误响应
   */
  private handleUnknownException(exception: unknown, _client: Socket): WebSocketError {
    const error = exception as Error;

    return {
      code: 'UNKNOWN_ERROR',
      message: '发生了未知错误，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * 发送错误响应给客户端
   * @param client WebSocket 客户端
   * @param error 错误响应
   */
  private sendErrorResponse(client: Socket, error: WebSocketError): void {
    try {
      // 发送错误事件
      client.emit('error', error);

      // 对于严重错误，可能需要断开连接
      if (this.shouldDisconnectClient(error)) {
        this.logger.warn(`严重错误，断开客户端连接: ${client.id}`);
        client.disconnect(true);
      }
    } catch (sendError) {
      this.logger.error(
        `发送错误响应失败: ${(sendError as Error).message}`,
        (sendError as Error).stack,
      );

      // 如果无法发送错误响应，强制断开连接
      try {
        client.disconnect(true);
      } catch (disconnectError) {
        this.logger.error(
          `强制断开连接失败: ${(disconnectError as Error).message}`,
          (disconnectError as Error).stack,
        );
      }
    }
  }

  /**
   * 记录异常信息
   * @param exception 异常对象
   * @param client WebSocket 客户端
   * @param data 请求数据
   */
  private logException(exception: unknown, client: Socket, data: unknown): void {
    const error = exception as Error;
    const logContext = {
      socketId: client.id,
      userId: (client as { userId?: string }).userId,
      clientIp: client.handshake.address,
      userAgent: client.handshake.headers['user-agent'],
      data: this.sanitizeLogData(data),
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`WebSocket 异常: ${error.name || 'Unknown'} - ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: logContext,
    });
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
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 判断是否应该断开客户端连接
   * @param error 错误响应
   * @returns 是否断开连接
   */
  private shouldDisconnectClient(error: WebSocketError): boolean {
    const criticalErrors = [
      'UNAUTHORIZED',
      'INVALID_TOKEN',
      'TOKEN_EXPIRED',
      'FORBIDDEN',
      'RATE_LIMIT_EXCEEDED',
    ];

    return criticalErrors.includes(error.code);
  }

  /**
   * 判断是否为 HTTP 异常
   * @param exception 异常对象
   * @returns 是否为 HTTP 异常
   */
  private isHttpException(exception: unknown): boolean {
    return Boolean(
      exception &&
        typeof exception === 'object' &&
        'getStatus' in exception &&
        'getResponse' in exception,
    );
  }

  /**
   * 判断是否为 JWT 异常
   * @param exception 异常对象
   * @returns 是否为 JWT 异常
   */
  private isJwtException(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    const jwtErrorNames = ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'];

    return jwtErrorNames.includes(exception.name);
  }

  /**
   * 判断是否为验证异常
   * @param exception 异常对象
   * @returns 是否为验证异常
   */
  private isValidationException(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    return (
      exception.name.includes('Validation') ||
      exception.message.includes('validation') ||
      exception.message.includes('invalid')
    );
  }

  /**
   * 判断是否为数据库异常
   * @param exception 异常对象
   * @returns 是否为数据库异常
   */
  private isDatabaseException(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    const dbErrorPatterns = [
      'QueryFailedError',
      'EntityNotFound',
      'TypeORMError',
      'Connection',
      'Database',
    ];

    return dbErrorPatterns.some(
      (pattern) => exception.name.includes(pattern) || exception.message.includes(pattern),
    );
  }

  /**
   * 判断是否为网络异常
   * @param exception 异常对象
   * @returns 是否为网络异常
   */
  private isNetworkException(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    const networkErrorPatterns = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'Network',
    ];

    return networkErrorPatterns.some((pattern) => exception.message.includes(pattern));
  }
}
