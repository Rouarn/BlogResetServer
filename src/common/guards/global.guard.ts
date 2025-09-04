import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CACHE_TOKENS } from 'src/common/constants';
import { ICacheService } from 'src/modules/cache';
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
 * 缓存键前缀常量
 */
const RATE_LIMIT_PREFIX = 'rate_limit:';
const CACHE_TTL_SECONDS = 60;

/**
 * 全局限流守卫（GlobalGuard）- Redis缓存版
 *
 * 用于对所有进入系统的 HTTP 请求进行限流控制，防止单个 IP 在单位时间内频繁请求，保护系统免受恶意刷接口攻击。
 *
 * 功能说明：
 * - 基于Redis缓存实现分布式滑动窗口限流，支持白名单路由差异化限流策略
 * - 超过限制后，抛出 401 UnauthorizedException 异常
 * - 优化的日志输出，减少性能开销
 * - 利用Redis TTL机制自动清理过期数据，无需手动内存管理
 * - 支持多实例部署的分布式限流
 *
 * 性能优化：
 * - 使用Redis缓存替代内存存储，支持集群部署
 * - 合并多条日志为单条结构化日志
 * - 缓存服务异常时自动降级，不影响业务流程
 * - 减少不必要的字符串操作
 *
 * 依赖项：
 * - ICacheService：缓存服务，用于存储限流数据
 * - Logger：用于记录请求日志
 * - WhitelistAuth：白名单路由检查
 * - getCurrentTimestamp：获取当前时间戳
 *
 * 用法示例：
 * - 在主模块中通过 APP_GUARD 全局注册该守卫，实现全局限流
 * - 确保缓存模块已正确配置和注册
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
  };

  constructor(
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {
    this.logger.log('');
    this.logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                  🛡️  全局限流守卫已初始化 🛡️                        ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.logger.log('');
    this.logger.log('┌─ 🛡️  限流配置信息 ────────────────────────────────────────────────┐');
    this.logger.log(`│ 📊 普通限制: ${this.config.normalLimit}/分钟`);
    this.logger.log(`│ ⭐ 白名单限制: ${this.config.whitelistLimit}/分钟`);
    this.logger.log(`│ ⏱️  时间窗口: ${this.config.windowSeconds}秒`);
    this.logger.log(`│ 💾 缓存TTL: ${CACHE_TTL_SECONDS}秒`);
    this.logger.log(`│ 🔧 缓存类型: Redis缓存版`);
    this.logger.log('└──────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
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
    const rateLimitResult = await this.checkRateLimit(clientIp, limit);

    // 记录请求信息（优化后的单条日志）
    this.logRequestInfo({
      path,
      method: request.method,
      ip: clientIp,
      currentCount: rateLimitResult.currentCount,
      limit,
      isWhitelisted,
      windowSeconds: this.config.windowSeconds,
      storeSize: 0, // Redis缓存无需显示存储大小
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
   * 执行限流检查（使用缓存服务）
   * @param ip 客户端IP
   * @param limit 限流阈值
   * @returns 限流检查结果
   * @throws UnauthorizedException 超过限流阈值时抛出
   */
  private async checkRateLimit(ip: string, limit: number): Promise<{ currentCount: number }> {
    const key = `${RATE_LIMIT_PREFIX}${ip}`;
    const now = getCurrentTimestamp();
    const windowMs = this.config.windowSeconds * 1000;

    try {
      // 从缓存获取限流记录
      const stored = await this.cacheService.get<RateLimitItem>(key);

      if (!stored || now > stored.resetTime) {
        // 创建新的限流记录
        const newItem: RateLimitItem = {
          count: 1,
          resetTime: now + windowMs,
          firstRequestTime: now,
        };

        // 存储到缓存，设置TTL为窗口时间
        await this.cacheService.set(key, newItem, { ttl: CACHE_TTL_SECONDS });
        return { currentCount: 1 };
      }

      // 增加请求计数
      stored.count++;

      // 检查是否超过限制
      if (stored.count > limit) {
        // 记录限流事件
        this.logger.warn('🚫 触发限流保护', {
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

      // 更新缓存中的计数
      await this.cacheService.set(key, stored, { ttl: CACHE_TTL_SECONDS });
      return { currentCount: stored.count };
    } catch (error) {
      // 缓存服务异常时，允许请求通过，避免影响业务
      this.logger.error('缓存服务异常，限流检查跳过', {
        ip,
        error: (error as Error).message,
      });
      return { currentCount: 1 };
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
    const statusIcon = info.isWhitelisted ? '🔵' : '🟢';
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

    // 使用log级别替代debug，在终端中显示为绿色，更加醒目
    this.logger.log(logMessage);
  }
}
