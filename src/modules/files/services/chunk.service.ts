import * as path from 'path';
import { formatDatePath, generateUUID } from 'src/utils';
import { Repository } from 'typeorm';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChunkUploadCompleteDto, ChunkUploadDto, ChunkUploadInitDto } from '../dto';
import { File, UploadChunk } from '../entities';
import { FileStatus } from '../enums';
import { ChunkUploadInfo, ChunkUploadResult } from '../interfaces';
import { StorageService } from './storage.service';
import { ValidationService } from './validation.service';

@Injectable()
export class ChunkService {
  private readonly logger = new Logger(ChunkService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(UploadChunk)
    private chunkRepository: Repository<UploadChunk>,
    private storageService: StorageService,
    private validationService: ValidationService,
  ) {}

  async initChunkUpload(initDto: ChunkUploadInitDto, userId?: string): Promise<ChunkUploadInfo> {
    const uploadId = generateUUID();
    const filename = this.validationService.generateUniqueFilename(initDto.filename);
    const fileType =
      initDto.fileType ?? this.validationService.getFileType('application/octet-stream');

    // 创建文件记录
    const fileEntity = this.fileRepository.create({
      filename,
      originalName: initDto.filename,
      mimeType: 'application/octet-stream', // 临时设置，完成时更新
      size: initDto.fileSize,
      path: '', // 完成时设置
      userId,
      fileType,
      status: FileStatus.UPLOADING,
      uploadId,
      totalChunks: initDto.totalChunks,
      uploadedChunks: 0,
      description: initDto.description,
      isPublic: initDto.isPublic ?? false,
    });

    await this.fileRepository.save(fileEntity);

    // 创建分块存储目录
    const chunkDir = path.join('chunks', uploadId);
    await this.storageService.createDirectory(chunkDir);

    this.logger.log(`Chunk upload initialized: ${uploadId}`);

    return {
      uploadId,
      filename: initDto.filename,
      fileSize: initDto.fileSize,
      chunkSize: initDto.chunkSize,
      totalChunks: initDto.totalChunks,
      fileType,
    };
  }

  async uploadChunk(
    chunkFile: Express.Multer.File,
    chunkDto: ChunkUploadDto,
  ): Promise<ChunkUploadResult> {
    const { uploadId, chunkNumber, chunkHash } = chunkDto;

    // 查找文件记录
    const file = await this.fileRepository.findOne({
      where: { uploadId, status: FileStatus.UPLOADING },
    });

    if (!file) {
      throw new BadRequestException('无效的上传ID或上传已完成');
    }

    // 检查分块是否已存在
    const existingChunk = await this.chunkRepository.findOne({
      where: { fileId: file.id, chunkNumber },
    });

    if (existingChunk) {
      return {
        uploadId,
        chunkNumber,
        chunkHash: existingChunk.chunkHash,
        uploaded: true,
      };
    }

    // 验证分块哈希
    const calculatedHash = this.validationService.generateFileHash(chunkFile.buffer);
    if (chunkHash && chunkHash !== calculatedHash) {
      throw new BadRequestException('分块哈希验证失败');
    }

    // 存储分块
    const chunkPath = path.join('chunks', uploadId, `chunk_${chunkNumber}`);
    await this.storageService.upload(chunkFile, chunkPath);

    // 保存分块记录
    const chunkEntity = this.chunkRepository.create({
      fileId: file.id,
      chunkNumber,
      chunkSize: chunkFile.size,
      chunkHash: calculatedHash,
      chunkPath,
    });

    await this.chunkRepository.save(chunkEntity);

    // 更新文件的已上传分块数
    file.uploadedChunks = (file.uploadedChunks ?? 0) + 1;
    await this.fileRepository.save(file);

    this.logger.log(`Chunk uploaded: ${uploadId} - ${chunkNumber}`);

    return {
      uploadId,
      chunkNumber,
      chunkHash: calculatedHash,
      uploaded: true,
    };
  }

  async completeChunkUpload(completeDto: ChunkUploadCompleteDto): Promise<File> {
    const { uploadId, chunks } = completeDto;

    // 查找文件记录
    const file = await this.fileRepository.findOne({
      where: { uploadId, status: FileStatus.UPLOADING },
      relations: ['chunks'],
    });

    if (!file) {
      throw new BadRequestException('无效的上传ID或上传已完成');
    }

    // 验证所有分块都已上传
    const uploadedChunks = file.chunks.map((chunk) => chunk.chunkNumber).sort((a, b) => a - b);
    const expectedChunks = chunks.sort((a, b) => a - b);

    if (
      uploadedChunks.length !== expectedChunks.length ||
      !uploadedChunks.every((chunk, index) => chunk === expectedChunks[index])
    ) {
      throw new BadRequestException('分块不完整，无法完成上传');
    }

    // 合并分块
    const finalPath = await this.mergeChunks(file);

    // 更新文件记录
    file.path = finalPath;
    file.status = FileStatus.COMPLETED;
    file.hash = await this.calculateFinalHash(file);

    const completedFile = await this.fileRepository.save(file);

    // 清理分块文件
    await this.cleanupChunks(uploadId);

    this.logger.log(`Chunk upload completed: ${uploadId}`);
    return completedFile;
  }

  private async mergeChunks(file: File): Promise<string> {
    const datePath = formatDatePath();
    const finalPath = path.join(datePath, file.filename);

    // 按顺序读取所有分块并合并
    const chunks = file.chunks.sort((a, b) => a.chunkNumber - b.chunkNumber);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const chunkBuffer = await this.storageService.download(chunk.chunkPath);
      buffers.push(chunkBuffer);
    }

    const finalBuffer = Buffer.concat(buffers);

    // 创建模拟的 Multer 文件对象
    const mockFile: any = {
      buffer: finalBuffer,
      originalname: file.originalName,
      mimetype: file.mimeType,
      size: finalBuffer.length,
    };

    await this.storageService.upload(mockFile, finalPath);
    return finalPath;
  }

  private async calculateFinalHash(file: File): Promise<string> {
    const buffer = await this.storageService.download(file.path);
    return this.validationService.generateFileHash(buffer);
  }

  private async cleanupChunks(uploadId: string): Promise<void> {
    try {
      const chunkDir = path.join('chunks', uploadId);
      // 这里应该实现删除整个目录的逻辑
      // 由于我们的存储服务目前只支持删除单个文件，这里先记录日志
      this.logger.log(`Should cleanup chunk directory: ${chunkDir}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup chunks for upload: ${uploadId}`, error);
    }
  }

  async getUploadProgress(uploadId: string): Promise<{
    uploadId: string;
    totalChunks: number;
    uploadedChunks: number;
    progress: number;
    status: FileStatus;
  }> {
    const file = await this.fileRepository.findOne({
      where: { uploadId },
    });

    if (!file) {
      throw new BadRequestException('无效的上传ID');
    }

    const progress =
      file.totalChunks > 0 ? Math.round((file.uploadedChunks / file.totalChunks) * 100) : 0;

    return {
      uploadId,
      totalChunks: file.totalChunks,
      uploadedChunks: file.uploadedChunks,
      progress,
      status: file.status,
    };
  }
}
