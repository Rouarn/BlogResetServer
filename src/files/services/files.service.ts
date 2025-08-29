import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { File } from '../entities';
import { FileStatus, FileType } from '../enums';
import { FileUploadDto, FileQueryDto } from '../dto';
import { FileUploadResult, BatchUploadResult } from '../interfaces';
import { StorageService } from './storage.service';
import { ValidationService } from './validation.service';
import { MultiProtocolService } from './multi-protocol.service';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private storageService: StorageService,
    private validationService: ValidationService,
    private multiProtocolService: MultiProtocolService,
  ) {}

  async uploadSingleFile(
    file: any,
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
    const existingFile = await this.fileRepository.findOne({ where: { hash: fileHash } });
    if (existingFile) {
      return this.mapToUploadResult(existingFile);
    }

    // 构建存储路径
    const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM
    const relativePath = path.join(datePath, filename);

    // 存储文件
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
      status: FileStatus.COMPLETED,
      description: uploadDto.description,
      isPublic: uploadDto.isPublic || false,
      uploadProtocol: uploadDto.protocol,
    });

    const savedFile = await this.fileRepository.save(fileEntity);
    this.logger.log(`File uploaded successfully: ${savedFile.id}`);

    return this.mapToUploadResult(savedFile);
  }

  async uploadMultipleFiles(
    files: any[],
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
          error: error.message,
        });
        results.failureCount++;
        this.logger.error(`Failed to upload file: ${file.originalname}`, error);
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  async findFiles(queryDto: FileQueryDto, userId?: string): Promise<{ files: File[]; total: number }> {
    const { page, limit, type, status, search, publicOnly, sortBy, sortOrder } = queryDto;
    
    const queryBuilder = this.fileRepository.createQueryBuilder('file');

    // 基础过滤条件
    if (!publicOnly && userId) {
      queryBuilder.where('file.userId = :userId OR file.isPublic = true', { userId });
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
      queryBuilder.andWhere(
        '(file.originalName ILIKE :search OR file.filename ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 排序
    queryBuilder.orderBy(`file.${sortBy}`, sortOrder);

    // 分页
    const offset = ((page || 1) - 1) * (limit || 10);
    queryBuilder.skip(offset).take(limit);

    const [files, total] = await queryBuilder.getManyAndCount();

    return { files, total };
  }

  async findFileById(id: string, userId?: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });
    
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
    const file = await this.fileRepository.findOne({ where: { id } });
    
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
    await this.fileRepository.remove(file);
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