/**
 * 调试模块
 *
 * 功能说明:
 * - 提供开发环境下的调试工具和监控功能
 * - 集成请求追踪、错误诊断和性能监控
 * - 提供调试面板和API接口
 * - 支持实时数据查看和历史记录分析
 *
 * 主要组件:
 * - DebugController: 调试API控制器
 * - DebugService: 核心调试服务
 * - RequestTrackingService: 请求追踪服务
 * - ErrorDiagnosticsService: 错误诊断服务
 * - PerformanceMonitorService: 性能监控服务
 * - DebugMiddleware: 请求追踪中间件
 * - RequestTrackingInterceptor: 请求拦截器
 * - DebugExceptionFilter: 调试异常过滤器
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DebugController } from './debug.controller';
import { DebugService } from './debug.service';
import { RequestTrackingService } from './services/request-tracking.service';
import { ErrorDiagnosticsService } from './services/error-diagnostics.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { EnvironmentService } from './services/environment.service';
import { DevelopmentGuard } from './guards/development.guard';
import { DebugMiddleware } from './middleware/debug.middleware';
import { RequestTrackingInterceptor } from './interceptors/request-tracking.interceptor';
import { DebugExceptionFilter } from './filters/debug-exception.filter';

@Module({
  imports: [ConfigModule],
  controllers: [DebugController],
  providers: [
    DebugService,
    RequestTrackingService,
    ErrorDiagnosticsService,
    PerformanceMonitorService,
    EnvironmentService,
    DevelopmentGuard,
    DebugMiddleware,
    RequestTrackingInterceptor,
    DebugExceptionFilter,
  ],
  exports: [
    DebugService,
    RequestTrackingService,
    ErrorDiagnosticsService,
    PerformanceMonitorService,
    EnvironmentService,
    DevelopmentGuard,
    DebugMiddleware,
    RequestTrackingInterceptor,
    DebugExceptionFilter,
  ],
})
export class DebugModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    // 只在开发环境启用调试中间件
    if (DevelopmentGuard.isDevelopment(this.configService)) {
      consumer.apply(DebugMiddleware).forRoutes('*'); // 应用到所有路由
    }
  }
}
