/**
 * 配置模块统一导出
 *
 * 提供应用程序所需的所有配置选项和服务的统一入口。
 *
 * 功能说明：
 * - 统一导出所有配置相关的模块和服务
 *
 * 导出内容：
 * - AppConfigService: 应用配置服务类
 * - ConfigModule: 配置模块
 * - configuration: 配置工厂函数
 * - validationSchema: 环境变量验证模式
 *
 * 用法示例：
 * ```typescript
 * import { AppConfigService } from '@/config';
 *
 * // 在服务中注入 AppConfigService
 * constructor(private readonly appConfig: AppConfigService) {}
 *
 * // 使用配置服务实例
 * const port = this.appConfig.port;
 * ```
 */

// 导出配置服务实例
export { AppConfigService } from './app-config.service';
export { ConfigModule } from './config.module';
export * from './types';
export { validationSchema } from './validation.schema';
