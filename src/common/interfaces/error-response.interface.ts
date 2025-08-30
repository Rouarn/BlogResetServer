/**
 * 错误响应接口（ErrorResponse）
 * 
 * 定义系统异常情况下统一的错误响应数据结构。
 * 
 * 字段说明：
 * - success: 请求是否成功，错误响应中固定为 false
 * - code: HTTP 状态码，如 400、401、404、500 等
 * - message: 错误信息，可以是单个字符串或字符串数组（用于表单验证错误）
 * - timestamp: 错误发生的时间戳，ISO 格式字符串
 * - path: 发生错误的请求路径
 * 
 * 用法示例：
 * ```typescript
 * const errorResponse: ErrorResponse = {
 *   success: false,
 *   code: 400,
 *   message: '参数验证失败',
 *   timestamp: '2024-01-01T00:00:00.000Z',
 *   path: '/api/users'
 * };
 * ```
 */
export interface ErrorResponse {
  /** 请求是否成功，错误响应中固定为 false */
  success: boolean;
  /** HTTP 状态码 */
  code: number;
  /** 错误信息，支持单个或多个错误消息 */
  message: string | string[];
  /** 错误发生时间戳 */
  timestamp: string;
  /** 发生错误的请求路径 */
  path: string;
}
