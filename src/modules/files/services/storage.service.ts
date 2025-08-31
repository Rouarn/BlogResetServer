import * as fs from 'fs/promises';
import * as path from 'path';
import type { StaticConfig } from 'src/common/interfaces';
import { appConfig } from 'src/config';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, StorageConfig } from '../interfaces';

@Injectable()
export class StorageService implements StorageAdapter {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;

  constructor(private configService: ConfigService) {
    // 使用静态资源配置中的上传设置
    const staticConfig = this.configService.get('app.static') as StaticConfig;

    // 解析上传路径，确保与静态文件服务路径一致
    let uploadPath: string;
    if (staticConfig.upload.path.startsWith('./dist/')) {
      uploadPath = path.join(process.cwd(), staticConfig.upload.path.substring(2));
    } else if (staticConfig.upload.path.startsWith('./')) {
      // 对于开发环境，文件应该存储在 dist 目录下
      uploadPath = path.join(process.cwd(), 'dist', staticConfig.upload.path.substring(2));
    } else {
      // 绝对路径直接使用
      uploadPath = staticConfig.upload.path;
    }

    this.config = {
      type: 'local',
      basePath: uploadPath,
      maxFileSize: staticConfig.upload.maxFileSize,
      allowedTypes: staticConfig.upload.allowedTypes,
    };

    this.logger.log(`🔧 Upload config - original path: ${staticConfig.upload.path}`);
    this.logger.log(`🔧 Upload config - resolved path: ${uploadPath}`);

    void this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.config.basePath);
      this.logger.log(`Upload directory exists: ${this.config.basePath}`);
    } catch {
      await fs.mkdir(this.config.basePath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.config.basePath}`);
    }
  }

  async upload(file: Express.Multer.File, relativePath: string): Promise<string> {
    const fullPath = path.join(this.config.basePath, relativePath);
    const directory = path.dirname(fullPath);

    this.logger.log(`Upload config - basePath: ${this.config.basePath}`);
    this.logger.log(`Upload config - relativePath: ${relativePath}`);
    this.logger.log(`Upload config - fullPath: ${fullPath}`);
    this.logger.log(`Upload config - directory: ${directory}`);

    // 确保目录存在
    await fs.mkdir(directory, { recursive: true });
    this.logger.log(`Directory created/verified: ${directory}`);

    // 写入文件
    await fs.writeFile(fullPath, file.buffer);
    this.logger.log(`File written to: ${fullPath}`);

    this.logger.log(`File uploaded successfully: ${relativePath}`);
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
    const baseUrl = this.configService.get('NEST_BASE_URL', 'http://localhost:3000');
    const port = this.configService.get('NEST_PORT', 3000);

    const staticConfig = appConfig.staticAssetsOptions;
    // 使用静态资源URL前缀构建访问地址，添加uploads子目录
    return `${baseUrl}:${port}${staticConfig.options.prefix}/uploads/${relativePath}`;
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
