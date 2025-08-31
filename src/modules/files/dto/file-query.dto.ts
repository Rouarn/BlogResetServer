import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileStatus, FileType } from '../enums';

export class FileQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  current?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 10;

  @ApiPropertyOptional({ enum: FileType, description: '文件类型筛选' })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @ApiPropertyOptional({ enum: FileStatus, description: '文件状态筛选' })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: '文件名搜索' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '是否只显示公开文件' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  publicOnly?: boolean;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['createdAt', 'size', 'filename'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'size' | 'filename' = 'createdAt';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
