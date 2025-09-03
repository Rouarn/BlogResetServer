/**
 * WebSocket 网关
 *
 * 功能说明:
 * - 处理 WebSocket 连接和断开
 * - 管理客户端消息传递
 * - 实现房间管理功能
 * - 提供实时通信能力
 *
 * 特点:
 * - 支持身份验证和授权
 * - 房间管理和广播功能
 * - 异常处理和错误恢复
 * - 详细的连接状态管理
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway as WSGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import {
  Injectable,
  Logger,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Server } from 'socket.io';
import type {
  AuthenticatedSocket,
  WebSocketResponse,
  JoinRoomData,
  LeaveRoomData,
  SendMessageData,
  BroadcastData,
  ConnectionStatus,
} from './interfaces';
import { WebSocketMessageType } from './interfaces';
import { WebSocketService } from './services/websocket.service';
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';
import { WebSocketExceptionFilter } from './filters/websocket-exception.filter';
import { WebSocketInterceptor } from './interceptors/websocket.interceptor';

/**
 * WebSocket 网关配置
 */
const GATEWAY_CONFIG = {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
};

/**
 * WebSocket 网关
 *
 * 处理所有 WebSocket 连接和消息传递
 */
@Injectable()
@WSGateway({
  namespace: '/ws',
  ...GATEWAY_CONFIG,
})
@UseFilters(WebSocketExceptionFilter)
@UseInterceptors(WebSocketInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  /**
   * 网关初始化
   * @param server Socket.IO 服务器实例
   */
  afterInit(server: Server): void {
    this.logger.log('WebSocket 网关初始化完成');
    this.server = server;

    // 设置服务器实例到服务中
    this.webSocketService.setServer(server);

    // 配置服务器级别的中间件
    this.setupServerMiddleware();
  }

  /**
   * 处理客户端连接
   * @param socket 客户端 Socket
   */
  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      this.logger.log(`客户端连接: ${socket.id}`);

      // 初始化rooms属性
      if (!socket.rooms) {
        socket.rooms = new Set();
      }

      // 添加连接到服务
      await this.webSocketService.addConnection(socket);

      // 发送连接成功消息
      const welcomeMessage = this.webSocketService.createMessage(
        WebSocketMessageType.CONNECTION,
        {
          socketId: socket.id,
          timestamp: Date.now(),
          message: '连接成功',
        },
        { senderId: socket.user?.id },
      );

      socket.emit('connected', welcomeMessage);

      // 发送连接状态
      const status = await this.webSocketService.getConnectionStatus(socket.id);
      socket.emit('status', status);
    } catch (error) {
      this.logger.error(`处理客户端连接失败: ${(error as Error).message}`, (error as Error).stack);

      // 发送连接错误
      socket.emit('error', {
        code: 'CONNECTION_ERROR',
        message: '连接失败，请重试',
        timestamp: Date.now(),
      });

      // 断开连接
      socket.disconnect(true);
    }
  }

  /**
   * 处理客户端断开连接
   * @param socket 客户端 Socket
   */
  async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    try {
      this.logger.log(`客户端断开连接: ${socket.id}`);

      // 从服务中移除连接
      await this.webSocketService.removeConnection(socket);
    } catch (error) {
      this.logger.error(
        `处理客户端断开连接失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  /**
   * 处理加入房间请求
   * @param socket 客户端 Socket
   * @param data 加入房间数据
   * @returns 响应结果
   */
  @SubscribeMessage('join-room')
  @UseGuards(WebSocketAuthGuard)
  async handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: JoinRoomData,
  ): Promise<WebSocketResponse<{ room: string; members: number }>> {
    try {
      this.logger.log(`客户端 ${socket.id} 请求加入房间: ${data.roomId}`);

      // 验证房间名称
      if (!this.isValidRoomName(data.roomId)) {
        throw new WsException({
          code: 'INVALID_ROOM_NAME',
          message: '房间名称无效',
        });
      }

      // 加入房间
      const result = await this.webSocketService.joinRoom(socket.id, data.roomId, data.userInfo);

      // Socket.IO 房间操作
      await socket.join(data.roomId);

      // 通知房间其他成员
      const notification = this.webSocketService.createMessage(
        WebSocketMessageType.NOTIFICATION,
        {
          userId: socket.user?.id,
          username: socket.user?.name,
          room: data.roomId,
          timestamp: Date.now(),
        },
        { senderId: socket.user?.id, roomId: data.roomId },
      );

      socket.to(data.roomId).emit('notification', notification);

      return {
        success: true,
        data: {
          room: data.roomId,
          members: result?.memberCount ?? 0,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`加入房间失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理离开房间请求
   * @param socket 客户端 Socket
   * @param data 离开房间数据
   * @returns 响应结果
   */
  @SubscribeMessage('leave-room')
  @UseGuards(WebSocketAuthGuard)
  async handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: LeaveRoomData,
  ): Promise<WebSocketResponse<{ room: string; members: number }>> {
    try {
      this.logger.log(`客户端 ${socket.id} 请求离开房间: ${data.roomId}`);

      // 离开房间
      const result = await this.webSocketService.leaveRoom(socket.id, data.roomId);

      // Socket.IO 房间操作
      await socket.leave(data.roomId);

      // 通知房间其他成员
      const notification = this.webSocketService.createMessage(
        WebSocketMessageType.NOTIFICATION,
        {
          userId: socket.user?.id,
          username: socket.user?.name,
          room: data.roomId,
          timestamp: Date.now(),
        },
        { senderId: socket.user?.id, roomId: data.roomId },
      );

      socket.to(data.roomId).emit('notification', notification);

      return {
        success: true,
        data: {
          room: data.roomId,
          members: result?.memberCount ?? 0,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`离开房间失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理发送消息请求
   * @param socket 客户端 Socket
   * @param data 消息数据
   * @returns 响应结果
   */
  @SubscribeMessage('send-message')
  @UseGuards(WebSocketAuthGuard)
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: SendMessageData,
  ): Promise<WebSocketResponse<{ messageId: string }>> {
    try {
      this.logger.log(`客户端 ${socket.id} 发送消息到房间: ${data.room}`);

      // 验证用户是否在房间中
      const isInRoom = await this.webSocketService.isSocketInRoom(socket.id, data.room);

      if (!isInRoom) {
        throw new WsException({
          code: 'NOT_IN_ROOM',
          message: '您不在该房间中',
        });
      }

      // 创建消息
      const message = this.webSocketService.createMessage(
        WebSocketMessageType.MESSAGE,
        {
          content: data.content,
          room: data.room,
          userId: socket.user?.id,
          username: socket.user?.name,
          timestamp: Date.now(),
          metadata: data.metadata,
        },
        { senderId: socket.user?.id, roomId: data.room },
      );

      // 发送消息到房间
      await this.webSocketService.sendMessageToRoom(data.room, message, socket.id);

      // 使用 Socket.IO 广播消息
      this.server.to(data.room).emit('message', message);

      return {
        success: true,
        data: {
          messageId: message.messageId!,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`发送消息失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理广播消息请求
   * @param socket 客户端 Socket
   * @param data 广播数据
   * @returns 响应结果
   */
  @SubscribeMessage('broadcast')
  @UseGuards(WebSocketAuthGuard)
  async handleBroadcast(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: BroadcastData,
  ): Promise<WebSocketResponse<{ recipients: number }>> {
    try {
      this.logger.log(`客户端 ${socket.id} 请求广播消息`);

      // 检查广播权限（可以根据用户角色等进行限制）
      if (!this.canBroadcast(socket)) {
        throw new WsException({
          code: 'BROADCAST_FORBIDDEN',
          message: '您没有广播权限',
        });
      }

      // 创建广播消息
      const message = this.webSocketService.createMessage(
        WebSocketMessageType.BROADCAST,
        {
          content: data.content,
          userId: socket.user?.id,
          username: socket.user?.name,
          timestamp: Date.now(),
          metadata: data.metadata,
        },
        { senderId: socket.user?.id },
      );

      // 广播消息
      const recipients = await this.webSocketService.broadcastMessage(message, data.excludeRooms);

      // 使用 Socket.IO 广播
      if (data.excludeRooms && data.excludeRooms.length > 0) {
        // 排除特定房间的广播
        const allSockets = await this.server.fetchSockets();
        const targetSockets = allSockets.filter((s) => {
          const rooms = Array.from(s.rooms);
          return !data.excludeRooms!.some((room) => rooms.includes(room));
        });

        targetSockets.forEach((s) => s.emit('broadcast', message));
      } else {
        // 全局广播
        this.server.emit('broadcast', message);
      }

      return {
        success: true,
        data: {
          recipients,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`广播消息失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理获取房间列表请求
   * @param socket 客户端 Socket
   * @returns 房间列表
   */
  @SubscribeMessage('get-rooms')
  @UseGuards(WebSocketAuthGuard)
  async handleGetRooms(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<WebSocketResponse<{ rooms: string[] }>> {
    try {
      const rooms = await this.webSocketService.getUserRooms(socket.id);

      return {
        success: true,
        data: {
          rooms,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`获取房间列表失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理获取连接状态请求
   * @param socket 客户端 Socket
   * @returns 连接状态
   */
  @SubscribeMessage('get-status')
  @UseGuards(WebSocketAuthGuard)
  async handleGetStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<WebSocketResponse<ConnectionStatus>> {
    try {
      const status = await this.webSocketService.getConnectionStatus(socket.id);

      return {
        success: true,
        data: status,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`获取连接状态失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 处理心跳请求
   * @param socket 客户端 Socket
   * @returns 心跳响应
   */
  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() _socket: AuthenticatedSocket,
  ): Promise<WebSocketResponse<{ timestamp: number }>> {
    return {
      success: true,
      data: {
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * 设置服务器中间件
   */
  private setupServerMiddleware(): void {
    // 连接速率限制
    if (this.server.engine) {
      this.server.engine.generateId = () => {
        return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      };
    }

    // 连接验证中间件
    this.server.use(async (socket, next) => {
      try {
        // 这里可以添加额外的连接验证逻辑
        // 例如：IP 白名单、连接数限制等

        next();
      } catch {
        next(new Error('连接验证失败'));
      }
    });
  }

  /**
   * 验证房间名称
   * @param roomName 房间名称
   * @returns 是否有效
   */
  private isValidRoomName(roomName: string): boolean {
    // 房间名称规则：1-50个字符，只允许字母、数字、下划线、连字符
    const roomNameRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    return roomNameRegex.test(roomName);
  }

  /**
   * 检查是否可以广播
   * @param socket 客户端 Socket
   * @returns 是否可以广播
   */
  private canBroadcast(socket: AuthenticatedSocket): boolean {
    // 这里可以根据用户角色、权限等进行判断
    // 例如：只有管理员可以广播
    const user = socket.user;

    if (!user) {
      return false;
    }

    // 示例：检查用户角色
    // return user.role === 'admin' || user.role === 'moderator';

    // 暂时允许所有认证用户广播
    return true;
  }
}
