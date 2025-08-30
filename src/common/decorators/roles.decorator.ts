import { SetMetadata } from '@nestjs/common';
import type { Role } from 'src/common/enums/index';

/**
 * 角色权限标识键
 * 用于在元数据中存储路由所需的角色信息
 */
export const ROLES_KEY = 'roles';

/**
 * 角色权限装饰器（Roles）
 * 
 * 用于为控制器或路由方法指定访问所需的用户角色。
 * 
 * 功能说明：
 * - 在路由元数据中设置所需的角色列表
 * - RolesGuard 会检查当前用户是否拥有其中任意一个角色
 * - 支持同时指定多个角色，用户拥有其中任意一个即可访问
 * - 需要配合 RolesGuard 和 JwtAuthGuard 一起使用
 * 
 * 依赖项：
 * - Role: 角色枚举类型
 * 
 * 用法示例：
 * ```typescript
 * @Get('admin-only')
 * @JwtAuth()
 * @Roles(Role.ADMIN, Role.SUPER)
 * getAdminData() {
 *   return { message: '仅管理员可访问' };
 * }
 * ```
 * 
 * @param roles 允许访问的角色列表
 * @returns 设置角色权限元数据的装饰器
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
