import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

/**
 * 当前用户认证信息接口
 *
 * 定义从JWT策略返回的标准化用户认证信息结构
 */
export interface CurrentUser {
  authId: string;
  userId: string;
  username: string;
  roles: string[];
  lastLoginAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

/**
 * 获取当前用户装饰器（GetCurrentUser）
 *
 * 用于在控制器方法参数中直接获取当前登录用户的认证信息。
 * 与新的认证架构集成，返回标准化的用户认证信息。
 *
 * 功能说明：
 * - 从请求对象中提取经过 JWT 认证后的用户信息
 * - 返回包含认证ID、用户名、角色等标准化信息
 * - 需要配合 JwtAuthGuard 使用，确保用户已通过认证
 * - 支持类型安全的用户信息访问
 *
 * 架构特点：
 * - 与JWT策略返回的信息结构一致
 * - 提供完整的用户认证上下文
 * - 支持角色权限验证
 * - 类型安全的接口定义
 *
 * 用法示例：
 * ```typescript
 * @Get('profile')
 * @JwtAuth()
 * getProfile(@GetCurrentUser() user: CurrentUser) {
 *   return {
 *     authId: user.authId,
 *     username: user.username,
 *     roles: user.roles
 *   };
 * }
 *
 * // 获取特定字段
 * @Post('update')
 * @JwtAuth()
 * updateData(
 *   @GetCurrentUser('authId') authId: string,
 *   @Body() updateDto: UpdateDto
 * ) {
 *   return this.service.update(authId, updateDto);
 * }
 * ```
 */
export const GetCurrentUser = createParamDecorator(
  (
    field: keyof CurrentUser | undefined,
    ctx: ExecutionContext,
  ): CurrentUser | string | string[] | Date => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUser;

    // 如果指定了特定字段，返回该字段的值
    if (field) {
      return user[field];
    }

    // 否则返回完整的用户认证信息
    return user;
  },
);
