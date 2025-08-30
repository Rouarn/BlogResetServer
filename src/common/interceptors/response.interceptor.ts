import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse, PaginatedResponse } from '../interfaces/response.interface';
import {
  SUCCESS_RESPONSE,
  DEFAULT_PAGINATION,
  PAGING_FIELDS,
} from '../constants/response.constant';

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
export class ResponseInterceptor<T = any> implements NestInterceptor {
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
          code: SUCCESS_RESPONSE.CODE,
          message: SUCCESS_RESPONSE.MESSAGE,
        };

        const request = context.switchToHttp().getRequest();
        const params = this.getRequestParams(request);

        if (this.isPagingRequest(params)) {
          return {
            ...baseResponse,
            data: this.formatPaginatedData(rawData, params),
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
  private getRequestParams(request: any): Record<string, any> {
    return {
      ...request.query,
      ...request.body,
      ...request.params,
    };
  }

  /**
   * 判断是否为分页请求
   * @param params 请求参数
   * @returns 如果包含分页字段则返回 true
   */
  private isPagingRequest(params: Record<string, any>): boolean {
    return PAGING_FIELDS.every((field) => field in params);
  }

  /**
   * 格式化分页数据
   * @param rawData 原始响应数据
   * @param params 请求参数
   * @returns 标准化的分页数据结构
   */
  private formatPaginatedData(rawData: any, params: Record<string, any>) {
    return {
      records: rawData.records || rawData.list || rawData.items || rawData,
      total: rawData.total ?? rawData.count ?? 0,
      current: Number(params.current) || DEFAULT_PAGINATION.MIN_PAGE,
      size: Number(params.size) || DEFAULT_PAGINATION.DEFAULT_PAGE_SIZE,
    };
  }
}
