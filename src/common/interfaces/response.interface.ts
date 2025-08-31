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
 * 分页数据类型
 * @param records 分页数据列表
 * @param total 总记录数
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
 * 分页响应类型
 * @param code 响应码
 * @param message 响应信息
 * @param data 响应数据 通用数据字段
 * @param data.records 分页数据列表
 * @param data.total 总记录数
 * @param data.current 当前页码
 * @param data.size 每页数量
 */
export type PaginatedResponse<T = unknown> = IResponse<PaginatedData<T>>;

/**
 * 默认分页参数
 * @param current 当前页码
 * @param size 每页数量
 */
export interface DefaultPagination {
  current: number;
  size: number;
}
