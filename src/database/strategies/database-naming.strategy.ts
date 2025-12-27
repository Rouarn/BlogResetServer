import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import type { DatabaseConfig } from '@/database';

/**
 * 数据库命名策略
 *
 * 用于统一管理数据库表名和字段名的命名规则。
 * 支持自定义字段名映射和表前缀配置。
 */
export class DatabaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  constructor(
    private readonly fieldNames?: DatabaseConfig['fieldNames'],
    private readonly tablePrefix?: DatabaseConfig['tablePrefix'],
  ) {
    super();
  }

  /**
   * 获取列名
   * @param propertyName 属性名
   * @param customName 自定义名称
   * @param embeddedPrefixes 嵌入前缀
   * @returns 数据库列名
   */
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    let configuredName: string | undefined;

    if (propertyName === 'createTime') {
      configuredName = this.fieldNames?.createTime;
    } else if (propertyName === 'updateTime') {
      configuredName = this.fieldNames?.updateTime;
    }

    const baseName = customName ?? configuredName ?? propertyName;
    const withPrefix = embeddedPrefixes.length
      ? `${embeddedPrefixes.join('_')}${baseName}`
      : baseName;

    const isCustom = !!(customName || configuredName);
    return isCustom ? withPrefix : snakeCase(withPrefix);
  }

  /**
   * 获取表名
   * @param className 类名
   * @param customName 自定义表名
   * @returns 数据库表名
   */
  tableName(className: string, customName?: string): string {
    const base = customName ?? snakeCase(className);
    const prefix = this.tablePrefix?.trim();
    if (!prefix) return base;
    const normalized = prefix.endsWith('_') ? prefix : `${prefix}_`;
    return base.startsWith(normalized) ? base : `${normalized}${base}`;
  }
}
