/**
 * 守卫模块导出
 *
 * 统一导出所有路由守卫，用于请求拦截、认证和权限控制。
 *
 * 包含守卫：
 * - GlobalGuard: 全局限流守卫，防止接口被恶意刷取
 * - JwtAuthGuard: JWT 认证守卫，验证用户身份
 * - RolesGuard: 角色权限守卫，基于角色的访问控制
 *
 * 用法示例：
 * import { JwtAuthGuard, RolesGuard } from '@/common/guards';
 */
export * from './global.guard';
export * from './jwt-auth.guard';
export * from './roles.guard';
