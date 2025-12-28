import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from './database.config';
import { DatabaseService } from './database.service';

/**
 * 数据库模块
 *
 * 封装 TypeORM 配置和连接管理。
 * 在 AppModule 中导入此模块即可启用数据库功能。
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
