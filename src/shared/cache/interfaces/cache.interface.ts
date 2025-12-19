/**
 * 缓存服务抽象接口
 *
 * 定义统一的缓存操作接口，支持多种实现方式（Redis、内存缓存等），
 * 确保在不同缓存实现之间可以无缝切换。
 */

/**
 * 缓存操作选项
 */
export interface CacheOptions {
  /** 缓存过期时间（秒），undefined表示永不过期 */
  ttl?: number;
  /** 键前缀 */
  prefix?: string;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 缓存键总数 */
  keys: number;
  /** 内存使用量（字节，仅内存缓存） */
  memoryUsage?: number;
}

/**
 * 缓存服务抽象接口
 *
 * 提供统一的缓存操作方法，支持基本的增删改查操作，
 * 所有实现类都必须遵循此接口规范。
 */
export interface ICacheService {
  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，不存在时返回null
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   */
  set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  del(key: string): Promise<boolean>;

  /**
   * 批量删除缓存
   * @param keys 缓存键数组
   * @returns 删除的键数量
   */
  delMany(keys: string[]): Promise<number>;

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 清空所有缓存
   */
  clear(): Promise<void>;

  /**
   * 获取所有缓存键
   * @param pattern 键模式，支持通配符
   * @returns 键数组
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * 设置缓存过期时间
   * @param key 缓存键
   * @param ttl 过期时间（秒）
   * @returns 是否设置成功
   */
  expire(key: string, ttl: number): Promise<boolean>;

  /**
   * 获取缓存剩余过期时间
   * @param key 缓存键
   * @returns 剩余时间（秒），-1表示永不过期，-2表示键不存在
   */
  ttl(key: string): Promise<number>;

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats(): Promise<CacheStats>;

  /**
   * 重置缓存统计信息
   */
  resetStats(): Promise<void>;

  /**
   * 检查缓存服务是否健康
   * @returns 是否健康
   */
  isHealthy(): Promise<boolean>;

  /**
   * 关闭缓存连接
   */
  close(): Promise<void>;
}

/**
 * 缓存服务类型枚举
 */
export enum CacheServiceType {
  /** Redis 缓存服务 */
  REDIS = 'redis',
  /** 内存缓存服务 */
  MEMORY = 'memory',
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 缓存服务类型 */
  type: CacheServiceType;
  /** 是否启用缓存 */
  enabled: boolean;
  /** 默认过期时间（秒） */
  defaultTtl: number;
  /** 键前缀 */
  keyPrefix: string;
  /** 最大缓存大小（内存缓存使用） */
  maxSize?: number;
}
