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
    const logMessage = contextMessages?.join(', ') ?? messages.join(', ');

    const errorResponse: ErrorResponse = {
      success: false,
      code: status,
      message: contextMessages?.join(', ') ?? finalMessage,
      data: {},
      timestamp: formatTimestamp(),
      url: request.url,
    };

    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);
    this.logError(logLevel, context, status, logMessage);

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
      contentType: request.headers['content-type'] ?? '',
    };
  }

  /**
   * 清理敏感信息
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object' || body === null) return body;
    return this.sanitizeDeep(body, 0);
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
      const resolved = this.resolveStatusFromError(exception);
      if (resolved) status = resolved as HttpStatus;
    }

    return { status, messages };
  }

  private resolveStatusFromError(err: Error): number | null {
    const anyErr = err as unknown as { code?: string; name?: string };
    const codeOrName = (anyErr.code ?? anyErr.name ?? '').toUpperCase();
    const msg = (err.message || '').toLowerCase();

    if (codeOrName === 'ENOENT') return HttpStatus.NOT_FOUND;
    if (codeOrName === 'EACCES' || codeOrName === 'EPERM') return HttpStatus.FORBIDDEN;
    if (codeOrName === 'ENOSPC') return HttpStatus.INSUFFICIENT_STORAGE;

    const checks: { status: number; keywords: string[] }[] = [
      {
        status: HttpStatus.PAYLOAD_TOO_LARGE,
        keywords: ['file size', 'size limit', 'payload too large', '文件大小超出限制'],
      },
      {
        status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        keywords: ['unsupported media type', 'unsupported file type', '不支持的文件类型'],
      },
      { status: HttpStatus.NOT_FOUND, keywords: ['file not found', 'not found', '文件不存在'] },
      { status: HttpStatus.FORBIDDEN, keywords: ['forbidden', 'permission denied', '无权限访问'] },
      {
        status: HttpStatus.BAD_REQUEST,
        keywords: ['upload failed', 'invalid upload', '文件上传失败'],
      },
      {
        status: HttpStatus.INSUFFICIENT_STORAGE,
        keywords: ['no space', 'insufficient storage', '存储空间不足'],
      },
    ];
    for (const { status, keywords } of checks) {
      if (keywords.some((k) => msg.includes(k))) return status;
    }
    return null;
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
      body: this.shouldLogBody(String(context.method), String(context['contentType']))
        ? this.formatJson(context.body)
        : 'N/A',
      client: this.detectClient(context.userAgent as string),
      timestamp: formatTimestamp(),
    };

    if (process.env.NODE_ENV === 'production') {
      logMethod(JSON.stringify(fields));
    } else {
      const urlStr = String(context.url);
      const isCommon = COMMON_BROWSER_REQUESTS.some((p) => urlStr.includes(p));
      if (isCommon && status === HttpStatus.NOT_FOUND) return;
      logMethod(this.formatCompactLine(fields));
    }
  }

  private formatCompactLine(fields: Record<string, string>): string {
    const parts: string[] = [];
    const msg = fields.message.length > 120 ? fields.message.slice(0, 120) + '…' : fields.message;
    parts.push(
      `[${fields.level}] ${fields.method} ${fields.url} ${fields.status} ${msg}`,
      `req=${fields.requestId}`,
      `uid=${fields.userId}`,
      `ip=${fields.ip}`,
      `ua=${fields.client}`,
      `t=${fields.timestamp}`,
    );
    if (fields.query && fields.query !== 'N/A') parts.push(`q=${fields.query}`);
    if (fields.body && fields.body !== 'N/A') {
      const body = fields.body.length > 120 ? fields.body.slice(0, 120) + '…' : fields.body;
      parts.push(`body=${body}`);
    }
    return parts.join(' | ');
  }

  private isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    return SENSITIVE_FIELDS.some((f) => lower.includes(f));
  }

  private sanitizeDeep(input: unknown, depth: number): unknown {
    if (depth > 3) return '[redacted]';
    if (Array.isArray(input)) return input.map((v) => this.sanitizeDeep(v, depth + 1));
    if (input && typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = this.isSensitiveKey(k) ? '***REDACTED***' : this.sanitizeDeep(v, depth + 1);
      }
      return out;
    }
    return input;
  }

  private shouldLogBody(method: string, contentType: string): boolean {
    if (!['POST', 'PUT', 'PATCH'].includes(method)) return false;
    const ct = (contentType || '').toLowerCase();
    if (ct.includes('application/json')) return true;
    return false;
  }

  private formatIp(ip: string): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip || 'unknown';
  }

  private formatKeyValue(obj: Record<string, unknown>): string {
    if (!obj || Object.keys(obj).length === 0) return 'N/A';
    const parts: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (this.isSensitiveKey(k)) {
        parts.push(`${k}=***REDACTED***`);
        continue;
      }
      if (v === undefined || v === null) {
        parts.push(`${k}=<empty>`);
        continue;
      }
      if (typeof v === 'object') {
        try {
          const s = JSON.stringify(v);
          parts.push(`${k}=${s.length > 120 ? s.slice(0, 120) + '…' : s}`);
        } catch {
          parts.push(`${k}=[object]`);
        }
      } else {
        const s = String(v);
        parts.push(`${k}=${s.length > 120 ? s.slice(0, 120) + '…' : s}`);
      }
    }
    return parts.join(', ');
  }

  private formatJson(body: unknown): string {
    if (!body || typeof body !== 'object') return 'N/A';
    try {
      const str = JSON.stringify(body);
      return str.length > 300 ? str.slice(0, 300) + '…' : str;
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
