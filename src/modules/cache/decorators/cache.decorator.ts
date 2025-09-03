/**
 * 缓存装饰器
 *
 * 提供方法级别的缓存功能，支持自动缓存和缓存清除
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

import type { CacheOptions } from '../interfaces';

/**
 * 缓存装饰器元数据键
 */
export const CACHE_KEY = 'cache:key';
export const CACHE_OPTIONS = 'cache:options';
export const CACHE_EVICT_KEY = 'cache:evict:key';
export const CACHE_EVICT_OPTIONS = 'cache:evict:options';

/**
 * 缓存装饰器选项
 */
export interface CacheDecoratorOptions extends CacheOptions {
  /** 缓存键模板，支持参数占位符 */
  key?: string;
  /** 是否基于参数生成缓存键 */
  useArgs?: boolean;
  /** 参数索引数组，用于生成缓存键 */
  argIndexes?: number[];
  /** 条件函数，返回 true 时才缓存 */
  condition?: (...args: unknown[]) => boolean;
}

/**
 * 缓存清除装饰器选项
 */
export interface CacheEvictOptions {
  /** 要清除的缓存键模板 */
  key?: string;
  /** 要清除的缓存键数组 */
  keys?: string[];
  /** 是否清除所有缓存 */
  allEntries?: boolean;
  /** 是否在方法执行前清除缓存 */
  beforeInvocation?: boolean;
  /** 条件函数，返回 true 时才清除缓存 */
  condition?: (...args: unknown[]) => boolean;
}

/**
 * 缓存装饰器
 *
 * 自动缓存方法的返回值
 *
 * @param options 缓存选项
 *
 * @example
 * ```typescript
 * @Cache({ key: 'user:${0}', ttl: 3600 })
 * async getUserById(id: string): Promise<User> {
 *   return await this.userRepository.findById(id);
 * }
 *
 * @Cache({ useArgs: true, ttl: 1800 })
 * async searchUsers(query: string, page: number): Promise<User[]> {
 *   return await this.userRepository.search(query, page);
 * }
 * ```
 */
export function Cache(options: CacheDecoratorOptions = {}): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // 设置缓存元数据
    SetMetadata(CACHE_KEY, propertyKey)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS, options)(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * 缓存清除装饰器
 *
 * 清除指定的缓存项
 *
 * @param options 缓存清除选项
 *
 * @example
 * ```typescript
 * @CacheEvict({ key: 'user:${0}' })
 * async updateUser(id: string, data: UpdateUserDto): Promise<User> {
 *   return await this.userRepository.update(id, data);
 * }
 *
 * @CacheEvict({ keys: ['users:list', 'users:count'] })
 * async createUser(data: CreateUserDto): Promise<User> {
 *   return await this.userRepository.create(data);
 * }
 *
 * @CacheEvict({ allEntries: true })
 * async clearAllUserCache(): Promise<void> {
 *   // 清除所有用户相关缓存
 * }
 * ```
 */
export function CacheEvict(options: CacheEvictOptions = {}): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // 设置缓存清除元数据
    SetMetadata(CACHE_EVICT_KEY, propertyKey)(target, propertyKey, descriptor);
    SetMetadata(CACHE_EVICT_OPTIONS, options)(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * 缓存键生成器
 *
 * 根据模板和参数生成缓存键
 *
 * @param template 键模板
 * @param args 方法参数
 * @param argIndexes 参数索引数组
 * @returns 生成的缓存键
 */
export function generateCacheKey(template: string, args: unknown[], argIndexes?: number[]): string {
  if (!template) {
    // 如果没有模板，使用参数生成键
    const keyArgs = argIndexes ? argIndexes.map((i) => args[i]) : args;
    return keyArgs.map((arg) => String(arg)).join(':');
  }

  // 替换模板中的占位符
  return template.replace(/\$\{(\d+)\}/g, (match, index) => {
    const argIndex = parseInt(index, 10);
    return args[argIndex] !== undefined ? String(args[argIndex]) : match;
  });
}

/**
 * 检查条件是否满足
 *
 * @param condition 条件函数
 * @param args 方法参数
 * @returns 是否满足条件
 */
export function checkCondition(
  condition: ((...args: unknown[]) => boolean) | undefined,
  args: unknown[],
): boolean {
  if (!condition) return true;

  try {
    return condition(...args);
  } catch {
    // 条件检查失败时，默认不执行缓存操作
    return false;
  }
}
