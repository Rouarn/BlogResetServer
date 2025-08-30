import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

/**
 * 当前用户信息接口
 * 
 * 定义从 JWT Token 中解析出的用户基本信息结构
 */
export interface CurrentUser {
  /** 用户唯一标识 */
  id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色列表（可选） */
  roles?: string[];
}

/**
 * 获取当前用户装饰器（GetCurrentUser）
 * 
 * 用于在控制器方法参数中直接获取当前登录用户的信息。
 * 
 * 功能说明：
 * - 从请求对象中提取经过 JWT 认证后的用户信息
 * - 返回包含用户 ID、邮箱和角色的 CurrentUser 对象
 * - 需要配合 JwtAuthGuard 使用，确保用户已通过认证
 * 
 * 用法示例：
 * ```typescript
 * @Get('profile')
 * @JwtAuth()
 * getProfile(@GetCurrentUser() user: CurrentUser) {
 *   return { userId: user.id, email: user.email };
 * }
 * ```
 */
export const GetCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);