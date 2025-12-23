import type { CacheOptions, CacheStats, ICacheService } from '../interfaces';

export class NoopCacheService implements ICacheService {
  async get<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }
  async set<T = unknown>(_key: string, _value: T, _options?: CacheOptions): Promise<void> {
    return;
  }
  async mget<T = unknown>(_keys: string[]): Promise<(T | null)[]> {
    return [];
  }
  async mset<T = unknown>(_entries: Record<string, T>, _options?: CacheOptions): Promise<void> {
    return;
  }
  async del(_key: string): Promise<boolean> {
    return false;
  }
  async delMany(_keys: string[]): Promise<number> {
    return 0;
  }
  async has(_key: string): Promise<boolean> {
    return false;
  }
  async clear(): Promise<void> {
    return;
  }
  async keys(_pattern?: string): Promise<string[]> {
    return [];
  }
  async scan(_pattern?: string, _count?: number): Promise<string[]> {
    return [];
  }
  async expire(_key: string, _ttl: number): Promise<boolean> {
    return false;
  }
  async ttl(_key: string): Promise<number> {
    return -2;
  }
  async incr(_key: string): Promise<number> {
    return 0;
  }
  async decr(_key: string): Promise<number> {
    return 0;
  }
  async hget<T = unknown>(_key: string, _field: string): Promise<T | null> {
    return null;
  }
  async hset<T = unknown>(
    _key: string,
    _field: string,
    _value: T,
    _options?: CacheOptions,
  ): Promise<void> {
    return;
  }
  async hmget<T = unknown>(_key: string, _fields: string[]): Promise<(T | null)[]> {
    return [];
  }
  async hmset<T = unknown>(
    _key: string,
    _entries: Record<string, T>,
    _options?: CacheOptions,
  ): Promise<void> {
    return;
  }
  async hdel(_key: string, ..._fields: string[]): Promise<number> {
    return 0;
  }
  async hgetall<T = unknown>(_key: string): Promise<Record<string, T>> {
    return {};
  }
  async sadd<T = unknown>(_key: string, ..._members: T[]): Promise<number> {
    return 0;
  }
  async srem<T = unknown>(_key: string, ..._members: T[]): Promise<number> {
    return 0;
  }
  async smembers<T = unknown>(_key: string): Promise<T[]> {
    return [];
  }
  async sismember<T = unknown>(_key: string, _member: T): Promise<boolean> {
    return false;
  }
  async lpush<T = unknown>(_key: string, ..._values: T[]): Promise<number> {
    return 0;
  }
  async rpush<T = unknown>(_key: string, ..._values: T[]): Promise<number> {
    return 0;
  }
  async lrange<T = unknown>(_key: string, _start: number, _stop: number): Promise<T[]> {
    return [];
  }
  async lpop<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }
  async rpop<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }
  async llen(_key: string): Promise<number> {
    return 0;
  }
  async zadd<T = unknown>(_key: string, _score: number, _member: T): Promise<number> {
    return 0;
  }
  async zrem<T = unknown>(_key: string, ..._members: T[]): Promise<number> {
    return 0;
  }
  async zscore<T = unknown>(_key: string, _member: T): Promise<number | null> {
    return null;
  }
  async zrange<T = unknown>(_key: string, _start: number, _stop: number): Promise<T[]> {
    return [];
  }
  async zcard(_key: string): Promise<number> {
    return 0;
  }
  async getStats(): Promise<CacheStats> {
    return { hits: 0, misses: 0, keys: 0 };
  }
  async resetStats(): Promise<void> {
    return;
  }
  async isHealthy(): Promise<boolean> {
    return true;
  }
  async close(): Promise<void> {
    return;
  }
}
