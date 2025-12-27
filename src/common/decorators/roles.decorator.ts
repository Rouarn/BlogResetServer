import type { Role } from '@/common/enums';
import { SetMetadata } from '@nestjs/common';

/**
 * 角色权限标识键
 * 用于在元数据中存储路由所需的角色信息
 */
export const ROLES_KEY = 'roles';

/**
 * 角色权限装饰器
 *
 * 用于为控制器或路由方法指定访问所需的用户角色。
 * RolesGuard 会检查当前用户是否拥有其中任意一个角色。
 *
 * @param roles 允许访问的角色列表
 * @returns 设置角色权限元数据的装饰器
 *
 * @example
 * ```typescript
 * @Get('admin-only')
 * @Roles(Role.SYSTEM_ADMIN, Role.ORG_ADMIN)
 * getAdminData() {
 *   return { message: '仅管理员可访问' };
 * }
 * ```
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
