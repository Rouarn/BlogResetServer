/**
 * 生成指定长度的随机字符串
 * @param length 字符串长度，默认 8
 * @returns 随机字符串
 */
export const randomString = (length = 8): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
