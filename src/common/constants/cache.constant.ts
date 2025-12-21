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
export const CACHE_PREFIXES = {} as const;

/**
 * 缓存 TTL 常量（秒）
 */
export const CACHE_TTL = {} as const;
