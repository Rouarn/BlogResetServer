/**
 * 调试中间件
 *
 * 功能说明:
 * - 在请求开始时启动追踪
 * - 在请求结束时记录完整信息
 * - 自动捕获请求异常并记录
 * - 仅在开发环境下启用
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { RequestTrackingService } from '../services/request-tracking.service';
import { ErrorDiagnosticsService } from '../services/error-diagnostics.service';

// 扩展Request接口以包含调试信息
interface DebugRequest extends Request {
  debugInfo?: {
    requestId: string;
    startTime: number;
  };
}

@Injectable()
export class DebugMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebugMiddleware.name);
  private readonly isDebugEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestTrackingService: RequestTrackingService,
    private readonly errorDiagnosticsService: ErrorDiagnosticsService,
  ) {
    this.isDebugEnabled = this.configService.get<string>('app.environment') === 'development';
  }

  use(req: DebugRequest, res: Response, next: NextFunction): void {
    if (!this.isDebugEnabled) {
      return next();
    }

    const startTime = Date.now();
    const requestId = this.requestTrackingService.startTracking(
      req as unknown as Record<string, unknown>,
    );

    // 将调试信息附加到请求对象
    req.debugInfo = {
      requestId,
      startTime,
    };

    // 监听响应结束事件
    const originalSend = res.send;
    const originalJson = res.json;
    let responseData: unknown;

    // 拦截响应数据
    res.send = function (data: unknown) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.json = function (data: unknown) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // 监听响应完成
    res.on('finish', () => {
      try {
        this.requestTrackingService.finishTracking(
          requestId,
          res.statusCode,
          startTime,
          responseData as Record<string, unknown> | undefined,
        );

        // 如果是错误响应，记录到错误诊断
        if (res.statusCode >= 400) {
          this.errorDiagnosticsService.recordError(
            res.statusCode >= 500 ? 'critical' : 'error',
            `HTTP ${res.statusCode} - ${req.method} ${req.url}`,
            undefined,
            {
              requestId,
              userId: (req as unknown as { user?: { id?: string } })?.user?.id,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              method: req.method,
              url: req.url,
              statusCode: res.statusCode,
            },
            {},
          );
        }
      } catch (error) {
        this.logger.error('调试中间件处理响应时发生错误:', error);
      }
    });

    // 监听响应错误
    res.on('error', (error: Error) => {
      try {
        this.requestTrackingService.finishTracking(
          requestId,
          res.statusCode || 500,
          startTime,
          undefined,
          error.message,
        );

        this.errorDiagnosticsService.recordError(
          'critical',
          error.message,
          error.stack,
          {
            requestId,
            userId: (req as unknown as { user?: { id?: string } })?.user?.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.url,
            statusCode: res.statusCode || 500,
          },
          {},
        );
      } catch (debugError) {
        this.logger.error('调试中间件处理错误时发生异常:', debugError);
      }
    });

    next();
  }

  /**
   * 清理敏感请求体数据
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
