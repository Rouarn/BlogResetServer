import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DISABLE_TIMESTAMPS_KEY, QUERY_CONTEXT } from '@/database';

/**
 * 审计拦截器
 *
 * 处理请求上下文中的审计相关配置，如时间戳管理等。
 * 通过反射机制获取装饰器元数据，实现灵活的审计控制。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 拦截请求处理
   * @param context 执行上下文
   * @param next 下一步处理函数
   * @returns 处理结果的可观察对象
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 获取装饰器元数据
    const disableTimestamps = this.reflector.getAllAndOverride<boolean>(DISABLE_TIMESTAMPS_KEY, [
      handler,
      controller,
    ]);

    // 将上下文附加到请求对象
    (request as Record<string | symbol, unknown>)[QUERY_CONTEXT] = {
      disableTimestamps: disableTimestamps || false,
    };

    return next.handle().pipe(
      tap(() => {
        // 清理上下文（可选）
        delete (request as Record<string | symbol, unknown>)[QUERY_CONTEXT];
      }),
    );
  }
}
