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
@Injectable()
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
   * 格式化请求参数
   */
  private formatQueryParams(query: Record<string, unknown>): string {
    const params: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.push(`${key}=${value}`);
      } else if (value === '') {
        params.push(`${key}=<empty>`);
      }
    }
    return params.length > 0 ? `{${params.join(', ')}}` : '{}';
  }

  /**
   * 格式化IP地址
   */
  private formatIpAddress(ip: string): string {
    if (ip === 'unknown') return 'unknown';
    // 简化IPv6映射的IPv4地址
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
    return ip;
  }

  /**
   * 记录错误日志
   */
  private logError(
    level: string,
    context: Record<string, unknown>,
    status: number,
    message: string,
  ): void {
    // 构建请求ID
    const requestId = (context.requestId as string)?.substring(0, 8) || 'unknown';

    // 获取用户信息
    const userId = context.userId && context.userId !== 'anonymous' ? context.userId : 'anonymous';

    // 获取IP信息
    const formattedIp = this.formatIpAddress(context.ip as string);

    // 获取请求参数
    let queryParams = 'N/A';
    if (context.query && Object.keys(context.query as object).length > 0) {
      queryParams = this.formatQueryParams(context.query as Record<string, unknown>);
    }

    // 获取请求体信息
    let requestBody = 'N/A';
    if (
      context.body &&
      typeof context.body === 'object' &&
      Object.keys(context.body).length > 0 &&
      ['POST', 'PUT', 'PATCH'].includes(context.method as string)
    ) {
      const bodyStr = JSON.stringify(context.body);
      requestBody = bodyStr.length > 80 ? `${bodyStr.substring(0, 80)}...` : bodyStr;
    }

    // 获取客户端信息
    let clientInfo = 'Unknown';
    if (context.userAgent && context.userAgent !== 'unknown') {
      const ua = context.userAgent as string;

      const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
      if (browserMatch) {
        clientInfo = `${browserMatch[1]}/${browserMatch[2]}`;
      } else if (ua.includes('Postman')) {
        clientInfo = 'Postman';
      } else if (ua.includes('curl')) {
        clientInfo = 'curl';
      } else if (ua.includes('axios')) {
        clientInfo = 'axios';
      }
    }

    // 根据级别选择日志方法
    const logMethod =
      {
        CRITICAL: this.logger.error.bind(this.logger),
        ERROR: this.logger.error.bind(this.logger),
        WARNING: this.logger.warn.bind(this.logger),
        INFO: this.logger.log.bind(this.logger),
        DEBUG: this.logger.debug.bind(this.logger),
      }[level] ?? this.logger.debug.bind(this.logger);

    // 构建表格格式的日志
    const tableWidth = 120; // 增加表格宽度
    const separator = '─'.repeat(tableWidth);
    const tableHeader = `┌${separator}┐`;
    const tableFooter = `└${separator}┘`;

    const formatRow = (label: string, value: string): string[] => {
      const labelWidth = 15; // 固定标签宽度
      const valueWidth = tableWidth - labelWidth - 4; // 4 = '│ ' + ' │'

      // 处理长值的换行显示
      if (value.length > valueWidth) {
        const lines = [];
        let remainingValue = value;

        // 第一行
        const firstLine = remainingValue.substring(0, valueWidth - 3) + '...';
        const paddedLabel = label.padEnd(labelWidth);
        lines.push(`│ ${paddedLabel} ${firstLine.padEnd(valueWidth)} │`);

        // 如果还有更多内容，显示完整内容的多行
        remainingValue = remainingValue.substring(valueWidth - 3);
        while (remainingValue.length > 0) {
          const chunk = remainingValue.substring(0, valueWidth);
          const emptyLabel = ' '.repeat(labelWidth);
          lines.push(`│ ${emptyLabel} ${chunk.padEnd(valueWidth)} │`);
          remainingValue = remainingValue.substring(valueWidth);
        }

        return lines;
      } else {
        const paddedLabel = label.padEnd(labelWidth);
        const paddedValue = value.padEnd(valueWidth);
        return [`│ ${paddedLabel} ${paddedValue} │`];
      }
    };

    // 记录表格格式的日志
    logMethod('');
    logMethod(tableHeader);

    // 记录每个字段，处理可能的多行内容
    const logRows = [
      formatRow('Level', level),
      formatRow('Request ID', requestId),
      formatRow('Method', context.method as string),
      formatRow('URL', context.url as string),
      formatRow('Status', status.toString()),
      formatRow('Message', message),
      formatRow('User ID', userId.toString()),
      formatRow('IP Address', formattedIp),
      formatRow('Query Params', queryParams),
      formatRow('Request Body', requestBody),
      formatRow('Client', clientInfo),
      formatRow('Timestamp', formatTimestamp()),
    ];

    // 输出所有行
    logRows.forEach((rowLines) => {
      rowLines.forEach((line) => logMethod(line));
    });

    logMethod(tableFooter);
    logMethod('');
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
    console.log('request: ', request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        messages = [exceptionResponse];
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const messageValue = responseObj.message ?? responseObj.error ?? 'Internal server error';

        if (Array.isArray(messageValue)) {
          messages = messageValue.map((msg) => String(msg));
        } else if (typeof messageValue === 'string') {
          // 处理逗号分隔的错误消息
          messages = messageValue.includes(',')
            ? messageValue.split(',').map((msg) => msg.trim())
            : [messageValue];
        } else {
          messages = [String(messageValue)];
        }
      }
    } else if (exception instanceof Error) {
      messages = [exception.message];

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

    // 智能判断返回格式：单个错误返回字符串，多个错误返回数组
    const finalMessage = messages.length === 1 ? messages[0] : messages;

    const errorResponse: ErrorResponse = {
      success: false,
      code: status,
      message: finalMessage,
      data: null,
      timestamp: formatTimestamp(),
      url: request.url,
    };

    // 提取上下文信息
    const context = this.extractContext(request);
    const logLevel = this.getLogLevel(status, request.url);

    // 记录日志
    this.logError(logLevel, context, status, messages.join(', '));

    response.status(status).json(errorResponse);
  }
}
