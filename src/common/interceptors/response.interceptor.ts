import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import {
  DEFAULT_PAGINATION,
  PAGING_FIELDS,
  SUCCESS_RESPONSE,
} from '../constants/response.constant';
import { IResponse, PaginatedResponse } from '../interfaces/response.interface';

/**
 * 响应数据格式化拦截器（ResponseInterceptor）
 *
 * 用于统一格式化所有 API 接口的响应数据结构。
 *
 * 功能说明：
 * - 自动包装所有成功响应，添加统一的 code、message 字段
 * - 智能识别分页请求，自动格式化为分页响应结构
 * - 支持多种数据源格式的自动转换（records、list、items 等）
 * - 提供一致的前端数据接口，简化前端数据处理逻辑
 *
 * 响应格式：
 * - 普通响应：{ code: 200, message: 'success', data: T }
 * - 分页响应：{ code: 200, message: 'success', data: { records: T[], total: number, current: number, size: number } }
 *
 * 依赖项：
 * - IResponse: 标准响应接口
 * - PaginatedResponse: 分页响应接口
 * - SUCCESS_RESPONSE: 成功响应常量
 * - DEFAULT_PAGINATION: 分页默认参数
 * - PAGING_FIELDS: 分页字段名常量
 *
 * 用法示例：
 * - 在主模块中通过 APP_INTERCEPTOR 全局注册该拦截器
 */
@Injectable()
export class ResponseInterceptor<T = unknown> implements NestInterceptor {
  /**
   * 拦截并格式化响应数据
   * @param context 执行上下文，包含请求相关信息
   * @param next 调用处理器，用于继续执行后续逻辑
   * @returns 格式化后的响应数据流
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((rawData) => {
        const baseResponse = {
          code: SUCCESS_RESPONSE.code,
          message: SUCCESS_RESPONSE.message,
          timestamp: new Date().toISOString(),
        };

        const request = context.switchToHttp().getRequest();
        const params = this.getRequestParams(request);

        if (this.isPagingRequest(params)) {
          const paginatedData = this.formatPaginatedData(rawData, params);
          return {
            ...baseResponse,
            data: paginatedData.records,
            pagination: {
              page: Number(paginatedData.current),
              limit: Number(paginatedData.size),
              total: Number(paginatedData.total),
              totalPages: Math.ceil(Number(paginatedData.total) / Number(paginatedData.size)),
            },
          } as PaginatedResponse<T>;
        }

        return {
          ...baseResponse,
          data: rawData,
        } as IResponse<T>;
      }),
    );
  }

  /**
   * 获取请求参数（合并 query、body、params）
   * @param request 请求对象
   * @returns 合并后的参数对象
   */
  private getRequestParams(request: {
    query?: unknown;
    body?: unknown;
    params?: unknown;
  }): Record<string, unknown> {
    const query =
      request.query && typeof request.query === 'object'
        ? (request.query as Record<string, unknown>)
        : {};
    const body =
      request.body && typeof request.body === 'object'
        ? (request.body as Record<string, unknown>)
        : {};
    const params =
      request.params && typeof request.params === 'object'
        ? (request.params as Record<string, unknown>)
        : {};

    return {
      ...query,
      ...body,
      ...params,
    };
  }

  /**
   * 判断是否为分页请求
   * @param params 请求参数
   * @returns 如果包含分页字段则返回 true
   */
  private isPagingRequest(params: Record<string, unknown>): boolean {
    return PAGING_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(params, field));
  }

  /**
   * 格式化分页数据
   * @param rawData 原始响应数据
   * @param params 请求参数
   * @returns 标准化的分页数据结构
   */
  private formatPaginatedData(
    rawData: Record<string, unknown>,
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      records:
        (rawData as { records?: unknown; list?: unknown; items?: unknown }).records ||
        (rawData as { list?: unknown }).list ||
        (rawData as { items?: unknown }).items ||
        rawData,
      total: Number(
        (rawData as { total?: unknown; count?: unknown }).total ??
          (rawData as { count?: unknown }).count ??
          0,
      ),
      current: Number((params as { current?: unknown }).current) || DEFAULT_PAGINATION.MIN_PAGE,
      size: Number((params as { size?: unknown }).size) || DEFAULT_PAGINATION.DEFAULT_PAGE_SIZE,
    };
  }
}
