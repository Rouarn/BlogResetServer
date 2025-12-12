import { HttpException, HttpStatus } from '@nestjs/common';
import { formatTimestamp } from 'src/utils/helpers';
import type { ErrorResponse } from '@/common/interfaces';

export class BusinessException extends HttpException {
  readonly details?: unknown;

  constructor(message: string | string[], status: HttpStatus, details?: unknown) {
    const body: ErrorResponse = {
      code: status,
      message,
      data: details ?? {},
      success: false,
      timestamp: formatTimestamp(),
    };
    super(body, status);
    this.details = details;
  }
}

export class BusinessExceptionFactory {
  static validation(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}验证失败`, HttpStatus.BAD_REQUEST, details);
  }

  static invalidParameter(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}参数不合法`, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}未授权`, HttpStatus.UNAUTHORIZED, details);
  }

  static forbidden(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}无权限`, HttpStatus.FORBIDDEN, details);
  }

  static notFound(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}不存在`, HttpStatus.NOT_FOUND, details);
  }

  static conflict(target: string, details?: unknown): BusinessException {
    return new BusinessException(`${target}冲突`, HttpStatus.CONFLICT, details);
  }

  static systemBusy(details?: {
    message?: string | string[];
    [key: string]: unknown;
  }): BusinessException {
    const msg = details?.message ?? '系统繁忙';
    return new BusinessException(msg, HttpStatus.TOO_MANY_REQUESTS, details);
  }
}
