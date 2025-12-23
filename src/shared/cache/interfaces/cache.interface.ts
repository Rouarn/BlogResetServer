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
   * 批量获取缓存值
   * @param keys 缓存键数组
   * @returns 按顺序返回的值数组
   */
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;

  /**
   * 批量设置缓存值
   * @param entries 键值对
   * @param options 缓存选项
   */
  mset<T = unknown>(entries: Record<string, T>, options?: CacheOptions): Promise<void>;

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
   * 使用 SCAN 遍历键
   * @param pattern 键模式
   * @param count 每次扫描数量
   */
  scan(pattern?: string, count?: number): Promise<string[]>;

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
   * 计数递增
   * @param key 键
   */
  incr(key: string): Promise<number>;

  /**
   * 计数递减
   * @param key 键
   */
  decr(key: string): Promise<number>;

  /**
   * Hash 读取字段
   */
  hget<T = unknown>(key: string, field: string): Promise<T | null>;

  /**
   * Hash 设置字段
   */
  hset<T = unknown>(key: string, field: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Hash 批量读取字段
   */
  hmget<T = unknown>(key: string, fields: string[]): Promise<(T | null)[]>;

  /**
   * Hash 批量设置字段
   */
  hmset<T = unknown>(
    key: string,
    entries: Record<string, T>,
    options?: CacheOptions,
  ): Promise<void>;

  /**
   * Hash 删除字段
   */
  hdel(key: string, ...fields: string[]): Promise<number>;

  /**
   * Hash 获取全部字段
   */
  hgetall<T = unknown>(key: string): Promise<Record<string, T>>;

  /**
   * Set 添加成员
   */
  sadd<T = unknown>(key: string, ...members: T[]): Promise<number>;

  /**
   * Set 删除成员
   */
  srem<T = unknown>(key: string, ...members: T[]): Promise<number>;

  /**
   * Set 获取成员
   */
  smembers<T = unknown>(key: string): Promise<T[]>;

  /**
   * Set 是否包含成员
   */
  sismember<T = unknown>(key: string, member: T): Promise<boolean>;

  /**
   * List 左推入
   */
  lpush<T = unknown>(key: string, ...values: T[]): Promise<number>;

  /**
   * List 右推入
   */
  rpush<T = unknown>(key: string, ...values: T[]): Promise<number>;

  /**
   * List 范围获取
   */
  lrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;

  /**
   * List 左弹出
   */
  lpop<T = unknown>(key: string): Promise<T | null>;

  /**
   * List 右弹出
   */
  rpop<T = unknown>(key: string): Promise<T | null>;

  /**
   * List 长度
   */
  llen(key: string): Promise<number>;

  /**
   * Sorted Set 添加成员
   */
  zadd<T = unknown>(key: string, score: number, member: T): Promise<number>;

  /**
   * Sorted Set 删除成员
   */
  zrem<T = unknown>(key: string, ...members: T[]): Promise<number>;

  /**
   * Sorted Set 获取分数
   */
  zscore<T = unknown>(key: string, member: T): Promise<number | null>;

  /**
   * Sorted Set 范围获取
   */
  zrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;

  /**
   * Sorted Set 获取成员数量
   */
  zcard(key: string): Promise<number>;

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

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 默认过期时间（秒） */
  defaultTtl: number;
  /** 键前缀 */
  keyPrefix: string;
}
