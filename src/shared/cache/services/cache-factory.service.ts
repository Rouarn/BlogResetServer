/**
 * 缓存工厂服务
 *
 * 提供统一的缓存服务创建和管理功能
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { AppConfigService } from '@/config';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CacheConfig, ICacheService } from '../interfaces';
import { NoopCacheService } from './noop-cache.service';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class CacheFactoryService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheFactoryService.name);
  private cacheService: ICacheService | null = null;
  private readonly cacheConfig: CacheConfig;

  constructor(private readonly appConfig: AppConfigService) {
    this.cacheConfig = this.buildCacheConfig();
  }

  /**
   * 获取缓存服务实例
   */
  async getCacheService(): Promise<ICacheService> {
    if (this.cacheService) {
      return this.cacheService;
    }

    try {
      this.cacheService = await this.createCacheService();
      return this.cacheService;
    } catch (error) {
      this.logger.error(`❌ 创建缓存服务失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 获取当前缓存配置
   */
  getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }

  /**
   * 检查缓存服务是否已初始化
   */
  isInitialized(): boolean {
    return this.cacheService !== null;
  }

  /**
   * 重新初始化缓存服务
   * 用于配置更改后重新创建缓存服务
   */
  async reinitialize(): Promise<void> {
    this.logger.log('🔄 正在重新初始化缓存服务');

    // 关闭现有服务
    if (this.cacheService) {
      await this.cacheService.close();
      this.cacheService = null;
    }

    // 重新构建配置
    Object.assign(this.cacheConfig, this.buildCacheConfig());

    // 创建新的缓存服务
    this.cacheService = await this.createCacheService();

    this.logger.log(`✅ 缓存服务重新初始化完成，类型: Redis`);
  }

  /**
   * 获取缓存服务健康状态
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    error?: string;
  }> {
    try {
      const service = await this.getCacheService();
      const healthy = await service.isHealthy();

      return { healthy };
    } catch (error) {
      return { healthy: false, error: (error as Error).message };
    }
  }

  /**
   * 关闭缓存服务
   */
  async close(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.close();
      this.cacheService = null;
      this.logger.log('✅ 缓存服务已关闭');
    }
  }

  /**
   * 模块销毁时清理资源
   */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  /**
   * 构建缓存配置
   */
  private buildCacheConfig(): CacheConfig {
    const redisEnabled = this.appConfig.redisConfig.enabled;
    const redisCache = this.appConfig.redisConfig.cache;
    return {
      enabled: redisEnabled,
      defaultTtl: redisCache.defaultTtl,
      keyPrefix: redisCache.keyPrefix,
    };
  }

  /**
   * 创建缓存服务实例
   */
  private async createCacheService(): Promise<ICacheService> {
    const enabled = this.appConfig.redisConfig.enabled;
    if (!enabled) {
      this.logger.warn('Redis 已禁用，使用 NoopCacheService');
      return new NoopCacheService();
    }
    this.logger.log('⚙️  正在创建 Redis 缓存服务...');
    const redisService = new RedisCacheService(this.appConfig);
    try {
      await redisService.initializeRedis();
      const isHealthy = await redisService.isHealthy();
      if (!isHealthy) {
        await redisService.close();
        throw new Error('❌ Redis 连接健康检查失败');
      }
      return redisService;
    } catch (error) {
      await redisService.close();
      throw error;
    }
  }
}
