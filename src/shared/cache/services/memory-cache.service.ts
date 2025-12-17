/**
 * 内存缓存服务实现
 *
 * 基于 Map 实现的内存缓存服务，作为 Redis 的 fallback 方案
 * 支持 TTL 过期机制和 LRU 淘汰策略
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { getCurrentTimestamp } from '@/utils/helpers';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheOptions, CacheStats, ICacheService } from '../interfaces';

/**
 * 缓存项接口
 */
interface CacheItem<T = unknown> {
  /** 缓存值 */
  value: T;
  /** 过期时间戳（毫秒） */
  expireAt?: number;
  /** 最后访问时间戳（毫秒） */
  lastAccessed: number;
}

@Injectable()
export class MemoryCacheService implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly cache = new Map<string, CacheItem>();
  private readonly maxSize: number;
  private readonly keyPrefix: string;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    memoryUsage: 0,
  };

  constructor(private readonly configService: ConfigService) {
    this.maxSize = this.configService.get('app.redis.cache.maxSize', 1000);
    this.keyPrefix = this.configService.get('app.redis.cache.keyPrefix', 'nestjs:');

    // 启动定期清理过期缓存的定时器
    this.startCleanupTimer();

    this.logger.log(`💾 内存缓存初始化完成 - 最大容量: ${this.maxSize}个键`);
    this.logger.log(`💾 缓存键前缀: ${this.keyPrefix}`);
    this.logger.log('💾 定期清理任务已启动');
  }

  /**
   * 获取缓存值
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const cacheKey = this.getKey(key);
    const item = this.cache.get(cacheKey);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // 更新最后访问时间
    item.lastAccessed = getCurrentTimestamp();
    this.stats.hits++;

    return item.value as T;
  }

  /**
   * 设置缓存值
   */
  async set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.getKey(key, options?.prefix);
    const now = getCurrentTimestamp();

    const ttl = options?.ttl ?? this.configService.get('app.redis.cache.defaultTtl', 3600);
    const expireAt = ttl && ttl > 0 ? now + ttl * 1000 : undefined;

    // 确保不超过容量限制
    this.ensureCapacity();

    const item: CacheItem<T> = {
      value,
      expireAt,
      lastAccessed: now,
    };

    this.cache.set(cacheKey, item);
    this.updateStats();
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    const cacheKey = this.getKey(key);
    const deleted = this.cache.delete(cacheKey);

    if (deleted) {
      this.updateStats();
    }

    return deleted;
  }

  /**
   * 批量删除缓存
   */
  async delMany(keys: string[]): Promise<number> {
    let deletedCount = 0;

    for (const key of keys) {
      const cacheKey = this.getKey(key);
      if (this.cache.delete(cacheKey)) {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.updateStats();
    }

    return deletedCount;
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    const cacheKey = this.getKey(key);
    const item = this.cache.get(cacheKey);

    if (!item) return false;

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey);
      this.updateStats();
      return false;
    }

    return true;
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.updateStats();
    this.logger.debug('Memory cache cleared');
  }

  /**
   * 获取所有缓存键
   */
  async keys(pattern?: string): Promise<string[]> {
    const keys: string[] = [];
    const searchPattern = pattern ? new RegExp(pattern.replace(/\*/g, '.*')) : null;

    for (const [key, item] of this.cache.entries()) {
      // 跳过过期的缓存项
      if (this.isExpired(item)) {
        this.cache.delete(key);
        continue;
      }

      // 移除前缀
      const cleanKey = key.replace(this.keyPrefix, '');

      if (!searchPattern || searchPattern.test(cleanKey)) {
        keys.push(cleanKey);
      }
    }

    this.updateStats();
    return keys;
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const cacheKey = this.getKey(key);
    const item = this.cache.get(cacheKey);

    if (!item || this.isExpired(item)) {
      return false;
    }

    item.expireAt = ttl > 0 ? getCurrentTimestamp() + ttl * 1000 : undefined;
    return true;
  }

  /**
   * 获取缓存剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    const cacheKey = this.getKey(key);
    const item = this.cache.get(cacheKey);

    if (!item) return -2; // 键不存在

    if (!item.expireAt) return -1; // 永不过期

    const remaining = Math.ceil((item.expireAt - getCurrentTimestamp()) / 1000);
    return remaining > 0 ? remaining : -2; // 已过期
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 重置缓存统计信息
   */
  async resetStats(): Promise<void> {
    this.stats = {
      hits: 0,
      misses: 0,
      keys: this.cache.size,
      memoryUsage: this.cache.size * 100,
    };
  }

  /**
   * 检查缓存服务是否健康
   */
  async isHealthy(): Promise<boolean> {
    // 内存缓存总是健康的
    return true;
  }

  /**
   * 关闭缓存连接
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    this.logger.log('Memory cache closed');
  }

  /**
   * 模块销毁时清理资源
   */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每5分钟清理一次过期缓存
    this.cleanupTimer = setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 获取带前缀的键名
   */
  private getKey(key: string, prefix?: string): string {
    const keyPrefix = prefix ?? this.keyPrefix;
    return `${keyPrefix}${key}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    if (!item.expireAt) return false;
    return getCurrentTimestamp() > item.expireAt;
  }

  /**
   * 清理过期的缓存项
   */
  private cleanupExpired(): void {
    const now = getCurrentTimestamp();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expireAt && now > item.expireAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache items`);
      this.updateStats();
    }
  }

  /**
   * LRU 淘汰策略：移除最久未访问的缓存项
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = getCurrentTimestamp();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug(`Evicted LRU cache item: ${oldestKey}`);
    }
  }

  /**
   * 确保缓存大小不超过限制
   */
  private ensureCapacity(): void {
    while (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.keys = this.cache.size;
    // 估算内存使用量（简单估算）
    this.stats.memoryUsage = this.cache.size * 100; // 假设每个缓存项平均100字节
  }
}
