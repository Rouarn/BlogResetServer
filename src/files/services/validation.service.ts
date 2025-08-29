import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';
import * as crypto from 'crypto';
import { FileType } from '../enums';

@Injectable()
export class ValidationService {
  private readonly allowedMimeTypes: Record<FileType, string[]> = {
    [FileType.IMAGE]: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    [FileType.VIDEO]: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
    ],
    [FileType.AUDIO]: [
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
    ],
    [FileType.DOCUMENT]: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    [FileType.ARCHIVE]: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ],
    [FileType.OTHER]: ['*'],
  };

  constructor(private configService: ConfigService) {}

  async validateFile(file: Express.Multer.File): Promise<void> {
    // 验证文件大小
    const maxSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024);
    if (file.size > maxSize) {
      throw new BadRequestException(`文件大小超出限制，最大允许 ${maxSize / 1024 / 1024}MB`);
    }

    // 验证文件类型
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (detectedType && detectedType.mime !== file.mimetype) {
      throw new BadRequestException('文件类型与实际内容不匹配');
    }

    // 验证MIME类型是否被允许
    const allowedTypes = this.configService.get<string[]>('ALLOWED_FILE_TYPES', []);
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }
  }

  async validateFiles(files: Express.Multer.File[]): Promise<void> {
    const maxFiles = this.configService.get<number>('MAX_BATCH_FILES', 10);
    if (files.length > maxFiles) {
      throw new BadRequestException(`批量上传文件数量超出限制，最大允许 ${maxFiles} 个文件`);
    }

    for (const file of files) {
      await this.validateFile(file);
    }
  }

  getFileType(mimeType: string): FileType {
    for (const [type, mimes] of Object.entries(this.allowedMimeTypes)) {
      if (mimes.includes('*') || mimes.includes(mimeType)) {
        return type as FileType;
      }
    }
    return FileType.OTHER;
  }

  generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = originalName.split('.').pop();
    return `${timestamp}_${random}.${ext}`;
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}