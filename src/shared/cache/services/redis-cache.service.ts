/**
 * Redis 缓存服务实现
 *
 * 基于 ioredis 实现的缓存服务，提供高性能的分布式缓存功能
 * 支持连接失败时的优雅降级处理
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheOptions, CacheStats, ICacheService } from '../interfaces';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis | null = null;
  private isConnected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
  };

  constructor(private readonly configService: ConfigService) {
    // 不在构造函数中初始化，而是在需要时初始化
  }

  /**
   * 初始化 Redis 连接
   */
  async initializeRedis(): Promise<void> {
    if (this.redis) {
      return; // 已经初始化过了
    }

    try {
      const redisConfig = this.configService.get('app.redis') as {
        enabled: boolean;
        host: string;
        port: number;
        password?: string;
        db: number;
        options?: Record<string, unknown>;
      };

      if (!redisConfig?.enabled) {
        this.logger.warn('Redis is disabled in configuration');
        return;
      }

      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        connectTimeout: 5000,
        lazyConnect: true, // 延迟连接
        ...redisConfig.options,
      });

      // 监听连接事件
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('🟢 Redis 连接成功');
      });

      this.redis.on('error', (error: Error) => {
        this.isConnected = false;
        this.logger.error(`❌ Redis 连接错误: ${error.message}`);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('⚪ Redis 连接已关闭');
      });

      this.redis.on('reconnecting', () => {
        this.logger.log('🔄 Redis 重新连接中...');
      });

      // 尝试连接并等待结果
      await this.redis.connect();
      this.logger.log('✅ Redis 初始化完成');
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${(error as Error).message}`);
      try {
        if (this.redis) {
          this.redis.disconnect();
          this.redis.removeAllListeners();
        }
      } catch (_) {}
      this.redis = null;
      this.isConnected = false;
      throw error; // 抛出错误让调用者知道初始化失败
    }
  }

  /**
   * 获取缓存值
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.safeExecute(
      async () => {
        const value = await this.redis!.get(this.getKey(key));
        if (value === null || value === undefined) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return JSON.parse(value) as T;
      },
      null,
      'get',
    );

    return result;
  }

  /**
   * 设置缓存值
   */
  async set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key, options?.prefix);
        const serializedValue = JSON.stringify(value);

        const ttl = options?.ttl ?? this.configService.get('app.redis.cache.defaultTtl', 3600);

        if (ttl && ttl > 0) {
          await this.redis!.setex(redisKey, ttl, serializedValue);
        } else {
          await this.redis!.set(redisKey, serializedValue);
        }

        this.stats.keys++;
      },
      undefined,
      'set',
    );
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.del(this.getKey(key));
        if (result && result > 0) {
          this.stats.keys = Math.max(0, this.stats.keys - 1);
        }
        return (result ?? 0) > 0;
      },
      false,
      'del',
    );
  }

  /**
   * 批量删除缓存
   */
  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    return await this.safeExecute(
      async () => {
        const redisKeys = keys.map((key) => this.getKey(key));
        const result = await this.redis!.del(...redisKeys);
        const deletedCount = result ?? 0;
        this.stats.keys = Math.max(0, this.stats.keys - deletedCount);
        return deletedCount;
      },
      0,
      'delMany',
    );
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.exists(this.getKey(key));
        return (result ?? 0) === 1;
      },
      false,
      'has',
    );
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await this.safeExecute(
      async () => {
        const keyPrefix = this.configService.get('app.redis.cache.keyPrefix', 'nestjs:');
        const keys = await this.redis!.keys(`${keyPrefix}*`);
        if (keys && keys.length > 0) {
          await this.redis!.del(...keys);
        }
        this.stats.keys = 0;
      },
      undefined,
      'clear',
    );
  }

  /**
   * 获取所有缓存键
   */
  async keys(pattern?: string): Promise<string[]> {
    return await this.safeExecute(
      async () => {
        const keyPrefix = this.configService.get('app.redis.cache.keyPrefix', 'nestjs:');
        const searchPattern = pattern ? `${keyPrefix}${pattern}` : `${keyPrefix}*`;
        const keys = await this.redis!.keys(searchPattern);
        // 移除前缀
        return keys ? keys.map((key) => key.replace(keyPrefix, '')) : [];
      },
      [],
      'keys',
    );
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.expire(this.getKey(key), ttl);
        return (result ?? 0) === 1;
      },
      false,
      'expire',
    );
  }

  /**
   * 获取缓存剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.ttl(this.getKey(key));
        return result ?? -2;
      },
      -2,
      'ttl',
    );
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    const keyCount = await this.safeExecute(
      async () => {
        const keyPrefix = this.configService.get('app.redis.cache.keyPrefix', 'nestjs:');
        const keys = await this.redis!.keys(`${keyPrefix}*`);
        return keys ? keys.length : 0;
      },
      0,
      'getStats',
    );

    return {
      ...this.stats,
      keys: keyCount,
    };
  }

  /**
   * 重置缓存统计信息
   */
  async resetStats(): Promise<void> {
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
    };
  }

  /**
   * 检查缓存服务是否健康
   */
  async isHealthy(): Promise<boolean> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.ping();
        return result === 'PONG';
      },
      false,
      'isHealthy',
    );
  }

  /**
   * 关闭缓存连接
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (_) {
        this.redis.disconnect();
      }
      this.redis.removeAllListeners();
      this.redis = null;
      this.isConnected = false;
      this.logger.log('⚪ Redis 连接已关闭');
    }
  }

  /**
   * 模块销毁时清理资源
   */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  /**
   * 获取带前缀的键名
   */
  private getKey(key: string, prefix?: string): string {
    const keyPrefix = prefix ?? this.configService.get('app.redis.cache.keyPrefix', 'nestjs:');
    return `${keyPrefix}${key}`;
  }

  /**
   * 安全执行 Redis 操作
   */
  private async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string,
  ): Promise<T> {
    if (!this.redis || !this.isConnected) {
      this.logger.warn(`Redis not available for ${operationName}, using fallback`);
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      this.logger.error(`Redis ${operationName} failed: ${(error as Error).message}`);
      return fallback;
    }
  }
}
