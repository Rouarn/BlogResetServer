/**
 * 管道模块导出
 *
 * 统一导出所有数据验证和转换管道，用于请求数据的预处理。
 *
 * 包含管道：
 * - FileValidationPipe: 单文件验证管道，验证文件大小和类型
 * - FilesValidationPipe: 多文件验证管道，验证批量上传文件
 *
 * 用法示例：
 * import { FileValidationPipe } from '@/common/pipes';
 */
export * from './file-validation.pipe';
