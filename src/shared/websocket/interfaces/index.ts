/**
 * WebSocket 模块接口和类型定义
 *
 * 功能说明:
 * - 定义 WebSocket 消息类型和结构
 * - 提供连接状态和房间管理接口
 * - 统一 WebSocket 相关的类型定义
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import type { Socket } from 'socket.io';

/**
 * WebSocket 消息类型枚举
 */
export enum WebSocketMessageType {
  /** 连接成功 */
  CONNECTION = 'connection',
  /** 断开连接 */
  DISCONNECT = 'disconnect',
  /** 加入房间 */
  JOIN_ROOM = 'join_room',
  /** 离开房间 */
  LEAVE_ROOM = 'leave_room',
  /** 发送消息 */
  MESSAGE = 'message',
  /** 广播消息 */
  BROADCAST = 'broadcast',
  /** 系统通知 */
  NOTIFICATION = 'notification',
  /** 错误消息 */
  ERROR = 'error',
  /** 心跳检测 */
  PING = 'ping',
  /** 心跳响应 */
  PONG = 'pong',
}

/**
 * WebSocket 消息基础结构
 */
export interface WebSocketMessage<T = unknown> {
  /** 消息类型 */
  type: WebSocketMessageType;
  /** 消息数据 */
  data: T;
  /** 时间戳 */
  timestamp: number;
  /** 消息ID */
  messageId?: string;
  /** 发送者ID */
  senderId?: string;
  /** 房间ID */
  roomId?: string;
}

/**
 * 房间加入请求数据
 */
export interface JoinRoomData {
  /** 房间ID */
  roomId: string;
  /** 用户ID */
  userId: string;
  /** 用户信息 */
  userInfo?: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

/**
 * 房间离开请求数据
 */
export interface LeaveRoomData {
  /** 房间ID */
  roomId: string;
  /** 用户ID */
  userId: string;
}

/**
 * 消息发送数据
 */
export interface MessageData {
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  messageType?: 'text' | 'image' | 'file' | 'system';
  /** 目标房间ID */
  roomId?: string;
  /** 目标用户ID */
  targetUserId?: string;
  /** 附加数据 */
  metadata?: Record<string, unknown>;
}

/**
 * WebSocket 发送消息数据接口
 */
export interface SendMessageData {
  /** 消息内容 */
  content: string;
  /** 房间ID */
  room: string;
  /** 消息类型 */
  messageType?: 'text' | 'image' | 'file' | 'system';
  /** 元数据 */
  metadata?: Record<string, unknown>;
  /** 目标用户ID */
  targetUserId?: string;
}

/**
 * WebSocket 广播数据接口
 */
export interface BroadcastData {
  /** 消息内容 */
  content: string;
  /** 房间ID */
  room: string;
  /** 排除的房间列表 */
  excludeRooms?: string[];
  /** 消息类型 */
  messageType?: 'text' | 'image' | 'file' | 'system';
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 系统通知数据
 */
export interface NotificationData {
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  content: string;
  /** 通知类型 */
  notificationType: 'info' | 'warning' | 'error' | 'success';
  /** 是否需要确认 */
  requireConfirm?: boolean;
  /** 附加数据 */
  metadata?: Record<string, unknown>;
}

/**
 * WebSocket 错误信息
 */
export interface WebSocketError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 扩展的 Socket 接口，包含用户信息
 */
export interface AuthenticatedSocket extends Socket {
  /** 用户ID */
  userId?: string;
  /** 是否已认证 */
  isAuthenticated?: boolean;
  /** 用户信息 */
  user?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatar?: string;
  };
  /** 用户所在房间 */
  rooms: Set<string>;
  /** 连接时间 */
  connectedAt?: Date;
  /** 最后活跃时间 */
  lastActiveAt?: Date;
}

/**
 * 房间信息接口
 */
export interface RoomInfo {
  /** 房间ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 房间描述 */
  description?: string;
  /** 房间类型 */
  type: 'public' | 'private' | 'system';
  /** 房间创建者ID */
  creatorId: string;
  /** 房间成员列表 */
  members: RoomMember[];
  /** 房间创建时间 */
  createdAt: Date;
  /** 房间更新时间 */
  updatedAt: Date;
  /** 房间配置 */
  config?: {
    maxMembers?: number;
    allowAnonymous?: boolean;
    requireAuth?: boolean;
    [key: string]: unknown;
  };
}

/**
 * 房间成员信息
 */
export interface RoomMember {
  /** 用户ID */
  userId: string;
  /** 用户名称 */
  userName: string;
  /** 用户头像 */
  userAvatar?: string;
  /** 用户角色 */
  role: 'owner' | 'admin' | 'member';
  /** 加入时间 */
  joinedAt: Date;
  /** 是否在线 */
  isOnline: boolean;
  /** Socket ID */
  socketId?: string;
}

/**
 * WebSocket 连接状态
 */
export interface ConnectionStatus {
  /** 连接ID */
  connectionId: string;
  /** 用户ID */
  userId?: string;
  /** Socket ID */
  socketId: string;
  /** 连接状态 */
  status: 'connected' | 'disconnected' | 'reconnecting';
  /** 连接时间 */
  connectedAt: Date;
  /** 最后活跃时间 */
  lastActiveAt: Date;
  /** 客户端信息 */
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    platform?: string;
  };
}

