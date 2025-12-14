import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import type { FileUploadOptions } from '@/shared/files/interfaces';

/**
 * 静态配置接口（StaticConfig）
 *
 * 定义了静态资源和文件上传相关的配置项。
 */
export interface StaticConfig {
  root: string;
  options: ServeStaticOptions & FileUploadOptions;
}
export type StaticOptions = StaticConfig['options'];
