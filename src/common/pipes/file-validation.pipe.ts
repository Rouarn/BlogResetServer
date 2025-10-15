import { Injectable, PipeTransform } from '@nestjs/common';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { ConfigService } from '@nestjs/config';
import type { StaticConfig } from '../interfaces';

/**
 * 单文件验证管道（FileValidationPipe）
 *
 * 用于验证上传的单个文件是否符合系统配置的要求。
 *
 * 功能说明：
 * - 验证文件是否存在（非空检查）
 * - 验证文件大小是否超出限制
 * - 验证文件类型是否在允许的范围内
 * - 验证失败时抛出 BadRequestException 异常
 *
 * 依赖项：
 * - ConfigService: 用于读取文件上传相关配置
 * - app.static.upload.maxFileSize: 最大文件大小配置
 * - app.static.upload.allowedTypes: 允许的文件类型配置
 *
 * 用法示例：
 * ```typescript
 * @Post('upload')
 * uploadFile(@UploadedFile(FileValidationPipe) file: Express.Multer.File) {
 *   return { filename: file.filename };
 * }
 * ```
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  /**
   * 构造函数
   * @param configService 配置服务实例，用于获取文件上传配置
   */
  constructor(private configService: ConfigService) {}

  /**
   * 验证单个文件
   * @param file 上传的文件对象
   * @returns 验证通过的文件对象
   * @throws BadRequestException 验证失败时抛出异常
   */
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw BusinessExceptionFactory.invalidParameter('文件', { reason: '文件不能为空' });
    }

    // 验证文件大小
    const staticConfig = this.configService.get<StaticConfig>('app.static');

    if (!staticConfig?.upload) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }

    const maxSize = staticConfig.upload.maxFileSize;
    if (file.size > maxSize) {
      throw BusinessExceptionFactory.invalidParameter('文件大小', {
        fileSize: file.size,
        maxSize,
        maxSizeMB: maxSize / 1024 / 1024,
      });
    }

    // 验证文件类型
    const allowedTypes = staticConfig.upload.allowedTypes;
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw BusinessExceptionFactory.invalidParameter('文件类型', {
        fileType: file.mimetype,
        allowedTypes,
      });
    }

    return file;
  }
}

/**
 * 多文件验证管道（FilesValidationPipe）
 *
 * 用于验证批量上传的文件是否符合系统配置的要求。
 *
 * 功能说明：
 * - 验证文件列表是否为空
 * - 验证文件数量是否超出批量上传限制
 * - 对每个文件执行单文件验证逻辑
 * - 验证失败时抛出 BadRequestException 异常
 *
 * 依赖项：
 * - ConfigService: 用于读取文件上传相关配置
 * - FileValidationPipe: 单文件验证管道
 * - app.static.upload.maxBatchFiles: 批量上传最大文件数配置
 *
 * 用法示例：
 * ```typescript
 * @Post('batch-upload')
 * uploadFiles(@UploadedFiles(FilesValidationPipe) files: Express.Multer.File[]) {
 *   return { count: files.length };
 * }
 * ```
 */
@Injectable()
export class FilesValidationPipe implements PipeTransform {
  /**
   * 构造函数
   * @param configService 配置服务实例，用于获取文件上传配置
   */
  constructor(private configService: ConfigService) {}

  /**
   * 验证多个文件
   * @param files 上传的文件数组
   * @returns 验证通过的文件数组
   * @throws BadRequestException 验证失败时抛出异常
   */
  transform(files: Express.Multer.File[]): Express.Multer.File[] {
    if (files?.length === 0) {
      throw BusinessExceptionFactory.invalidParameter('文件列表', { reason: '文件列表不能为空' });
    }

    const staticConfig = this.configService.get<StaticConfig>('app.static');

    if (!staticConfig?.upload) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }

    const maxFiles = staticConfig.upload.maxBatchFiles;
    if (files.length > maxFiles) {
      throw BusinessExceptionFactory.invalidParameter('文件数量', {
        fileCount: files.length,
        maxFiles,
      });
    }

    const fileValidationPipe = new FileValidationPipe(this.configService);
    return files.map((file) => fileValidationPipe.transform(file));
  }
}
