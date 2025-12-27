import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser } from '../interfaces';

/**
 * 获取当前用户装饰器（GetCurrentUser）
 *
 * 用于在控制器方法参数中直接获取当前登录用户的认证信息。
 * 与新的认证架构集成，返回标准化的用户认证信息。
 */
export const GetCurrentUser = createParamDecorator(
  (
    field: keyof CurrentUser | undefined,
    ctx: ExecutionContext,
  ): CurrentUser | string | string[] | Date | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user: CurrentUser | undefined = request.user;

    if (!user) {
      return undefined;
    }

    // 如果指定了特定字段，返回该字段的值
    if (field) {
      return user[field];
    }

    // 否则返回完整的用户认证信息
    return user;
  },
);
