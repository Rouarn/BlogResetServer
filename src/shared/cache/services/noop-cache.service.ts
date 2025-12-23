import type { CacheOptions, CacheStats, ICacheService } from '../interfaces';

export class NoopCacheService implements ICacheService {
  async get<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }
  async set<T = unknown>(_key: string, _value: T, _options?: CacheOptions): Promise<void> {
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
  async expire(_key: string, _ttl: number): Promise<boolean> {
    return false;
  }
  async ttl(_key: string): Promise<number> {
    return -2;
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
