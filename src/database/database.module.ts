import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './interceptors';
import { AuditSubscriber } from './subscribers';
import { DATABASE_CONFIG, DatabaseConfig } from './types';

// 类型定义
interface AsyncModuleOptions {
  useFactory?: (...args: unknown[]) => Promise<DatabaseConfig> | DatabaseConfig;
  inject?: (string | symbol | Type<unknown>)[];
  imports?: Type<unknown>[];
}

/**
 * 时间戳管理模块
 * 提供自动时间戳管理功能
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * 全局配置数据库模块
   * @param config 配置选项
   */
  static forRoot(config: DatabaseConfig = {}): DynamicModule {
    const defaultConfig: DatabaseConfig = {
      /**
       * 是否启用时间戳管理
       */
      enableTimestamps: true,
      /**
       * 字段名配置
       */
      fieldNames: {
        /**
         * 创建时间字段名
         */
        createTime: 'createTime',
        updateTime: 'updateTime',
      },
      /**
       * 排除的实体类
       */
      excludeEntities: [],
      ...config,
    };

    const providers: Provider[] = [
      {
        provide: DATABASE_CONFIG,
        useValue: defaultConfig,
      },
    ];

    // 添加订阅者
    if (defaultConfig.enableTimestamps) {
      providers.push(AuditSubscriber);
    }

    // 添加拦截器
    const interceptors: Provider[] = [];

    /**
     * 时间戳拦截器
     */
    if (defaultConfig.enableTimestamps) {
      interceptors.push({
        provide: APP_INTERCEPTOR,
        useClass: AuditInterceptor,
      });
    }

    providers.push(...interceptors);

    return {
      module: DatabaseModule,
      providers,
      exports: [DATABASE_CONFIG],
    };
  }

  /**
   * 异步配置时间戳管理模块
   * @param options 异步配置选项
   */
  static forRootAsync(options: AsyncModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DATABASE_CONFIG,
        useFactory: options.useFactory!,
        inject: options.inject ?? [],
      },
      AuditSubscriber,
      {
        provide: APP_INTERCEPTOR,
        useClass: AuditInterceptor,
      },
    ];

    return {
      module: DatabaseModule,
      imports: options.imports ?? [],
      providers,
      exports: [DATABASE_CONFIG],
    };
  }

  /**
   * 功能模块（不包含全局配置）
   * 用于在特定模块中使用时间戳管理功能
   */
  static forFeature(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [AuditSubscriber],
      exports: [AuditSubscriber],
    };
  }
}
