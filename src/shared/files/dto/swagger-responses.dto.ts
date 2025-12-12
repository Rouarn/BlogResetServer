import { ApiProperty } from '@nestjs/swagger';

/**
 * 文件信息 DTO
 */
export class FileInfoDto {
  @ApiProperty({ description: '文件ID' })
  id: string;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: 'MIME类型' })
  mimetype: string;

  @ApiProperty({ description: '文件路径' })
  path: string;

  @ApiProperty({ description: '文件URL' })
  url: string;

  @ApiProperty({ description: '是否公开' })
  isPublic: boolean;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;

  @ApiProperty({ description: '删除时间', required: false })
  deleteTime?: Date;
}

/**
 * 文件上传响应 DTO
 */
export class FileUploadResponseDto {
  @ApiProperty({ description: '文件信息', type: FileInfoDto })
  file: FileInfoDto;

  @ApiProperty({ description: '上传消息' })
  message: string;
}

/**
 * 文件列表响应 DTO
 */
export class FileListResponseDto {
  @ApiProperty({ description: '文件列表', type: [FileInfoDto] })
  files: FileInfoDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  current: number;

  @ApiProperty({ description: '每页数量' })
  size: number;
}

/**
 * 通用文件响应 DTO
 */
export class FileResponseDto {
  @ApiProperty({ description: '响应数据' })
  data: unknown;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiProperty({ description: '响应代码' })
  code: number;

  @ApiProperty({ description: '时间戳' })
  timestamp: string;
}
