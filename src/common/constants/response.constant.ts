import type { DefaultPagination, SuccessResponse } from '../interfaces/response.interface';

/**
 * 标准请求成功响应常量
 */
export const SUCCESS_RESPONSE: SuccessResponse = {
  CODE: 200,
  MESSAGE: 'success',
} as const;

/**
 * 分页默认参数常量
 */
export const DEFAULT_PAGINATION: DefaultPagination = {
  MIN_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
} as const;

/**
 * 分页字段名常量
 * @type {readonly ['current', 'size']}
 * @description 包含分页相关的字段名，分别为当前页码和每页条数
 */
export const PAGING_FIELDS: readonly ['current', 'size'] = ['current', 'size'] as const;
