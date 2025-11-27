/**
 * WebSocket 模块统一导出
 *
 * 功能说明:
 * - 统一导出所有 WebSocket 相关组件
 * - 提供便捷的导入方式
 * - 支持按需导入和批量导入
 * - 维护清晰的模块接口
 *
 * 使用示例:
 * ```typescript
 * // 导入整个模块
 * import { WebSocketModule } from '@/shared/websocket';
 *
 * // 导入服务和网关
 * import { WebSocketService, WebSocketGateway } from '@/shared/websocket';
 *
 * // 导入类型定义
 * import type { WebSocketMessage, AuthenticatedSocket } from '@/shared/websocket';
 * ```
 *
 * @author NestJS Template
 * @version 1.0.0
 */

// =============================================================================
// 核心模块和组件
// =============================================================================

/** WebSocket 模块 */
export { WebSocketModule } from './websocket.module';

/** WebSocket 网关 */
export { WebSocketGateway } from './websocket.gateway';

// =============================================================================
// 服务层
// =============================================================================

/** WebSocket 服务 */
export { WebSocketService } from './services/websocket.service';

// =============================================================================
// 守卫、过滤器和拦截器
// =============================================================================

/** WebSocket 认证守卫 */
export { WebSocketAuthGuard } from './guards/websocket-auth.guard';
export { WebSocketOptionalAuthGuard } from './guards/websocket-optional-auth.guard';

/** WebSocket 异常过滤器 */
export { WebSocketExceptionFilter } from './filters/websocket-exception.filter';

/** WebSocket 拦截器 */
export { WebSocketInterceptor } from './interceptors/websocket.interceptor';

// =============================================================================
// 类型定义和接口
// =============================================================================

/** 导出所有接口和类型定义 */
export type {
  // 基础类型
  WebSocketMessage,
  WebSocketResponse,
  WebSocketError,
  AuthenticatedSocket,

  // 房间管理
  JoinRoomData,
  LeaveRoomData,
  RoomInfo,
  RoomMember,

  // 消息相关
  SendMessageData,
  MessageData,
  NotificationData,
  BroadcastData,

  // 连接状态
  ConnectionStatus,
  ConnectionInfo,

  // 事件处理
  WebSocketEventHandler,
  WebSocketEventMap,

  // 配置
  WebSocketConfig,
  RoomConfig,
} from './interfaces';

// =============================================================================
// 常量和枚举
// =============================================================================

/** 导出常量（如果有的话） */
// export { WS_CONSTANTS } from './constants';

// =============================================================================
// 默认导出
// =============================================================================

/** 默认导出 WebSocket 模块 */
export { WebSocketModule as default } from './websocket.module';

// =============================================================================
// 模块信息
// =============================================================================

/** 模块版本信息 */
export const WEBSOCKET_MODULE_VERSION = '1.0.0';

/** 模块描述 */
export const WEBSOCKET_MODULE_DESCRIPTION = 'NestJS WebSocket 模块 - 提供实时通信功能';

/** 支持的功能列表 */
export const WEBSOCKET_FEATURES = [
  '实时双向通信',
  '房间管理和广播',
  'JWT 身份验证',
  '异常处理和恢复',
  '请求/响应拦截',
  '连接状态管理',
  '性能监控和日志',
] as const;

/** 模块配置选项 */
export interface WebSocketModuleOptions {
  /** 是否启用认证 */
  enableAuth?: boolean;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 是否启用性能监控 */
  enableMetrics?: boolean;
  /** 自定义 CORS 配置 */
  corsOptions?: {
    origin?: string | string[];
    credentials?: boolean;
  };
  /** 连接限制 */
  connectionLimits?: {
    maxConnections?: number;
    maxRoomsPerUser?: number;
  };
}
