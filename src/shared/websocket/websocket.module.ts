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
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { WebSocketService } from './services/websocket.service';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketExceptionFilter } from './filters/websocket-exception.filter';
import { WebSocketInterceptor } from './interceptors/websocket.interceptor';

/**
 * WebSocket 模块
 *
 * 提供完整的 WebSocket 功能支持
 */
@Module({
  imports: [ConfigModule, AuthModule],
  providers: [WebSocketService, WebSocketGateway, WebSocketExceptionFilter, WebSocketInterceptor],
  exports: [WebSocketService, WebSocketExceptionFilter, WebSocketInterceptor],
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
