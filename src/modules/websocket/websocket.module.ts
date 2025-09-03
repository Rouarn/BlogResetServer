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

import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// WebSocket 核心组件
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './services/websocket.service';

// 守卫、过滤器和拦截器
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';
import { WebSocketExceptionFilter } from './filters/websocket-exception.filter';
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
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
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
  private logModuleInitialization(): void {
    this.logger.log('');
    this.logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                   🔌 WebSocket 模块初始化完成 🔌                  ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.logger.log('');
    this.logger.log('┌─ 📦 模块组件 ────────────────────────────────────────────────────┐');
    this.logger.log('│ 🚀 WebSocketGateway: 网关服务');
    this.logger.log('│ 🔧 WebSocketService: 核心服务');
    this.logger.log('│ 🛡️  WebSocketAuthGuard: 身份验证守卫');
    this.logger.log('│ 🔍 WebSocketInterceptor: 请求拦截器');
    this.logger.log('│ ⚠️  WebSocketExceptionFilter: 异常过滤器');
    this.logger.log('└──────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
    this.logger.log('┌─ ⚡ 核心功能 ─────────────────────────────────────────────────────┐');
    this.logger.log('│ 🏠 房间管理: 支持加入/离开房间');
    this.logger.log('│ 💬 消息传递: 实时消息发送与接收');
    this.logger.log('│ 📢 广播功能: 支持房间内广播');
    this.logger.log('│ 📊 状态监控: 连接状态实时监控');
    this.logger.log('│ 🔍 健康检查: Ping/Pong 心跳检测');
    this.logger.log('│ 🛡️  异常处理: 完整的错误处理机制');
    this.logger.log('└──────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
  }
}
