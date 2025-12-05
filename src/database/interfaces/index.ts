export interface DatabaseConfig {
  /** 是否启用自动时间戳管理 */
  enableTimestamps?: boolean;
  /** 时间戳字段名配置 */
  fieldNames?: {
    createTime?: string;
    updateTime?: string;
  };
  /** 表名前缀（来自环境变量），例如：ra_ */
  tablePrefix?: string;
  /** 时间戳字段配置 */
  timestampFields?: {
    createTime?: string;
    updateTime?: string;
  };
  /** 全局禁用时间戳的实体类名列表 */
  excludeEntities?: string[];
}

export interface BaseEntityFields {
  createTime: Date;
  updateTime: Date;
}

export interface QueryContext {
  disableTimestamps?: boolean;
}

export const DATABASE_CONFIG = Symbol('DATABASE_CONFIG');
export const QUERY_CONTEXT = Symbol('QUERY_CONTEXT');
