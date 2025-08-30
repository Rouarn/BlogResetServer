/**
 * 异常类模块导出
 *
 * 统一导出所有自定义异常类，用于业务逻辑中的错误处理。
 *
 * 包含异常类：
 * - BusinessException: 业务逻辑异常，用于主动抛出自定义错误
 *
 * 用法示例：
 * import { BusinessException } from '@/common/exceptions';
 * throw new BusinessException('操作失败', 422);
 */
export * from './http.exception';
