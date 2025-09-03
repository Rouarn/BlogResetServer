/**
 * WebSocket 认证守卫
 *
 * 功能说明:
 * - 验证 WebSocket 连接的身份认证
 * - 从 token 中提取用户信息
 * - 阻止未认证的连接
 * - 支持多种认证方式
 *
 * 特点:
 * - 支持 JWT Token 认证
 * - 支持查询参数和 Header 认证
 * - 异常安全处理
 * - 详细的日志记录
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../interfaces';

/**
 * WebSocket 认证守卫
 *
 * 在 WebSocket 连接建立时验证用户身份
 */
@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 验证 WebSocket 连接权限
   * @param context 执行上下文
   * @returns 是否允许连接
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const _data = context.switchToWs().getData();

      // 提取认证信息
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`WebSocket 连接缺少认证令牌: ${client.id}`);
        throw new WsException({
          code: 'UNAUTHORIZED',
          message: '缺少认证令牌',
          timestamp: Date.now(),
        });
      }

      // 验证 JWT Token
      const payload = await this.validateToken(token);

      if (!payload) {
        this.logger.warn(`WebSocket 连接令牌无效: ${client.id}`);
        throw new WsException({
          code: 'INVALID_TOKEN',
          message: '认证令牌无效',
          timestamp: Date.now(),
        });
      }

      // 将用户信息附加到 socket
      const authenticatedSocket = client as AuthenticatedSocket;
      authenticatedSocket.userId = (payload.sub ?? payload.userId) as string;
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
      this.logger.error(`WebSocket 认证失败: ${(error as Error).message}`, (error as Error).stack);

      // 如果是 WsException，直接抛出
      if (error instanceof WsException) {
        throw error;
      }

      // 其他异常转换为 WsException
      throw new WsException({
        code: 'AUTH_ERROR',
        message: '认证过程中发生错误',
        details: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 从 WebSocket 连接中提取认证令牌
   * @param client WebSocket 客户端
   * @returns JWT Token 或 null
   */
  private extractToken(client: Socket): string | null {
    try {
      // 方式1: 从查询参数中获取 token
      const queryToken = client.handshake.query?.token as string;
      if (queryToken) {
        return queryToken;
      }

      // 方式2: 从 auth 查询参数中获取
      const authQuery = client.handshake.query?.auth as string;
      if (authQuery) {
        return authQuery;
      }

      // 方式3: 从 Authorization header 中获取
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader) {
        const [type, token] = authHeader.split(' ');
        if (type === 'Bearer' && token) {
          return token;
        }
      }

      // 方式4: 从自定义 header 中获取
      const customToken = client.handshake.headers?.['x-auth-token'] as string;
      if (customToken) {
        return customToken;
      }

      return null;
    } catch (error) {
      this.logger.error(`提取认证令牌失败: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

  /**
   * 验证 JWT Token
   * @param token JWT Token
   * @returns Token 载荷或 null
   */
  private async validateToken(token: string): Promise<Record<string, unknown> | null> {
    try {
      // 验证并解码 JWT Token
      const payload = await this.jwtService.verifyAsync(token);

      // 检查必要字段
      const typedPayload = payload as { sub?: string; userId?: string; exp?: number };
      if (!typedPayload.sub && !typedPayload.userId) {
        this.logger.warn('JWT Token 缺少用户ID字段');
        return null;
      }

      // 检查 Token 是否过期
      if (typedPayload.exp && typedPayload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn('JWT Token 已过期');
        return null;
      }

      return payload as Record<string, unknown>;
    } catch (error) {
      this.logger.error(`验证 JWT Token 失败: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 验证用户权限（可扩展）
   * @param userId 用户ID
   * @param requiredRole 所需角色
   * @returns 是否有权限
   */
  private async validateUserPermissions(userId: string, _requiredRole?: string): Promise<boolean> {
    try {
      // 这里可以添加更复杂的权限验证逻辑
      // 例如：查询数据库验证用户状态、角色等

      // 基础验证：用户ID 不能为空
      if (!userId) {
        return false;
      }

      // 如果需要特定角色，可以在这里验证
      if (_requiredRole) {
        // TODO: 实现角色验证逻辑
        // const user = await this.userService.findById(userId);
        // return user && user.role === requiredRole;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证用户权限失败: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  /**
   * 检查连接速率限制（可扩展）
   * @param clientIp 客户端IP
   * @returns 是否允许连接
   */
  private async checkRateLimit(_clientIp: string): Promise<boolean> {
    try {
      // 这里可以实现连接速率限制逻辑
      // 例如：使用 Redis 记录连接频率

      // 基础实现：总是允许（生产环境中应该实现真正的限流）
      return true;
    } catch (error) {
      this.logger.error(
        `检查连接速率限制失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * 记录连接审计日志（可扩展）
   * @param socket WebSocket 连接
   * @param userId 用户ID
   * @param success 是否成功
   */
  private logConnectionAttempt(socket: Socket, userId?: string, success: boolean = true): void {
    try {
      const logData = {
        socketId: socket.id,
        userId,
        clientIp: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        timestamp: new Date().toISOString(),
        success,
      };

      if (success) {
        this.logger.log(`WebSocket 连接成功: ${JSON.stringify(logData)}`);
      } else {
        this.logger.warn(`WebSocket 连接失败: ${JSON.stringify(logData)}`);
      }

      // 这里可以将审计日志发送到外部系统
      // 例如：发送到日志收集服务、安全监控系统等
    } catch (error) {
      this.logger.error(
        `记录连接审计日志失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
