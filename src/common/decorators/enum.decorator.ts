import 'reflect-metadata';

/**
 * 枚举验证装饰器工厂
 * 用于验证属性值是否为有效的枚举值
 * @param enumObject - 枚举对象
 * @param message - 可选的错误消息
 * @returns 验证装饰器
 */
export function IsEnum<T extends Record<string, string | number>>(
  enumObject: T,
  message?: string,
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // 这里可以集成 class-validator 的装饰器逻辑
    // 或者提供自定义的验证逻辑
    const errorMessage =
      message ?? `${String(propertyKey)} must be a valid ${enumObject.constructor.name} value`;

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
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
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
