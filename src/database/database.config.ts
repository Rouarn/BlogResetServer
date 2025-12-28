import { AppConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { CustomNamingStrategy } from './naming.strategy';

/**
 * 数据库配置服务
 *
 * 负责创建 TypeORM 配置对象，注入应用配置，并应用自定义命名策略。
 */
@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly appConfigService: AppConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig = this.appConfigService.databaseConfig;

    return {
      type: dbConfig.type,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,

      // 自动加载实体
      autoLoadEntities: true,

      // 同步数据库结构 (生产环境应禁用)
      synchronize: dbConfig.synchronize,

      // 日志配置
      logging: dbConfig.logging,
      logger: dbConfig.logger,

      // 表前缀配置
      entityPrefix: dbConfig.tablePrefix,

      // 自定义命名策略 (处理字段前缀、蛇形命名、时间戳字段名)
      namingStrategy: new CustomNamingStrategy({
        snakeCase: dbConfig.snakeCase,
        timestamps: {
          createTime: dbConfig.timestamps.createdAt,
          updateTime: dbConfig.timestamps.updatedAt,
        },
      }),

      // 连接池配置
      extra: {
        connectionLimit: 10,
      },

      // 时区配置 (建议设置为 UTC 或本地时间)
      timezone: 'Z',
    };
  }
}
