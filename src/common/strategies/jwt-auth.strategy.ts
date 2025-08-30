import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

/**
 * JWT 认证策略（JwtAuthStrategy）
 *
 * 用于解析和校验请求头中的 JWT Token，实现基于 Passport 的认证机制。
 *
 * 功能说明：
 * - 继承自 PassportStrategy，指定策略名称为 'jwt'。
 * - 从请求头 Authorization: Bearer <token> 中提取 JWT。
 * - 使用配置文件中的密钥进行 Token 校验。
 * - 校验通过后，返回 payload 作为请求的 user 信息。
 *
 * 依赖项：
 * - ConfigService：用于读取配置信息（如密钥）。
 * - JWT.NEST_JWT_SECRET：JWT 校验所需的密钥。
 * - CreateAuthDto：定义 JWT payload 的数据结构。
 *
 * 用法示例：
 * - 在 AuthModule 中注册该策略，配合 JwtAuthGuard 使用，实现路由保护。
 */
@Injectable()
// 验证请求头中的token
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * 构造函数
   * @param _config 配置服务实例，用于获取 JWT 密钥
   */
  constructor(private readonly _config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: _config.get<string>('NEST_JWT_SECRET'),
    });
  }

  /**
   * 校验并处理 JWT payload
   * @param payload JWT 载荷，包含用户信息及 iat/exp 字段
   * @returns 校验通过后的用户信息对象
   */
  async validate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      delete (payload as { iat?: number }).iat;
      delete (payload as { exp?: number }).exp;
      return {
        ...payload,
      };
    } catch (e) {
      return { ...(e as Record<string, unknown>) };
    }
  }
}
