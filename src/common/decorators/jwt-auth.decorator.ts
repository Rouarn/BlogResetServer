import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';

/**
 * JWT 认证装饰器（JwtAuth）
 *
 * 用于快速为控制器或路由方法添加 JWT 认证保护。
 *
 * 功能说明：
 * - 自动应用 JwtAuthGuard 守卫，要求请求携带有效的 JWT Token
 * - 认证失败时自动返回 401 未授权错误
 * - 认证成功后，用户信息会被注入到 request.user 中
 *
 * 依赖项：
 * - JwtAuthGuard: JWT 认证守卫
 *
 * 用法示例：
 * ```typescript
 * @Get('protected')
 * @JwtAuth()
 * getProtectedData() {
 *   return { message: '这是受保护的数据' };
 * }
 * ```
 *
 * @returns 应用了 JwtAuthGuard 的装饰器组合
 */
export function JwtAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
