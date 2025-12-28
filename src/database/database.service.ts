import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * 数据库服务
 *
 * 提供数据库连接状态检查和通用工具方法。
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    if (this.dataSource.isInitialized) {
      this.logger.log('Database connection established successfully.');
    } else {
      this.logger.error('Database connection failed to establish.');
    }
  }

  /**
   * 获取原生数据库连接 (DataSource)
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * 检查数据库连接状态
   */
  isConnected(): boolean {
    return this.dataSource.isInitialized;
  }
}
