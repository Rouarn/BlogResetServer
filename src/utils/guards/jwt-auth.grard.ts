import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /** 验证token */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 是否是公共路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // 校验token
    return super.canActivate(context);
  }

  /**
   * @description: 验完成后调用
   * @param {*} error 这是 Passport 策略执行过程中发生的任何潜在错误。如果在验证过程中没有错误发生，这个值通常是 null
   * @param {*} user 这是 Passport 策略验证成功后返回的用户对象。如果验证失败，这个值可能是 false 或 null，具体取决于你使用的 Passport 策略
   * @param {*} info 如果验证失败，info通常是一个error对象
   */
  handleRequest(error: any, user: any, info: any) {
    if (info || error) throw new UnauthorizedException('token校验失败');
    if (!user) throw new NotFoundException('用户不存在');

    return user;
  }
}
