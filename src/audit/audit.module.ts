import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  QueryFilterInterceptor,
  SoftDeleteInterceptor,
  TimestampInterceptor,
} from './interceptors';
import { SoftDeleteSubscriber, TimestampSubscriber } from './subscribers';
import { TIMESTAMP_MANAGER_CONFIG, TimestampManagerConfig } from './types';

// 类型定义
interface AsyncModuleOptions {
  useFactory?: (...args: unknown[]) => Promise<TimestampManagerConfig> | TimestampManagerConfig;
  inject?: (string | symbol | Type<unknown>)[];
  imports?: Type<unknown>[];
}

/**
 * 时间戳管理模块
 * 提供自动时间戳管理和软删除功能
 */
@Global()
@Module({})
export class AuditModule {
  /**
   * 全局配置时间戳管理模块
   * @param config 配置选项
   */
  static forRoot(config: TimestampManagerConfig = {}): DynamicModule {
    const defaultConfig: TimestampManagerConfig = {
      /**
       * 是否启用时间戳管理
       */
      enableTimestamps: true,
      /**
       * 是否启用软删除
       */
      enableSoftDelete: true,
      /**
       * 字段名配置
       */
      fieldNames: {
        /**
         * 创建时间字段名
         */
        createTime: 'createTime',
        updateTime: 'updateTime',
        deleteTime: 'deleteTime',
      },
      /**
       * 是否自动过滤已删除实体
       */
      autoFilterDeleted: true,
      /**
       * 排除的实体类
       */
      excludeEntities: [],
      ...config,
    };

    const providers: Provider[] = [
      {
        provide: TIMESTAMP_MANAGER_CONFIG,
        useValue: defaultConfig,
      },
    ];

    // 添加订阅者
    if (defaultConfig.enableTimestamps) {
      providers.push(TimestampSubscriber);
    }

    if (defaultConfig.enableSoftDelete) {
      providers.push(SoftDeleteSubscriber);
    }

    // 添加拦截器
    const interceptors: Provider[] = [];

    /**
     * 时间戳拦截器
     */
    if (defaultConfig.enableTimestamps) {
      interceptors.push({
        provide: APP_INTERCEPTOR,
        useClass: TimestampInterceptor,
      });
    }

    if (defaultConfig.enableSoftDelete) {
      interceptors.push(
        {
          provide: APP_INTERCEPTOR,
          useClass: SoftDeleteInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: QueryFilterInterceptor,
        },
      );
    }

    providers.push(...interceptors);

    return {
      module: AuditModule,
      providers,
      exports: [TIMESTAMP_MANAGER_CONFIG],
    };
  }

  /**
   * 异步配置时间戳管理模块
   * @param options 异步配置选项
   */
  static forRootAsync(options: AsyncModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: TIMESTAMP_MANAGER_CONFIG,
        useFactory: options.useFactory!,
        inject: options.inject ?? [],
      },
      TimestampSubscriber,
      SoftDeleteSubscriber,
      {
        provide: APP_INTERCEPTOR,
        useClass: TimestampInterceptor,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: SoftDeleteInterceptor,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: QueryFilterInterceptor,
      },
    ];

    return {
      module: AuditModule,
      imports: options.imports ?? [],
      providers,
      exports: [TIMESTAMP_MANAGER_CONFIG],
    };
  }

  /**
   * 功能模块（不包含全局配置）
   * 用于在特定模块中使用时间戳管理功能
   */
  static forFeature(): DynamicModule {
    return {
      module: AuditModule,
      providers: [TimestampSubscriber, SoftDeleteSubscriber],
      exports: [TimestampSubscriber, SoftDeleteSubscriber],
    };
  }
}
