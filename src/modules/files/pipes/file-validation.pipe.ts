import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private configService: ConfigService) {}

  transform(file: any): any {
    if (!file) {
      throw new BadRequestException('文件不能为空');
    }

    // 验证文件大小
    const maxSize = this.configService.get<number>(
      'MAX_FILE_SIZE',
      10 * 1024 * 1024,
    );
    if (file.size > maxSize) {
      throw new BadRequestException(
        `文件大小超出限制，最大允许 ${maxSize / 1024 / 1024}MB`,
      );
    }

    // 验证文件类型
    const allowedTypes = this.configService.get<string[]>(
      'ALLOWED_FILE_TYPES',
      [],
    );
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }

    return file;
  }
}

@Injectable()
export class FilesValidationPipe implements PipeTransform {
  constructor(private configService: ConfigService) {}

  transform(files: any[]): any[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('文件列表不能为空');
    }

    const maxFiles = this.configService.get<number>('MAX_BATCH_FILES', 10);
    if (files.length > maxFiles) {
      throw new BadRequestException(
        `批量上传文件数量超出限制，最大允许 ${maxFiles} 个文件`,
      );
    }

    const fileValidationPipe = new FileValidationPipe(this.configService);
    return files.map((file) => fileValidationPipe.transform(file));
  }
}
