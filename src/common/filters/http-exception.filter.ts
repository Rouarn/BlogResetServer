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
 *
 * 用于脱敏请求中的敏感信息（大小写不敏感、包含式匹配）。
 */
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'authorization'];

/**
 * 请求上下文
 *
 * 统一抽象请求相关的关键字段，便于日志/响应构建。
 */
type RequestContext = {
  requestId: string;
  userId: string;
  userAgent: string;
  ip: string;
  method: string;
  url: string;
  query: Record<string, unknown>;
  body: unknown;
  contentType: string;
};

/**
 * 日志字段
 *
 * 生产环境直接 JSON 输出；开发环境拼接为单行，便于阅读。
 */
type LogFields = {
  level: string;
  requestId: string;
  method: string;
  url: string;
  status: string;
  message: string;
  userId: string;
  ip: string;
  query: string;
  body: string;
  client: string;
  timestamp: string;
};

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

    const { status, responseMessage, logMessage } = this.computeMessages(exception);

    const errorResponse = this.buildErrorResponse(status, responseMessage, request.url);

    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);
    this.logError(logLevel, context, status, logMessage);

    response.status(status).json(errorResponse);
  }

  /**
   * 根据状态码和请求路径获取日志级别
   *
   * - 5xx → CRITICAL
   * - 4xx → 常见静态资源降级为 DEBUG，其它为 ERROR
   * - 3xx → WARNING
   * - 2xx → INFO
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
   *
   * 统一抽取并规范类型，保证日志与响应构建的稳定性。
   */
  private extractContext(request: Request): RequestContext {
    const reqId = request.headers['x-request-id'] ?? generateUUID();
    const ua = request.headers['user-agent'] ?? 'unknown';
    const ipRaw =
      request.ip ?? (request.connection as { remoteAddress?: string })?.remoteAddress ?? 'unknown';
    const ctx: RequestContext = {
      requestId: String(reqId),
      userId:
        (request as Request & { user?: { authId?: string } }).user?.authId ??
        (request.headers['x-user-id'] as string) ??
        'anonymous',
      userAgent: String(ua),
      ip: String(ipRaw),
      method: request.method,
      url: request.url,
      query: request.query as Record<string, unknown>,
      body: this.sanitizeBody(request.body),
      contentType: String(request.headers['content-type'] ?? ''),
    };
    return ctx;
  }

  /**
   * 清理敏感信息
   *
   * 对对象/数组进行递归脱敏；非对象直接原样返回。
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object' || body === null) return body;
    return this.sanitizeDeep(body, 0);
  }

  /**
   * 提取异常中的错误消息
   *
   * 兼容 `HttpException` 响应结构与一般 `Error`，统一为字符串数组。
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

  private computeMessages(exception: unknown): {
    status: number;
    responseMessage: string | string[];
    logMessage: string;
  } {
    /**
     * 返回两个视角的消息：
     * - responseMessage：返回给客户端，可为字符串或字符串数组
     * - logMessage：用于日志打印，统一拼接为字符串
     */
    const { status, messages } = this.extractMessages(exception);
    const ctxMsgs = this.extractContextMessages(exception);
    const responseMessage = ctxMsgs?.length
      ? `${messages.join(', ')}: ${ctxMsgs.join(', ')}`
      : messages.length === 1
        ? messages[0]
        : messages.join(', ');
    const logMessage = ctxMsgs?.length ? ctxMsgs.join(', ') : (messages.join(', ') ?? '');
    return { status, responseMessage, logMessage };
  }

  /**
   * 根据系统错误码/名称与关键词解析 HTTP 状态码
   *
   * 优先使用 `error.code/error.name`（如 ENOENT/EACCES/ENOSPC），其次匹配英文关键词（兼容中文描述）。
   */
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
   *
   * 兼容 `BusinessException`/`AppException`，支持校验错误列表与明确原因。
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
   *
   * - 测试环境：不打印
   * - 生产环境：JSON 输出
   * - 开发环境：单行输出，并对常见静态资源 404 静默
   */
  private logError(
    level: LogLevel,
    context: RequestContext,
    status: number,
    message: string,
  ): void {
    // if (process.env.NODE_ENV === 'test') return;
    const logMethod = {
      [LogLevel.CRITICAL]: this.logger.error,
      [LogLevel.ERROR]: this.logger.error,
      [LogLevel.WARNING]: this.logger.warn,
      [LogLevel.INFO]: this.logger.log,
      [LogLevel.DEBUG]: this.logger.debug,
    }[level].bind(this.logger);

    const fields = this.buildLogFields(level, context, status, message);

    if (process.env.NODE_ENV === 'production') {
      logMethod(JSON.stringify(fields));
    } else {
      const urlStr = String(context.url);
      const isCommon = COMMON_BROWSER_REQUESTS.some((p) => urlStr.includes(p));
      if (isCommon && status === HttpStatus.NOT_FOUND) return;
      logMethod(this.formatCompactLine(fields));
    }
  }

  /**
   * 构建统一的日志字段
   *
   * 包含脱敏后的 query/body 与客户端信息，便于观测与审计。
   */
  private buildLogFields(
    level: LogLevel,
    context: RequestContext,
    status: number,
    message: string,
  ): LogFields {
    return {
      level,
      requestId: String(context.requestId).slice(0, 8),
      method: context.method,
      url: context.url,
      status: String(status),
      message,
      userId: String(context.userId ?? 'anonymous'),
      ip: this.formatIp(context.ip),
      query: this.formatKeyValue(context.query),
      body: this.shouldLogBody(context.method, context.contentType)
        ? this.formatJson(context.body)
        : 'N/A',
      client: this.detectClient(context.userAgent),
      timestamp: formatTimestamp(),
    };
  }

  /**
   * 将日志字段格式化为单行（开发环境）
   */
  private formatCompactLine(fields: LogFields): string {
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

  /**
   * 判断字段名是否敏感（包含式匹配）
   */
  private isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    return SENSITIVE_FIELDS.some((f) => lower.includes(f));
  }

  /**
   * 递归脱敏（最大深度 3），避免日志过长或结构过深
   */
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

  /**
   * 判定是否打印请求体
   *
   * 仅在 `POST/PUT/PATCH` 且 `Content-Type` 包含 `application/json` 时打印。
   */
  private shouldLogBody(method: string, contentType: string): boolean {
    if (!['POST', 'PUT', 'PATCH'].includes(method)) return false;
    const ct = (contentType || '').toLowerCase();
    if (ct.includes('application/json')) return true;
    return false;
  }

  /**
   * 规范化 IP 输出，去除 `::ffff:` 前缀
   */
  private formatIp(ip: string): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip || 'unknown';
  }

  /**
   * 将对象转为简洁的 `key=value` 列表字符串
   *
   * 对敏感字段进行脱敏，对超长值进行截断。
   */
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

  /**
   * 将对象转为单行 JSON 字符串，并进行长度截断
   */
  private formatJson(body: unknown): string {
    if (!body || typeof body !== 'object') return 'N/A';
    try {
      const str = JSON.stringify(body);
      return str.length > 300 ? str.slice(0, 300) + '…' : str;
    } catch {
      return String(body).slice(0, 300);
    }
  }

  /**
   * 构建统一错误响应结构
   */
  private buildErrorResponse(
    status: number,
    message: string | string[],
    url: string,
  ): ErrorResponse {
    return {
      success: false,
      code: status,
      message,
      data: {},
      timestamp: formatTimestamp(),
      url,
    };
  }

  /**
   * 粗略解析客户端标识（浏览器/工具），便于追踪来源
   */
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
