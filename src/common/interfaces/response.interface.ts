import type { HttpStatus } from '@nestjs/common';

/**
 * 通用响应接口 - 返回给前端的格式
 */
export interface IResponse<T = unknown> {
  data: T;
  message: string | string[];
  code: HttpStatus;
  timestamp: string;
}

/**
 * 成功响应接口
 */
export interface SuccessResponse<T = unknown> extends IResponse<T> {
  success: true;
}

/**
 * 错误响应接口
 */
export interface ErrorResponse extends IResponse<null> {
  success: false;
  error?: string;
  stack?: string;
  url?: string;
  path?: string;
}

/**
 * 开发者接口返回数据类型（普通接口）
 * Controller 中可以返回的格式:
 * 1. 直接返回数据: T (如 {token: 'xxx'} 或 string 等)
 * 2. 包装格式: {data: T, message?: string}
 */
export type DeveloperResponse<T = unknown> =
  | T
  | {
      data: T;
      message?: string;
    };

/**
 * 开发者接口返回数据类型（分页接口）
 * Controller 中可以返回的格式:
 * 1. 直接返回分页数据: {list: T[], total: number}
 * 2. 包装格式: {data: {list: T[], total: number}, message?: string}
 */
export type DeveloperPaginatedResponse<T = unknown> =
  | { list: T[]; total: number }
  | {
      data: {
        list: T[];
        total: number;
      };
      message?: string;
    };

/**
 * 分页数据类型 - 返回给前端的格式
 * @param records 分页数据列表
 * @param total 总记录数
 * @param totalPages 总页数
 * @param current 当前页码
 * @param size 每页数量
 */
export interface PaginatedData<T = unknown> {
  records: T[];
  total: number;
  totalPages: number;
  current: number;
  size: number;
}

/**
 * 分页响应类型 - 返回给前端的格式
 */
export type PaginatedResponse<T = unknown> = IResponse<PaginatedData<T>>;

/**
 * 分页参数
 * @param current 当前页码
 * @param size 每页数量
 */
export interface PaginationParams {
  current: number;
  size: number;
}
