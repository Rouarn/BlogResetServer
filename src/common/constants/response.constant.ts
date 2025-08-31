import { formatTimestamp } from 'src/utils/helpers';
import type { DefaultPagination, SuccessResponse } from '../interfaces/response.interface';

/**
 * 成功响应常量
 */
export const SUCCESS_RESPONSE: SuccessResponse = {
  code: 200,
  message: '请求成功',
  data: null,
  success: true,
  timestamp: formatTimestamp(),
};

/**
 * 默认分页参数
 */
export const DEFAULT_PAGINATION: DefaultPagination & {
  MIN_PAGE: number;
  DEFAULT_PAGE_SIZE: number;
} = {
  current: 1,
  size: 10,
  MIN_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
};

/**
 * 分页字段名常量
 */
export const PAGING_FIELDS: readonly ['current', 'size'] = ['current', 'size'] as const;
