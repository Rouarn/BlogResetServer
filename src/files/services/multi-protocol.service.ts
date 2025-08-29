import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageFactoryService } from './storage-factory.service';
import { StorageAdapter } from '../interfaces/storage.interface';
import { UploadProtocol } from '../enums';
import { StorageType } from '../interfaces/storage-factory.interface';

@Injectable()
export class MultiProtocolService {
  private readonly logger = new Logger(MultiProtocolService.name);
  private adapters: Map<UploadProtocol, StorageAdapter> = new Map();

  constructor(
    private configService: ConfigService,
    private storageFactory: StorageFactoryService,
  ) {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // HTTP协议使用本地存储或配置的云存储
    const httpStorageType = this.configService.get<StorageType>('HTTP_STORAGE_TYPE', StorageType.LOCAL);
    const httpAdapter = this.storageFactory.createAdapter({
      type: httpStorageType,
      config: this.storageFactory['getStorageConfig'](httpStorageType),
    });
    this.adapters.set(UploadProtocol.HTTP, httpAdapter);

    // FTP协议使用FTP存储
    if (this.configService.get('FTP_HOST')) {
      const ftpAdapter = this.storageFactory.createAdapter({
        type: StorageType.FTP,
        config: this.storageFactory['getStorageConfig'](StorageType.FTP),
      });
      this.adapters.set(UploadProtocol.FTP, ftpAdapter);
    }

    this.logger.log(`Initialized ${this.adapters.size} storage adapters`);
  }

  getAdapter(protocol: UploadProtocol): StorageAdapter {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new BadRequestException(`不支持的上传协议: ${protocol}`);
    }
    return adapter;
  }

  async uploadFile(
    file: any,
    relativePath: string,
    protocol: UploadProtocol = UploadProtocol.HTTP,
  ): Promise<string> {
    const adapter = this.getAdapter(protocol);
    return await adapter.upload(file, relativePath);
  }

  async downloadFile(
    relativePath: string,
    protocol: UploadProtocol = UploadProtocol.HTTP,
  ): Promise<Buffer> {
    const adapter = this.getAdapter(protocol);
    return await adapter.download(relativePath);
  }

  async deleteFile(
    relativePath: string,
    protocol: UploadProtocol = UploadProtocol.HTTP,
  ): Promise<boolean> {
    const adapter = this.getAdapter(protocol);
    return await adapter.delete(relativePath);
  }

  async fileExists(
    relativePath: string,
    protocol: UploadProtocol = UploadProtocol.HTTP,
  ): Promise<boolean> {
    const adapter = this.getAdapter(protocol);
    return await adapter.exists(relativePath);
  }

  getFileUrl(
    relativePath: string,
    protocol: UploadProtocol = UploadProtocol.HTTP,
  ): string {
    const adapter = this.getAdapter(protocol);
    return adapter.getUrl(relativePath);
  }

  getSupportedProtocols(): UploadProtocol[] {
    return Array.from(this.adapters.keys());
  }
}