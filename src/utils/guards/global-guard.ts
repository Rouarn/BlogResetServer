import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('RoleGuard 全局守卫');
    return true;
  }
}
