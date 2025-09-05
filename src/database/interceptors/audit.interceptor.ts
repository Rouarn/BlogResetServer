import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DISABLE_TIMESTAMPS_KEY } from '../decorators';
import { QUERY_CONTEXT } from '../types';
import type { QueryContext } from '../types';

/**
 * 审计拦截器
 * 处理请求上下文中的审计相关配置
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 获取装饰器元数据
    const disableTimestamps = this.reflector.getAllAndOverride<boolean>(DISABLE_TIMESTAMPS_KEY, [
      handler,
      controller,
    ]);

    // 创建查询上下文
    const queryContext: QueryContext = {
      disableTimestamps: disableTimestamps || false,
    };

    // 将上下文附加到请求对象
    (request as Record<string | symbol, unknown>)[QUERY_CONTEXT] = queryContext;

    return next.handle().pipe(
      tap(() => {
        // 清理上下文（可选）
        delete (request as Record<string | symbol, unknown>)[QUERY_CONTEXT];
      }),
    );
  }
}
