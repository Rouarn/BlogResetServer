import { formatDate } from './format-date.helper';

/**
 * 格式化当前时间戳为标准格式
 * @returns 格式化后的时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export const formatTimestamp = (): string => {
  return formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化当前时间为 ISO 字符串
 * @returns ISO 格式的时间字符串
 */
export const formatISOString = (): string => {
  return new Date().toISOString();
};

/**
 * 格式化当前日期为路径格式 (YYYY-MM)
 * @returns 日期路径字符串
 */
export const formatDatePath = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * 获取当前时间戳
 * @returns 当前时间戳
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * 检查时间戳是否过期
 * @param timestamp 时间戳
 * @param maxAge 最大有效期（毫秒）
 * @returns 是否过期
 */
export const isExpired = (timestamp: number, maxAge: number): boolean => {
  return Date.now() - timestamp > maxAge;
};
