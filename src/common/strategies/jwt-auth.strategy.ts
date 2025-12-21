import { Role, Status } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUser } from '../decorators';

/**
 * JWT 认证策略（JwtAuthStrategy）
 *
 * 用于解析和校验请求头中的 JWT Token，实现基于 Passport 的认证机制。
 * 与新的认证架构集成，支持认证状态验证和用户信息获取。
 */
@Injectable()
// 验证请求头中的token是否有效
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * 构造函数
   * @param config 配置服务实例，用于获取 JWT 密钥
   * @param authService 认证服务，用于验证用户状态
   */
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('NEST_JWT_SECRET') ?? 'default-secret-key',
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
  async validate(payload: CurrentUser): Promise<{
    authId: string;
    userId: string;
    username: string;
    roles: string[];
  }> {
    // 验证载荷必要字段
    if (!payload.authId || !payload.username) {
      throw BusinessExceptionFactory.validation('令牌参数', {
        message: '无效的令牌载荷',
      });
    }

    // 通过认证服务获取完整的用户认证信息
    const authInfo = await this.authService.getAuthById(payload.authId);

    // 检查认证状态
    if (!authInfo || authInfo.status !== Status.ENABLED) {
      throw BusinessExceptionFactory.forbidden('账号访问', {
        message: '账号已被禁用或不存在',
        authId: payload.authId,
      });
    }

    // 检查账号是否被锁定
    if (authInfo.isLocked()) {
      throw BusinessExceptionFactory.forbidden('账号访问', {
        message: '账号已被锁定',
        authId: payload.authId,
      });
    }

    return {
      authId: authInfo.id,
      userId: authInfo.user?.id || authInfo.id,
      username: authInfo.username,
      roles: [authInfo.user?.roles || Role.USER],
    };
  }
}
