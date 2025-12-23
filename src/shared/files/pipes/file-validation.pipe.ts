import { BusinessExceptionFactory } from '@/common/exceptions';
import { AppConfigService } from '@/config';
import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * 单文件验证管道（FileValidationPipe）
 *
 * 用于验证上传的单个文件是否符合系统配置的要求。
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  /**
   * 构造函数
   * @param configService 配置服务实例，用于获取文件上传配置
   */
  constructor(private readonly appConfig: AppConfigService) {}

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
    const staticConfig = this.appConfig.staticAssetsOptions.options;

    if (!staticConfig) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }

    const maxSize = staticConfig.uploadsMaxSize;
    if (file.size > maxSize) {
      throw BusinessExceptionFactory.invalidParameter('文件大小', {
        fileSize: file.size,
        maxSize,
        maxSizeMB: maxSize / 1024 / 1024,
      });
    }

    // 验证文件类型
    const allowedTypes = staticConfig.uploadsAllowedTypes;
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
 */
@Injectable()
export class FilesValidationPipe implements PipeTransform {
  /**
   * 构造函数
   * @param configService 配置服务实例，用于获取文件上传配置
   */
  constructor(private readonly appConfig: AppConfigService) {}

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

    const staticConfig = this.appConfig.staticAssetsOptions.options;

    if (!staticConfig) {
      throw BusinessExceptionFactory.systemBusy({ reason: '文件上传配置未找到' });
    }

    const maxFiles = staticConfig.uploadsMaxFiles;
    if (files.length > maxFiles) {
      throw BusinessExceptionFactory.invalidParameter('文件数量', {
        fileCount: files.length,
        maxFiles,
      });
    }

    const fileValidationPipe = new FileValidationPipe(this.appConfig);
    return files.map((file) => fileValidationPipe.transform(file));
  }
}
