import { UploadProtocol, FileType } from '../enums';

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  uploadPath?: string;
  protocol?: UploadProtocol;
}

export interface ChunkUploadInfo {
  uploadId: string;
  filename: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  fileType?: FileType;
}

export interface ChunkUploadResult {
  uploadId: string;
  chunkNumber: number;
  chunkHash: string;
  uploaded: boolean;
}

export interface FileUploadResult {
  fileId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  hash: string;
  downloadUrl: string;
}

export interface BatchUploadResult {
  successful: FileUploadResult[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
  totalFiles: number;
  successCount: number;
  failureCount: number;
}