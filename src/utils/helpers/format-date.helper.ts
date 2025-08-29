/**
 * 日期格式化工具函数
 * @param date 日期对象或时间戳
 * @param format 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: Date | number,
  format = 'YYYY-MM-DD HH:mm:ss',
): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return format
    .replace('YYYY', d.getFullYear().toString())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
};
