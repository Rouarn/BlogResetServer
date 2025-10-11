# WebSocket 模块使用指南

本模块提供了完整的 WebSocket 功能实现，基于 Socket.IO 构建，支持实时双向通信。

## 📋 目录结构

```
websocket/
├── filters/
│   └── websocket-exception.filter.ts    # WebSocket 异常过滤器
├── guards/
│   ├── websocket-auth.guard.ts          # WebSocket 认证守卫
│   └── websocket-optional-auth.guard.ts # WebSocket 可选认证守卫
├── interceptors/
│   └── websocket.interceptor.ts         # WebSocket 拦截器
├── interfaces/
│   └── index.ts                         # 接口定义
├── services/
│   └── websocket.service.ts             # WebSocket 服务
├── websocket.gateway.ts                 # WebSocket 网关
├── websocket.module.ts                  # WebSocket 模块
└── index.ts                             # 模块导出
```

## 🚀 快速开始

### 服务器端配置

WebSocket 服务默认运行在 `ws://localhost:8848/ws` 端点（端口与主服务端口一致）。

#### 1. 模块导入

```typescript
import { WebSocketModule } from '@/shared/websocket';

@Module({
  imports: [
    WebSocketModule,
    // 其他模块...
  ],
})
export class AppModule {
}
```

#### 2. 环境配置

在 `.env` 文件中配置 WebSocket 相关参数：

```env
# CORS 配置（WebSocket 使用全局 CORS 配置）
NEST_CORS_ORIGINS=http://127.0.0.1:8848,http://localhost:9527

# 注意：
# - WebSocket 端口通常与主服务端口相同（NEST_PORT）
# - CORS 源使用全局的 NEST_CORS_ORIGINS 配置
# - 当前 WebSocket 路径硬编码为 /ws，如需动态配置请修改 websocket.gateway.ts
```

## 🔧 后端开发者指南

### 创建自定义事件处理器

```typescript
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/ws',
})
export class CustomGateway {
  @SubscribeMessage('custom-event')
  handleCustomEvent(client: Socket, payload: any) {
    // 处理自定义事件
    return {
      success: true,
      data: payload,
      timestamp: Date.now(),
    };
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    client.to(room).emit('user-joined', {
      userId: client.id,
      room,
    });
  }
}
```

### 使用 WebSocket 服务

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from './websocket.service';

@Injectable()
export class NotificationService {
  constructor(private readonly wsService: WebSocketService) {
  }

  // 向特定用户发送消息
  async sendToUser(userId: string, message: any) {
    this.wsService.sendToUser(userId, 'notification', message);
  }

  // 向房间广播消息
  async broadcastToRoom(room: string, message: any) {
    this.wsService.sendToRoom(room, 'broadcast', message);
  }

  // 全局广播
  async broadcastToAll(message: any) {
    this.wsService.broadcast('global-message', message);
  }
}
```

### 认证和授权

#### 使用认证守卫

```typescript
import { UseGuards } from '@nestjs/common';
import { WebSocketAuthGuard } from './guards/websocket-auth.guard';

@UseGuards(WebSocketAuthGuard)
@SubscribeMessage('protected-event')
handleProtectedEvent(client
:
Socket, payload
:
any
)
{
  // 只有认证用户才能访问
  const user = client.data.user;
  return { message: `Hello ${user.username}` };
}
```

#### 可选认证

```typescript
import { WebSocketOptionalAuthGuard } from './guards/websocket-optional-auth.guard';

@UseGuards(WebSocketOptionalAuthGuard)
@SubscribeMessage('optional-auth-event')
handleOptionalAuthEvent(client
:
Socket, payload
:
any
)
{
  const user = client.data.user; // 可能为 null
  if (user) {
    return { message: `Hello ${user.username}` };
  } else {
    return { message: 'Hello anonymous user' };
  }
}
```

### 异常处理

```typescript
import { WsException } from '@nestjs/websockets';

@SubscribeMessage('risky-operation')
handleRiskyOperation(client
:
Socket, payload
:
any
)
{
  try {
    // 执行可能失败的操作
    return { success: true };
  } catch (error) {
    throw new WsException({
      error: 'OPERATION_FAILED',
      message: '操作失败',
      details: error.message,
    });
  }
}
```

## 🌐 前端开发者指南

### 基础连接

#### 使用 Socket.IO 客户端

```html
<!-- 引入 Socket.IO 客户端 -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

```javascript
// 建立连接
const socket = io('ws://localhost:8848', {
  path: '/ws',
  transports: ['websocket', 'polling'],
});

// 连接事件
socket.on('connect', () => {
  console.log('连接成功:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('连接断开:', reason);
});

socket.on('connect_error', (error) => {
  console.error('连接错误:', error);
});
```

#### 使用认证 Token

WebSocket 认证支持多种方式传递 JWT Token：

**方式1：通过查询参数（推荐）**

```javascript
const socket = io('ws://localhost:8848', {
  path: '/ws',
  query: {
    token: 'your-jwt-token-here',
  },
});
```

**方式2：通过 Authorization Header**

```javascript
const socket = io('ws://localhost:8848', {
  path: '/ws',
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token-here',
  },
});
```

