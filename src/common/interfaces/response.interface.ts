/**
 * 通用响应接口
 */
export interface IResponse<T = unknown> {
  data: T;
  message: string;
  code: number;
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
 * 分页响应接口
 */
export interface PaginatedResponse<T = unknown> extends IResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 默认分页参数
 */
export interface DefaultPagination {
  page: number;
  limit: number;
}
