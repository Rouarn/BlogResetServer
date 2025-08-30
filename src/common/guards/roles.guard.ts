import { Role } from 'src/common/enums/index';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

/**
 * 角色守卫（RolesGuard）
 *
 * 该守卫用于基于角色的访问控制。它会检查当前请求的用户是否拥有访问特定资源所需的角色。
 *
 * 使用方式：
 * - 在控制器或路由处理器上使用 @Roles 装饰器指定所需角色。
 * - 该守卫会自动读取装饰器中的角色信息，并校验当前用户是否具备其中任意一个角色。
 *
 * 依赖项：
 * - Reflector：用于获取元数据（如角色信息）。
 *
 * 方法：
 * - canActivate(context: ExecutionContext): boolean
 *   - 若未指定所需角色，则允许访问。
 *   - 若指定了角色，则校验当前用户是否拥有其中任意一个角色，拥有则允许访问，否则拒绝。
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
   * @returns boolean 是否允许访问
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
