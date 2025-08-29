import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 客户端工厂函数
 * 根据配置创建 Redis 客户端实例
 */
export const createRedisClient = (configService: ConfigService): Redis => {
  const redisConfig = {
    host: configService.get<string>('NEST_REDIS_HOST', 'localhost'),
    port: configService.get<number>('NEST_REDIS_PORT', 6379),
    password: configService.get<string>('NEST_REDIS_PASSWORD', ''),
    db: configService.get<number>('NEST_REDIS_DB', 0),
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  };

  return new Redis(redisConfig);
};

/**
 * Redis 客户端提供者配置
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return createRedisClient(configService);
  },
  inject: [ConfigService],
};
