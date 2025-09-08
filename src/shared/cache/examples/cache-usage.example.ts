/**
 * 缓存使用示例
 *
 * 展示如何在 NestJS 服务中使用缓存装饰器和缓存服务
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_TOKENS } from 'src/common/constants';
import { Cache, CacheEvict, ICacheService } from '../index';

/**
 * 用户数据传输对象
 */
interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/**
 * 用户查询参数
 */
interface UserSearchQuery {
  keyword: string;
  page: number;
  limit: number;
}

/**
 * 缓存使用示例服务
 *
 * 演示各种缓存使用场景和最佳实践
 */
@Injectable()
export class CacheUsageExampleService {
  private readonly logger = new Logger(CacheUsageExampleService.name);

  constructor(
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  // =============================================================================
  // 基础缓存装饰器使用示例
  // =============================================================================

  /**
   * 示例1: 基础缓存使用
   * 使用用户ID作为缓存键，缓存1小时
   */
  @Cache({ key: 'user:${0}', ttl: 3600 })
  async getUserById(id: string): Promise<UserDto | null> {
    this.logger.log(`Fetching user from database: ${id}`);

    // 模拟数据库查询
    await this.simulateDbDelay();

    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      createdAt: new Date(),
    };
  }

  /**
   * 示例2: 使用参数生成缓存键
   * 自动使用所有参数生成缓存键
   */
  @Cache({ useArgs: true, ttl: 1800 })
  async searchUsers(query: UserSearchQuery): Promise<UserDto[]> {
    this.logger.log(`Searching users: ${JSON.stringify(query)}`);

    await this.simulateDbDelay();

    // 模拟搜索结果
    return Array.from({ length: query.limit }, (_, index) => ({
      id: `${query.page}-${index}`,
      name: `${query.keyword} User ${index}`,
      email: `user${index}@example.com`,
      createdAt: new Date(),
    }));
  }

  /**
   * 示例3: 条件缓存
   * 只有当用户ID不为空时才缓存
   */
  @Cache({
    key: 'user:profile:${0}',
    ttl: 7200,
    condition: (id: string) => !!id && id.length > 0,
  })
  async getUserProfile(id: string): Promise<UserDto | null> {
    if (!id) return null;

    this.logger.log(`Fetching user profile: ${id}`);
    await this.simulateDbDelay();

    return {
      id,
      name: `Profile ${id}`,
      email: `profile${id}@example.com`,
      createdAt: new Date(),
    };
  }

  // =============================================================================
  // 缓存清除装饰器使用示例
  // =============================================================================

  /**
   * 示例4: 更新用户时清除相关缓存
   * 清除用户基础信息和档案缓存
   */
  @CacheEvict({
    keys: ['user:${0}', 'user:profile:${0}'],
  })
  async updateUser(id: string, data: Partial<UserDto>): Promise<UserDto> {
    this.logger.log(`Updating user: ${id}`);
    await this.simulateDbDelay();

    return {
      id,
      name: data.name ?? `Updated User ${id}`,
      email: data.email ?? `updated${id}@example.com`,
      createdAt: new Date(),
    };
  }

  /**
   * 示例5: 删除用户时清除所有相关缓存
   * 使用模式匹配清除多个缓存项
   */
  @CacheEvict({ key: 'user:*' })
  async deleteUser(id: string): Promise<boolean> {
    this.logger.log(`Deleting user: ${id}`);
    await this.simulateDbDelay();

    // 手动清除特定模式的缓存
    const keys = await this.cacheService.keys(`user:${id}*`);
    if (keys.length > 0) {
      await this.cacheService.delMany(keys);
      this.logger.log(`Cleared ${keys.length} cache entries for user ${id}`);
    }

    return true;
  }

  /**
   * 示例6: 批量操作后清除所有缓存
   */
  @CacheEvict({ allEntries: true })
  async batchUpdateUsers(updates: { id: string; data: Partial<UserDto> }[]): Promise<UserDto[]> {
    this.logger.log(`Batch updating ${updates.length} users`);
    await this.simulateDbDelay();

    return updates.map(({ id, data }) => ({
      id,
      name: data.name ?? `Batch Updated ${id}`,
      email: data.email ?? `batch${id}@example.com`,
      createdAt: new Date(),
    }));
  }

  // =============================================================================
  // 手动缓存操作示例
  // =============================================================================

  /**
   * 示例7: 手动缓存操作
   * 展示如何直接使用缓存服务
   */
  async manualCacheOperations(): Promise<void> {
    const cacheKey = 'manual:example';
    const data = { message: 'Hello Cache!', timestamp: Date.now() };

    // 设置缓存
    await this.cacheService.set(cacheKey, data, { ttl: 300 });
    this.logger.log('Cache set manually');

    // 获取缓存
    const cached = await this.cacheService.get<typeof data>(cacheKey);
    this.logger.log(`Cache retrieved: ${JSON.stringify(cached)}`);

    // 检查缓存是否存在
    const exists = await this.cacheService.has(cacheKey);
    this.logger.log(`Cache exists: ${exists}`);

    // 获取剩余过期时间
    const ttl = await this.cacheService.ttl(cacheKey);
    this.logger.log(`Cache TTL: ${ttl} seconds`);

    // 延长过期时间
    await this.cacheService.expire(cacheKey, 600);
    this.logger.log('Cache TTL extended');

    // 删除缓存
    await this.cacheService.del(cacheKey);
    this.logger.log('Cache deleted manually');
  }

  /**
   * 示例8: 缓存统计信息
   */
  async getCacheStatistics(): Promise<void> {
    const stats = await this.cacheService.getStats();
    this.logger.log(`Cache Statistics:`);
    this.logger.log(`  Hits: ${stats.hits}`);
    this.logger.log(`  Misses: ${stats.misses}`);
    this.logger.log(`  Keys: ${stats.keys}`);
    this.logger.log(`  Memory Usage: ${stats.memoryUsage} bytes`);

    const hitRate =
      stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
        : '0.00';
    this.logger.log(`  Hit Rate: ${hitRate}%`);
  }

  /**
   * 示例9: 缓存健康检查
   */
  async checkCacheHealth(): Promise<boolean> {
    try {
      const isHealthy = await this.cacheService.isHealthy();
      this.logger.log(`Cache health status: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
      return isHealthy;
    } catch (error) {
      this.logger.error(`Cache health check failed: ${(error as Error).message}`);
      return false;
    }
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  /**
   * 模拟数据库查询延迟
   */
  private async simulateDbDelay(): Promise<void> {
    const delay = Math.random() * 100 + 50; // 50-150ms 随机延迟
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * 清理所有示例缓存
   */
  async cleanupExampleCache(): Promise<void> {
    const patterns = ['user:*', 'manual:*'];

    for (const pattern of patterns) {
      const keys = await this.cacheService.keys(pattern);
      if (keys.length > 0) {
        await this.cacheService.delMany(keys);
        this.logger.log(`Cleaned up ${keys.length} cache entries matching ${pattern}`);
      }
    }
  }
}
