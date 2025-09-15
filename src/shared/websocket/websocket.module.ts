/**
 * WebSocket 模块
 *
 * 功能说明:
 * - 整合所有 WebSocket 相关组件
 * - 提供 WebSocket 服务和网关
 * - 配置认证、过滤器和拦截器
 * - 导出可复用的服务和组件
 *
 * 特点:
 * - 模块化设计，易于维护
 * - 完整的 WebSocket 功能支持
 * - 符合 NestJS 最佳实践
 * - 支持依赖注入和装饰器
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// WebSocket 核心组件
import { WebSocketService } from './services/websocket.service';
import { WebSocketGateway } from './websocket.gateway';
// 守卫、过滤器和拦截器
import { WebSocketExceptionFilter } from './filters/websocket-exception.filter';
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';
import { WebSocketInterceptor } from './interceptors/websocket.interceptor';

/**
 * WebSocket 模块
 *
 * 提供完整的 WebSocket 功能支持
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule,

    // JWT 模块 - 用于 WebSocket 认证
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('NEST_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('NEST_JWT_ACCESS_TOKEN_TTL', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  providers: [
    // 核心服务
    WebSocketService,

    // 网关
    WebSocketGateway,

    // 守卫
    WebSocketAuthGuard,

    // 过滤器
    WebSocketExceptionFilter,

    // 拦截器
    WebSocketInterceptor,
  ],

  exports: [
    // 导出服务供其他模块使用
    WebSocketService,

    // 导出守卫供其他模块使用
    WebSocketAuthGuard,

    // 导出过滤器供其他模块使用
    WebSocketExceptionFilter,

    // 导出拦截器供其他模块使用
    WebSocketInterceptor,
  ],
})
export class WebSocketModule {
  private readonly logger = new Logger(WebSocketModule.name);

  /**
   * 模块初始化时的日志
   */
  constructor() {
    this.logModuleInitialization();
  }

  /**
   * 输出模块初始化信息
   */
  private logModuleInitialization(): void {}
}
