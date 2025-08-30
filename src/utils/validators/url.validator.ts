/**
 * URL验证工具
 *
 * 提供各种URL格式验证功能
 */

/**
 * 校验URL格式
 * @param url URL字符串
 * @returns 是否为合法URL
 */
export const isUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 校验HTTP/HTTPS URL
 * @param url URL字符串
 * @returns 是否为合法的HTTP/HTTPS URL
 */
export const isHttpUrl = (url: string): boolean => {
  return /^https?:\/\/.+/.test(url) && isUrl(url);
};

/**
 * 校验HTTPS URL
 * @param url URL字符串
 * @returns 是否为合法的HTTPS URL
 */
export const isHttpsUrl = (url: string): boolean => {
  return /^https:\/\/.+/.test(url) && isUrl(url);
};

/**
 * 校验域名格式
 * @param domain 域名字符串
 * @returns 是否为合法域名
 */
export const isDomain = (domain: string): boolean => {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    domain,
  );
};

/**
 * 校验IP地址格式
 * @param ip IP地址字符串
 * @returns 是否为合法IP地址
 */
export const isIpAddress = (ip: string): boolean => {
  return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip,
  );
};

/**
 * 校验IPv6地址格式
 * @param ipv6 IPv6地址字符串
 * @returns 是否为合法IPv6地址
 */
export const isIpv6Address = (ipv6: string): boolean => {
  return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/.test(ipv6);
};
