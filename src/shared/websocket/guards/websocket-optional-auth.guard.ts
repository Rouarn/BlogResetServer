/**
 * WebSocket 可选认证守卫
 *
 * 功能说明:
 * - 支持可选的身份认证验证
 * - 允许匿名用户连接WebSocket
 * - 区分认证用户和匿名用户
 * - 为匿名用户分配临时标识
 *
 * 特点:
 * - 支持 JWT Token 认证（可选）
 * - 支持匿名用户访问
 * - 异常安全处理
 * - 详细的日志记录
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../interfaces';

/**
 * WebSocket 可选认证守卫
 *
 * 在 WebSocket 连接建立时验证用户身份（可选）
 */
@Injectable()
export class WebSocketOptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketOptionalAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 验证 WebSocket 连接权限（可选认证）
   * @param context 执行上下文
   * @returns 始终返回 true，允许所有连接
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const _data = context.switchToWs().getData();

      // 提取认证信息
      const token = this.extractToken(client);

      if (!token) {
        // 没有token，设置为匿名用户
        this.setupAnonymousUser(client);
        this.logger.log(`WebSocket 匿名连接: ${client.id}`);
        return true;
      }

      // 验证 JWT Token
      const payload = await this.validateToken(token);

      if (!payload) {
        // token无效，设置为匿名用户
        this.setupAnonymousUser(client);
        this.logger.warn(`WebSocket 连接令牌无效，设置为匿名用户: ${client.id}`);
        return true;
      }

      // 将用户信息附加到 socket
      const authenticatedSocket = client as AuthenticatedSocket;
      authenticatedSocket.userId = (payload.sub ?? payload.userId) as string;
      authenticatedSocket.isAuthenticated = true;
      authenticatedSocket.user = {
        id: (payload.sub ?? payload.userId) as string,
        name: (payload.name ?? payload.username) as string,
        email: payload.email as string | undefined,
        role: payload.role as string | undefined,
        avatar: payload.avatar as string | undefined,
      };

      this.logger.log(`WebSocket 连接认证成功: ${client.id} (用户: ${authenticatedSocket.userId})`);
      return true;
    } catch (error) {
      this.logger.error(`WebSocket 认证过程中发生错误: ${(error as Error).message}`);

      // 发生错误时，设置为匿名用户并允许连接
      const client = context.switchToWs().getClient<Socket>();
      this.setupAnonymousUser(client);
      this.logger.log(`WebSocket 认证失败，设置为匿名用户: ${client.id}`);
      return true;
    }
  }

  /**
   * 设置匿名用户信息
   * @param client Socket 客户端
   */
  private setupAnonymousUser(client: Socket): void {
    const authenticatedSocket = client as AuthenticatedSocket;
    const anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    authenticatedSocket.userId = anonymousId;
    authenticatedSocket.isAuthenticated = false;
    authenticatedSocket.user = {
      id: anonymousId,
      name: '匿名用户',
      email: undefined,
      role: 'anonymous',
      avatar: undefined,
    };
  }

  /**
   * 从 Socket 中提取认证令牌
   * @param client Socket 客户端
   * @returns JWT Token 或 null
   */
  private extractToken(client: Socket): string | null {
    try {
      // 从查询参数中获取 token
      if (client.handshake.query?.token) {
        return Array.isArray(client.handshake.query.token)
          ? client.handshake.query.token[0]
          : client.handshake.query.token;
      }

      // 从 Authorization header 中获取 token
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader && typeof authHeader === 'string') {
        const [type, token] = authHeader.split(' ');
        if (type === 'Bearer' && token) {
          return token;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`提取认证令牌时发生错误: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 验证 JWT Token
   * @param token JWT Token
   * @returns 解码后的 payload 或 null
   */
  private async validateToken(token: string): Promise<Record<string, unknown> | null> {
    try {
      // 验证并解码 JWT Token
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload || typeof payload !== 'object') {
        return null;
      }

      // 检查必要的字段
      const jwtPayload = payload as Record<string, unknown>;
      if (!jwtPayload.sub && !jwtPayload.userId) {
        this.logger.warn('JWT Token 缺少用户标识符');
        return null;
      }

      return jwtPayload;
    } catch (error) {
      this.logger.warn(`JWT Token 验证失败: ${(error as Error).message}`);
      return null;
    }
  }
}
