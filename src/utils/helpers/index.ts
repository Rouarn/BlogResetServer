/**
 * 辅助函数模块导出
 *
 * 统一导出所有辅助函数，提供各种实用的工具方法。
 *
 * 包含功能：
 * - 字符串处理：capitalize, randomString
 * - 数据处理：deepClone
 * - 时间处理：formatDate
 * - 性能优化：debounce, throttle
 * - 唯一标识：uuid
 *
 * 用法示例：
 * ```typescript
 * import { formatDate, debounce } from '@/utils/helpers';
 * import { isEmail } from '@/utils/validators';
 *
 * const valid = isEmail('test@example.com');
 * const formatted = formatDate(new Date());
 * const debouncedFn = debounce(() => console.log('Hello'), 300);
 * ```
 */

// 字符串处理
export * from './capitalize.helper';
export * from './random-string.helper';

// 数据处理
export * from './deep-clone.helper';
export * from './enum.helper';

// 时间处理
export * from './date.helper';
export * from './format-date.helper';

// 性能优化
export * from './debounce.helper';
export * from './throttle.helper';

// 唯一标识
export * from './uuid.helper';
