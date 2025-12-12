import { ExecutionContext, Injectable } from '@nestjs/common';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { Auth } from 'src/modules/auth/entities/auth.entity';
import { WhitelistAuth } from 'src/utils';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * JwtAuthGuard（JWT 认证守卫）
 *
 * 用于保护需要身份认证的路由，基于 JWT 策略进行用户身份校验。
 *
 * 功能说明：
 * - 继承自 NestJS 的 AuthGuard('jwt')，自动集成 Passport 的 JWT 策略。
 * - 支持通过 @Public 装饰器声明无需认证的公共路由。
 * - 校验失败时自动抛出 401（未授权）或 404（用户不存在）异常。
 *
 * 依赖项：
 * - Reflector：用于读取路由元数据（如是否为公共路由）。
 *
 * 主要方法：
 * - canActivate：判断当前请求是否需要认证，若为公共路由则直接放行，否则进入 JWT 校验。
 * - handleRequest：处理认证结果，抛出相应异常或返回用户对象。
 *
 * 用法示例：
 * - 在需要保护的控制器或路由上使用 @UseGuards(JwtAuthGuard)
 * - 在无需认证的路由上使用 @Public 装饰器
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 构造函数
   * @param reflector 用于获取元数据的反射工具
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 判断当前请求是否需要认证
   * @param context 执行上下文，包含请求相关信息
   * @returns 是否允许访问（布尔值、Promise 或 Observable）
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path ?? request.url;

    // 检查是否在白名单中
    if (WhitelistAuth.isWhitelistedPath(path)) {
      return true;
    }

    // 是否是公共路由（通过装饰器标记）
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // 校验token
    return super.canActivate(context);
  }

  /**
   * 处理认证结果
   * @param error Passport 策略执行过程中的错误
   * @param user 验证通过后的用户对象
   * @param info 验证失败时的错误信息
   * @returns 认证通过的用户对象
   * @throws BusinessException token 校验失败
   * @throws BusinessException 用户不存在
   */
  handleRequest<TUser = Auth>(error: Error, user: Auth, info: unknown): TUser {
    if (info || error) throw BusinessExceptionFactory.validation('Token');
    if (typeof user !== 'object') throw BusinessExceptionFactory.notFound('用户', { user });

    return user as TUser;
  }
}
