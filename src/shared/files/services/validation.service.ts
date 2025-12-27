import { BusinessExceptionFactory } from '@/common/exceptions';
import { AppConfigService } from '@/config';
import { getCurrentTimestamp, uuid4 } from '@/utils';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
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

  constructor(private readonly appConfig: AppConfigService) {}

  async validateFile(file: Express.Multer.File): Promise<void> {
    // 验证文件名安全性
    this.validateFilename(file.originalname);

    // 验证文件大小 - 使用静态资源配置中的限制
    const staticConfig = this.appConfig.staticAssetsOptions.options;
    if (!staticConfig) {
      throw BusinessExceptionFactory.systemBusy({ message: '文件上传配置未找到' });
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
        reason: '文件真实类型与声明类型不匹配',
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

  /**
   * 验证文件名的安全性
   * @param filename 原始文件名
   */
  validateFilename(filename: string): void {
    if (!filename) {
      throw BusinessExceptionFactory.invalidParameter('文件名', { reason: '文件名不能为空' });
    }

    // 检查非法字符 (Null Byte)
    if (/\0/g.test(filename)) {
      throw BusinessExceptionFactory.invalidParameter('文件名', {
        reason: '文件名包含非法字符',
      });
    }

    // 检查路径遍历字符
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw BusinessExceptionFactory.invalidParameter('文件名', {
        reason: '文件名包含路径遍历字符',
      });
    }

    // 检查扩展名安全性
    const ext = this.getFileExtension(filename);
    if (ext && !/^[a-z0-9]+$/i.test(ext)) {
      throw BusinessExceptionFactory.invalidParameter('文件扩展名', {
        reason: '扩展名包含非法字符',
      });
    }
  }

  async validateFiles(files: Express.Multer.File[]): Promise<void> {
    const staticConfig = this.appConfig.staticAssetsOptions.options;
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
    const random = uuid4();
    const ext = this.getFileExtension(originalName);
    // 确保扩展名安全
    const safeExt = ext ? this.sanitizeFilename(ext) : 'bin';
    return `${timestamp}_${random}.${safeExt}`;
  }

  /**
   * 安全获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    // 如果没有扩展名或只有点，返回空字符串
    if (parts.length < 2 || (parts.length === 2 && parts[0] === '')) return '';
    return parts.pop()?.toLowerCase() ?? '';
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9.-]/gi, '_') // 仅允许字母、数字、点、横杠
      .replace(/\.{2,}/g, '.') // 防止连续点
      .replace(/^\.+|\.+$/g, '') // 去除首尾点
      .toLowerCase();
  }
}
