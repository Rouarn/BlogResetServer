import { NestModule, MiddlewareConsumer, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DebugMiddleware } from './middleware/debug.middleware';

/**
 * 调试中间件配置
 *
 * 功能说明:
 * - 配置和注册调试中间件
 * - 基于配置的中间件激活
 * - 统一的调试工具集成点
 *
 * 配置特点:
 * - 基于配置服务启用
 * - 全局路由覆盖
 * - 细粒度的功能控制
 */
@Injectable()
export class DebugMiddlewareConfig implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    // 检查调试功能是否启用
    const debugEnabled = this.configService.get<boolean>('app.debug.enabled', false);
    const requestTracking = this.configService.get<boolean>('app.debug.requestTracking', false);

    if (debugEnabled && requestTracking) {
      // 在调试模式启用时应用调试中间件到所有路由
      consumer.apply(DebugMiddleware).forRoutes('*');
    }
  }
}
