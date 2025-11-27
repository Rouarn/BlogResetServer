import { IS_PUBLIC_KEY } from '@/common/decorators';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import type { JwtPayloadDto } from '@/modules/auth/dto/token.dto';
import type { AuthenticatedSocket } from '@/shared/websocket/interfaces';
import { WhitelistAuth, formatTimestamp } from '@/utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Request } from 'express';
import type { Socket } from 'socket.io';
import { extractHttpToken, extractWsToken } from '../utils/token.util';

type RequestWithUser = Request & { user?: { id: string; username: string; roles: string } };

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const type = context.getType<string>();
    if (type === 'http') return this.handleHttp(context);
    if (type === 'ws') return this.handleWs(context);
    return true;
  }

  private async handleHttp(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const path = request.path ?? request.url;
    if (WhitelistAuth.isWhitelistedPath(path)) return true;
    const token = extractHttpToken(request);
    if (!token) throw BusinessExceptionFactory.forbidden('访问', { reason: '缺少令牌' });
    let payload: JwtPayloadDto;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadDto>(token);
    } catch {
      throw BusinessExceptionFactory.forbidden('访问', { reason: '令牌无效或已过期' });
    }
    const authId = payload?.authId ?? payload?.sub;
    if (!authId) throw BusinessExceptionFactory.forbidden('访问', { reason: '令牌缺少用户标识' });
    const auth = await this.authService.getAuthById(authId);
    request.user = {
      id: auth.id,
      username: auth.username,
      roles: auth.user?.roles || 'USER',
    };
    return true;
  }

  private async handleWs(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = extractWsToken(client);
    if (!token) {
      client.disconnect(true);
      throw new WsException({
        code: 401,
        message: '未授权',
        category: 'PERMISSION_DENIED',
        timestamp: formatTimestamp(),
      });
    }
    let payload: JwtPayloadDto;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadDto>(token);
    } catch {
      client.disconnect(true);
      throw new WsException({
        code: 401,
        message: '令牌无效或已过期',
        category: 'PERMISSION_DENIED',
        timestamp: formatTimestamp(),
      });
    }
    const authId = payload?.authId ?? payload?.sub;
    if (!authId) {
      client.disconnect(true);
      throw new WsException({
        code: 401,
        message: '令牌缺少用户标识',
        category: 'PERMISSION_DENIED',
        timestamp: formatTimestamp(),
      });
    }
    const auth = await this.authService.getAuthById(authId);
    const s = client as AuthenticatedSocket;
    s.userId = auth.id;
    s.isAuthenticated = true;
    s.user = {
      id: auth.id,
      name: auth.username,
      email: auth.user?.email || '',
      role: auth.user?.roles || 'USER',
      avatar: auth.user?.avatar || '',
    };
    return true;
  }
}
