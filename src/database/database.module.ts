import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from './database.config';
import { DatabaseService } from './database.service';

/**
 * 数据库核心模块
 *
 * @description
 * 该模块负责数据库层的初始化和配置。它封装了 TypeORM 的配置逻辑，
 * 并在全局范围内提供数据库连接服务。
 *
 * 主要功能：
 * 1. 导入 TypeOrmModule 并使用 forRootAsync 异步配置数据库连接。
 * 2. 注入 DatabaseConfigService 以获取动态配置。
 * 3. 导出 DatabaseService 供其他模块使用。
 *
 * @module DatabaseModule
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfigService,
    }),
  ],
  providers: [DatabaseConfigService, DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
