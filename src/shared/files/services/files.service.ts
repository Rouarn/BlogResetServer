import { Status } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { formatDatePath, getErrorMessage } from '@/utils';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import sharp from 'sharp';
import { In, Repository } from 'typeorm';
import type { FileQueryDto, FileUploadDto } from '../dto';
import { File } from '../entities';
import type { BatchUploadResult, FileUploadResult } from '../interfaces';
import { StorageService } from './storage.service';
import { ValidationService } from './validation.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private storageService: StorageService,
    private validationService: ValidationService,
  ) {}

  async uploadSingleFile(
    file: Express.Multer.File,
    uploadDto: FileUploadDto,
    userId?: string,
  ): Promise<FileUploadResult> {
    // 验证文件
    await this.validationService.validateFile(file);

    // 生成文件信息
    const filename = this.validationService.generateUniqueFilename(file.originalname);
    const fileHash = this.validationService.generateFileHash(file.buffer);
    const fileType = this.validationService.getFileType(file.mimetype);

    // 检查文件是否已存在（基于hash）
    const existingFile = await this.fileRepository.findOne({
      where: { hash: fileHash },
    });
    if (existingFile) {
      return this.mapToUploadResult(existingFile);
    }

    // 构建存储路径，使用配置中的静态资源路径
    const datePath = formatDatePath(); // YYYY-MM
    const relativePath = path.join(datePath, filename);

    // 存储文件（StorageService会自动使用配置的根路径）
    const storedPath = await this.storageService.upload(file, relativePath);

    // 保存文件记录
    const fileEntity = this.fileRepository.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: storedPath,
      hash: fileHash,
      userId,
      fileType,
      description: uploadDto.description,
      isPublic: Number(uploadDto.isPublic) === Status.ENABLED ? Status.ENABLED : Status.DISABLED,
      uploadProtocol: uploadDto.protocol,
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    this.logger.log(
      `📁 文件上传成功: ${savedFile.originalName} (${savedFile.id}) - ${(savedFile.size / 1024).toFixed(2)}KB`,
    );

    return this.mapToUploadResult(savedFile);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadDto: FileUploadDto,
    userId?: string,
  ): Promise<BatchUploadResult> {
    // 验证所有文件
    await this.validationService.validateFiles(files);

    const results: BatchUploadResult = {
      successful: [],
      failed: [],
      totalFiles: files.length,
      successCount: 0,
      failureCount: 0,
    };

    // 预先计算所有文件的哈希值
    const fileHashes = files.map((file) => this.validationService.generateFileHash(file.buffer));

    // 批量查询已存在的文件
    const existingFiles = await this.fileRepository.findBy({ hash: In(fileHashes) });
    const existingFilesMap = new Map(existingFiles.map((file) => [file.hash, file]));

    // 并发处理文件上传
    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileHash = fileHashes[index];
        const existingFile = existingFilesMap.get(fileHash);

        if (existingFile) {
          const result = this.mapToUploadResult(existingFile);
          results.successful.push(result);
          results.successCount++;
          return;
        }

        const result = await this.uploadSingleFile(file, uploadDto, userId);
        results.successful.push(result);
        results.successCount++;
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: getErrorMessage(error),
        });
        results.failureCount++;
        this.logger.error(`❌ 文件上传失败: ${file.originalname}`, error);
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  async findFiles(
    queryDto: FileQueryDto,
    userId?: string,
  ): Promise<{ data: File[]; total: number }> {
    const { size, current, type, search, publicOnly, sortBy, sortOrder } = queryDto;

    const queryBuilder = this.fileRepository.createQueryBuilder('file');

    // 基础过滤条件
    if (!publicOnly && userId) {
      queryBuilder.where('file.userId = :userId OR file.isPublic = :isPublic', {
        userId,
        isPublic: Status.ENABLED,
      });
    } else if (publicOnly) {
      queryBuilder.where('file.isPublic = :isPublic', { isPublic: Status.ENABLED });
    }

    // 类型过滤
    if (type) {
      queryBuilder.andWhere('file.fileType = :type', { type });
    }

    // 搜索过滤
    if (search) {
      queryBuilder.andWhere('(file.originalName ILIKE :search OR file.filename ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 排序
    const allowedSortFields = ['createTime', 'size', 'filename'];
    const inputSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createTime';
    const sortField = inputSortBy === 'createTime' ? 'createdAt' : inputSortBy;
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`file.${sortField}`, order);

    // 分页
    const pageSize = size ?? 10;
    const pageNumber = current ?? 1;
    const offset = (pageNumber - 1) * pageSize;
    queryBuilder.skip(offset).take(pageSize);

    const [files, total] = await queryBuilder.getManyAndCount();

    return { data: files, total };
  }

  async findFileById(id: string, userId?: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw BusinessExceptionFactory.notFound('文件不存在', { id });
    }

    // 检查访问权限
    if (!this.canAccessFile(file, userId)) {
      throw BusinessExceptionFactory.forbidden('禁止访问该文件', { id });
    }

    return file;
  }

  async deleteFile(id: string, userId?: string): Promise<boolean> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw BusinessExceptionFactory.notFound('文件不存在', { id });
    }

    // 只有文件所有者可以删除文件
    if (userId && file.userId !== userId) {
      throw BusinessExceptionFactory.forbidden('只有文件所有者可以删除文件', { id });
    }

    // 删除物理文件
    const deleted = await this.storageService.delete(file.path);
    if (!deleted) {
      this.logger.warn(`⚠️ 物理文件删除失败: ${file.path}`);
    }

    // 删除数据库记录
    await this.fileRepository.remove(file);
    this.logger.log(`🗑️ 文件删除成功: ${file.originalName} (${id})`);

    return true;
  }

  async getFileBuffer(
    id: string,
    userId?: string,
    size?: string,
  ): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.findFileById(id, userId);
    let buffer = await this.storageService.download(file.path);

    if (size && file.mimeType.startsWith('image/')) {
      try {
        const [width, height] = size.split('x').map((s) => parseInt(s, 10));

        if (!isNaN(width) && !isNaN(height)) {
          buffer = await sharp(buffer)
            .resize(width, height, {
              fit: 'cover',
              position: 'center',
            })
            .toBuffer();
        }
      } catch (error) {
        this.logger.warn(`图片缩放失败: ${error}`);
        // 缩放失败时返回原图
      }
    }

    return { file, buffer };
  }

  private canAccessFile(file: File, userId?: string): boolean {
    // 公开文件任何人都可以访问
    if (file.isPublic === Status.ENABLED) {
      return true;
    }

    // 私有文件只有所有者可以访问
    if (userId && file.userId === userId) {
      return true;
    }

    return false;
  }

  async updateFilePublicStatus(id: string, isPublic: Status, userId?: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw BusinessExceptionFactory.notFound('文件不存在', { id });
    }

    // 只有文件所有者可以修改文件状态
    if (userId && file.userId !== userId) {
      throw BusinessExceptionFactory.forbidden('只有文件所有者可以修改文件状态', { id });
    }

    file.isPublic = isPublic;
    await this.fileRepository.save(file);

    this.logger.log(`🔒 文件公开状态更新: ${file.originalName} (${id}) - ${isPublic}`);
    return file;
  }

  private mapToUploadResult(file: File): FileUploadResult {
    return {
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      path: file.path,
      hash: file.hash,
      downloadUrl: this.storageService.getUrl(file.path),
    };
  }
}
