import * as path from 'path';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { BaseService } from 'src/database';
import { formatDatePath } from 'src/utils';
import type { FileQueryDto, FileUploadDto } from '../dto';
import { File } from '../entities';
import { FileStatus } from '../enums';
import type { BatchUploadResult, FileUploadResult } from '../interfaces';
import { StorageService } from './storage.service';
import { ValidationService } from './validation.service';

@Injectable()
export class FilesService extends BaseService<File> {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    fileRepository: Repository<File>,
    private storageService: StorageService,
    private validationService: ValidationService,
  ) {
    super(fileRepository);
  }

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
    const existingFile = await this.repository.findOne({
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
    const fileEntity = this.repository.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: storedPath,
      hash: fileHash,
      userId,
      fileType,
      status: FileStatus.COMPLETED,
      description: uploadDto.description,
      isPublic: uploadDto.isPublic ?? false,
      uploadProtocol: uploadDto.protocol,
    });

    const savedFile = await this.repository.save(fileEntity);
    console.log('savedFile: ', savedFile);
    this.logger.log(`File uploaded successfully: ${savedFile.id}`);

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

    // 并发处理文件上传
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await this.uploadSingleFile(file, uploadDto, userId);
        results.successful.push(result);
        results.successCount++;
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: (error as Error).message,
        });
        results.failureCount++;
        this.logger.error(`Failed to upload file: ${file.originalname}`, error);
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  async findFiles(
    queryDto: FileQueryDto,
    userId?: string,
  ): Promise<{ data: File[]; total: number }> {
    const { size, current, type, status, search, publicOnly, sortBy, sortOrder } = queryDto;

    const queryBuilder = this.repository.createQueryBuilder('file');

    // 基础过滤条件
    if (!publicOnly && userId) {
      queryBuilder.where('file.userId = :userId OR file.isPublic = true', {
        userId,
      });
    } else if (publicOnly) {
      queryBuilder.where('file.isPublic = true');
    }

    // 类型过滤
    if (type) {
      queryBuilder.andWhere('file.fileType = :type', { type });
    }

    // 状态过滤
    if (status) {
      queryBuilder.andWhere('file.status = :status', { status });
    }

    // 搜索过滤
    if (search) {
      queryBuilder.andWhere('(file.originalName ILIKE :search OR file.filename ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 排序
    const allowedSortFields = ['createTime', 'size', 'filename'];
    const sortField = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createTime';
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
    const file = await this.repository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 检查访问权限
    if (!this.canAccessFile(file, userId)) {
      throw new ForbiddenException('无权限访问该文件');
    }

    return file;
  }

  private canAccessFile(file: File, userId?: string): boolean {
    // 公开文件任何人都可以访问
    if (file.isPublic) {
      return true;
    }

    // 私有文件只有所有者可以访问
    if (userId && file.userId === userId) {
      return true;
    }

    return false;
  }

  async deleteFile(id: string, userId?: string): Promise<boolean> {
    const file = await this.repository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 只有文件所有者可以删除文件
    if (userId && file.userId !== userId) {
      throw new ForbiddenException('只有文件所有者可以删除文件');
    }

    // 删除物理文件
    const deleted = await this.storageService.delete(file.path);
    if (!deleted) {
      this.logger.warn(`Failed to delete physical file: ${file.path}`);
    }

    // 删除数据库记录
    await this.repository.remove(file);
    this.logger.log(`File deleted: ${id}`);

    return true;
  }

  async getFileBuffer(id: string, userId?: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.findFileById(id, userId);
    const buffer = await this.storageService.download(file.path);
    return { file, buffer };
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
