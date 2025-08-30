import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { WhitelistAuth, getCurrentTimestamp } from 'src/utils';

/**
 * 全局限流守卫（GlobalGuard）
 *
 * 用于对所有进入系统的 HTTP 请求进行限流控制，防止单个 IP 在单位时间内频繁请求，保护系统免受恶意刷接口攻击。
 *
 * 功能说明：
 * - 基于内存实现简单的滑动窗口限流，每个 IP 每分钟最多允许 100 次请求。
 * - 超过限制后，抛出 401 UnauthorizedException 异常，提示"请求过于频繁,请稍后再试"。
 * - 记录每次请求的详细信息（路径、方法、IP、当前请求次数、最大请求次数、时间窗口等），便于排查和监控。
 *
 * 依赖项：
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
   * 内存限流存储
   */
  private readonly rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor() {}

  /**
   * 限流校验逻辑
   * @param context 执行上下文，包含请求相关信息
   * @returns 是否允许通过（Promise<boolean>）
   * @throws UnauthorizedException 超过限流阈值时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || request.url;
    const ip = request.ip?.replace(/:/g, '-') || '127.0.0.1';

    // 白名单路由可以有更宽松的限流策略
    const isWhitelisted = WhitelistAuth.isWhitelistedPath(path);

    const key = `rate_limit:${ip}`;
    // 白名单路由使用更宽松的限制
    const limit = isWhitelisted ? 200 : 100; // 每分钟最大请求数
    const window = 60; // 时间窗口(秒)

    // 基于内存的限流检查
    const now = getCurrentTimestamp();
    const stored = this.rateLimitStore.get(key);

    if (!stored || now > stored.resetTime) {
      // 重置计数器
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + window * 1000,
      });
    } else {
      // 增加计数
      stored.count++;
      if (stored.count > limit) {
        throw new UnauthorizedException('请求过于频繁,请稍后再试');
      }
    }

    // 清理过期的记录（简单的内存管理）
    if (Math.random() < 0.01) {
      // 1% 的概率清理
      for (const [k, v] of this.rateLimitStore.entries()) {
        if (now > v.resetTime) {
          this.rateLimitStore.delete(k);
        }
      }
    }

    // 记录请求信息
    const current = stored?.count || 1;
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
