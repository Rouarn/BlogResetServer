/**
 * 邮箱验证工具
 *
 * 提供各种邮箱格式验证功能
 */

/**
 * 校验邮箱格式
 * @param email 邮箱字符串
 * @returns 是否为合法邮箱
 */
export const isEmail = (email: string): boolean => {
  return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email);
};

/**
 * 校验邮箱格式（严格模式）
 * @param email 邮箱字符串
 * @returns 是否为合法邮箱
 */
export const isEmailStrict = (email: string): boolean => {
  const strictEmailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return strictEmailRegex.test(email);
};

/**
 * 校验是否为企业邮箱
 * @param email 邮箱字符串
 * @returns 是否为企业邮箱
 */
export const isCorporateEmail = (email: string): boolean => {
  if (!isEmail(email)) return false;

  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'qq.com',
    '163.com',
    '126.com',
    'sina.com',
    'sohu.com',
  ];

  const domain = email.split('@')[1].toLowerCase();
  return !personalDomains.includes(domain);
};

/**
 * 校验邮箱域名是否在白名单中
 * @param email 邮箱字符串
 * @param allowedDomains 允许的域名列表
 * @returns 是否在白名单中
 */
export const isEmailDomainAllowed = (
  email: string,
  allowedDomains: string[],
): boolean => {
  if (!isEmail(email)) return false;

  const domain = email.split('@')[1].toLowerCase();
  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
};