**方式3：通过自定义 Header**

```javascript
const socket = io('ws://localhost:8848', {
  path: '/ws',
  extraHeaders: {
    'x-auth-token': 'your-jwt-token-here',
  },
});
```

### 事件处理

#### 发送和接收消息

```javascript
// 发送消息
socket.emit('message', {
  content: 'Hello Server!',
  timestamp: Date.now(),
});

// 监听消息
socket.on('message', (data) => {
  console.log('收到消息:', data);
});

// 使用回调函数
socket.emit('ping', { timestamp: Date.now() }, (response) => {
  console.log('Ping 响应:', response);
});
```

#### 房间操作

```javascript
// 加入房间
socket.emit('join-room', 'chat-room-1');

// 离开房间
socket.emit('leave-room', 'chat-room-1');

// 监听房间消息
socket.on('room-message', (data) => {
  console.log('房间消息:', data);
});
```

### React 集成示例

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function WebSocketComponent() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt-token');
    const newSocket = io('ws://localhost:8848', {
      path: '/ws',
      query: token ? { token } : undefined,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('WebSocket 连接成功');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket 连接断开');
    });

    newSocket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (content) => {
    if (socket && connected) {
      socket.emit('message', {
        content,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div>
      <div>状态: {connected ? '已连接' : '未连接'}</div>
      <button onClick={() => sendMessage('Hello!')}>发送消息</button>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

### Vue 3 集成示例

```vue

<template>
  <div>
    <div>状态: {{ connected ? '已连接' : '未连接' }}</div>
    <button @click="sendMessage('Hello!')">发送消息</button>
    <div v-for="(msg, index) in messages" :key="index">
      {{ msg.content }}
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import io from 'socket.io-client';

  const socket = ref(null);
  const messages = ref([]);
  const connected = ref(false);

  onMounted(() => {
    const token = localStorage.getItem('jwt-token');
    socket.value = io('ws://localhost:8848', {
      path: '/ws',
      query: token ? { token } : undefined,
    });

    socket.value.on('connect', () => {
      connected.value = true;
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });

    socket.value.on('message', (message) => {
      messages.value.push(message);
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });

  const sendMessage = (content) => {
    if (socket.value && connected.value) {
      socket.value.emit('message', {
        content,
        timestamp: Date.now(),
      });
    }
  };
</script>
```

## 📡 可用事件

### 系统事件

| 事件名                | 描述     | 参数                      | 响应                                     |
|--------------------|--------|-------------------------|----------------------------------------|
| `ping`             | 心跳检测   | `{ timestamp: number }` | `{ success: true, timestamp: number }` |
| `join-room`        | 加入房间   | `{ room: string }`      | `{ success: true, room: string }`      |
| `leave-room`       | 离开房间   | `{ room: string }`      | `{ success: true, room: string }`      |
| `get-online-users` | 获取在线用户 | -                       | `{ users: User[] }`                    |
| `get-room-members` | 获取房间成员 | `{ room: string }`      | `{ members: User[] }`                  |

### 消息事件

| 事件名         | 描述   | 参数                                     | 响应                                     |
|-------------|------|----------------------------------------|----------------------------------------|
| `message`   | 发送消息 | `{ content: string, target?: string }` | `{ success: true, messageId: string }` |
| `broadcast` | 广播消息 | `{ content: string, room?: string }`   | `{ success: true }`                    |

## 🔒 安全考虑

### 1. 认证验证

```javascript
// 客户端发送 JWT Token（推荐方式）
const socket = io('ws://localhost:8848', {
  path: '/ws',
  query: {
    token: localStorage.getItem('jwt-token'),
  },
});

// 或者通过 Authorization Header
const socket = io('ws://localhost:8848', {
  path: '/ws',
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
  },
});
```

### 2. 速率限制

服务器端已实现基础的速率限制，防止消息洪水攻击。

### 3. 输入验证

所有客户端输入都会经过验证和清理，防止 XSS 攻击。

## 🐛 调试和测试

### 启用调试日志

```env
# 在 .env 文件中
DEBUG=socket.io*
LOG_LEVEL=debug
```

### 使用测试工具

项目根目录提供了测试文件：

- `test-websocket.html` - 浏览器测试页面
- `test-websocket.js` - Node.js 测试脚本

### 常见问题排查

1. **连接失败**
  - 检查端口是否正确 (默认 8848)
  - 确认 CORS 配置
  - 验证网络连接

2. **认证失败**
  - 检查 JWT Token 是否有效
  - 确认 Token 格式正确
  - 验证用户权限

3. **消息丢失**
  - 检查网络稳定性
  - 确认事件名称正确
  - 验证消息格式

## 📚 更多资源

- [Socket.IO 官方文档](https://socket.io/docs/)
- [NestJS WebSocket 文档](https://docs.nestjs.com/websockets/gateways)
- [JWT 认证指南](https://jwt.io/)

## 🤝 贡献

如果您发现问题或有改进建议，请提交 Issue 或 Pull Request。

---

**注意**: 本文档基于当前项目配置编写，实际使用时请根据具体需求调整配置参数。
