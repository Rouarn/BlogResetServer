import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import type { StaticOptions } from 'src/common/interfaces';
import { getCurrentTimestamp, randomString } from 'src/utils';
import { BusinessExceptionFactory } from '../../../common/exceptions';
import { FileType } from '../enums';

@Injectable()
export class ValidationService {
  private readonly allowedMimeTypes: Record<FileType, string[]> = {
    [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    [FileType.VIDEO]: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    [FileType.AUDIO]: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
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
    // 验证文件大小 - 使用静态资源配置中的限制
    const staticConfig = this.configService.get('app.static') as StaticOptions;
    if (!staticConfig) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }
    const maxSize = staticConfig.uploadsMaxSize;

    if (file.size > maxSize) {
      throw BusinessExceptionFactory.invalidParameter('文件大小', {
        fileSize: file.size,
        maxSize,
      });
    }

    // 验证文件类型
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (detectedType && detectedType.mime !== file.mimetype) {
      throw BusinessExceptionFactory.invalidParameter('文件类型', {
        detectedType: detectedType.mime,
        expectedType: file.mimetype,
      });
    }

    // 验证MIME类型是否被允许
    const allowedTypes = staticConfig.uploadsAllowedTypes;
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw BusinessExceptionFactory.invalidParameter('文件类型', {
        fileType: file.mimetype,
        allowedTypes,
      });
    }
  }

  async validateFiles(files: Express.Multer.File[]): Promise<void> {
    const staticConfig = this.configService.get('app.static') as StaticOptions;
    if (!staticConfig) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }

    const maxFiles = staticConfig.uploadsMaxFiles ?? 10;
    if (files.length > maxFiles) {
      throw BusinessExceptionFactory.invalidParameter('批量上传文件数量', {
        fileCount: files.length,
        maxFiles,
      });
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
    const timestamp = getCurrentTimestamp();
    const random = randomString(8);
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
