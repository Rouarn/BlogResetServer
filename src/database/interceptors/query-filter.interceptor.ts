import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { INCLUDE_DELETED_KEY } from '../decorators';
import type { IBaseEntity } from '../interfaces';
import type { QueryContext } from '../types';
import { QUERY_CONTEXT } from '../types';

// 定义响应数据类型
interface PaginatedResponse<T = unknown> {
  data: T[];
  total?: number;
  [key: string]: unknown;
}

interface ItemsResponse<T = unknown> {
  items: T[];
  total?: number;
  [key: string]: unknown;
}

type ResponseData<T = unknown> = T | T[] | PaginatedResponse<T> | ItemsResponse<T> | null;

/**
 * 查询过滤拦截器
 * 自动过滤查询结果中的已删除数据
 */
@Injectable()
export class QueryFilterInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 检查是否包含已删除数据
    const includeDeleted = this.reflector.getAllAndOverride<boolean>(INCLUDE_DELETED_KEY, [
      handler,
      controller,
    ]);

    // 获取或创建查询上下文
    const requestWithContext = request as Record<string | symbol, unknown>;
    const queryContext: QueryContext = (requestWithContext[QUERY_CONTEXT] as QueryContext) || {};
    queryContext.includeDeleted = includeDeleted || false;
    requestWithContext[QUERY_CONTEXT] = queryContext;

    return next.handle().pipe(
      map((data: ResponseData) => {
        // 如果明确要求包含已删除数据，则不过滤
        if (queryContext.includeDeleted) {
          return data;
        }

        // 过滤已删除的数据
        return this.filterDeletedData(data);
      }),
    );
  }

  /**
   * 过滤已删除的数据
   */
  private filterDeletedData(data: ResponseData): ResponseData {
    if (!data) {
      return data;
    }

    // 处理数组数据
    if (Array.isArray(data)) {
      return data.filter((item) => !this.isDeleted(item));
    }

    // 处理分页数据
    if (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      Array.isArray((data as PaginatedResponse).data)
    ) {
      const paginatedData = data as PaginatedResponse;
      const filteredData = paginatedData.data.filter((item: unknown) => !this.isDeleted(item));
      return {
        ...paginatedData,
        data: filteredData,
        total: filteredData.length,
      };
    }

    // 处理包含 items 字段的分页数据
    if (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      Array.isArray((data as ItemsResponse).items)
    ) {
      const itemsData = data as ItemsResponse;
      const filteredItems = itemsData.items.filter((item: unknown) => !this.isDeleted(item));
      return {
        ...itemsData,
        items: filteredItems,
        total: filteredItems.length,
      };
    }

    // 处理单个对象
    if (this.isDeleted(data)) {
      return null;
    }

    // 递归处理嵌套对象
    if (data && typeof data === 'object') {
      const result = { ...data } as Record<string, unknown>;
      for (const key in result) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = this.filterDeletedData(result[key]);
        }
      }
      return result;
    }

    return data;
  }

  /**
   * 检查数据是否已被删除
   */
  private isDeleted(item: unknown): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const obj = item as Record<string, unknown>;

    // 检查是否有 deleteTime 字段且不为 null
    if ('deleteTime' in obj) {
      return obj.deleteTime !== null && obj.deleteTime !== undefined;
    }

    // 检查是否有 delete_time 字段且不为 null
    if ('delete_time' in obj) {
      return obj.delete_time !== null && obj.delete_time !== undefined;
    }

    // 检查是否实现了 IBaseEntity 接口
    if (this.isBaseEntity(obj)) {
      return obj.deleteTime !== null && obj.deleteTime !== undefined;
    }

    return false;
  }

  /**
   * 检查对象是否为时间戳管理实体
   */
  private isBaseEntity(obj: unknown): obj is IBaseEntity {
    return (
      obj !== null &&
      obj !== undefined &&
      typeof obj === 'object' &&
      'createTime' in obj &&
      'updateTime' in obj &&
      'deleteTime' in obj
    );
  }
}
