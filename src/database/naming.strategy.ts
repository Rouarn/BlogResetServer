import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';

export interface NamingStrategyOptions {
  fieldPrefix?: string;
  timestamps: {
    createTime: string;
    updateTime: string;
  };
}

/**
 * 自定义数据库命名策略
 *
 * 实现以下功能：
 * 1. 自动添加字段前缀
 * 2. 自定义时间戳字段名
 */
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  constructor(private readonly options: NamingStrategyOptions) {
    super();
  }

  /**
   * 表名命名策略
   * 注意：表前缀由 TypeOrmModuleOptions 的 entityPrefix 处理
   */
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ?? targetName;
  }

  /**
   * 列名命名策略
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

  relationName(propertyName: string): string {
    return propertyName;
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    // 关系列名通常是 "property_id" 形式，如果直接加前缀可能会导致与手动定义的列名冲突
    // 这里我们只应用前缀，但不重复添加
    const name = relationName;
    return this.formatColumnName(`${name}_${referencedColumnName}`, []);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.formatColumnName(`${tableName}_${columnName ?? propertyName}`, []);
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return this.formatColumnName(`${parentTableName}_${parentTableIdPropertyName}`, []);
  }

  /**
   * 格式化列名：嵌入前缀 -> 字段前缀
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
