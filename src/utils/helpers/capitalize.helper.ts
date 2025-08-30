/**
 * 字符串首字母大写工具函数
 * 
 * 功能说明:
 * - 将字符串的首字母转换为大写
 * - 其余字母保持原样不变
 * - 安全处理空字符串和 falsy 值
 * 
 * 使用场景:
 * - 用户姓名格式化
 * - 标题文本处理
 * - 表单数据标准化
 * - API 响应数据格式化
 * 
 * @param str 输入字符串 - 需要进行首字母大写处理的字符串
 * @returns 首字母大写后的字符串，如果输入为空则返回空字符串
 * 
 * @example
 * ```typescript
 * capitalize('hello'); // 'Hello'
 * capitalize('world'); // 'World'
 * capitalize('API'); // 'API'
 * capitalize(''); // ''
 * capitalize(null); // '' (安全处理)
 * ```
 * 
 * @author NestJS Template
 * @version 1.0.0
 */
export const capitalize = (str: string): string => {
  // 安全检查：处理空字符串、null、undefined 等情况
  if (!str) return '';
  
  // 首字母大写 + 剩余部分保持不变
  return str.charAt(0).toUpperCase() + str.slice(1);
};
