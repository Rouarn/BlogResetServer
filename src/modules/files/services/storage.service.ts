import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StaticConfig } from 'src/common/interfaces';
import { appConfig } from 'src/config';

import type { StorageAdapter, StorageConfig } from '../interfaces';

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;

  constructor(private configService: ConfigService) {
    // 使用静态资源配置中的上传设置
    const staticConfig = this.configService.get('app.static') as StaticConfig;
    this.config = {
      type: 'local',
      basePath: staticConfig.upload.path,
      maxFileSize: staticConfig.upload.maxFileSize,
      allowedTypes: staticConfig.upload.allowedTypes,
    };
    void this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.config.basePath);
      this.logger.debug(`📁 上传目录已存在: ${this.config.basePath}`);
    } catch {
      await fs.mkdir(this.config.basePath, { recursive: true });
      this.logger.log(`📁 创建上传目录: ${this.config.basePath}`);
    }
  }

  async upload(file: Express.Multer.File, relativePath: string): Promise<string> {
    const fullPath = path.join(this.config.basePath, relativePath);
    const directory = path.dirname(fullPath);

    this.logger.debug(`📤 开始上传文件: ${file.originalname} -> ${relativePath}`);
    this.logger.debug(`📂 目标路径: ${fullPath}`);

    try {
      // 确保目录存在
      await fs.mkdir(directory, { recursive: true });

      // 写入文件
      await fs.writeFile(fullPath, file.buffer);

      this.logger.log(
        `✅ 文件上传成功: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB) -> ${relativePath}`,
      );
      return relativePath;
    } catch (error) {
      this.logger.error(`❌ 文件上传失败: ${file.originalname} -> ${relativePath}`, error);
      throw error;
    }
  }

  async download(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.config.basePath, relativePath);
    return await fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.basePath, relativePath);
      await fs.unlink(fullPath);
      this.logger.log(`🗑️ 文件删除成功: ${relativePath}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ 文件删除失败: ${relativePath}`, error);
      return false;
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.basePath, relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(relativePath: string): string {
    const baseUrl = this.configService.get('NEST_BASE_URL', 'http://localhost:3000');
    const port = this.configService.get('NEST_PORT', 3000);

    const staticConfig = appConfig.staticAssetsOptions;
    // 使用静态资源URL前缀构建访问地址，添加uploads子目录
    return `${baseUrl}:${port}${staticConfig.uploads.prefix}/${relativePath}`;
  }

  async getFileStats(relativePath: string): Promise<{ size: number; mtime: Date } | null> {
    try {
      const fullPath = path.join(this.config.basePath, relativePath);
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  async createDirectory(relativePath: string): Promise<void> {
    const fullPath = path.join(this.config.basePath, relativePath);
    await fs.mkdir(fullPath, { recursive: true });
  }
}
