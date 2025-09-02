/**
 * 请求追踪拦截器
 *
 * 功能说明:
 * - 拦截所有HTTP请求和响应
 * - 记录详细的请求执行信息
 * - 测量控制器方法执行时间
 * - 捕获异常并记录到错误诊断
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestTrackingService } from '../services/request-tracking.service';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

// 扩展Request接口
interface DebugRequest extends Request {
  debugInfo?: {
    requestId: string;
    startTime: number;
  };
}

@Injectable()
export class RequestTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTrackingInterceptor.name);
  private readonly isDebugEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestTrackingService: RequestTrackingService,
    private readonly performanceMonitorService: PerformanceMonitorService,
  ) {
    this.isDebugEnabled = this.configService.get<string>('app.environment') === 'development';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.isDebugEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<DebugRequest>();
    const response = context.switchToHttp().getResponse();
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;

    const executionStartTime = Date.now();
    const requestId = request.debugInfo?.requestId || 'unknown';

    // 检查是否启用性能监控
    const performanceMonitoring = this.configService.get<boolean>(
      'app.debug.performanceMonitoring',
      false,
    );

    // 开始性能监控（如果启用）
    let performanceId: string | undefined;
    if (performanceMonitoring) {
      performanceId = this.performanceMonitorService.startMonitoring(
        'request',
        `${request.method} ${request.url}`,
        {
          requestId,
          controller: controllerName,
          handler: handlerName,
          method: request.method,
          url: request.url,
        },
      );
    }

    return next.handle().pipe(
      tap((data) => {
        try {
          const executionTime = Date.now() - executionStartTime;

          // 记录控制器执行信息
          this.logger.debug(
            `[${requestId}] ${controllerName}.${handlerName} 执行完成 - ${executionTime}ms`,
          );

          // 完成性能监控（如果启用）
          if (performanceId) {
            this.performanceMonitorService.finishMonitoring(performanceId, true, {
              executionTime,
              responseSize: this.calculateResponseSize(data),
            });
          }

          // 如果有调试信息，更新请求记录
          if (request.debugInfo) {
            // 这里可以添加更多的执行细节
            const metadata = {
              controller: controllerName,
              handler: handlerName,
              executionTime,
              responseData: this.sanitizeResponse(data),
            };

            // 可以通过某种方式将这些信息传递给请求追踪服务
            // 由于拦截器在中间件之后执行，这里主要用于记录控制器层的信息
          }
        } catch (error) {
          this.logger.error('请求追踪拦截器处理成功响应时发生错误:', error);
        }
      }),
      catchError((error) => {
        try {
          const executionTime = Date.now() - executionStartTime;

          this.logger.error(
            `[${requestId}] ${controllerName}.${handlerName} 执行失败 - ${executionTime}ms`,
            error.stack,
          );

          // 完成性能监控（失败，如果启用）
          if (performanceId) {
            this.performanceMonitorService.finishMonitoring(performanceId, false, {
              executionTime,
              errorName: error.name,
              errorMessage: error.message,
              statusCode: error.status || 500,
            });
          }

          // 记录控制器层异常信息
          this.logger.error(`[${requestId}] 控制器异常详情`, {
            controller: controllerName,
            handler: handlerName,
            executionTime,
            query: request.query,
            body: this.sanitizeBody(request.body),
            errorName: error.name,
            errorCode: error.code,
          });
        } catch (debugError) {
          this.logger.error('请求追踪拦截器处理异常时发生错误:', debugError);
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * 清理敏感请求体数据
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 清理敏感响应数据
   */
  private sanitizeResponse(response: any): any {
    if (!response || typeof response !== 'object') {
      return response;
    }

    const sensitiveFields = ['token', 'secret', 'key', 'password'];
    const sanitized = { ...response };

    // 如果响应有data字段，也需要清理
    if (sanitized.data && typeof sanitized.data === 'object') {
      sanitized.data = { ...sanitized.data };
      for (const field of sensitiveFields) {
        if (sanitized.data[field]) {
          sanitized.data[field] = '***REDACTED***';
        }
      }
    }

    // 清理顶层敏感字段
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 计算响应大小
   */
  private calculateResponseSize(response: any): number {
    try {
      return JSON.stringify(response).length;
    } catch {
      return 0;
    }
  }
}
