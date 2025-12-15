import { CACHE_PREFIXES, CACHE_TOKENS } from '@/common/constants';
import { Role, Status } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import type { ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT 认证策略（JwtAuthStrategy）
 *
 * 用于解析和校验请求头中的 JWT Token，实现基于 Passport 的认证机制。
 * 与新的认证架构集成，支持认证状态验证和用户信息获取。
 *
 * 功能说明：
 * - 继承自 PassportStrategy，指定策略名称为 'jwt'
 * - 从请求头 Authorization: Bearer <token> 中提取 JWT
 * - 使用配置文件中的密钥进行 Token 校验
 * - 验证用户认证状态和账号有效性
 * - 返回完整的用户认证信息供后续使用
 *
 * 架构特点：
 * - 与AuthService协作验证用户状态
 * - 支持账号锁定和禁用状态检查
 * - 返回标准化的用户认证信息
 * - 集成缓存机制提升性能
 *
 * 依赖项：
 * - ConfigService：配置服务，获取JWT密钥
 * - AuthService：认证服务，验证用户状态
 *
 * 安全特性：
 * - JWT令牌有效性验证
 * - 用户账号状态实时检查
 * - 异常情况统一处理
 */
@Injectable()
// 验证请求头中的token
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * 构造函数
   * @param config 配置服务实例，用于获取 JWT 密钥
   * @param authService 认证服务，用于验证用户状态
   */
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('NEST_JWT_SECRET') ?? 'default-secret-key',
      passReqToCallback: true,
    });
  }

  /**
   * 校验并处理 JWT payload
   *
   * 验证JWT载荷的有效性，并检查用户认证状态
   *
   * @param payload JWT 载荷，包含认证ID等用户信息
   * @returns 校验通过后的完整用户认证信息
   * @throws UnauthorizedException 认证失败或用户状态异常
   */
  async validate(
    req: Request,
    payload: {
      authId: string; // 认证ID
      username: string;
      iat?: number;
      exp?: number;
    },
  ): Promise<{
    authId: string;
    userId: string;
    username: string;
    roles: string[];
    lastLoginAt: Date;
  }> {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (token) {
      const isBlacklisted = await this.cacheService.has(
        `${CACHE_PREFIXES.BLACKLIST_TOKEN}:${token}`,
      );

      if (isBlacklisted) {
        throw BusinessExceptionFactory.unauthorized('令牌访问', { status: 'blacklisted' });
      }
    }
    // 验证载荷必要字段
    if (!payload.authId || !payload.username) {
      throw BusinessExceptionFactory.validation('令牌参数', {
        reason: '无效的令牌载荷',
        ...payload,
      });
    }

    // 通过认证服务获取完整的用户认证信息
    const authInfo = await this.authService.getAuthById(payload.authId);

    // 检查认证状态
    if (!authInfo || authInfo.status !== Status.ENABLED) {
      throw BusinessExceptionFactory.forbidden('账号访问', {
        reason: '账号已被禁用或不存在',
        authId: payload.authId,
      });
    }

    // 检查账号是否被锁定
    if (authInfo.isLocked()) {
      throw BusinessExceptionFactory.forbidden('账号访问', {
        reason: '账号已被锁定',
        authId: payload.authId,
      });
    }

    // 返回标准化的认证信息
    const userRoles = authInfo.user?.roles ? [authInfo.user.roles] : [Role.USER];

    return {
      authId: authInfo.id,
      userId: authInfo.user?.id || authInfo.id,
      username: authInfo.username,
      roles: userRoles,
      lastLoginAt: authInfo.lastLoginAt,
    };
  }
}
