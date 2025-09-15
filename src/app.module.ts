/**
 * NestJS 应用根模块
 *
 * 功能说明:
 * - 配置应用的核心模块和依赖注入
 * - 设置全局守卫、拦截器、管道和过滤器
 * - 集成数据库、JWT认证、配置管理等基础服务
 * - 注册业务模块（认证、文件管理等）
 *
 * 架构特点:
 * - 模块化设计，职责分离
 * - 全局服务统一配置
 * - 依赖注入和配置驱动
 * - 支持热重载和环境切换
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core/constants';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
// 应用核心组件
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpExceptionFilter } from './common/filters';
import { GlobalGuard, JwtAuthGuard, RolesGuard } from './common/guards';
// 公共组件导入
import { ResponseInterceptor } from './common/interceptors';
import { CustomValidationPipe } from './common/pipes';
import { JwtAuthStrategy } from './common/strategies';
// 配置模块导入
import { ConfigModule as AppConfigModule, AppConfigService } from './config';
// 时间戳管理模块
import { DatabaseModule } from './database';
// 业务模块导入
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { WebSocketModule } from './shared/websocket/websocket.module';
import { CacheModule } from './shared/cache/cache.module';

/**
 * 应用根模块配置
 *
 * 采用 NestJS 模块化架构，统一管理应用的所有依赖和配置
 */
@Module({
  imports: [
    // =============================================================================
    // 配置模块 - 环境变量和应用配置管理
    // =============================================================================
    AppConfigModule,

    // =============================================================================
    // JWT 认证模块 - 全局 JWT 服务配置
    // =============================================================================
    JwtModule.registerAsync({
      global: true, // 全局可用，无需在每个模块中重复导入
      inject: [ConfigService], // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('NEST_JWT_SECRET'), // JWT 签名密钥
        signOptions: {
          expiresIn: configService.get<number>( // JWT 过期时间
            'NEST_JWT_ACCESS_TOKEN_TTL',
            3600, // 默认 1 天
          ),
        },
      }),
    }),

    // =============================================================================
    // 数据库模块 - TypeORM 配置
    // =============================================================================
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService], // 注入应用配置服务
      useFactory: (configService: AppConfigService) => ({
        ...configService.databaseConfig, // 使用配置服务中的数据库配置
        autoLoadEntities: true, // 自动加载实体类
        retryDelay: 500, // 连接重试延迟 (毫秒)
        retryAttempts: 10, // 最大重试次数
      }),
    }),

    // =============================================================================
    // 数据库管理模块 - 自动时间戳功能
    // =============================================================================
    DatabaseModule.forRoot({
      enableTimestamps: true, // 启用时间戳功能
      fieldNames: {
        createTime: 'createTime',
        updateTime: 'updateTime',
      },
    }),

    // =============================================================================
    // 业务模块 - 应用功能模块
    // =============================================================================
    // 业务模块注册
    AuthModule, // 用户认证模块 (登录、注册、验证码)
    UsersModule, // 用户管理模块 (用户资料、状态管理、CRUD)
    FilesModule, // 文件管理模块 (上传、下载、存储)
    WebSocketModule, // WebSocket 模块 (实时通信、房间管理)
    CacheModule, // 缓存模块 (Redis/内存缓存，支持装饰器)
  ],

  // =============================================================================
  // 控制器注册
  // =============================================================================
  controllers: [
    AppController, // 应用根控制器 (健康检查、欢迎页面)
  ],

  // =============================================================================
  // 服务提供者配置
  // =============================================================================
  providers: [
    // 应用核心服务
    AppService, // 应用根服务
    JwtAuthStrategy, // JWT 认证策略

    // =============================================================================
    // 全局守卫配置 - 按优先级顺序执行
    // =============================================================================
    {
      provide: APP_GUARD,
      useClass: GlobalGuard, // 全局限流守卫 (优先执行限流检查)
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT 认证守卫 (验证访问令牌)
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 角色权限守卫 (验证用户角色)
    },

    // =============================================================================
    // 全局拦截器 - 统一响应格式化和请求追踪
    // =============================================================================

    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor, // 响应格式化拦截器 (统一响应格式)
    },

    // =============================================================================
    // 全局管道配置
    // =============================================================================
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },

    // =============================================================================
    // 全局异常过滤器 - 统一错误处理和调试诊断
    // =============================================================================

    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // HTTP 异常过滤器 (统一错误处理)
    },
  ],
})
export class AppModule {}
