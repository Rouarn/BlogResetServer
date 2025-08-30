/**
 * 配置模块统一导出
 *
 * 提供应用程序所需的所有配置选项和服务的统一入口。
 *
 * 功能说明：
 * - 创建并导出预配置的配置服务实例
 * - 提供常用配置选项的快捷访问方式
 * - 统一导出所有配置相关的模块和服务
 *
 * 导出内容：
 * - jwtOptions: JWT 认证配置选项
 * - whiteList: 白名单路由列表
 * - corsOptions: CORS 跨域配置选项
 * - staticAssetsOptions: 静态资源服务配置
 * - swaggerOptions: API 文档配置选项
 * - appConfig: 应用配置服务实例
 * - AppConfigService: 应用配置服务类
 * - ConfigModule: 配置模块
 * - configuration: 配置工厂函数
 * - validationSchema: 环境变量验证模式
 *
 * 用法示例：
 * ```typescript
 * import { jwtOptions, corsOptions, appConfig } from '@/config';
 *
 * // 使用预配置的选项
 * JwtModule.register(jwtOptions);
 *
 * // 使用配置服务实例
 * const port = appConfig.port;
 * ```
 */

import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

// 创建配置服务实例
const configService = new ConfigService();
const appConfig = new AppConfigService(configService);

// 导出配置选项供其他模块使用
export const jwtOptions = appConfig.jwtOptions;
export const corsOptions = appConfig.corsOptions;

export const staticAssetsOptions = appConfig.staticAssetsOptions;
export const swaggerOptions = appConfig.swaggerOptions;

// 导出配置服务实例
export { appConfig };
export { AppConfigService } from './app-config.service';
export { ConfigModule } from './config.module';
export { default as configuration } from './configuration';
export { validationSchema } from './validation.schema';
