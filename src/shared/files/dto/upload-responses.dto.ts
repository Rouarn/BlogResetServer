import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResultDto {
  @ApiProperty({ description: '文件ID' })
  fileId: string;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件路径' })
  path: string;

  @ApiProperty({ description: '文件哈希值' })
  hash: string;

  @ApiProperty({ description: '下载URL' })
  downloadUrl: string;
}

export class BatchUploadResultDto {
  @ApiProperty({ description: '成功上传的文件列表', type: [UploadFileResultDto] })
  successful: UploadFileResultDto[];

  @ApiProperty({
    description: '失败上传的文件列表',
    type: 'array',
  })
  failed: { filename: string; error: string }[];

  @ApiProperty({ description: '总文件数' })
  totalFiles: number;

  @ApiProperty({ description: '成功上传文件数' })
  successCount: number;

  @ApiProperty({ description: '失败上传文件数' })
  failureCount: number;
}
