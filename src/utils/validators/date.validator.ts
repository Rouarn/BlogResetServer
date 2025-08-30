/**
 * 日期验证工具
 *
 * 提供各种日期格式验证功能
 */

/**
 * 校验是否为有效日期
 * @param date 日期字符串或Date对象
 * @returns 是否为有效日期
 */
export const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * 校验日期格式 (YYYY-MM-DD)
 * @param dateStr 日期字符串
 * @returns 是否符合格式
 */
export const isDateFormat = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && isValidDate(dateStr);
};

/**
 * 校验时间格式 (HH:mm:ss)
 * @param timeStr 时间字符串
 * @returns 是否符合格式
 */
export const isTimeFormat = (timeStr: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeStr);
};

/**
 * 校验日期时间格式 (YYYY-MM-DD HH:mm:ss)
 * @param datetimeStr 日期时间字符串
 * @returns 是否符合格式
 */
export const isDateTimeFormat = (datetimeStr: string): boolean => {
  return (
    /^\d{4}-\d{2}-\d{2} ([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(
      datetimeStr,
    ) && isValidDate(datetimeStr)
  );
};

/**
 * 校验是否为今天
 * @param date 日期字符串或Date对象
 * @returns 是否为今天
 */
export const isToday = (date: string | Date): boolean => {
  if (!isValidDate(date)) return false;

  const inputDate = new Date(date);
  const today = new Date();

  return inputDate.toDateString() === today.toDateString();
};

/**
 * 校验是否为过去的日期
 * @param date 日期字符串或Date对象
 * @returns 是否为过去的日期
 */
export const isPastDate = (date: string | Date): boolean => {
  if (!isValidDate(date)) return false;

  const inputDate = new Date(date);
  const now = new Date();

  return inputDate < now;
};

/**
 * 校验是否为未来的日期
 * @param date 日期字符串或Date对象
 * @returns 是否为未来的日期
 */
export const isFutureDate = (date: string | Date): boolean => {
  if (!isValidDate(date)) return false;

  const inputDate = new Date(date);
  const now = new Date();

  return inputDate > now;
};

/**
 * 校验年龄是否在指定范围内
 * @param birthDate 出生日期
 * @param minAge 最小年龄
 * @param maxAge 最大年龄
 * @returns 是否在年龄范围内
 */
export const isAgeInRange = (
  birthDate: string | Date,
  minAge: number,
  maxAge: number,
): boolean => {
  if (!isValidDate(birthDate)) return false;

  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();

  return age >= minAge && age <= maxAge;
};
