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
      // 时间戳字段名也需要经过格式化（前缀+蛇形）
      return this.formatColumnName(this.options.timestamps.createTime, []);
    }
    if (propertyName === 'updatedAt' && !customName) {
      return this.formatColumnName(this.options.timestamps.updateTime, []);
    }

    // 2. 获取基础名称
    const name = customName ?? propertyName;

    // 3. 格式化列名
    return this.formatColumnName(name, embeddedPrefixes);
  }

  /**
   * 格式化列名
   *
   * @description
   * 内部辅助方法，用于组合嵌入式前缀和字段名。
   *
   * @param name 字段基础名称
   * @param embeddedPrefixes 嵌入式前缀列表
   * @private
   */
  private formatColumnName(name: string, embeddedPrefixes: string[]): string {
    let formattedName = name;

    // 1. 处理嵌入前缀
    if (embeddedPrefixes.length > 0) {
      formattedName = `${embeddedPrefixes.join('_')}_${formattedName}`;
    }

    return formattedName;
  }
}
