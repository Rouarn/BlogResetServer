/**
 * 文件状态枚举
 */
export enum FileStatus {
  /** 上传中 */
  UPLOADING = 'UPLOADING',
  /** 上传完成 */
  COMPLETED = 'COMPLETED',
  /** 上传失败 */
  FAILED = 'FAILED',
  /** 处理中 */
  PROCESSING = 'PROCESSING',
  /** 已删除 */
  DELETED = 'DELETED',
}
