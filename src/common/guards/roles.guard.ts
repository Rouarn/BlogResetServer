import { Role } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

/**
 * 角色守卫
 *
 * 用于基于角色的访问控制，检查当前请求的用户是否拥有访问特定资源所需的角色。
 *
 * 使用方式：
 * - 在控制器或路由处理器上使用 @Roles 装饰器指定所需角色
 * - 该守卫会自动读取装饰器中的角色信息，并校验当前用户是否具备其中任意一个角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * 构造函数
   * @param reflector 用于获取元数据的反射工具
   */
  constructor(private reflector: Reflector) {}

  /**
   * 判断当前请求是否有权限访问
   * @param context 执行上下文，包含请求相关信息
   * @returns 是否允许访问
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: { roles?: string[] } }>();
    const user = request.user;

    const hasPermission = requiredRoles.some((role) => user?.roles?.includes(role));

    if (!hasPermission) {
      throw BusinessExceptionFactory.forbidden('资源访问', {
        requiredRoles,
        userRoles: user?.roles,
      });
    }

    return true;
  }
}
