import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * 全局 HTTP 异常过滤器（HttpExceptionFilter）
 *
 * 用于统一处理由 HttpException 抛出的异常，规范接口错误响应格式，提升前后端交互一致性。
 *
 * 功能说明：
 * - 捕获所有继承自 HttpException 的异常（如 UnauthorizedException、NotFoundException 等）。
 * - 统一返回结构：包含 success、code、message、timestamp、path 字段，便于前端统一处理。
 * - 自动获取异常状态码、错误信息、请求路径和时间戳。
 *
 * 依赖项：
 * - ErrorResponse 接口：定义统一的错误响应结构。
 * - express.Response：用于发送自定义响应。
 *
 * 用法示例：
 * - 在主模块中通过 APP_FILTER 全局注册该过滤器，实现全局异常处理。
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * 捕获并处理 HTTP 异常
   * @param exception 捕获到的 HttpException 实例
   * @param host 当前请求的参数和上下文
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as
      | string
      | { message: string | string[] };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse.message;

    response.status(status).json({
      success: false,
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    } as ErrorResponse);
  }
}
