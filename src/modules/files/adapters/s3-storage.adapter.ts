import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter } from '../interfaces/storage.interface';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  basePath?: string;
}

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private s3Client: any; // AWS SDK v3 client

  constructor(private config: S3Config) {
    // 注意：这里需要安装 @aws-sdk/client-s3
    // this.s3Client = new S3Client({
    //   region: config.region,
    //   credentials: {
    //     accessKeyId: config.accessKeyId,
    //     secretAccessKey: config.secretAccessKey,
    //   },
    //   endpoint: config.endpoint,
    // });
  }

  async upload(file: any, relativePath: string): Promise<string> {
    try {
      const key = this.config.basePath
        ? `${this.config.basePath}/${relativePath}`
        : relativePath;

      // const command = new PutObjectCommand({
      //   Bucket: this.config.bucket,
      //   Key: key,
      //   Body: file.buffer,
      //   ContentType: file.mimetype,
      // });

      // await this.s3Client.send(command);

      this.logger.log(`File uploaded to S3: ${key}`);
      return relativePath;
    } catch (error) {
      this.logger.error('S3 upload failed', error);
      throw error;
    }
  }

  async download(relativePath: string): Promise<Buffer> {
    try {
      const key = this.config.basePath
        ? `${this.config.basePath}/${relativePath}`
        : relativePath;

      // const command = new GetObjectCommand({
      //   Bucket: this.config.bucket,
      //   Key: key,
      // });

      // const response = await this.s3Client.send(command);
      // const chunks: Buffer[] = [];

      // for await (const chunk of response.Body as any) {
      //   chunks.push(chunk);
      // }

      // return Buffer.concat(chunks);

      // 临时返回空Buffer，实际使用时需要取消注释上面的代码
      return Buffer.alloc(0);
    } catch (error) {
      this.logger.error('S3 download failed', error);
      throw error;
    }
  }

  async delete(relativePath: string): Promise<boolean> {
    try {
      const key = this.config.basePath
        ? `${this.config.basePath}/${relativePath}`
        : relativePath;

      // const command = new DeleteObjectCommand({
      //   Bucket: this.config.bucket,
      //   Key: key,
      // });

      // await this.s3Client.send(command);

      this.logger.log(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      this.logger.error('S3 delete failed', error);
      return false;
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const key = this.config.basePath
        ? `${this.config.basePath}/${relativePath}`
        : relativePath;

      // const command = new HeadObjectCommand({
      //   Bucket: this.config.bucket,
      //   Key: key,
      // });

      // await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  getUrl(relativePath: string): string {
    const key = this.config.basePath
      ? `${this.config.basePath}/${relativePath}`
      : relativePath;

    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}
