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
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core/constants';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
// 应用核心组件
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpExceptionFilter } from './common/filters';
import { JwtAuthGuard, RolesGuard } from './common/guards';
// 公共组件导入
import { ResponseInterceptor } from './common/interceptors';
import { CustomValidationPipe } from './common/pipes';
// 配置模块导入
import { ConfigModule as AppConfigModule, AppConfigService } from './config';
// 时间管理模块
import {
  DATABASE_CONFIG,
  DatabaseConfig,
  DatabaseModule,
  DatabaseNamingStrategy,
} from './database';
// 业务模块导入
import { CacheModule } from '@/shared/cache';
import { FilesModule } from '@/shared/files/files.module';
import { ArticleCategoriesModule } from './modules/article_categories/article_categories.module';
import { ArticleFilesModule } from './modules/article_files/article_files.module';
import { ArticleLikesModule } from './modules/article_likes/article_likes.module';
import { ArticleRevisionsModule } from './modules/article_revisions/article_revisions.module';
import { ArticleTagsModule } from './modules/article_tags/article_tags.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';

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
      inject: [AppConfigService], // 注入配置服务
      useFactory: (appConfig: AppConfigService) => {
        return {
          secret: appConfig.jwtOptions.secret, // JWT 签名密钥
          signOptions: {
            expiresIn: appConfig.jwtOptions.accessTokenTtl, // JWT 过期时间
            algorithm: 'HS256',
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),

    // =============================================================================
    // 数据库模块 - TypeORM 配置
    // =============================================================================
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService, DATABASE_CONFIG],
      useFactory: (configService: AppConfigService, dbConfig: DatabaseConfig) => ({
        ...configService.databaseConfig,
        namingStrategy: new DatabaseNamingStrategy(dbConfig.fieldNames, dbConfig.tablePrefix),
        autoLoadEntities: true,
        retryDelay: 500,
        retryAttempts: 10,
      }),
    }),

    // =============================================================================
    // 数据库管理模块 - 自动时间戳功能
    // =============================================================================
    DatabaseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        enableTimestamps: true, // 启用时间戳功能
        fieldNames: {
          createTime: 'createTime',
          updateTime: 'updateTime',
        },
        tablePrefix: appConfig.databaseConfig.tablePrefix,
      }),
    }),

    // =============================================================================
    // 业务模块 - 应用功能模块
    // =============================================================================
    // 业务模块注册
    AuthModule, // 用户认证模块 (登录、注册、验证码)
    UsersModule, // 用户管理模块 (用户资料、状态管理、CRUD)
    FilesModule, // 文件管理模块 (上传、下载、存储)
    CacheModule, // 缓存模块 (Redis/内存缓存，支持装饰器)
    ArticlesModule, // 文章模块 (文章 CRUD、发布、状态管理)
    TagsModule, // 标签模块 (标签 CRUD、关联管理)
    CategoriesModule, // 分类模块 (分类 CRUD、层级关系)
    ArticleTagsModule, // 文章标签关联模块 (文章与标签多对多关系)
    ArticleCategoriesModule, // 文章分类关联模块 (文章与分类多对多关系)
    CommentsModule, // 评论模块 (评论 CRUD、状态管理)
    ArticleLikesModule, // 文章点赞模块 (用户点赞、匿名点赞)
    ArticleRevisionsModule, // 文章修订模块 (文章内容历史记录)
    ArticleFilesModule, // 文章文件关联模块 (文章与文件多对多关系)
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

    // =============================================================================
    // 全局守卫配置 - 按优先级顺序执行
    // =============================================================================
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
      useClass: CustomValidationPipe, // 自定义验证管道 (全局验证)
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
