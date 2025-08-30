/**
 * 手机号验证工具
 *
 * 提供各种手机号格式验证功能
 */

/**
 * 校验中国大陆手机号
 * @param phone 手机号字符串
 * @returns 是否为合法手机号
 */
export const isPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 校验中国大陆手机号（严格模式）
 * @param phone 手机号字符串
 * @returns 是否为合法手机号
 */
export const isPhoneStrict = (phone: string): boolean => {
  // 更严格的手机号验证，包含具体的号段
  const strictPhoneRegex =
    /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/;
  return strictPhoneRegex.test(phone);
};

/**
 * 校验国际手机号格式
 * @param phone 手机号字符串（包含国家代码）
 * @returns 是否为合法国际手机号
 */
export const isInternationalPhone = (phone: string): boolean => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

/**
 * 格式化手机号显示（隐藏中间4位）
 * @param phone 手机号字符串
 * @returns 格式化后的手机号
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!isPhone(phone)) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
