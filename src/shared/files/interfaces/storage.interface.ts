export interface StorageAdapter {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): string;
}

export interface StorageConfig {
  type: 'local';
  basePath: string;
  maxFileSize: number;
  allowedTypes: string[];
}