/**
 * WebSocket 事件处理器接口
 */
export interface WebSocketEventHandler {
  /** 处理连接事件 */
  handleConnection(socket: AuthenticatedSocket): Promise<void>;
  /** 处理断开连接事件 */
  handleDisconnect(socket: AuthenticatedSocket): Promise<void>;
  /** 处理消息事件 */
  handleMessage(socket: AuthenticatedSocket, data: MessageData): Promise<void>;
  /** 处理加入房间事件 */
  handleJoinRoom(socket: AuthenticatedSocket, data: JoinRoomData): Promise<void>;
  /** 处理离开房间事件 */
  handleLeaveRoom(socket: AuthenticatedSocket, data: LeaveRoomData): Promise<void>;
}

/**
 * WebSocket 响应接口
 */
export interface WebSocketResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: WebSocketError;
  /** 时间戳 */
  timestamp: number;
  /** 请求ID */
  requestId?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 连接信息接口
 */
export interface ConnectionInfo {
  /** 连接ID */
  connectionId: string;
  /** 用户ID */
  userId?: string;
  /** Socket ID */
  socketId: string;
  /** 连接时间 */
  connectedAt: Date;
  /** 客户端信息 */
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    platform?: string;
  };
}

/**
 * WebSocket 事件映射接口
 */
export interface WebSocketEventMap {
  /** 连接事件 */
  connection: (socket: AuthenticatedSocket) => void;
  /** 断开连接事件 */
  disconnect: (socket: AuthenticatedSocket) => void;
  /** 消息事件 */
  message: (socket: AuthenticatedSocket, data: MessageData) => void;
  /** 加入房间事件 */
  joinRoom: (socket: AuthenticatedSocket, data: JoinRoomData) => void;
  /** 离开房间事件 */
  leaveRoom: (socket: AuthenticatedSocket, data: LeaveRoomData) => void;
}

/**
 * 房间配置接口
 */
export interface RoomConfig {
  /** 最大成员数 */
  maxMembers?: number;
  /** 是否允许匿名用户 */
  allowAnonymous?: boolean;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 是否为私有房间 */
  isPrivate?: boolean;
  /** 房间密码 */
  password?: string;
  /** 自定义配置 */
  [key: string]: unknown;
}

/**
 * WebSocket 配置接口
 */
export interface WebSocketConfig {
  /** 端口号 */
  port?: number;
  /** 命名空间 */
  namespace?: string;
  /** CORS 配置 */
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean;
  };
  /** 连接超时时间 (毫秒) */
  connectionTimeout?: number;
  /** 心跳间隔 (毫秒) */
  pingInterval?: number;
  /** 心跳超时时间 (毫秒) */
  pingTimeout?: number;
  /** 最大连接数 */
  maxConnections?: number;
  /** 是否启用压缩 */
  compression?: boolean;
  /** 传输方式 */
  transports?: ('polling' | 'websocket')[];
}
