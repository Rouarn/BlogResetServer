/**
 * 首字母大写工具函数
 * @param str 输入字符串
 * @returns 首字母大写后的字符串
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
