export interface DatabaseConfig {
  /** 是否启用自动时间戳管理 */
  enableTimestamps?: boolean;
  /** 是否启用软删除功能 */
  enableSoftDelete?: boolean;
  /** 时间戳字段名配置 */
  fieldNames?: {
    createTime?: string;
    updateTime?: string;
    deleteTime?: string;
  };
  /** 时间戳字段配置 */
  timestampFields?: {
    createTime?: string;
    updateTime?: string;
    deleteTime?: string;
  };
  /** 是否在查询时自动过滤已删除数据 */
  autoFilterDeleted?: boolean;
  /** 全局禁用时间戳的实体类名列表 */
  excludeEntities?: string[];
}

export interface BaseEntityFields {
  createTime: Date;
  updateTime: Date;
  deleteTime?: Date | null;
}

export interface SoftDeleteOptions {
  /** 是否包含已删除的数据 */
  includeDeleted?: boolean;
  /** 是否强制物理删除 */
  forceDelete?: boolean;
}

export interface QueryContext {
  includeDeleted?: boolean;
  disableTimestamps?: boolean;
  forceDelete?: boolean;
}

export const DATABASE_CONFIG = Symbol('DATABASE_CONFIG');
export const QUERY_CONTEXT = Symbol('QUERY_CONTEXT');
