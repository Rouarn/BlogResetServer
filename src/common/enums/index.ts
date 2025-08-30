/**
 * 枚举工具模块
 * 导出所有枚举类型和相关工具函数
 */

// 导出枚举类型
export * from './gender.enum';
export * from './role.enum';

/**
 * 通用枚举工具类
 */
export class EnumUtils {
  /**
   * 获取枚举的所有键名
   * @param enumObject - 枚举对象
   * @returns 键名数组
   */
  static getKeys<T extends Record<string, string | number>>(enumObject: T): (keyof T)[] {
    return Object.keys(enumObject).filter((key) => isNaN(Number(key))) as (keyof T)[];
  }

  /**
   * 获取枚举的所有值
   * @param enumObject - 枚举对象
   * @returns 值数组
   */
  static getValues<T extends Record<string, string | number>>(enumObject: T): T[keyof T][] {
    return Object.values(enumObject).filter(
      (value) => typeof value === 'string' || typeof value === 'number',
    ) as T[keyof T][];
  }

  /**
   * 检查值是否存在于枚举中
   * @param enumObject - 枚举对象
   * @param value - 要检查的值
   * @returns 如果值存在则返回 true
   */
  static hasValue<T extends Record<string, string | number>>(
    enumObject: T,
    value: unknown,
  ): value is T[keyof T] {
    return this.getValues(enumObject).includes(value as T[keyof T]);
  }

  /**
   * 根据值获取对应的键名
   * @param enumObject - 枚举对象
   * @param value - 枚举值
   * @returns 对应的键名，如果不存在则返回 undefined
   */
  static getKeyByValue<T extends Record<string, string | number>>(
    enumObject: T,
    value: T[keyof T],
  ): keyof T | undefined {
    const entries = Object.entries(enumObject);
    const entry = entries.find(([, v]) => v === value);
    return entry ? (entry[0] as keyof T) : undefined;
  }

  /**
   * 将枚举转换为选项数组
   * @param enumObject - 枚举对象
   * @param labelMap - 可选的标签映射
   * @returns 选项数组
   */
  static toOptions<T extends Record<string, string | number>>(
    enumObject: T,
    labelMap?: Partial<Record<T[keyof T], string>>,
  ): { value: T[keyof T]; label: string; key: keyof T }[] {
    return this.getKeys(enumObject).map((key) => ({
      value: enumObject[key],
      label: labelMap?.[enumObject[key]] || String(key),
      key,
    }));
  }
}

/**
 * 枚举验证装饰器工厂
 * @param enumObject - 枚举对象
 * @param message - 可选的错误消息
 * @returns 验证装饰器
 */
export function IsEnum<T extends Record<string, string | number>>(enumObject: T, message?: string) {
  return function (target: any, propertyKey: string) {
    // 这里可以集成 class-validator 的装饰器逻辑
    // 或者提供自定义的验证逻辑
    const errorMessage =
      message || `${propertyKey} must be a valid ${enumObject.constructor.name} value`;

    // 存储验证信息到元数据中
    Reflect.defineMetadata(
      'enum:validation',
      {
        enumObject,
        message: errorMessage,
      },
      target,
      propertyKey,
    );
  };
}

/**
 * 枚举转换装饰器工厂
 * 自动将输入值转换为对应的枚举值
 * @param enumObject - 枚举对象
 * @param parser - 可选的自定义解析函数
 * @returns 转换装饰器
 */
export function TransformEnum<T extends Record<string, string | number>>(
  enumObject: T,
  parser?: (value: unknown) => T[keyof T] | undefined,
) {
  return function (target: any, propertyKey: string) {
    // 存储转换信息到元数据中
    Reflect.defineMetadata(
      'enum:transform',
      {
        enumObject,
        parser,
      },
      target,
      propertyKey,
    );
  };
}
