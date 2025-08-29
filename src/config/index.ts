import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

// 创建配置服务实例
const configService = new ConfigService();
const appConfig = new AppConfigService(configService);

// 导出配置选项供其他模块使用
export const jwtOptions = appConfig.jwtOptions;
export const whiteList = appConfig.whiteList;
export const corsOptions = appConfig.corsOptions;

export const staticAssetsOptions = appConfig.staticAssetsOptions;
export const swaggerOptions = appConfig.swaggerOptions;

// 导出配置服务实例
export { appConfig };
export { AppConfigService } from './app-config.service';
export { ConfigModule } from './config.module';
export { default as configuration } from './configuration';
export { validationSchema } from './validation.schema';

// 导出 Redis 配置
export { createRedisClient, redisProvider, REDIS_CLIENT } from './redis.config';