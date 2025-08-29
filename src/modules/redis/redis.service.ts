import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/config';

/**
 * Redis服务类，用于与Redis数据库进行交互。
 */
@Injectable()
export class RedisService {
  /**
   * 构造函数，注入Redis客户端实例。
   * Redis客户端由全局配置提供者创建和管理。
   */
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * 设置Redis中的键值对。
   * @param key - 要设置的键。
   * @param value - 要设置的值。
   * @param ttl - 可选参数，键的过期时间（秒）。
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value); // 设置键值对并设置过期时间
    } else {
      await this.redis.set(key, value); // 设置键值对
    }
  }

  /**
   * 获取Redis中的键对应的值。
   * @param key - 要获取的键。
   * @returns 返回键对应的值，如果键不存在则返回null。
   */
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  /**
   * 删除Redis中的键。
   * @param key - 要删除的键。
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * 增加Redis中键对应的数值。
   * @param key - 要增加的键。
   * @returns 返回增加后的数值。
   */
  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  /**
   * 检查Redis中是否存在某个键。
   * @param key - 要检查的键。
   * @returns 如果键存在返回true，否则返回false。
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }
}
