import { AppException, BusinessException } from '@/common/exceptions';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { formatTimestamp, generateUUID } from 'src/utils';
import { ErrorResponse } from '../interfaces';

/**
 * 日志级别
 */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * 常见浏览器请求路径（日志降级）
 */
const COMMON_BROWSER_REQUESTS = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];

/**
 * 敏感字段
 */
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'authorization'];

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 捕获并处理所有异常
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, messages } = this.extractMessages(exception);
    const contextMessages = this.extractContextMessages(exception);
    const finalMessage = messages.length === 1 ? messages[0] : messages;

    const errorResponse: ErrorResponse = {
      success: false,
      code: status,
      message: finalMessage,
      data: contextMessages,
      timestamp: formatTimestamp(),
      url: request.url,
    };

    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);
    this.logError(logLevel, context, status, contextMessages?.join(', ') ?? '');

    response.status(status).json(errorResponse);
  }

  /**
   * 根据状态码和请求路径获取日志级别
   */
  private getLogLevel(status: number, url: string): LogLevel {
    const isCommonRequest = COMMON_BROWSER_REQUESTS.some((path) => url.includes(path));

    if (status >= 500) return LogLevel.CRITICAL;
    if (status >= 400) return isCommonRequest ? LogLevel.DEBUG : LogLevel.ERROR;
    if (status >= 300) return LogLevel.WARNING;
    if (status >= 200) return LogLevel.INFO;
    return LogLevel.DEBUG;
  }

  /**
   * 提取上下文信息
   */
  private extractContext(request: Request): Record<string, unknown> {
    return {
      requestId: request.headers['x-request-id'] ?? generateUUID(),
      userId:
        (request as Request & { user?: { authId?: string } }).user?.authId ??
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

    const sanitized = { ...(body as Record<string, unknown>) };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) sanitized[field] = '***REDACTED***';
    }
    return sanitized;
  }

  /**
   * 提取异常中的错误消息
   */
  private extractMessages(exception: unknown): { status: number; messages: string[] } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        messages = [response];
      } else if (typeof response === 'object') {
        const obj = response as Record<string, unknown>;
        const message = obj.message ?? obj.error ?? 'Internal server error';

        if (Array.isArray(message)) messages = message.map(String);
        else if (typeof message === 'string')
          messages = message.includes(',') ? message.split(',').map((m) => m.trim()) : [message];
        else messages = [String(message)];
      }
    } else if (exception instanceof Error) {
      messages = [exception.message];

      // 文件相关错误处理
      const map: Record<string, number> = {
        文件大小超出限制: HttpStatus.PAYLOAD_TOO_LARGE,
        不支持的文件类型: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        文件不存在: HttpStatus.NOT_FOUND,
        无权限访问: HttpStatus.FORBIDDEN,
        文件上传失败: HttpStatus.BAD_REQUEST,
        存储空间不足: 507,
      };
      for (const [key, code] of Object.entries(map)) {
        if (exception.message.includes(key)) {
          status = code as HttpStatus;
          break;
        }
      }
    }

    return { status, messages };
  }

  /**
   * 提取异常中的上下文消息
   */
  private extractContextMessages(exception: unknown): string[] | null {
    let ctx: Record<string, unknown> | undefined;
    if (exception instanceof BusinessException) ctx = exception.context;
    else if (exception instanceof AppException) ctx = exception.context;
    if (!ctx) return null;
    const ve = ctx['validationErrors'];
    if (Array.isArray(ve)) return ve.map((v) => String(v));
    const reason = ctx['reason'];
    if (typeof reason === 'string' && reason.trim()) return [reason];
    return null;
  }

  /**
   * 格式化并打印日志
   */
  private logError(
    level: LogLevel,
    context: Record<string, unknown>,
    status: number,
    message: string,
  ): void {
    const logMethod = {
      [LogLevel.CRITICAL]: this.logger.error,
      [LogLevel.ERROR]: this.logger.error,
      [LogLevel.WARNING]: this.logger.warn,
      [LogLevel.INFO]: this.logger.log,
      [LogLevel.DEBUG]: this.logger.debug,
    }[level].bind(this.logger);

    const fields: Record<string, string> = {
      level,
      requestId: String(context.requestId).slice(0, 8),
      method: String(context.method),
      url: String(context.url),
      status: String(status),
      message,
      userId: String(context.userId ?? 'anonymous'),
      ip: this.formatIp(context.ip as string),
      query: this.formatKeyValue(context.query as Record<string, unknown>),
      body: ['POST', 'PUT', 'PATCH'].includes(String(context.method))
        ? this.formatJson(context.body)
        : 'N/A',
      client: this.detectClient(context.userAgent as string),
      timestamp: formatTimestamp(),
    };

    if (process.env.NODE_ENV === 'production') {
      // 生产环境 → 输出 JSON，方便日志收集
      logMethod(JSON.stringify(fields));
    } else {
      // 开发环境 → 美观的表格日志
      this.printTable(logMethod, fields);
    }
  }

  /**
   * 打印表格日志
   */
  private printTable(log: (msg: string) => void, fields: Record<string, string>): void {
    const maxContentLength = Math.min(
      Math.max(...Object.values(fields).map((v) => v.length), 40),
      100,
    );
    const labelWidth = 15;
    const tableWidth = labelWidth + maxContentLength + 5;
    const separator = '─'.repeat(tableWidth);

    log('');
    log(`┌${separator}`);
    for (const [label, value] of Object.entries(fields)) {
      this.formatRow(label, value, labelWidth, maxContentLength).forEach((line) => log(line));
    }
    log(`└${separator}`);
    log('');
  }

  private formatRow(label: string, value: string, labelWidth: number, maxLen: number): string[] {
    const paddedLabel = label.padEnd(labelWidth);
    if (value.length <= maxLen) return [`│ ${paddedLabel}  ${value}`];

    const lines: string[] = [];
    let remaining = value;
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, maxLen);
      remaining = remaining.slice(maxLen);
      lines.push(
        lines.length === 0 ? `│ ${paddedLabel}  ${chunk}` : `│ ${' '.repeat(labelWidth)}  ${chunk}`,
      );
    }
    return lines;
  }

  private formatIp(ip: string): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip || 'unknown';
  }

  private formatKeyValue(obj: Record<string, unknown>): string {
    if (!obj || Object.keys(obj).length === 0) return 'N/A';
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${v ?? '<empty>'}`)
      .join(', ');
  }

  private formatJson(body: unknown): string {
    if (!body || typeof body !== 'object') return 'N/A';
    try {
      const str = JSON.stringify(body, null, 2);
      return str.length > 300 ? str.slice(0, 300) + '...' : str;
    } catch {
      return String(body).slice(0, 300);
    }
  }

  private detectClient(ua: string): string {
    if (!ua || ua === 'unknown') return 'Unknown';
    const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    if (ua.includes('Postman')) return 'Postman';
    if (ua.includes('curl')) return 'curl';
    if (ua.includes('axios')) return 'axios';
    return 'Unknown';
  }
}
