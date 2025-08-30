/**
 * 验证工具模块统一导出
 *
 * 提供各种常用的验证功能，包括：
 * - 邮箱验证
 * - 手机号验证
 * - 身份证验证
 * - URL验证
 * - 数字验证
 * - 字符串验证
 * - 日期验证
 *
 * 用法示例：
 * ```typescript
 * import { isEmail, isPhone, isIdCard } from '@/utils/validators';
 *
 * const emailValid = isEmail('test@example.com');
 * const phoneValid = isPhone('13800138000');
 * const idCardValid = isIdCard('110101199001011234');
 * ```
 */

// 邮箱验证
export * from './email.validator';

// 手机号验证
export * from './phone.validator';

// 身份证验证
export * from './id-card.validator';

// URL验证
export * from './url.validator';

// 数字验证
export * from './number.validator';

// 字符串验证
export * from './string.validator';

// 日期验证
export * from './date.validator';
