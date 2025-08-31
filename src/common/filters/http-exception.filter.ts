import { Request, Response } from 'express';
import { formatTimestamp, generateUUID } from 'src/utils';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorResponse } from '../interfaces';

/**
 * 全局 HTTP 异常过滤器（HttpExceptionFilter）
 *
 * 用于统一处理所有异常，包括 HttpException 和其他错误类型，规范接口错误响应格式。
 *
 * 功能说明：
 * - 捕获所有异常类型（HttpException、Error、文件相关错误等）
 * - 统一返回结构：包含 success、code、message、timestamp、path 字段
 * - 特殊处理文件上传下载相关错误
 * - 自动获取异常状态码、错误信息、请求路径和时间戳
 * - 优化的日志输出：包含错误级别分类、精确时间戳、完整堆栈信息、上下文数据和结构化输出
 * - 智能过滤常见浏览器请求（如favicon.ico）的日志级别
 *
 * 依赖项：
 * - ErrorResponse 接口：定义统一的错误响应结构
 * - express.Response：用于发送自定义响应
 * - generateUUID：用于生成请求ID
 * - formatDate：用于格式化时间戳
 *
 * 用法示例：
 * - 在主模块中通过 APP_FILTER 全局注册该过滤器，实现全局异常处理
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 获取日志级别
   */
  private getLogLevel(status: number, url: string): string {
    // 对于常见的浏览器自动请求，降低日志级别
    const commonBrowserRequests = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
    const isCommonRequest = commonBrowserRequests.some((path) => url.includes(path));

    if (status >= 500) return 'CRITICAL';
    if (status >= 400) {
      // 对于常见的浏览器请求404，降级为DEBUG
      return isCommonRequest ? 'DEBUG' : 'ERROR';
    }
    if (status >= 300) return 'WARNING';
    if (status >= 200) return 'INFO';
    return 'DEBUG';
  }

  /**
   * 提取上下文信息
   */
  private extractContext(request: Request): Record<string, unknown> {
    return {
      requestId: request.headers['x-request-id'] ?? generateUUID(),
      userId:
        (request as Request & { user?: { id?: string } }).user?.id ??
        request.headers['x-user-id'] ??
        'anonymous',
      userAgent: request.headers['user-agent'] ?? 'unknown',
      ip:
        request.ip ??
        (request.connection as { remoteAddress?: string })?.remoteAddress ??
        'unknown',
      method: request.method,
      url: request.url,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };
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

  /**
   * 创建结构化日志
   */
  private _createStructuredLog(
    level: string,
    status: number,
    message: string,
    context: Record<string, unknown>,
    stack?: string,
  ): string {
    const logData = {
      timestamp: formatTimestamp(),
      level,
      status,
      message,
      context,
      stack: stack ?? null,
      service: 'NestJS-Template',
      environment: process.env.NODE_ENV ?? 'development',
    };

    return JSON.stringify(logData, null, 2);
  }

  /**
   * 记录错误日志
   */
  private logError(
    level: string,
    context: Record<string, unknown>,
    status: number,
    message: string,
    // structuredLog: string,
    // stack?: string,
  ): void {
    const logMessage = `[${level}] ${context.method} ${context.url} - ${status} - ${message}`;
    const icons = {
      CRITICAL: '💥',
      ERROR: '❌',
      WARNING: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🔍',
    };

    const icon = icons[level as keyof typeof icons] ?? '🔍';
    const formattedMessage = `${icon} ${logMessage}`;

    // 根据级别选择日志方法
    const logMethod =
      {
        CRITICAL: this.logger.error.bind(this.logger),
        ERROR: this.logger.error.bind(this.logger),
        WARNING: this.logger.warn.bind(this.logger),
        INFO: this.logger.log.bind(this.logger),
        DEBUG: this.logger.debug.bind(this.logger),
      }[level] ?? this.logger.debug.bind(this.logger);

    // 记录基本日志
    logMethod(formattedMessage);

    // 对于DEBUG级别，只记录简单信息
    if (level === 'DEBUG') {
      return;
    }

    // 记录结构化日志
    // logMethod(`📊 结构化日志: ${structuredLog}`);

    // 记录错误堆栈（仅对CRITICAL和ERROR级别）
    // if (stack && (level === 'CRITICAL' || level === 'ERROR')) {
    //   this.logger.error(`📚 错误堆栈:\n${stack}`);
    // }
  }

  /**
   * 捕获并处理所有异常
   * @param exception 捕获到的异常实例
   * @param host 当前请求的参数和上下文
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = String(responseObj.message ?? responseObj.error ?? message);
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // 文件相关错误的特殊处理
      if (exception.message.includes('文件大小超出限制')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
      } else if (exception.message.includes('不支持的文件类型')) {
        status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;
      } else if (exception.message.includes('文件不存在')) {
        status = HttpStatus.NOT_FOUND;
      } else if (exception.message.includes('无权限访问')) {
        status = HttpStatus.FORBIDDEN;
      } else if (exception.message.includes('文件上传失败')) {
        status = HttpStatus.BAD_REQUEST;
      } else if (exception.message.includes('存储空间不足')) {
        status = 507 as HttpStatus;
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      code: status,
      message,
      data: null,
      timestamp: formatTimestamp(),
      url: request.url,
    };

    // 提取上下文信息
    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);
    // const stack = exception instanceof Error ? exception.stack : undefined;

    // 创建结构化日志
    // const structuredLog = this.createStructuredLog(logLevel, status, message, context, stack);

    // 记录日志
    this.logError(logLevel, context, status, message /**structuredLog, stack*/);

    response.status(status).json(errorResponse);
  }
}
