import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { RedisService } from 'src/modules/redis/redis.service';
import { Request } from 'express';

/**
 * 全局限流守卫（GlobalGuard）
 *
 * 用于对所有进入系统的 HTTP 请求进行限流控制，防止单个 IP 在单位时间内频繁请求，保护系统免受恶意刷接口攻击。
 *
 * 功能说明：
 * - 基于 Redis 实现简单的滑动窗口限流，每个 IP 每分钟最多允许 100 次请求。
 * - 超过限制后，抛出 401 UnauthorizedException 异常，提示"请求过于频繁,请稍后再试"。
 * - 记录每次请求的详细信息（路径、方法、IP、当前请求次数、最大请求次数、时间窗口等），便于排查和监控。
 *
 * 依赖项：
 * - RedisService：用于计数和设置过期时间，实现分布式限流。
 * - Logger：用于记录请求日志。
 *
 * 用法示例：
 * - 在主模块中通过 APP_GUARD 全局注册该守卫，实现全局限流。
 */
@Injectable()
export class GlobalGuard implements CanActivate {
  /**
   * 日志记录器
   */
  private readonly logger = new Logger(GlobalGuard.name);

  /**
   * 构造函数
   * @param redisService Redis 服务实例，用于限流计数（可选）
   */
  constructor(@Optional() private readonly redisService?: RedisService) {}

  /**
   * 限流校验逻辑
   * @param context 执行上下文，包含请求相关信息
   * @returns 是否允许通过（Promise<boolean>）
   * @throws UnauthorizedException 超过限流阈值时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip?.replace(/:/g, '-') || '127.0.0.1';

    // 如果 Redis 服务不可用，跳过限流检查
    if (!this.redisService) {
      this.logger.debug('Redis 服务未启用，跳过限流检查');
      return true;
    }

    const key = `rate_limit:${ip}`;
    const limit = 100; // 每分钟最大请求数
    const window = 60; // 时间窗口(秒)

    // 检查是否超过限制
    const current = await this.redisService.incr(key);
    if (current === 1) {
      // 如果是第一次请求,设置过期时间
      await this.redisService.set(key, '1', window);
    }

    if (current > limit) {
      throw new UnauthorizedException('请求过于频繁,请稍后再试');
    }

    // 1. 记录请求信息
    this.logger.debug(`请求路径: ${request.path}`);
    this.logger.debug(`请求方法: ${request.method}`);
    this.logger.debug(`请求IP: ${request.ip}`);
    this.logger.debug(`当前请求次数: ${current}`);
    this.logger.debug(`最大请求次数: ${limit}`);
    this.logger.debug(`时间窗口: ${window}秒`);
    this.logger.debug('---------------------------');

    return true;
  }
}
