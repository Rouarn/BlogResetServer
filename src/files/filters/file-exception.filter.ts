import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class FileExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FileExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        details = responseObj.details;
        errorCode = responseObj.code || this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = this.getErrorCodeFromMessage(exception.message);
      
      // 特殊错误处理
      if (exception.message.includes('文件大小超出限制')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        errorCode = 'FILE_TOO_LARGE';
      } else if (exception.message.includes('不支持的文件类型')) {
        status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;
        errorCode = 'UNSUPPORTED_FILE_TYPE';
      } else if (exception.message.includes('文件不存在')) {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'FILE_NOT_FOUND';
      } else if (exception.message.includes('无权限访问')) {
        status = HttpStatus.FORBIDDEN;
        errorCode = 'ACCESS_DENIED';
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
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

  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'FILE_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  private getErrorCodeFromMessage(message: string): string {
    if (message.includes('validation')) return 'VALIDATION_ERROR';
    if (message.includes('duplicate')) return 'DUPLICATE_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('unauthorized')) return 'UNAUTHORIZED';
    if (message.includes('forbidden')) return 'FORBIDDEN';
    return 'INTERNAL_SERVER_ERROR';
  }
}