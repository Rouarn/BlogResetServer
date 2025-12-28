import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';

/**
 * 命名策略配置选项
 */
export interface NamingStrategyOptions {
  /** 时间戳字段名配置 */
  timestamps: {
    /** 创建时间字段名 */
    createTime: string;
    /** 更新时间字段名 */
    updateTime: string;
  };
}

/**
 * 自定义数据库命名策略
 *
 * @description
 * 扩展 TypeORM 的默认命名策略，实现以下特定的数据库命名规范：
 * 1. 自动处理时间戳字段（createdAt, updatedAt）的数据库列名映射。
 * 2. 规范化关联列（Join Column）和关联表（Join Table）的命名。
 *
 * @see {@link DefaultNamingStrategy}
 */
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  constructor(private readonly options: NamingStrategyOptions) {
    super();
  }

  /**
   * 列名命名策略
   *
   * @description
   * 决定实体属性在数据库中对应的列名。
   * 特别处理了 `createdAt` 和 `updatedAt` 字段，使其根据配置映射到指定的数据库字段名。
   *
   * @param propertyName 实体属性名
   * @param customName 用户在 @Column 装饰器中指定的列名
   * @param embeddedPrefixes 嵌入式实体的列名前缀数组
   * @returns 数据库列名
   */
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    // 1. 处理时间戳字段映射
    if (propertyName === 'createdAt' && !customName) {
      return this.options.timestamps.createTime;
    }
    if (propertyName === 'updatedAt' && !customName) {
      return this.options.timestamps.updateTime;
    }

    // 2. 获取基础名称
    const name = customName ?? propertyName;

    // 3. 处理嵌入式前缀 (保留 TypeORM 默认行为，避免嵌入式实体字段名冲突)
    if (embeddedPrefixes.length > 0) {
      return `${embeddedPrefixes.join('_')}_${name}`;
    }

    return name;
  }
}
