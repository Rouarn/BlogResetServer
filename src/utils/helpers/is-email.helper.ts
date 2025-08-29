/**
 * 校验邮箱格式
 * @param email 邮箱字符串
 * @returns 是否为合法邮箱
 */
export const isEmail = (email: string): boolean => {
  return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email);
};
