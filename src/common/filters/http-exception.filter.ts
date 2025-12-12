import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { formatTimestamp } from 'src/utils/helpers';
import type { ErrorResponse } from '@/common/interfaces';

@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception.getResponse() as unknown;

    let message: string | string[] = '请求失败';
    let data: unknown = {};

    if (typeof raw === 'string') {
      message = raw;
    } else if (typeof raw === 'object' && raw) {
      const resObj = raw as Record<string, unknown>;
      const maybeMsg = resObj['message'];
      const maybeData = resObj['data'];
      if (typeof maybeMsg === 'string' || Array.isArray(maybeMsg)) {
        message = maybeMsg as string | string[];
      }
      data = maybeData ?? resObj;
    }

    const body: ErrorResponse = {
      code: status,
      message,
      data,
      success: false,
      timestamp: formatTimestamp(),
      error: exception.name,
      stack: process.env.NODE_ENV === 'production' ? undefined : exception.stack,
      url: (() => {
        const host =
          (request.headers['x-forwarded-host'] as string) ??
          (request.headers['host'] as string) ??
          '';
        const proto =
          (request.headers['x-forwarded-proto'] as string) ??
          (request.protocol as string) ??
          'http';
        return host ? `${proto}://${host}${request.originalUrl}` : request.originalUrl;
      })(),
      path: request.path,
    };

    response.status(status).json(body);
  }
}
