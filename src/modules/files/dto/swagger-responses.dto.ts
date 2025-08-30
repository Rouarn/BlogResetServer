import { ApiProperty } from '@nestjs/swagger';
import { BatchUploadResult, FileUploadResult } from '../interfaces';

export class ApiSuccessResponse<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '操作成功' })
  message?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 413, description: '错误状态码' })
  code: number;

  @ApiProperty({ example: '文件大小超出限制', description: '错误信息' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/files/upload' })
  path: string;
}

export class FileUploadSuccessResponse extends ApiSuccessResponse<FileUploadResult> {
  @ApiProperty({
    example: {
      fileId: 'uuid',
      filename: 'example_123456.pdf',
      originalName: 'example.pdf',
      size: 1048576,
      mimeType: 'application/pdf',
      path: '2024-01/example_123456.pdf',
      hash: 'sha256hash',
      downloadUrl: 'http://localhost:3000/api/files/uuid/download',
    },
  })
  data: FileUploadResult;
}

export class BatchUploadSuccessResponse extends ApiSuccessResponse<BatchUploadResult> {
  @ApiProperty({
    example: {
      successful: [
        {
          fileId: 'uuid1',
          filename: 'file1.pdf',
          originalName: 'file1.pdf',
          size: 1048576,
          mimeType: 'application/pdf',
          path: '2024-01/file1.pdf',
          hash: 'hash1',
          downloadUrl: 'http://localhost:3000/api/files/uuid1/download',
        },
      ],
      failed: [
        {
          filename: 'file2.pdf',
          error: '文件大小超出限制',
        },
      ],
      totalFiles: 2,
      successCount: 1,
      failureCount: 1,
    },
  })
  data: BatchUploadResult;
}

export class FileListResponse {
  @ApiProperty({
    example: [
      {
        id: 'uuid',
        filename: 'example.pdf',
        originalName: 'example.pdf',
        size: 1048576,
        mimeType: 'application/pdf',
        fileType: 'DOCUMENT',
        status: 'COMPLETED',
        isPublic: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  files: any[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
