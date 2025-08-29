import { StorageAdapter } from './storage.interface';

export enum StorageType {
  LOCAL = 'local',
  AWS_S3 = 'aws-s3',
  AZURE_BLOB = 'azure-blob',
  GOOGLE_CLOUD = 'google-cloud',
  FTP = 'ftp',
}

export interface StorageFactoryConfig {
  type: StorageType;
  config: Record<string, any>;
}

export interface StorageFactory {
  createAdapter(config: StorageFactoryConfig): StorageAdapter;
}