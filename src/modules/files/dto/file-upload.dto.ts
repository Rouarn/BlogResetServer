import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { FileType } from '../enums';

export class FileUploadDto {
  @ApiProperty({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否公开', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '上传协议', default: 'HTTP' })
  @IsOptional()
  @IsString()
  protocol?: string;
}

export class ChunkUploadInitDto {
  @ApiProperty({ description: '文件名' })
  @IsString()
  filename: string;

  @ApiProperty({ description: '文件大小（字节）' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: '分块大小（字节）' })
  @IsNumber()
  chunkSize: number;

  @ApiProperty({ description: '总分块数' })
  @IsNumber()
  totalChunks: number;

  @ApiPropertyOptional({ enum: FileType, description: '文件类型' })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否公开', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class ChunkUploadDto {
  @ApiProperty({ description: '上传ID' })
  @IsString()
  uploadId: string;

  @ApiProperty({ description: '分块序号' })
  @IsNumber()
  chunkNumber: number;

  @ApiProperty({ description: '分块哈希值' })
  @IsOptional()
  @IsString()
  chunkHash?: string;
}

export class ChunkUploadCompleteDto {
  @ApiProperty({ description: '上传ID' })
  @IsString()
  uploadId: string;

  @ApiProperty({ description: '已上传的分块序号列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  chunks: number[];
}

export class BatchUploadInitDto {
  @ApiProperty({ description: '文件信息列表', type: [ChunkUploadInitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChunkUploadInitDto)
  files: ChunkUploadInitDto[];
}
