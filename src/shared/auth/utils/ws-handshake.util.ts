import type { AuthService } from '@/modules/auth/auth.service';
import type { JwtPayloadDto } from '@/modules/auth/dto/token.dto';
import type { AuthenticatedSocket } from '@/shared/websocket/interfaces';
import { formatTimestamp } from '@/utils';
import type { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { extractWsToken } from './token.util';

export function attachHandshakeAuth(
  server: Server,
  jwtService: JwtService,
  authService: AuthService,
): void {
  server.use(async (socket: Socket, next) => {
    try {
      const token = extractWsToken(socket);
      if (!token)
        return next(
          new Error(
            JSON.stringify({
              code: 401,
              message: '未授权',
              category: 'PERMISSION_DENIED',
              timestamp: formatTimestamp(),
            }),
          ),
        );
      let payload: JwtPayloadDto;
      try {
        payload = await jwtService.verifyAsync<JwtPayloadDto>(token);
      } catch {
        return next(
          new Error(
            JSON.stringify({
              code: 401,
              message: '令牌无效或已过期',
              category: 'PERMISSION_DENIED',
              timestamp: formatTimestamp(),
            }),
          ),
        );
      }
      const authId = payload?.authId ?? payload?.sub;
      if (!authId)
        return next(
          new Error(
            JSON.stringify({
              code: 401,
              message: '令牌缺少用户标识',
              category: 'PERMISSION_DENIED',
              timestamp: formatTimestamp(),
            }),
          ),
        );
      const auth = await authService.getAuthById(authId);
      const s = socket as AuthenticatedSocket;
      s.userId = auth.id;
      s.isAuthenticated = true;
      s.user = {
        id: auth.id,
        name: auth.username,
        email: auth.user?.email || '',
        role: auth.user?.roles || 'USER',
        avatar: auth.user?.avatar || '',
      };
      next();
    } catch {
      next(
        new Error(
          JSON.stringify({
            code: 500,
            message: '连接验证失败',
            category: 'SYSTEM_BUSY',
            timestamp: formatTimestamp(),
          }),
        ),
      );
    }
  });
}
