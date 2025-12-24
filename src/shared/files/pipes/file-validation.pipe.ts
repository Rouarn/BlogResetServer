import { BusinessExceptionFactory } from '@/common/exceptions';
import { Injectable, PipeTransform } from '@nestjs/common';
import { ValidationService } from '../services/validation.service';

/**
 * 单文件验证管道（FileValidationPipe）
 *
 * 用于验证上传的单个文件是否符合系统配置的要求。
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  /**
   * 构造函数
   * @param validationService 文件验证服务
   */
  constructor(private readonly validationService: ValidationService) {}

  /**
   * 验证单个文件
   * @param file 上传的文件对象
   * @returns 验证通过的文件对象
   * @throws BadRequestException 验证失败时抛出异常
   */
  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!file) {
      throw BusinessExceptionFactory.invalidParameter('文件', { reason: '文件不能为空' });
    }

    await this.validationService.validateFile(file);
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
   * @param validationService 文件验证服务
   */
  constructor(private readonly validationService: ValidationService) {}

  /**
   * 验证多个文件
   * @param files 上传的文件数组
   * @returns 验证通过的文件数组
   * @throws BadRequestException 验证失败时抛出异常
   */
  async transform(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
    if (!files || files.length === 0) {
      throw BusinessExceptionFactory.invalidParameter('文件列表', { reason: '文件列表不能为空' });
    }

    await this.validationService.validateFiles(files);
    return files;
  }
}
