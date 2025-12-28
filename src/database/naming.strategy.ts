import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';

export interface NamingStrategyOptions {
  fieldPrefix: string;
  snakeCase: boolean;
  timestamps: {
    createTime: string;
    updateTime: string;
  };
}

/**
 * 自定义数据库命名策略
 *
 * 实现以下功能：
 * 1. 自动转换蛇形命名 (snake_case)
 * 2. 自动添加字段前缀
 * 3. 自定义时间戳字段名
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
    return (
      userSpecifiedName ?? (this.options.snakeCase ? this.toSnakeCase(targetName) : targetName)
    );
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
    return this.options.snakeCase ? this.toSnakeCase(propertyName) : propertyName;
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    // 关系列名通常是 "property_id" 形式，如果直接加前缀可能会导致与手动定义的列名冲突
    // 这里我们只应用蛇形命名和前缀，但不重复添加
    const name = this.options.snakeCase ? this.toSnakeCase(relationName) : relationName;
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
   * 格式化列名：嵌入前缀 -> 蛇形转换 -> 字段前缀
   */
  private formatColumnName(name: string, embeddedPrefixes: string[]): string {
    let formattedName = name;

    // 1. 处理嵌入前缀
    if (embeddedPrefixes.length > 0) {
      formattedName = `${embeddedPrefixes.join('_')}_${formattedName}`;
    }

    // 2. 处理蛇形命名
    if (this.options.snakeCase) {
      formattedName = this.toSnakeCase(formattedName);
    }

    // 3. 处理字段统一前缀
    // 注意：如果是用户指定了 customName，通常也应该遵循前缀规则，
    // 除非我们认为 customName 是绝对名称。这里我们选择统一添加前缀以保持一致性。
    if (this.options.fieldPrefix) {
      // 避免重复添加前缀 (简单的检查)
      if (!formattedName.startsWith(this.options.fieldPrefix)) {
        formattedName = `${this.options.fieldPrefix}${formattedName}`;
      }
    }

    return formattedName;
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
