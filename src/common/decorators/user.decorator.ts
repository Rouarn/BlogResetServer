import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

/**
 * 用户信息参数装饰器（User）
 *
 * 用于在控制器方法参数中直接获取当前认证用户的完整信息。
 *
 * 功能说明：
 * - 从请求对象中提取经过认证后的用户信息
 * - 返回 JWT 策略验证后存储在 request.user 中的用户对象
 * - 需要配合认证守卫使用，确保用户已通过身份验证
 * - 与 GetCurrentUser 装饰器功能类似，但更通用
 *
 * 用法示例：
 * ```typescript
 * @Get('me')
 * @JwtAuth()
 * getCurrentUser(@User() user: any) {
 *   return user;
 * }
 * ```
 *
 * @param data 可选的数据参数（当前未使用）
 * @param ctx 执行上下文，用于获取请求对象
 * @returns 当前认证用户的信息对象
 */
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): unknown => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
