/**
 * 日期格式化核心工具函数
 * 
 * 功能说明:
 * - 支持 Date 对象和时间戳两种输入格式
 * - 提供灵活的日期格式化功能
 * - 支持多种格式占位符
 * - 自动补零处理，确保格式一致性
 * - 高性能字符串替换算法
 * 
 * 支持的格式占位符:
 * - YYYY: 四位年份 (如: 2024)
 * - MM: 两位月份 (01-12)
 * - DD: 两位日期 (01-31)
 * - HH: 两位小时 (00-23)
 * - mm: 两位分钟 (00-59)
 * - ss: 两位秒数 (00-59)
 * 
 * 使用场景:
 * - 用户界面时间显示
 * - 日志文件命名和记录
 * - 数据库时间字段格式化
 * - API 响应时间格式化
 * - 报表和文档生成
 * - 文件上传路径生成
 * 
 * @param date 日期对象或时间戳 - 支持 Date 对象或毫秒级时间戳
 * @param format 格式字符串 - 默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 * 
 * @example
 * ```typescript
 * const now = new Date();
 * const timestamp = 1705312225123;
 * 
 * // 使用 Date 对象
 * formatDate(now); // '2024-01-15 14:30:25'
 * formatDate(now, 'YYYY年MM月DD日'); // '2024年01月15日'
 * formatDate(now, 'MM/DD/YYYY'); // '01/15/2024'
 * formatDate(now, 'HH:mm:ss'); // '14:30:25'
 * 
 * // 使用时间戳
 * formatDate(timestamp); // '2024-01-15 14:30:25'
 * formatDate(timestamp, 'YYYY-MM-DD'); // '2024-01-15'
 * 
 * // 用于文件命名
 * const fileName = `backup_${formatDate(now, 'YYYY-MM-DD_HH-mm-ss')}.sql`;
 * // 结果: 'backup_2024-01-15_14-30-25.sql'
 * 
 * // 用于日志记录
 * const logEntry = `[${formatDate(Date.now())}] 用户登录成功`;
 * 
 * // 用于 API 响应
 * return {
 *   data: result,
 *   createdAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
 * };
 * ```
 * 
 * @author NestJS Template
 * @version 1.0.0
 */
export const formatDate = (
  date: Date | number,
  format = 'YYYY-MM-DD HH:mm:ss',
): string => {
  // 统一转换为 Date 对象，支持时间戳输入
  const d = typeof date === 'number' ? new Date(date) : date;
  
  // 数字补零辅助函数，确保两位数格式
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // 按顺序替换格式占位符，注意月份需要+1（JavaScript月份从0开始）
  return format
    .replace('YYYY', d.getFullYear().toString())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
};
