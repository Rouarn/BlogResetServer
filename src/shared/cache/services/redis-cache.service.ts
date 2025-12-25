/**
 * Redis 缓存服务实现
 *
 * 基于 ioredis 实现的缓存服务，提供高性能的分布式缓存功能，
 * 支持连接失败时的优雅降级处理。
 */

import { AppConfigService } from '@/config';
import { deserialize, getErrorMessage, serialize } from '@/utils';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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

  constructor(private readonly appConfig: AppConfigService) {
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
      const redisConfig = this.appConfig.redisConfig;

      if (!redisConfig.enabled) {
        this.logger.warn('Redis 是禁用的，跳过初始化');
        return;
      }

      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
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
      this.logger.error(`❌ 初始化 Redis 失败: ${getErrorMessage(error)}`);
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
        return deserialize<T>(value);
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
        const serializedValue = serialize(value);

        const ttl = options?.ttl ?? this.appConfig.redisConfig.cache.defaultTtl;

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

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    return await this.safeExecute(
      async () => {
        const redisKeys = keys.map((k) => this.getKey(k));
        const values = await this.redis!.mget(redisKeys);
        return (values ?? []).map((v) => (v == null ? null : deserialize<T>(v)));
      },
      [],
      'mget',
    );
  }

  async mset<T = unknown>(entries: Record<string, T>, options?: CacheOptions): Promise<void> {
    const keys = Object.keys(entries);
    if (keys.length === 0) return;
    await this.safeExecute(
      async () => {
        const ttl = options?.ttl ?? this.appConfig.redisConfig.cache.defaultTtl;
        const pipeline = this.redis!.pipeline();
        for (const k of keys) {
          const redisKey = this.getKey(k, options?.prefix);
          const serializedValue = serialize(entries[k]);
          if (ttl && ttl > 0) {
            pipeline.setex(redisKey, ttl, serializedValue);
          } else {
            pipeline.set(redisKey, serializedValue);
          }
        }
        await pipeline.exec();
      },
      undefined,
      'mset',
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
        const keyPrefix = this.appConfig.redisConfig.cache.keyPrefix;
        let cursor = '0';
        do {
          const [next, keys] = await this.redis!.scan(
            cursor,
            'MATCH',
            `${keyPrefix}*`,
            'COUNT',
            100,
          );
          cursor = next;
          if (keys && keys.length > 0) {
            await this.redis!.del(...keys);
          }
        } while (cursor !== '0');
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
        const keyPrefix = this.appConfig.redisConfig.cache.keyPrefix;
        const match = pattern ? `${keyPrefix}${pattern}` : `${keyPrefix}*`;
        const out: string[] = [];
        let cursor = '0';
        do {
          const [next, keys] = await this.redis!.scan(cursor, 'MATCH', match, 'COUNT', 100);
          cursor = next;
          if (keys?.length) {
            out.push(...keys.map((k) => k.replace(keyPrefix, '')));
          }
        } while (cursor !== '0');
        return out;
      },
      [],
      'keys',
    );
  }

  async scan(pattern?: string, count: number = 100): Promise<string[]> {
    return await this.safeExecute(
      async () => {
        const keyPrefix = this.appConfig.redisConfig.cache.keyPrefix;
        const match = pattern ? `${keyPrefix}${pattern}` : `${keyPrefix}*`;
        const out: string[] = [];
        let cursor = '0';
        do {
          const [next, keys] = await this.redis!.scan(cursor, 'MATCH', match, 'COUNT', count);
          cursor = next;
          if (keys?.length) {
            out.push(...keys.map((k) => k.replace(keyPrefix, '')));
          }
        } while (cursor !== '0');
        return out;
      },
      [],
      'scan',
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

  async incr(key: string): Promise<number> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.incr(this.getKey(key));
        return result ?? 0;
      },
      0,
      'incr',
    );
  }

  async decr(key: string): Promise<number> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.decr(this.getKey(key));
        return result ?? 0;
      },
      0,
      'decr',
    );
  }

  async hget<T = unknown>(key: string, field: string): Promise<T | null> {
    return await this.safeExecute(
      async () => {
        const v = await this.redis!.hget(this.getKey(key), field);
        return v == null ? null : deserialize<T>(v);
      },
      null,
      'hget',
    );
  }

  async hset<T = unknown>(
    key: string,
    field: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key, options?.prefix);
        await this.redis!.hset(redisKey, field, serialize(value));
        const ttl = options?.ttl ?? this.appConfig.redisConfig.cache.defaultTtl;
        if (ttl && ttl > 0) await this.redis!.expire(redisKey, ttl);
      },
      undefined,
      'hset',
    );
  }

  async hmget<T = unknown>(key: string, fields: string[]): Promise<(T | null)[]> {
    return await this.safeExecute(
      async () => {
        if (fields.length === 0) return [];
        const arr = await this.redis!.hmget(this.getKey(key), ...fields);
        return (arr ?? []).map((v) => (v == null ? null : deserialize<T>(v)));
      },
      [],
      'hmget',
    );
  }

  async hmset<T = unknown>(
    key: string,
    entries: Record<string, T>,
    options?: CacheOptions,
  ): Promise<void> {
    await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key, options?.prefix);
        const pipeline = this.redis!.pipeline();
        for (const field of Object.keys(entries)) {
          pipeline.hset(redisKey, field, serialize(entries[field]));
        }
        const ttl = options?.ttl ?? this.appConfig.redisConfig.cache.defaultTtl;
        if (ttl && ttl > 0) pipeline.expire(redisKey, ttl);
        await pipeline.exec();
      },
      undefined,
      'hmset',
    );
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (fields.length === 0) return 0;
        const result = await this.redis!.hdel(this.getKey(key), ...fields);
        return result ?? 0;
      },
      0,
      'hdel',
    );
  }

  async hgetall<T = unknown>(key: string): Promise<Record<string, T>> {
    return await this.safeExecute(
      async () => {
        const obj = await this.redis!.hgetall(this.getKey(key));
        const out: Record<string, T> = {};
        for (const f of Object.keys(obj ?? {})) {
          out[f] = deserialize<T>(obj[f]);
        }
        return out;
      },
      {},
      'hgetall',
    );
  }

  async sadd<T = unknown>(key: string, ...members: T[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (members.length === 0) return 0;
        const arr = members.map((m) => serialize(m));
        const result = await this.redis!.sadd(this.getKey(key), ...arr);
        return result ?? 0;
      },
      0,
      'sadd',
    );
  }

  async srem<T = unknown>(key: string, ...members: T[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (members.length === 0) return 0;
        const arr = members.map((m) => serialize(m));
        const result = await this.redis!.srem(this.getKey(key), ...arr);
        return result ?? 0;
      },
      0,
      'srem',
    );
  }

  async smembers<T = unknown>(key: string): Promise<T[]> {
    return await this.safeExecute(
      async () => {
        const arr = await this.redis!.smembers(this.getKey(key));
        return (arr ?? []).map((v) => deserialize<T>(v));
      },
      [],
      'smembers',
    );
  }

  async sismember<T = unknown>(key: string, member: T): Promise<boolean> {
    return await this.safeExecute(
      async () => {
        const result = await this.redis!.sismember(this.getKey(key), serialize(member));
        return (result ?? 0) === 1;
      },
      false,
      'sismember',
    );
  }

  async lpush<T = unknown>(key: string, ...values: T[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (values.length === 0) return 0;
        const arr = values.map((v) => serialize(v));
        const result = await this.redis!.lpush(this.getKey(key), ...arr);
        return result ?? 0;
      },
      0,
      'lpush',
    );
  }

  async rpush<T = unknown>(key: string, ...values: T[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (values.length === 0) return 0;
        const arr = values.map((v) => serialize(v));
        const result = await this.redis!.rpush(this.getKey(key), ...arr);
        return result ?? 0;
      },
      0,
      'rpush',
    );
  }

  async lrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]> {
    return await this.safeExecute(
      async () => {
        const arr = await this.redis!.lrange(this.getKey(key), start, stop);
        return (arr ?? []).map((v) => deserialize<T>(v));
      },
      [],
      'lrange',
    );
  }

  async lpop<T = unknown>(key: string): Promise<T | null> {
    return await this.safeExecute(
      async () => {
        const v = await this.redis!.lpop(this.getKey(key));
        return v == null ? null : deserialize<T>(v);
      },
      null,
      'lpop',
    );
  }

  async rpop<T = unknown>(key: string): Promise<T | null> {
    return await this.safeExecute(
      async () => {
        const v = await this.redis!.rpop(this.getKey(key));
        return v == null ? null : deserialize<T>(v);
      },
      null,
      'rpop',
    );
  }

  async llen(key: string): Promise<number> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        return await this.redis!.llen(redisKey);
      },
      0,
      'llen',
    );
  }

  async zadd<T = unknown>(key: string, score: number, member: T): Promise<number> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        const result = await this.redis!.zadd(redisKey, score, serialize(member));
        return typeof result === 'string' ? parseInt(result, 10) : result;
      },
      0,
      'zadd',
    );
  }

  async zrem<T = unknown>(key: string, ...members: T[]): Promise<number> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        const serializedMembers = members.map((m) => serialize(m));
        return await this.redis!.zrem(redisKey, ...serializedMembers);
      },
      0,
      'zrem',
    );
  }

  async zscore<T = unknown>(key: string, member: T): Promise<number | null> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        const score = await this.redis!.zscore(redisKey, serialize(member));
        return score ? parseFloat(score) : null;
      },
      null,
      'zscore',
    );
  }

  async zrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        const values = await this.redis!.zrange(redisKey, start, stop);
        return values.map((v) => deserialize<T>(v));
      },
      [],
      'zrange',
    );
  }

  async zcard(key: string): Promise<number> {
    return await this.safeExecute(
      async () => {
        const redisKey = this.getKey(key);
        return await this.redis!.zcard(redisKey);
      },
      0,
      'zcard',
    );
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    const keyCount = await this.safeExecute(
      async () => {
        const keyPrefix = this.appConfig.redisConfig.cache.keyPrefix;
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
    const keyPrefix = prefix ?? this.appConfig.redisConfig.cache.keyPrefix;
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
      this.logger.warn(`Redis 不可用，${operationName} 操作失败，使用回退值 ${fallback}`);
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      this.logger.error(`❌ Redis ${operationName} 操作失败: ${getErrorMessage(error)}`);
      return fallback;
    }
  }
}
