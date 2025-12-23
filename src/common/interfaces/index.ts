/**
 * 接口类型模块导出
 *
 * 统一导出所有 TypeScript 接口定义，用于类型约束和数据结构定义。
 *
 * 包含接口：
 * - ErrorResponse: 错误响应接口，定义异常情况下的响应结构
 * - IResponse: 标准响应接口，定义成功响应的数据结构
 * - PaginatedResponse: 分页响应接口，定义分页数据的响应结构
 * - SuccessResponse: 成功响应常量接口
 * - DefaultPagination: 分页默认参数接口
 *
 * 用法示例：
 * import { IResponse, ErrorResponse } from '@/common/interfaces';
 */
export * from './response.interface';
export * from './files.interface';
export * from './current-user.interface';
