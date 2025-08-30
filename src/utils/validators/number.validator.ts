/**
 * 数字验证工具
 *
 * 提供各种数字格式验证功能
 */

/**
 * 校验是否为整数
 * @param value 值
 * @returns 是否为整数
 */
export const isInteger = (value: any): boolean => {
  return Number.isInteger(Number(value));
};

/**
 * 校验是否为正整数
 * @param value 值
 * @returns 是否为正整数
 */
export const isPositiveInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * 校验是否为非负整数
 * @param value 值
 * @returns 是否为非负整数
 */
export const isNonNegativeInteger = (value: any): boolean => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};

/**
 * 校验是否为浮点数
 * @param value 值
 * @returns 是否为浮点数
 */
export const isFloat = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 校验是否在指定范围内
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * 校验是否为有效的百分比（0-100）
 * @param value 值
 * @returns 是否为有效百分比
 */
export const isPercentage = (value: any): boolean => {
  const num = Number(value);
  return isFloat(num) && num >= 0 && num <= 100;
};

/**
 * 校验是否为有效的金额（最多2位小数）
 * @param value 值
 * @returns 是否为有效金额
 */
export const isMoney = (value: any): boolean => {
  return /^\d+(\.\d{1,2})?$/.test(String(value));
};
