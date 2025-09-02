import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { WhitelistAuth, getCurrentTimestamp } from 'src/utils';

/**
 * 限流配置接口
 */
interface RateLimitConfig {
  /** 普通路由每分钟最大请求数 */
  readonly normalLimit: number;
  /** 白名单路由每分钟最大请求数 */
  readonly whitelistLimit: number;
  /** 时间窗口（秒） */
  readonly windowSeconds: number;
  /** 内存清理概率（0-1） */
  readonly cleanupProbability: number;
}

/**
 * 限流存储项接口
 */
interface RateLimitItem {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

/**
 * 全局限流守卫（GlobalGuard）
 *
 * 用于对所有进入系统的 HTTP 请求进行限流控制，防止单个 IP 在单位时间内频繁请求，保护系统免受恶意刷接口攻击。
 *
 * 功能说明：
 * - 基于内存实现滑动窗口限流，支持白名单路由差异化限流策略
 * - 超过限制后，抛出 401 UnauthorizedException 异常
 * - 优化的日志输出，减少性能开销
 * - 智能内存管理，防止内存泄漏
 *
 * 性能优化：
 * - 合并多条日志为单条结构化日志
 * - 优化内存清理策略
 * - 减少不必要的字符串操作
 *
 * 依赖项：
 * - Logger：用于记录请求日志
 * - WhitelistAuth：白名单路由检查
 * - getCurrentTimestamp：获取当前时间戳
 *
 * 用法示例：
 * - 在主模块中通过 APP_GUARD 全局注册该守卫，实现全局限流
 */
@Injectable()
export class GlobalGuard implements CanActivate {
  /**
   * 日志记录器
   */
  private readonly logger = new Logger(GlobalGuard.name);

  /**
   * 限流配置
   */
  private readonly config: RateLimitConfig = {
    normalLimit: 100,
    whitelistLimit: 200,
    windowSeconds: 60,
    cleanupProbability: 0.01,
  };

  /**
   * 内存限流存储
   */
  private readonly rateLimitStore = new Map<string, RateLimitItem>();

  /**
   * 上次清理时间
   */
  private lastCleanupTime = 0;

  constructor() {
    this.logger.log('全局限流守卫已初始化', {
      normalLimit: this.config.normalLimit,
      whitelistLimit: this.config.whitelistLimit,
      windowSeconds: this.config.windowSeconds,
    });
  }

  /**
   * 限流校验逻辑
   * @param context 执行上下文，包含请求相关信息
   * @returns 是否允许通过（Promise<boolean>）
   * @throws UnauthorizedException 超过限流阈值时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path ?? request.url;
    const clientIp = this.getClientIp(request);

    // 检查是否为白名单路由
    const isWhitelisted = WhitelistAuth.isWhitelistedPath(path);
    const limit = isWhitelisted ? this.config.whitelistLimit : this.config.normalLimit;

    // 执行限流检查
    const rateLimitResult = this.checkRateLimit(clientIp, limit);

    // 定期清理过期记录
    this.performCleanupIfNeeded();

    // 记录请求信息（优化后的单条日志）
    this.logRequestInfo({
      path,
      method: request.method,
      ip: clientIp,
      currentCount: rateLimitResult.currentCount,
      limit,
      isWhitelisted,
      windowSeconds: this.config.windowSeconds,
      storeSize: this.rateLimitStore.size,
    });

    return true;
  }

  /**
   * 获取客户端真实IP地址
   * @param request HTTP请求对象
   * @returns 客户端IP地址
   */
  private getClientIp(request: Request): string {
    // 优先从代理头获取真实IP
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    // 清理IPv6格式，替换冒号为连字符
    return (request.ip ?? '127.0.0.1').replace(/:/g, '-');
  }

  /**
   * 执行限流检查
   * @param ip 客户端IP
   * @param limit 限流阈值
   * @returns 限流检查结果
   * @throws UnauthorizedException 超过限流阈值时抛出
   */
  private checkRateLimit(ip: string, limit: number): { currentCount: number } {
    const key = `rate_limit:${ip}`;
    const now = getCurrentTimestamp();
    const windowMs = this.config.windowSeconds * 1000;

    const stored = this.rateLimitStore.get(key);

    if (!stored || now > stored.resetTime) {
      // 创建新的限流记录
      const newItem: RateLimitItem = {
        count: 1,
        resetTime: now + windowMs,
        firstRequestTime: now,
      };
      this.rateLimitStore.set(key, newItem);
      return { currentCount: 1 };
    }

    // 增加请求计数
    stored.count++;

    // 检查是否超过限制
    if (stored.count > limit) {
      // 记录限流事件
      this.logger.warn('触发限流保护', {
        ip,
        currentCount: stored.count,
        limit,
        windowSeconds: this.config.windowSeconds,
        duration: Math.round((now - stored.firstRequestTime) / 1000),
      });

      throw new UnauthorizedException({
        message: '请求过于频繁，请稍后再试',
        error: 'Too Many Requests',
        statusCode: 429,
        retryAfter: Math.ceil((stored.resetTime - now) / 1000),
      });
    }

    return { currentCount: stored.count };
  }

  /**
   * 定期清理过期的限流记录
   */
  private performCleanupIfNeeded(): void {
    const now = getCurrentTimestamp();

    // 基于时间间隔的清理策略，避免频繁的随机清理
    const shouldCleanup =
      Math.random() < this.config.cleanupProbability || now - this.lastCleanupTime > 300000; // 5分钟强制清理一次

    if (!shouldCleanup) {
      return;
    }

    const initialSize = this.rateLimitStore.size;
    let cleanedCount = 0;

    // 清理过期记录
    for (const [key, item] of this.rateLimitStore.entries()) {
      if (now > item.resetTime) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    this.lastCleanupTime = now;

    // 记录清理结果
    if (cleanedCount > 0) {
      this.logger.debug('内存清理完成', {
        cleanedCount,
        remainingCount: this.rateLimitStore.size,
        initialSize,
        cleanupRatio: `${((cleanedCount / initialSize) * 100).toFixed(1)}%`,
      });
    }
  }

  /**
   * 记录请求信息（结构化日志）
   * @param info 请求信息
   */
  private logRequestInfo(info: {
    path: string;
    method: string;
    ip: string;
    currentCount: number;
    limit: number;
    isWhitelisted: boolean;
    windowSeconds: number;
    storeSize: number;
  }): void {
    // 计算使用率和状态
    const usageRate = ((info.currentCount / info.limit) * 100).toFixed(1);
    const statusIcon = info.isWhitelisted ? '🟢' : '🔵';
    const usageIcon = parseFloat(usageRate) > 80 ? '🔴' : parseFloat(usageRate) > 50 ? '🟡' : '🟢';

    // 格式化美观的日志消息
    const logMessage = [
      `${statusIcon} 限流检查`,
      `📍 ${info.method} ${info.path}`,
      `🌐 IP: ${info.ip}`,
      `📊 使用率: ${usageIcon} ${usageRate}% (${info.currentCount}/${info.limit})`,
      `⏱️  窗口: ${info.windowSeconds}s`,
      `💾 存储: ${info.storeSize} 项`,
      info.isWhitelisted ? '✅ 白名单路由' : '🔒 普通路由',
    ].join(' | ');

    this.logger.debug(logMessage);
  }
}
