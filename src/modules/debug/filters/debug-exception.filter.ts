/**
 * 调试异常过滤器
 *
 * 功能说明:
 * - 扩展原有的HTTP异常过滤器
 * - 集成错误诊断服务，自动记录所有异常
 * - 提供更详细的错误上下文信息
 * - 支持错误分类和优先级管理
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { formatTimestamp, generateUUID } from 'src/utils';
import { ErrorResponse } from 'src/common/interfaces';
import { ErrorDiagnosticsService } from '../services/error-diagnostics.service';

// 扩展Request接口
interface DebugRequest extends Request {
  debugInfo?: {
    requestId: string;
    startTime: number;
  };
}

@Injectable()
@Catch()
export class DebugExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DebugExceptionFilter.name);
  private readonly isDebugEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly errorDiagnosticsService: ErrorDiagnosticsService,
  ) {
    this.isDebugEnabled = this.configService.get<string>('app.environment') === 'development';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<DebugRequest>();
    const response = ctx.getResponse<Response>();

    const { status, message, stack } = this.extractExceptionInfo(exception);
    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);

    // 记录到错误诊断服务（仅在调试模式下）
    if (this.isDebugEnabled) {
      try {
        this.errorDiagnosticsService.recordError(
          this.mapLogLevelToErrorLevel(logLevel),
          message,
          stack,
          {
            requestId: request.debugInfo?.requestId || (context.requestId as string),
            userId: context.userId as string,
            ip: context.ip as string,
            userAgent: context.userAgent as string,
            method: context.method as string,
            url: context.url as string,
            statusCode: status,
          },
          {
            query: context.query,
            body: context.body,
            exceptionType: exception?.constructor?.name || 'Unknown',
            timestamp: formatTimestamp(),
          },
        );
      } catch (debugError) {
        this.logger.error('调试异常过滤器记录错误时发生异常:', debugError);
      }
    }

    // 记录日志
    this.logError(logLevel, context, status, message, stack);

    // 构建错误响应
    const errorResponse: ErrorResponse = {
      success: false,
      code: status,
      message,
      timestamp: formatTimestamp(),
      path: request.url,
      data: null,
      ...(this.isDebugEnabled && {
        debug: {
          requestId: request.debugInfo?.requestId || context.requestId,
          stack: stack?.split('\n').slice(0, 10), // 限制堆栈深度
          context: {
            controller: this.extractControllerInfo(host),
            handler: this.extractHandlerInfo(host),
          },
        },
      }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 提取异常信息
   */
  private extractExceptionInfo(exception: unknown): {
    status: number;
    message: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        status: exception.getStatus(),
        message:
          typeof response === 'string' ? response : (response as any)?.message || exception.message,
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      // 处理特定类型的错误
      if (exception.message.includes('ENOENT')) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: '请求的资源不存在',
          stack: exception.stack,
        };
      }

      if (exception.message.includes('EACCES')) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: '访问被拒绝',
          stack: exception.stack,
        };
      }

      if (exception.message.includes('timeout')) {
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: '请求超时',
          stack: exception.stack,
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || '服务器内部错误',
        stack: exception.stack,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '未知错误',
      stack: undefined,
    };
  }

  /**
   * 提取请求上下文信息
   */
  private extractContext(request: DebugRequest): Record<string, unknown> {
    return {
      requestId: request.debugInfo?.requestId || request.headers['x-request-id'] || generateUUID(),
      userId: (request as any).user?.id || request.headers['x-user-id'] || 'anonymous',
      userAgent: request.headers['user-agent'] || 'unknown',
      ip: request.ip || request.connection?.remoteAddress || 'unknown',
      method: request.method,
      url: request.url,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(status: number, url: string): string {
    const commonBrowserRequests = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
    const isCommonRequest = commonBrowserRequests.some((path) => url.includes(path));

    if (status >= 500) return 'CRITICAL';
    if (status >= 400) {
      return isCommonRequest ? 'DEBUG' : 'ERROR';
    }
    if (status >= 300) return 'WARNING';
    return 'INFO';
  }

  /**
   * 映射日志级别到错误级别
   */
  private mapLogLevelToErrorLevel(logLevel: string): 'error' | 'warn' | 'critical' {
    switch (logLevel) {
      case 'CRITICAL':
        return 'critical';
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warn';
      default:
        return 'error';
    }
  }

  /**
   * 记录错误日志
   */
  private logError(
    level: string,
    context: Record<string, unknown>,
    status: number,
    message: string,
    stack?: string,
  ): void {
    const logMessage = this.createStructuredLog(level, status, message, context, stack);

    switch (level) {
      case 'CRITICAL':
        this.logger.error(logMessage);
        break;
      case 'ERROR':
        this.logger.error(logMessage);
        break;
      case 'WARNING':
        this.logger.warn(logMessage);
        break;
      case 'INFO':
        this.logger.log(logMessage);
        break;
      case 'DEBUG':
        this.logger.debug(logMessage);
        break;
      default:
        this.logger.error(logMessage);
    }
  }

  /**
   * 创建结构化日志
   */
  private createStructuredLog(
    level: string,
    status: number,
    message: string,
    context: Record<string, unknown>,
    stack?: string,
  ): string {
    const logData = {
      level,
      status,
      message,
      timestamp: formatTimestamp(),
      context,
      ...(stack && { stack: stack.split('\n').slice(0, 5) }),
    };

    return JSON.stringify(logData, null, 2);
  }

  /**
   * 提取控制器信息
   */
  private extractControllerInfo(host: ArgumentsHost): string {
    try {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      return request.route?.path?.split('/')[1] || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * 提取处理器信息
   */
  private extractHandlerInfo(host: ArgumentsHost): string {
    try {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      return request.route?.stack?.[0]?.name || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * 清理敏感信息
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object' || body === null) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...(body as Record<string, unknown>) };

    for (const field of sensitiveFields) {
      if (field in sanitized && sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
