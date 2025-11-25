import type { NamingStrategyInterface } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import type { DatabaseConfig } from '../types';

export class DatabaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  constructor(private readonly fieldNames?: DatabaseConfig['fieldNames']) {
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
    const withPrefix = embeddedPrefixes.length
      ? `${embeddedPrefixes.join('_')}${baseName}`
      : baseName;

    // 保持配置提供的自定义名称原样，其余按 snake_case 处理以与默认策略一致
    const isCustom = !!(customName || configuredName);
    return isCustom ? withPrefix : snakeCase(withPrefix);
  }
}
