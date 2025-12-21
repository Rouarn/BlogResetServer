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
  /** 黑名单令牌缓存键前缀 */
  BLACKLIST: 'auth:blacklist:token:',
  /** 用户令牌缓存键前缀 */
  USER_TOKENS: 'auth:user_tokens:',
} as const;

/**
 * 缓存 TTL 常量（秒）
 */
export const CACHE_TTL = {
  /** 刷新令牌缓存 TTL（秒）7天 */
  REFRESH_TOKEN: 604800,
} as const;
