import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import type { DatabaseConfig } from '../interfaces';

export class DatabaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  constructor(
    private readonly fieldNames?: DatabaseConfig['fieldNames'],
    private readonly tablePrefix?: DatabaseConfig['tablePrefix'],
  ) {
    super();
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    const configuredName =
      propertyName === 'createTime'
        ? this.fieldNames?.createTime
        : propertyName === 'updateTime'
          ? this.fieldNames?.updateTime
          : undefined;

    const baseName = customName ?? configuredName ?? propertyName;
    const withPrefix = embeddedPrefixes.length ? `${embeddedPrefixes.join('_')}${baseName}` : baseName;

    const isCustom = !!(customName || configuredName);
    return isCustom ? withPrefix : snakeCase(withPrefix);
  }

  tableName(className: string, customName?: string): string {
    const base = customName ?? snakeCase(className);
    const prefix = this.tablePrefix?.trim();
    if (!prefix) return base;
    const normalized = prefix.endsWith('_') ? prefix : `${prefix}_`;
    return base.startsWith(normalized) ? base : `${normalized}${base}`;
  }
}
