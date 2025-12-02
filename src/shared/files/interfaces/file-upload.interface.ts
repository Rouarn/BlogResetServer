import type { FileStatus, FileType } from '../enums';

/**
 * 文件上传配置
 */
export interface FileUploadOptions {
  /**
   * 上传文件的存储路径
   * @default './static/uploads'
   */
  uploadsPath: string;
  /**
   * 上传文件的URL前缀
   * @default '/static/uploads'
   */
  uploadsPrefix: string;
  /**
   * 上传文件的最大大小（字节）
   * @default 10485760（10MB）
   */
  uploadsMaxSize: number;
  /**
   * 允许上传的文件类型列表
   * @default []（不限制）
   */
  uploadsAllowedTypes: string[];
  /**
   * 上传文件的最大数量
   * @default 10
   */
  uploadsMaxFiles: number;
}

/**
 * 分块上传信息
 */
export interface ChunkUploadInfo {
  /**
   * 上传ID
   */
  uploadId: string;
  /**
   * 文件名
   */
  filename: string;
  /**
   * 文件大小（字节）
   */
  fileSize: number;
  /**
   * 分块大小（字节）
   */
  chunkSize: number;
  /**
   * 总分块数
   */
  totalChunks: number;
  /**
   * 文件类型
   */
  fileType?: FileType;
}

/**
 * 分块上传结果
 */
export interface ChunkUploadResult {
  /**
   * 上传ID
   */
  uploadId: string;
  /**
   * 分块编号
   */
  chunkNumber: number;
  /**
   * 分块哈希值
   */
  chunkHash: string;
  uploaded: boolean;
}

export interface FileUploadResult {
  /**
   * 文件ID
   */
  fileId: string;
  /**
   * 文件名
   */
  filename: string;
  /**
   * 原始文件名
   */
  originalName: string;
  /**
   * 文件大小（字节）
   */
  size: number;
  /**
   * 文件类型
   */
  mimeType: string;
  /**
   * 文件路径
   */
  path: string;
  /**
   * 文件哈希值
   */
  hash: string;
  /**
   * 下载URL
   */
  downloadUrl: string;
}

export interface BatchUploadResult {
  /**
   * 成功上传的文件列表
   */
  successful: FileUploadResult[];
  /**
   * 失败上传的文件列表
   */
  failed: {
    /**
     * 文件名
     */
    filename: string;
    /**
     * 错误信息
     */
    error: string;
  }[];
  /**
   * 总文件数
   */
  totalFiles: number;
  /**
   * 成功上传文件数
   */
  successCount: number;
  /**
   * 失败上传文件数
   */
  failureCount: number;
}

export interface UploadProgress {
  /**
   * 上传ID
   */
  uploadId: string;
  /**
   * 总分块数
   */
  totalChunks: number;
  /**
   * 已上传分块数
   */
  uploadedChunks: number;
  /**
   * 上传进度（%）
   */
  progress: number;
  /**
   * 上传状态
   */
  status: FileStatus;
}
