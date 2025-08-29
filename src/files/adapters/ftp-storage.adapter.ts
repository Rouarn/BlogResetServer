import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter } from '../interfaces/storage.interface';
import * as ftp from 'basic-ftp';
import * as path from 'path';
import { Readable } from 'stream';

export interface FtpConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  secure?: boolean;
  basePath?: string;
}

@Injectable()
export class FtpStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(FtpStorageAdapter.name);
  private client: ftp.Client;

  constructor(private config: FtpConfig) {
    this.client = new ftp.Client();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.access({
        host: this.config.host,
        port: this.config.port || 21,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure || false,
      });
    } catch (error) {
      this.logger.error('FTP connection failed', error);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    this.client.close();
  }

  async upload(file: any, relativePath: string): Promise<string> {
    await this.connect();
    
    try {
      const fullPath = this.config.basePath 
        ? path.join(this.config.basePath, relativePath)
        : relativePath;
      
      const directory = path.dirname(fullPath);
      
      // 确保目录存在
      try {
        await this.client.ensureDir(directory);
      } catch (error) {
        this.logger.warn(`Failed to create directory: ${directory}`, error);
      }

      // 上传文件 - 将Buffer转换为Readable流
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      
      await this.client.uploadFrom(stream, fullPath);
      
      this.logger.log(`File uploaded via FTP: ${fullPath}`);
      return relativePath;
    } finally {
      await this.disconnect();
    }
  }

  async download(relativePath: string): Promise<Buffer> {
    await this.connect();
    
    try {
      const fullPath = this.config.basePath 
        ? path.join(this.config.basePath, relativePath)
        : relativePath;
      
      const chunks: Buffer[] = [];
      
      // 使用PassThrough流来处理下载
      const { PassThrough } = require('stream');
      const downloadStream = new PassThrough();
      
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      await this.client.downloadTo(downloadStream, fullPath);
      
      return Buffer.concat(chunks);
    } finally {
      await this.disconnect();
    }
  }

  async delete(relativePath: string): Promise<boolean> {
    await this.connect();
    
    try {
      const fullPath = this.config.basePath 
        ? path.join(this.config.basePath, relativePath)
        : relativePath;
      
      await this.client.remove(fullPath);
      this.logger.log(`File deleted via FTP: ${fullPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file via FTP: ${relativePath}`, error);
      return false;
    } finally {
      await this.disconnect();
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    await this.connect();
    
    try {
      const fullPath = this.config.basePath 
        ? path.join(this.config.basePath, relativePath)
        : relativePath;
      
      const list = await this.client.list(path.dirname(fullPath));
      const filename = path.basename(fullPath);
      
      return list.some((item: any) => item.name === filename);
    } catch (error) {
      return false;
    } finally {
      await this.disconnect();
    }
  }

  getUrl(relativePath: string): string {
    return `ftp://${this.config.host}${this.config.basePath || ''}/${relativePath}`;
  }
}