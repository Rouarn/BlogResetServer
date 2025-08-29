/**
 * 响应类型
 * @param code 响应码
 * @param message 响应信息
 * @param data 响应数据 通用数据字段
 */
export interface IResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页数据类型
 * @param records 分页数据列表
 * @param total 总记录数
 * @param current 当前页码
 * @param size 每页数量
 */
export interface PaginatedData<T = any> {
  records: T[];
  total: number;
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
export type PaginatedResponse<T = any> = IResponse<PaginatedData<T>>;

/**
 * 标准请求成功响应类型
 * @param CODE 响应码
 * @param MESSAGE 响应信息
 */
export interface SuccessResponse {
  readonly CODE: number;
  readonly MESSAGE: string;
}

/**
 * 分页默认参数类型
 * @param MIN_PAGE 最小页码
 * @param DEFAULT_PAGE_SIZE 每页默认数量
 */
export interface DefaultPagination {
  readonly MIN_PAGE: number;
  readonly DEFAULT_PAGE_SIZE: number;
}
