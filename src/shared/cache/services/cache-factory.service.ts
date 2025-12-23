/**
 * 缓存工厂服务
 *
 * 根据配置动态选择缓存实现（Redis 或内存缓存）
 * 提供统一的缓存服务创建和管理功能
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { AppConfigService } from '@/config';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CacheConfig, CacheServiceType, ICacheService } from '../interfaces';
import { MemoryCacheService } from './memory-cache.service';
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

      // 如果 Redis 创建失败，回退到内存缓存
      if (this.cacheConfig.type === CacheServiceType.REDIS) {
        this.logger.warn('⚠️  Redis 连接失败，正在回退到内存缓存...');
        this.cacheService = new MemoryCacheService(this.appConfig);
        this.cacheConfig.type = CacheServiceType.MEMORY;
        return this.cacheService;
      }

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
   * 获取当前缓存服务类型
   */
  getCurrentCacheType(): CacheServiceType {
    if (this.cacheService) {
      return this.cacheService instanceof RedisCacheService
        ? CacheServiceType.REDIS
        : CacheServiceType.MEMORY;
    }
    return this.cacheConfig.type;
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

    this.logger.log(`✅ 缓存服务重新初始化完成，类型: ${this.cacheConfig.type}`);
  }

  /**
   * 获取缓存服务健康状态
   */
  async getHealthStatus(): Promise<{
    type: CacheServiceType;
    healthy: boolean;
    error?: string;
  }> {
    try {
      const service = await this.getCacheService();
      const healthy = await service.isHealthy();

      return {
        type: this.cacheConfig.type,
        healthy,
      };
    } catch (error) {
      return {
        type: this.cacheConfig.type,
        healthy: false,
        error: (error as Error).message,
      };
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
      type: redisEnabled ? CacheServiceType.REDIS : CacheServiceType.MEMORY,
      enabled: redisEnabled,
      defaultTtl: redisCache.defaultTtl,
      keyPrefix: redisCache.keyPrefix,
      maxSize: redisCache.maxSize,
    };
  }

  /**
   * 创建缓存服务实例
   */
  private async createCacheService(): Promise<ICacheService> {
    switch (this.cacheConfig.type) {
      case CacheServiceType.REDIS:
        this.logger.log('⚙️  正在创建 Redis 缓存服务...');
        const redisService = new RedisCacheService(this.appConfig);

        try {
          // 先初始化 Redis 连接
          await redisService.initializeRedis();

          // 测试 Redis 连接
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

      case CacheServiceType.MEMORY:
        this.logger.log('💾 正在创建内存缓存服务...');
        return new MemoryCacheService(this.appConfig);

      default:
        throw new Error(`❌ 不支持的缓存服务类型: ${this.cacheConfig.type}`);
    }
  }
}
