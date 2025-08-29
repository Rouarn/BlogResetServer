import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter } from '../interfaces/storage.interface';
import { StorageFactory, StorageFactoryConfig, StorageType } from '../interfaces/storage-factory.interface';
import { StorageService } from './storage.service';
import { FtpStorageAdapter, FtpConfig } from '../adapters/ftp-storage-simple.adapter';
import { S3StorageAdapter, S3Config } from '../adapters/s3-storage.adapter';

@Injectable()
export class StorageFactoryService implements StorageFactory {
  private readonly logger = new Logger(StorageFactoryService.name);

  constructor(private configService: ConfigService) {}

  createAdapter(config: StorageFactoryConfig): StorageAdapter {
    switch (config.type) {
      case StorageType.LOCAL:
        return new StorageService(this.configService);

      case StorageType.FTP:
        const ftpConfig: FtpConfig = {
          host: config.config.host,
          port: config.config.port,
          user: config.config.user,
          password: config.config.password,
          secure: config.config.secure,
          basePath: config.config.basePath,
        };
        return new FtpStorageAdapter(ftpConfig);

      case StorageType.AWS_S3:
        const s3Config: S3Config = {
          region: config.config.region,
          bucket: config.config.bucket,
          accessKeyId: config.config.accessKeyId,
          secretAccessKey: config.config.secretAccessKey,
          endpoint: config.config.endpoint,
          basePath: config.config.basePath,
        };
        return new S3StorageAdapter(s3Config);

      case StorageType.AZURE_BLOB:
        // TODO: 实现Azure Blob存储适配器
        throw new Error('Azure Blob storage adapter not implemented yet');

      case StorageType.GOOGLE_CLOUD:
        // TODO: 实现Google Cloud存储适配器
        throw new Error('Google Cloud storage adapter not implemented yet');

      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }
  }

  createFromConfig(): StorageAdapter {
    const storageType = this.configService.get<StorageType>('STORAGE_TYPE', StorageType.LOCAL);
    
    const config: StorageFactoryConfig = {
      type: storageType,
      config: this.getStorageConfig(storageType),
    };

    return this.createAdapter(config);
  }

  private getStorageConfig(type: StorageType): Record<string, any> {
    switch (type) {
      case StorageType.LOCAL:
        return {
          basePath: this.configService.get('UPLOAD_PATH', './uploads'),
          maxFileSize: this.configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024),
          allowedTypes: this.configService.get('ALLOWED_FILE_TYPES', []),
        };

      case StorageType.FTP:
        return {
          host: this.configService.get('FTP_HOST'),
          port: this.configService.get('FTP_PORT', 21),
          user: this.configService.get('FTP_USER'),
          password: this.configService.get('FTP_PASSWORD'),
          secure: this.configService.get('FTP_SECURE', false),
          basePath: this.configService.get('FTP_BASE_PATH', '/uploads'),
        };

      case StorageType.AWS_S3:
        return {
          region: this.configService.get('AWS_REGION'),
          bucket: this.configService.get('AWS_S3_BUCKET'),
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
          endpoint: this.configService.get('AWS_S3_ENDPOINT'),
          basePath: this.configService.get('AWS_S3_BASE_PATH', 'uploads'),
        };

      default:
        return {};
    }
  }
}