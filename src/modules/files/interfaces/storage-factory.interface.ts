import type { StorageAdapter } from './storage.interface';

export enum StorageType {
  LOCAL = 'local',
}

export interface StorageFactoryConfig {
  type: StorageType;
  config: Record<string, unknown>;
}

export interface StorageFactory {
  createAdapter(config: StorageFactoryConfig): StorageAdapter;
}
