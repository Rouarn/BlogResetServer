/**
 * 缓存拦截器
 *
 * 实现 @Cache 和 @CacheEvict 装饰器的实际缓存逻辑
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ICacheService } from '../interfaces';
import {
  CACHE_EVICT_KEY,
  CACHE_EVICT_OPTIONS,
  CACHE_KEY,
  CACHE_OPTIONS,
  CacheDecoratorOptions,
  CacheEvictOptions,
  checkCondition,
  generateCacheKey,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    @Inject('I_CACHE_SERVICE') private readonly cacheService: ICacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    const target = context.getClass();
    const args = context.getArgs();

    // 检查是否有缓存装饰器
    const cacheKey = this.reflector.get<string>(CACHE_KEY, handler);
    const cacheOptions = this.reflector.get<CacheDecoratorOptions>(CACHE_OPTIONS, handler);

    // 检查是否有缓存清除装饰器
    const evictKey = this.reflector.get<string>(CACHE_EVICT_KEY, handler);
    const evictOptions = this.reflector.get<CacheEvictOptions>(CACHE_EVICT_OPTIONS, handler);

    // 处理缓存清除（方法执行前）
    if (evictKey && evictOptions) {
      await this.handleCacheEvict(evictOptions, args, true);
    }

    // 处理缓存读取
    if (cacheKey && cacheOptions) {
      const cachedResult = await this.handleCacheGet(cacheOptions, args, target.name, handler.name);
      if (cachedResult !== null) {
        return of(cachedResult);
      }
    }

    // 执行原方法
    return next.handle().pipe(
      tap(async (result) => {
        // 处理缓存存储
        if (cacheKey && cacheOptions) {
          await this.handleCacheSet(cacheOptions, args, result, target.name, handler.name);
        }

        // 处理缓存清除（方法执行后）
        if (evictKey && evictOptions) {
          await this.handleCacheEvict(evictOptions, args, false);
        }
      }),
    );
  }

  /**
   * 处理缓存获取
   */
  private async handleCacheGet(
    options: CacheDecoratorOptions,
    args: unknown[],
    className: string,
    methodName: string,
  ): Promise<unknown> {
    try {
      // 检查条件
      if (!checkCondition(options.condition, args)) {
        return null;
      }

      // 生成缓存键
      const cacheKey = this.generateMethodCacheKey(options, args, className, methodName);

      // 获取缓存
      const cachedResult = await this.cacheService.get(cacheKey);

      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedResult;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

  /**
   * 处理缓存存储
   */
  private async handleCacheSet(
    options: CacheDecoratorOptions,
    args: unknown[],
    result: unknown,
    className: string,
    methodName: string,
  ): Promise<void> {
    try {
      // 检查条件
      if (!checkCondition(options.condition, args)) {
        return;
      }

      // 生成缓存键
      const cacheKey = this.generateMethodCacheKey(options, args, className, methodName);

      // 存储缓存
      await this.cacheService.set(cacheKey, result, {
        ttl: options.ttl,
        prefix: options.prefix,
      });

      this.logger.debug(`Cache set for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache set error: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * 处理缓存清除
   */
  private async handleCacheEvict(
    options: CacheEvictOptions,
    args: unknown[],
    beforeInvocation: boolean,
  ): Promise<void> {
    try {
      // 检查是否应该在此时执行清除
      const shouldEvict = options.beforeInvocation === beforeInvocation;
      if (!shouldEvict) {
        return;
      }

      // 检查条件
      if (!checkCondition(options.condition, args)) {
        return;
      }

      // 清除所有缓存
      if (options.allEntries) {
        await this.cacheService.clear();
        this.logger.debug('All cache entries evicted');
        return;
      }

      // 清除指定键的缓存
      const keysToEvict: string[] = [];

      if (options.key) {
        const key = generateCacheKey(options.key, args);
        keysToEvict.push(key);
      }

      if (options.keys && options.keys.length > 0) {
        for (const keyTemplate of options.keys) {
          const key = generateCacheKey(keyTemplate, args);
          keysToEvict.push(key);
        }
      }

      if (keysToEvict.length > 0) {
        const deletedCount = await this.cacheService.delMany(keysToEvict);
        this.logger.debug(`Evicted ${deletedCount} cache entries: ${keysToEvict.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Cache evict error: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * 生成方法缓存键
   */
  private generateMethodCacheKey(
    options: CacheDecoratorOptions,
    args: unknown[],
    className: string,
    methodName: string,
  ): string {
    if (options.key) {
      // 使用自定义键模板
      return generateCacheKey(options.key, args, options.argIndexes);
    }

    if (options.useArgs) {
      // 使用参数生成键
      const argKeys = options.argIndexes ? options.argIndexes.map((i) => args[i]) : args;
      const argString = argKeys.map((arg) => String(arg)).join(':');
      return `${className}:${methodName}:${argString}`;
    }

    // 默认键格式
    return `${className}:${methodName}`;
  }
}
