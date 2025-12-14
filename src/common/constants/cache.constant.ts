/**
 * 缓存相关常量定义
 *
 * 定义缓存模块中使用的注入令牌和其他常量
 * 避免在代码中使用硬编码字符串，提高代码的可维护性
 *
 * @author NestJS Template
 * @version 1.0.0
 */

/**
 * 缓存服务注入令牌
 */
export const CACHE_TOKENS = {
  /** ICacheService 接口令牌 */
  I_CACHE_SERVICE: Symbol('I_CACHE_SERVICE'),
} as const;

/**
 * 缓存键前缀常量
 */
export const CACHE_PREFIXES = {
  /** 用户相关缓存前缀 */
  USER: 'auth:user',
  /** 用户列表缓存前缀 */
  USERS: 'auth:users',
  /** 用户信息缓存前缀 */
  USER_INFO: 'auth:userinfo',
  /** 认证实体缓存前缀 */
  AUTH: 'auth:auth',
  /** 验证码缓存前缀 */
  CAPTCHA: 'auth:captcha',
  /** 刷新令牌缓存前缀 */
  REFRESH_TOKEN: 'auth:refresh_token',
  /** 重置令牌缓存前缀 */
  RESET_TOKEN: 'auth:reset_token',
  /** 黑名单令牌缓存前缀 */
  BLACKLIST_TOKEN: 'auth:blacklist_token',
} as const;

/**
 * 缓存 TTL 常量（秒）
 */
export const CACHE_TTL = {
  /** 用户信息缓存时间：1小时 */
  USER_INFO: 3600,
  /** 用户列表缓存时间：30分钟 */
  USER_LIST: 1800,
  /** 验证码缓存时间：5分钟 */
  CAPTCHA: 300,
  /** 刷新令牌缓存时间：7天 */
  REFRESH_TOKEN: 604800,
  /** 重置令牌缓存时间：30分钟 */
  RESET_TOKEN: 1800,
} as const;
