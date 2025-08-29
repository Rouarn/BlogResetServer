import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageAdapter, StorageConfig } from '../interfaces';
import { appConfig } from '../../config';

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;

  constructor(private configService: ConfigService) {
    // 使用配置中的静态资源路径作为上传基础路径
    const staticConfig = appConfig.staticAssetsOptions;
    this.config = {
      type: 'local',
      basePath: this.configService.get('UPLOAD_PATH', staticConfig.root),
      maxFileSize: this.configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024),
      allowedTypes: this.configService.get('ALLOWED_FILE_TYPES', []),
    };
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.config.basePath);
    } catch {
      await fs.mkdir(this.config.basePath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.config.basePath}`);
    }
  }

  async upload(file: any, relativePath: string): Promise<string> {
    const fullPath = path.join(this.config.basePath, relativePath);
    const directory = path.dirname(fullPath);

    // 确保目录存在
    await fs.mkdir(directory, { recursive: true });

    // 写入文件
    await fs.writeFile(fullPath, file.buffer);

    this.logger.log(`File uploaded: ${relativePath}`);
    return relativePath;
  }

  async download(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.config.basePath, relativePath);
    return await fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.basePath, relativePath);
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${relativePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${relativePath}`, error);
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
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    const staticConfig = appConfig.staticAssetsOptions;
    // 使用静态资源URL前缀构建访问地址
    return `${baseUrl}${staticConfig.options.prefix}/${relativePath}`;
  }

  async getFileStats(
    relativePath: string,
  ): Promise<{ size: number; mtime: Date } | null> {
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
