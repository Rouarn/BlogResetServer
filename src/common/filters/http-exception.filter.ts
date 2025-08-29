import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../interfaces/error-response.interface';

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
 *
 * 依赖项：
 * - ErrorResponse 接口：定义统一的错误响应结构
 * - express.Response：用于发送自定义响应
 *
 * 用法示例：
 * - 在主模块中通过 APP_FILTER 全局注册该过滤器，实现全局异常处理
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  /**
   * 捕获并处理所有异常
   * @param exception 捕获到的异常实例
   * @param host 当前请求的参数和上下文
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
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
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
