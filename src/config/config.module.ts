import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import configuration from './configuration';
import { validationSchema } from './validation.schema';

/**
 * 配置模块（ConfigModule）
 *
 * 全局配置模块，负责加载和验证应用程序的所有配置。
 *
 * 功能说明：
 * - 使用 @Global() 装饰器，使配置在整个应用中全局可用
 * - 自动加载环境变量文件，支持多环境配置
 * - 集成配置验证，确保必需的环境变量存在且格式正确
 * - 提供 AppConfigService 服务，封装配置访问逻辑
 *
 * 配置加载顺序：
 * 1. .env.{NODE_ENV} (如 .env.development, .env.production)
 * 2. .env (通用配置文件)
 * 3. 系统环境变量
 *
 * 依赖项：
 * - NestConfigModule: NestJS 官方配置模块
 * - configuration: 配置工厂函数，定义配置结构
 * - validationSchema: Joi 验证模式，验证环境变量
 * - AppConfigService: 应用配置服务，提供类型安全的配置访问
 *
 * 用法示例：
 * ```typescript
 * // 在其他模块中注入使用
 * constructor(private appConfig: AppConfigService) {}
 *
 * // 或直接注入 ConfigService
 * constructor(private configService: ConfigService) {}
 * ```
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
