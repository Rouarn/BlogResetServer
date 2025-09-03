/**
 * WebSocket 服务
 *
 * 功能说明:
 * - 管理 WebSocket 连接和房间
 * - 处理消息发送和广播
 * - 提供连接状态管理
 * - 实现房间成员管理
 *
 * 特点:
 * - 内存存储连接和房间信息
 * - 支持房间广播和私聊
 * - 提供连接健康检查
 * - 异常安全处理
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type {
  AuthenticatedSocket,
  ConnectionStatus,
  JoinRoomData,
  LeaveRoomData,
  MessageData,
  NotificationData,
  RoomInfo,
  RoomMember,
  WebSocketError,
  WebSocketMessage,
} from '../interfaces';
import { WebSocketMessageType } from '../interfaces';

/**
 * WebSocket 服务类
 *
 * 提供 WebSocket 连接管理、房间管理和消息处理功能
 */
@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  /** Socket.IO 服务器实例 */
  private server: Server;

  /** 活跃连接映射 (socketId -> socket) */
  private readonly connections = new Map<string, AuthenticatedSocket>();

  /** 用户连接映射 (userId -> socketId[]) */
  private readonly userConnections = new Map<string, Set<string>>();

  /** 房间信息映射 (roomId -> RoomInfo) */
  private readonly rooms = new Map<string, RoomInfo>();

  /** 房间成员映射 (roomId -> Set<socketId>) */
  private readonly roomMembers = new Map<string, Set<string>>();

  /** 连接状态映射 (socketId -> ConnectionStatus) */
  private readonly connectionStatus = new Map<string, ConnectionStatus>();

  /**
   * 添加连接
   * @param socket WebSocket 连接
   */
  addConnection(socket: AuthenticatedSocket): void {
    try {
      const socketId = socket.id;
      const userId = socket.userId;

      // 存储连接
      this.connections.set(socketId, socket);

      // 更新用户连接映射
      if (userId) {
        if (!this.userConnections.has(userId)) {
          this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId)!.add(socketId);
      }

      // 创建连接状态
      const status: ConnectionStatus = {
        connectionId: uuidv4(),
        userId,
        socketId,
        status: 'connected',
        connectedAt: new Date(),
        lastActiveAt: new Date(),
        clientInfo: {
          userAgent: socket.handshake.headers['user-agent'],
          ip: socket.handshake.address,
        },
      };
      this.connectionStatus.set(socketId, status);

      // 设置 socket 属性
      socket.connectedAt = new Date();
      socket.lastActiveAt = new Date();
      socket.rooms = new Set();

      this.logger.log(`连接已添加: ${socketId} (用户: ${userId ?? '匿名'})`);
    } catch (error) {
      this.logger.error(`添加连接失败: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * 移除连接
   * @param socket WebSocket 连接
   */
  async removeConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const socketId = socket.id;
      const userId = socket.userId;

      // 从所有房间中移除
      if (socket.rooms && socket.rooms.size > 0) {
        const roomIds = Array.from(socket.rooms);
        for (const roomId of roomIds) {
          await this.leaveRoomInternalById(socketId, roomId);
        }
      }

      // 移除连接
      this.connections.delete(socketId);

      // 更新用户连接映射
      if (userId && this.userConnections.has(userId)) {
        const userSockets = this.userConnections.get(userId)!;
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }

      // 更新连接状态
      const status = this.connectionStatus.get(socketId);
      if (status) {
        status.status = 'disconnected';
        // 保留状态一段时间用于统计
        setTimeout(() => {
          this.connectionStatus.delete(socketId);
        }, 60000); // 1分钟后清理
      }

      this.logger.log(`连接已移除: ${socketId} (用户: ${userId ?? '匿名'})`);
    } catch (error) {
      this.logger.error(`移除连接失败: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * 获取连接
   * @param socketId Socket ID
   * @returns WebSocket 连接
   */
  getConnection(socketId: string): AuthenticatedSocket | undefined {
    return this.connections.get(socketId);
  }

  /**
   * 获取用户的所有连接
   * @param userId 用户ID
   * @returns WebSocket 连接数组
   */
  getUserConnections(userId: string): AuthenticatedSocket[] {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) return [];

    const connections: AuthenticatedSocket[] = [];
    for (const socketId of socketIds) {
      const socket = this.connections.get(socketId);
      if (socket) {
        connections.push(socket);
      }
    }
    return connections;
  }

  /**
   * 加入房间
   * @param socketId Socket ID 或 WebSocket 连接
   * @param roomIdOrData 房间ID 或房间数据
   * @param metadata 元数据（可选）
   */
  async joinRoom(
    socketId: string | AuthenticatedSocket,
    roomIdOrData: string | JoinRoomData,
    _metadata?: Record<string, unknown>,
  ): Promise<{ memberCount: number } | void> {
    // 处理重载参数
    let socket: AuthenticatedSocket;
    let data: JoinRoomData;

    if (typeof socketId === 'string') {
      // 新的调用方式: joinRoom(socketId, roomId, metadata)
      const foundSocket = this.connections.get(socketId);
      if (!foundSocket) {
        throw new Error(`Socket ${socketId} not found`);
      }
      socket = foundSocket;
      data = {
        roomId: roomIdOrData as string,
        userId: socket.userId ?? socketId,
        userInfo: socket.user
          ? {
              name: socket.user.name,
              avatar: socket.user.avatar,
              role: socket.user.role,
            }
          : undefined,
      };
    } else {
      // 原有的调用方式: joinRoom(socket, data)
      socket = socketId;
      data = roomIdOrData as JoinRoomData;
    }

    return this.joinRoomInternal(socket, data);
  }

  /**
   * 内部加入房间方法
   * @param socket WebSocket 连接
   * @param data 房间数据
   */
  private async joinRoomInternal(
    socket: AuthenticatedSocket,
    data: JoinRoomData,
  ): Promise<{ memberCount: number }> {
    try {
      const { roomId, userId, userInfo } = data;
      const socketId = socket.id;

      // 验证参数
      if (!roomId || !userId) {
        throw new Error('房间ID和用户ID不能为空');
      }

      // 创建或获取房间
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          name: `房间-${roomId}`,
          type: 'public',
          creatorId: userId,
          members: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.rooms.set(roomId, room);
        this.roomMembers.set(roomId, new Set());
      }

      // 加入房间
      await socket.join(roomId);
      if (!socket.rooms) {
        socket.rooms = new Set();
      }
      socket.rooms.add(roomId);

      // 添加房间成员
      const roomMemberSet = this.roomMembers.get(roomId)!;
      roomMemberSet.add(socketId);

      // 更新房间成员信息
      const existingMember = room.members.find((m) => m.userId === userId);
      if (existingMember) {
        existingMember.isOnline = true;
        existingMember.socketId = socketId;
      } else {
        const member: RoomMember = {
          userId,
          userName: userInfo?.name ?? `用户-${userId}`,
          userAvatar: userInfo?.avatar,
          role: room.members.length === 0 ? 'owner' : 'member',
          joinedAt: new Date(),
          isOnline: true,
          socketId,
        };
        room.members.push(member);
      }

      room.updatedAt = new Date();

      // 通知房间其他成员
      const joinMessage = this.createMessage(
        WebSocketMessageType.NOTIFICATION,
        {
          title: '成员加入',
          content: `${userInfo?.name ?? userId} 加入了房间`,
          notificationType: 'info',
        } as NotificationData,
        { roomId, senderId: userId },
      );

      socket.to(roomId).emit('message', joinMessage);

      // 发送房间信息给新成员
      const roomInfoMessage = this.createMessage(WebSocketMessageType.JOIN_ROOM, room, { roomId });
      socket.emit('message', roomInfoMessage);

      this.logger.log(`用户 ${userId} 加入房间 ${roomId}`);

      return { memberCount: room.members.length };
    } catch (error) {
      this.logger.error(`加入房间失败: ${(error as Error).message}`, (error as Error).stack);
      const errorMessage = this.createErrorMessage('JOIN_ROOM_FAILED', (error as Error).message);
      socket.emit('error', errorMessage);
      throw error;
    }
  }

  /**
   * 离开房间
   * @param socketId Socket ID 或 WebSocket 连接
   * @param roomIdOrData 房间ID 或离开房间数据
   */
  async leaveRoom(
    socketId: string | AuthenticatedSocket,
    roomIdOrData: string | LeaveRoomData,
  ): Promise<{ memberCount: number } | void> {
    // 处理重载参数
    let socket: AuthenticatedSocket;
    let data: LeaveRoomData;

    if (typeof socketId === 'string') {
      // 新的调用方式: leaveRoom(socketId, roomId)
      const foundSocket = this.connections.get(socketId);
      if (!foundSocket) {
        throw new Error(`Socket ${socketId} not found`);
      }
      socket = foundSocket;
      data = {
        roomId: roomIdOrData as string,
        userId: socket.userId ?? socketId,
      };
    } else {
      // 原有的调用方式: leaveRoom(socket, data)
      socket = socketId;
      data = roomIdOrData as LeaveRoomData;
    }

    return this.leaveRoomInternal(socket, data);
  }

  /**
   * 内部离开房间方法
   * @param socket WebSocket 连接
   * @param data 离开房间数据
   */
  private async leaveRoomInternal(
    socket: AuthenticatedSocket,
    data: LeaveRoomData,
  ): Promise<{ memberCount: number }> {
    try {
      const { roomId, userId } = data;
      const socketId = socket.id;

      await this.leaveRoomInternalById(socketId, roomId);

      // 获取房间信息以返回成员数量
      const room = this.rooms.get(roomId);
      const memberCount = room ? room.members.length : 0;

      // 通知房间其他成员
      const leaveMessage = this.createMessage(
        WebSocketMessageType.NOTIFICATION,
        {
          title: '成员离开',
          content: `${userId} 离开了房间`,
          notificationType: 'info',
        } as NotificationData,
        { roomId, senderId: userId },
      );

      socket.to(roomId).emit('message', leaveMessage);

      this.logger.log(`用户 ${userId} 离开房间 ${roomId}`);

      return { memberCount };
    } catch (error) {
      this.logger.error(`离开房间失败: ${(error as Error).message}`, (error as Error).stack);
      const errorMessage = this.createErrorMessage('LEAVE_ROOM_FAILED', (error as Error).message);
      socket.emit('error', errorMessage);
      throw error;
    }
  }

  /**
   * 内部离开房间方法（通过ID）
   * @param socketId Socket ID
   * @param roomId 房间ID
   */
  private async leaveRoomInternalById(socketId: string, roomId: string): Promise<void> {
    const socket = this.connections.get(socketId);
    if (!socket) return;

    // 离开房间
    await socket.leave(roomId);
    if (socket.rooms) {
      socket.rooms.delete(roomId);
    }

    // 移除房间成员
    const roomMemberSet = this.roomMembers.get(roomId);
    if (roomMemberSet) {
      roomMemberSet.delete(socketId);

      // 更新房间成员状态
      const room = this.rooms.get(roomId);
      if (room) {
        const member = room.members.find((m) => m.socketId === socketId);
        if (member) {
          member.isOnline = false;
          member.socketId = undefined;
        }

        // 如果房间为空，清理房间
        if (roomMemberSet.size === 0) {
          this.rooms.delete(roomId);
          this.roomMembers.delete(roomId);
        }
      }
    }
  }

  /**
   * 发送消息
   * @param socket WebSocket 连接
   * @param data 消息数据
   */
  async sendMessage(socket: AuthenticatedSocket, data: MessageData): Promise<void> {
    try {
      const { content, messageType = 'text', roomId, targetUserId } = data;
      const senderId = socket.userId;

      if (!content) {
        throw new Error('消息内容不能为空');
      }

      const message = this.createMessage(
        WebSocketMessageType.MESSAGE,
        {
          ...data,
          messageType,
        },
        {
          senderId,
          roomId,
        },
      );

      if (roomId) {
        // 房间消息
        socket.to(roomId).emit('message', message);
        socket.emit('message', message); // 也发送给发送者确认
      } else if (targetUserId) {
        // 私聊消息
        const targetConnections = this.getUserConnections(targetUserId);
        for (const targetSocket of targetConnections) {
          targetSocket.emit('message', message);
        }
        socket.emit('message', message); // 发送给发送者确认
      } else {
        throw new Error('必须指定房间ID或目标用户ID');
      }

      this.logger.log(`消息已发送: ${senderId} -> ${roomId ?? targetUserId}`);
    } catch (error) {
      this.logger.error(`发送消息失败: ${(error as Error).message}`, (error as Error).stack);
      const errorMessage = this.createErrorMessage('SEND_MESSAGE_FAILED', (error as Error).message);
      socket.emit('error', errorMessage);
    }
  }

  /**
   * 广播通知
   * @param data 通知数据
   * @param roomId 房间ID（可选）
   */
  broadcastNotification(data: NotificationData, roomId?: string): void {
    try {
      const message = this.createMessage(WebSocketMessageType.NOTIFICATION, data, { roomId });

      if (roomId) {
        // 房间广播
        const roomMemberSet = this.roomMembers.get(roomId);
        if (roomMemberSet) {
          for (const socketId of roomMemberSet) {
            const socket = this.connections.get(socketId);
            if (socket) {
              socket.emit('message', message);
            }
          }
        }
      } else {
        // 全局广播
        for (const socket of this.connections.values()) {
          socket.emit('message', message);
        }
      }

      this.logger.log(`通知已广播: ${data.title} (房间: ${roomId ?? '全局'})`);
    } catch (error) {
      this.logger.error(`广播通知失败: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * 获取房间信息
   * @param roomId 房间ID
   * @returns 房间信息
   */
  getRoomInfo(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 获取房间列表
   * @returns 房间信息数组
   */
  getRoomList(): RoomInfo[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 获取连接统计信息
   * @returns 统计信息
   */
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    totalRooms: number;
    totalUsers: number;
  } {
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter((s) => s.userId)
        .length,
      totalRooms: this.rooms.size,
      totalUsers: this.userConnections.size,
    };
  }

  /**
   * 更新连接活跃时间
   * @param socketId Socket ID
   */
  updateLastActive(socketId: string): void {
    const socket = this.connections.get(socketId);
    const status = this.connectionStatus.get(socketId);

    if (socket) {
      socket.lastActiveAt = new Date();
    }

    if (status) {
      status.lastActiveAt = new Date();
    }
  }

  /**
   * 创建 WebSocket 消息
   * @param type 消息类型
   * @param data 消息数据
   * @param options 选项
   * @returns WebSocket 消息
   */
  createMessage<T>(
    type: WebSocketMessageType,
    data: T,
    options: {
      messageId?: string;
      senderId?: string;
      roomId?: string;
    } = {},
  ): WebSocketMessage<T> {
    return {
      type,
      data,
      timestamp: Date.now(),
      messageId: options.messageId ?? uuidv4(),
      senderId: options.senderId,
      roomId: options.roomId,
    };
  }

  /**
   * 创建错误消息
   * @param code 错误代码
   * @param message 错误消息
   * @param details 错误详情
   * @returns WebSocket 错误
   */
  private createErrorMessage(code: string, message: string, details?: unknown): WebSocketError {
    return {
      code,
      message,
      details,
      timestamp: Date.now(),
    };
  }

  /**
   * 设置 Socket.IO 服务器实例
   * @param server Socket.IO 服务器
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * 获取连接状态
   * @param socketId Socket ID
   * @returns 连接状态
   */
  async getConnectionStatus(socketId: string): Promise<ConnectionStatus | undefined> {
    return this.connectionStatus.get(socketId);
  }

  /**
   * 检查 Socket 是否在指定房间中
   * @param socketId Socket ID
   * @param roomId 房间ID
   * @returns 是否在房间中
   */
  async isSocketInRoom(socketId: string, roomId: string): Promise<boolean> {
    const roomMembers = this.roomMembers.get(roomId);
    return roomMembers ? roomMembers.has(socketId) : false;
  }

  /**
   * 向房间发送消息
   * @param roomId 房间ID
   * @param message 消息
   * @param excludeSocketId 排除的Socket ID
   */
  async sendMessageToRoom(
    roomId: string,
    message: WebSocketMessage<unknown>,
    excludeSocketId?: string,
  ): Promise<void> {
    if (this.server) {
      if (excludeSocketId) {
        this.server.to(roomId).except(excludeSocketId).emit('message', message);
      } else {
        this.server.to(roomId).emit('message', message);
      }
    }
  }

  /**
   * 广播消息
   * @param message 消息
   * @param excludeRooms 排除的房间列表
   * @returns 接收消息的用户数量
   */
  async broadcastMessage(
    message: WebSocketMessage<unknown>,
    excludeRooms?: string[],
  ): Promise<number> {
    let recipients = 0;
    if (this.server) {
      for (const [, socket] of this.connections) {
        let shouldSend = true;
        if (excludeRooms && socket.rooms && socket.rooms.size > 0) {
          shouldSend = !excludeRooms.some((room) => socket.rooms.has(room));
        }
        if (shouldSend) {
          socket.emit('message', message);
          recipients++;
        }
      }
    }
    return recipients;
  }

  /**
   * 获取用户所在的房间列表
   * @param socketId Socket ID
   * @returns 房间ID列表
   */
  async getUserRooms(socketId: string): Promise<string[]> {
    const socket = this.connections.get(socketId);
    return socket?.rooms ? Array.from(socket.rooms) : [];
  }

  /**
   * 获取公共房间列表
   * @returns 公共房间列表
   */
  async getPublicRooms(): Promise<string[]> {
    const publicRooms: string[] = [];

    // 添加默认公共房间
    publicRooms.push('lobby');

    // 从现有房间中筛选公共房间
    for (const [roomId, roomInfo] of this.rooms) {
      if (roomInfo.type === 'public' || roomId.startsWith('public_')) {
        publicRooms.push(roomId);
      }
    }

    // 添加一些预定义的公共房间
    const predefinedRooms = ['public_general', 'public_tech', 'public_random'];
    for (const room of predefinedRooms) {
      if (!publicRooms.includes(room)) {
        publicRooms.push(room);
      }
    }

    return publicRooms;
  }

  /**
   * 获取房间成员数量
   * @param roomId 房间ID
   * @returns 成员数量
   */
  async getRoomMemberCount(roomId: string): Promise<number> {
    if (!this.server) {
      return 0;
    }

    try {
      const room = this.server.sockets.adapter.rooms.get(roomId);
      return room ? room.size : 0;
    } catch (error) {
      this.logger.error(`获取房间 ${roomId} 成员数量失败: ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * 检查房间是否为公共房间
   * @param roomId 房间ID
   * @returns 是否为公共房间
   */
  isPublicRoom(roomId: string): boolean {
    return (
      roomId === 'lobby' ||
      roomId.startsWith('public_') ||
      (this.rooms.has(roomId) && this.rooms.get(roomId)?.type === 'public')
    );
  }
}
