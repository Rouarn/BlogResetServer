import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { formatTimestamp } from 'src/utils';

import { DEFAULT_PAGINATION, SUCCESS_RESPONSE } from '../constants/response.constant';
import {
  DeveloperPaginatedResponse,
  DeveloperResponse,
  IResponse,
  PaginatedData,
  PaginatedResponse,
  PaginationParams,
} from '../interfaces/response.interface';

/**
 * 响应数据格式化拦截器（ResponseInterceptor）
 *
 * 用于统一格式化所有 API 接口的响应数据结构。
 *
 * 功能说明：
 * - 将开发者接口返回的格式转换为统一的前端响应格式
 * - 普通接口支持两种返回格式：
 *   1. 直接返回数据：T -> {data: T, message: 'success', code: 200, timestamp: string}
 *   2. 包装格式：{data: T, message?: string} -> {data: T, message: string, code: 200, timestamp: string}
 * - 分页接口支持两种返回格式：
 *   1. 直接返回分页数据：{list: T[], total: number} -> 标准分页响应格式
 *   2. 包装格式：{data: {list: T[], total: number}, message?: string} -> 标准分页响应格式
 * - 通过请求参数中的 current 和 size 字段判断是否为分页请求
 * - 如果开发者未提供 message，则使用默认的成功消息
 *
 * 响应格式：
 * - 普通响应：{ code: 200, message: string, data: T, timestamp: string }
 * - 分页响应：{ code: 200, message: string, data: { records: T[], total: number, totalPages: number, current: number, size: number }, timestamp: string }
 */
@Injectable()
export class ResponseInterceptor<T = unknown> implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

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
      map((rawData: DeveloperResponse<T> | DeveloperPaginatedResponse<T>) => {
        const request = context.switchToHttp().getRequest();
        const paginationParams = this.extractPaginationParams(request);

        // 检查是否为分页响应（通过请求参数中的 current 和 size 判断）
        if (paginationParams && this.isDeveloperPaginatedResponse(rawData)) {
          const { data, message } = this.extractPaginatedDataAndMessage(rawData);
          const paginatedData = this.formatDeveloperPaginatedData<T>(data, paginationParams);

          return {
            code: SUCCESS_RESPONSE.code,
            message: message ?? SUCCESS_RESPONSE.message,
            timestamp: formatTimestamp(),
            data: paginatedData,
          } as PaginatedResponse<T>;
        }

        // 处理普通响应
        const { data, message } = this.extractDataAndMessage(rawData);
        return {
          code: SUCCESS_RESPONSE.code,
          message: message ?? SUCCESS_RESPONSE.message,
          timestamp: formatTimestamp(),
          data,
        } as IResponse<T>;
      }),
    );
  }

  /**
   * 从请求中提取分页参数
   * @param request 请求对象
   * @returns 分页参数对象，如果不存在则返回 null
   */
  private extractPaginationParams(request: {
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
  }): PaginationParams | null {
    const { query = {}, body = {}, params = {} } = request;

    // 合并所有参数
    const allParams = {
      ...((typeof query === 'object' && query) || {}),
      ...((typeof body === 'object' && body) || {}),
      ...((typeof params === 'object' && params) || {}),
    };

    // 检查是否包含分页参数 current 和 size
    const hasCurrent = 'current' in allParams && allParams.current != null;
    const hasSize = 'size' in allParams && allParams.size != null;

    if (hasCurrent && hasSize) {
      const current = Number(allParams.current) || DEFAULT_PAGINATION.MIN_PAGE;
      const size = Number(allParams.size) || DEFAULT_PAGINATION.DEFAULT_PAGE_SIZE;
      return { current, size };
    }

    return null;
  }

  /**
   * 提取普通响应的数据和消息
   * @param rawData 原始响应数据
   * @returns 提取的数据和消息
   */
  private extractDataAndMessage<T>(rawData: DeveloperResponse<T>): { data: T; message?: string } {
    // 检查是否为包装格式 {data: T, message?: string}
    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      'data' in rawData &&
      Object.prototype.hasOwnProperty.call(rawData, 'data')
    ) {
      const wrappedData = rawData as { data: T; message?: string };
      return {
        data: wrappedData.data,
        message: wrappedData.message,
      };
    }

    // 直接返回的数据格式
    return {
      data: rawData as T,
      message: undefined,
    };
  }

  /**
   * 提取分页响应的数据和消息
   * @param rawData 原始分页响应数据
   * @returns 提取的分页数据和消息
   */
  private extractPaginatedDataAndMessage<T>(rawData: DeveloperPaginatedResponse<T>): {
    data: { list: T[]; total: number };
    message?: string;
  } {
    // 检查是否为包装格式 {data: {list: T[], total: number}, message?: string}
    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      'data' in rawData &&
      typeof rawData.data === 'object' &&
      rawData.data !== null &&
      'list' in rawData.data &&
      'total' in rawData.data
    ) {
      const wrappedData = rawData as {
        data: { list: T[]; total: number };
        message?: string;
      };
      return {
        data: wrappedData.data,
        message: wrappedData.message,
      };
    }

    // 直接返回的分页数据格式 {list: T[], total: number}
    const directData = rawData as { list: T[]; total: number };
    return {
      data: directData,
      message: undefined,
    };
  }

  /**
   * 检查是否为开发者分页响应格式
   * @param data 响应数据
   * @returns 如果是分页响应则返回 true
   */
  private isDeveloperPaginatedResponse<T>(
    data: DeveloperResponse<T> | DeveloperPaginatedResponse<T>,
  ): data is DeveloperPaginatedResponse<T> {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    // 检查直接分页格式 {list: T[], total: number}
    if ('list' in data && 'total' in data && Array.isArray(data.list)) {
      return true;
    }

    // 检查包装分页格式 {data: {list: T[], total: number}, message?: string}
    if (
      'data' in data &&
      typeof data.data === 'object' &&
      data.data !== null &&
      'list' in data.data &&
      'total' in data.data &&
      Array.isArray((data.data as { list: unknown; total: unknown }).list)
    ) {
      return true;
    }

    return false;
  }

  /**
   * 格式化开发者分页数据为标准分页格式
   * @param data 提取后的分页数据 {list: T[], total: number}
   * @param paginationParams 分页参数
   * @returns 标准化的分页数据结构
   */
  private formatDeveloperPaginatedData<T>(
    data: { list: T[]; total: number },
    paginationParams: PaginationParams,
  ): PaginatedData<T> {
    const { list, total } = data;
    const { current, size } = paginationParams;
    const totalNum = Number(total ?? 0);
    const totalPages = Math.ceil(totalNum / size);

    return {
      records: list,
      total: totalNum,
      totalPages,
      current,
      size,
    };
  }
}
