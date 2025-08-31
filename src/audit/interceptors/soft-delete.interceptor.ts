import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FORCE_DELETE_KEY } from '../decorators';
import { QUERY_CONTEXT, QueryContext } from '../types';

interface DeleteResponse {
  message?: string;
  deleteType?: 'hard' | 'soft';
  [key: string]: unknown;
}

/**
 * 软删除拦截器
 * 拦截删除操作并转换为软删除
 */
@Injectable()
export class SoftDeleteInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<DeleteResponse | unknown> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 检查是否为强制删除
    const forceDelete = this.reflector.getAllAndOverride<boolean>(FORCE_DELETE_KEY, [
      handler,
      controller,
    ]);

    // 获取或创建查询上下文
    const requestWithContext = request as Record<string | symbol, unknown>;
    const queryContext: QueryContext = (requestWithContext[QUERY_CONTEXT] as QueryContext) || {};
    queryContext.forceDelete = forceDelete || false;
    requestWithContext[QUERY_CONTEXT] = queryContext;

    return next.handle().pipe(
      map((data: unknown) => {
        // 处理删除操作的响应
        if (this.isDeleteOperation(context)) {
          return this.handleDeleteResponse(data, queryContext);
        }
        return data;
      }),
    );
  }

  /**
   * 检查是否为删除操作
   */
  private isDeleteOperation(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // 使用类型守卫来安全访问属性
    const method = this.getStringProperty(request, 'method');
    const url = this.getStringProperty(request, 'url');

    // 检查 HTTP 方法
    if (typeof method === 'string' && method.toLowerCase() === 'delete') {
      return true;
    }

    // 检查 URL 路径是否包含删除相关的关键词
    if (typeof url === 'string') {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('/delete') || lowerUrl.includes('/remove')) {
        return true;
      }
    }

    // 检查方法名是否包含删除相关的关键词
    const handler = context.getHandler() as unknown as { name?: string };
    const handlerName = handler?.name;
    if (typeof handlerName === 'string') {
      const lowerHandlerName = handlerName.toLowerCase();
      if (lowerHandlerName.includes('delete') || lowerHandlerName.includes('remove')) {
        return true;
      }
    }

    return false;
  }

  /**
   * 安全获取字符串属性的辅助方法
   */
  private getStringProperty(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * 处理删除操作的响应
   */
  private handleDeleteResponse(data: unknown, context: QueryContext): DeleteResponse {
    const baseData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    if (context.forceDelete) {
      // 强制删除，返回原始响应
      return {
        ...baseData,
        message: (baseData.message as string) || '删除成功',
        deleteType: 'hard',
      };
    } else {
      // 软删除，修改响应消息
      return {
        ...baseData,
        message: (baseData.message as string) || '删除成功（软删除）',
        deleteType: 'soft',
      };
    }
  }
}
