/**
 * 缓存模块
 *
 * 集成所有缓存相关服务，提供全局可用的缓存功能
 * 支持 Redis 和内存缓存的动态切换
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { Global, Logger, Module, OnModuleInit, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_TOKENS } from 'src/common/constants';
import { ICacheService } from './interfaces';
import { CacheFactoryService } from './services/cache-factory.service';

/**
 * 缓存服务提供者
 * 通过工厂服务创建缓存实例，统一使用接口令牌
 */
const cacheServiceProvider: Provider<ICacheService> = {
  provide: CACHE_TOKENS.I_CACHE_SERVICE,
  useFactory: async (cacheFactory: CacheFactoryService): Promise<ICacheService> => {
    return await cacheFactory.getCacheService();
  },
  inject: [CacheFactoryService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheFactoryService, cacheServiceProvider],
  exports: [CacheFactoryService, CACHE_TOKENS.I_CACHE_SERVICE],
})
export class CacheModule implements OnModuleInit {
  private readonly logger = new Logger(CacheModule.name);

  constructor(
    private readonly cacheFactory: CacheFactoryService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 模块初始化时的日志输出
   */
  async onModuleInit(): Promise<void> {
    const cacheType = this.cacheFactory.getCurrentCacheType();
    const redisEnabled = this.configService.get<boolean>('app.redis.enabled', false);

    this.logger.log('');
    this.logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                    🚀 缓存模块初始化完成 🚀                       ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.logger.log('');
    this.logger.log('┌─ 📦 缓存配置信息 ────────────────────────────────────────────────┐');
    this.logger.log(`│ 📦 缓存类型: ${cacheType === 'redis' ? '💎 Redis' : '💾 Memory'}`);
    this.logger.log(`│ ⚡ Redis状态: ${redisEnabled ? '✅ 已启用' : '❌ 已禁用'}`);

    if (redisEnabled) {
      const host = this.configService.get<string>('app.redis.host', 'localhost');
      const port = this.configService.get<number>('app.redis.port', 6379);
      const db = this.configService.get<number>('app.redis.db', 0);

      // 检查Redis连接状态
      const cacheService = await this.cacheFactory.getCacheService();
      const isHealthy = await cacheService.isHealthy();

      this.logger.log(`│ 🌐 连接地址: ${host}:${port}/${db}`);
      this.logger.log(`│ 🔗 连接状态: ${isHealthy ? '🟢 已连接' : '🔴 连接失败'}`);
    }

    this.logger.log(
      `│ ⏰ 默认TTL: ${this.configService.get<number>('app.redis.cache.defaultTtl', 3600)}秒`,
    );
    this.logger.log(
      `│ 🏷️  键前缀: ${this.configService.get<string>('app.redis.cache.keyPrefix', 'nestjs:')}`,
    );
    this.logger.log('└──────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
  }

  /**
   * 模块销毁时清理资源
   */
  async onModuleDestroy(): Promise<void> {
    await this.cacheFactory.close();
  }
}
