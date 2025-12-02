import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { staticAssetsOptions } from '../../../config';
import type {
  StorageAdapter,
  StorageFactory,
  StorageFactoryConfig,
} from '../interfaces/storage-factory.interface';
import { StorageType } from '../interfaces/storage-factory.interface';
import { StorageService } from './storage.service';

@Injectable()
export class StorageFactoryService implements StorageFactory {
  private readonly logger = new Logger(StorageFactoryService.name);

  constructor(private configService: ConfigService) {}

  createAdapter(config: StorageFactoryConfig): StorageAdapter {
    switch (config.type) {
      case StorageType.LOCAL:
        return new StorageService(this.configService);

      default:
        throw new BadRequestException(`Unsupported storage type: ${config.type}`);
    }
  }

  createFromConfig(): StorageAdapter {
    // 直接使用本地存储，因为项目只支持本地存储
    const storageType = StorageType.LOCAL;

    const config: StorageFactoryConfig = {
      type: storageType,
      config: this.getStorageConfig(storageType),
    };

    return this.createAdapter(config);
  }

  private getStorageConfig(type: StorageType): Record<string, unknown> {
    switch (type) {
      case StorageType.LOCAL:
        // 上传文件保存在静态资源目录下的 uploads 子目录
        const uploadPath: string = path.join(
          process.cwd(),
          staticAssetsOptions.root,
          staticAssetsOptions.options.uploadsPath,
        );

        return {
          basePath: uploadPath,
          maxFileSize: staticAssetsOptions.options.uploadsMaxSize,
          allowedTypes: staticAssetsOptions.options.uploadsAllowedTypes,
        };

      default:
        return {};
    }
  }
}
