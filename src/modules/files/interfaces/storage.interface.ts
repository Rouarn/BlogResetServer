export interface StorageAdapter {
  upload(file: any, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): string;
}

export interface StorageConfig {
  type: 'local' | 'aws' | 'azure' | 'gcp';
  basePath: string;
  maxFileSize: number;
  allowedTypes: string[];
}
