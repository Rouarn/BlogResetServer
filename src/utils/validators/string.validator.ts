/**
 * 字符串验证工具
 *
 * 提供各种字符串格式验证功能
 */

/**
 * 校验是否为空字符串或仅包含空白字符
 * @param str 字符串
 * @returns 是否为空
 */
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * 校验字符串长度是否在指定范围内
 * @param str 字符串
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在范围内
 */
export const isLengthInRange = (
  str: string,
  min: number,
  max: number,
): boolean => {
  const length = str.length;
  return length >= min && length <= max;
};

/**
 * 校验是否只包含字母
 * @param str 字符串
 * @returns 是否只包含字母
 */
export const isAlpha = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * 校验是否只包含字母和数字
 * @param str 字符串
 * @returns 是否只包含字母和数字
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * 校验是否只包含中文字符
 * @param str 字符串
 * @returns 是否只包含中文字符
 */
export const isChinese = (str: string): boolean => {
  return /^[\u4e00-\u9fa5]+$/.test(str);
};

/**
 * 校验是否为有效的用户名（字母、数字、下划线，3-20位）
 * @param username 用户名
 * @returns 是否为有效用户名
 */
export const isUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

/**
 * 校验密码强度（至少8位，包含大小写字母、数字）
 * @param password 密码
 * @returns 是否为强密码
 */
export const isStrongPassword = (password: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
};

/**
 * 校验是否包含特殊字符
 * @param str 字符串
 * @returns 是否包含特殊字符
 */
export const hasSpecialChars = (str: string): boolean => {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);
};
