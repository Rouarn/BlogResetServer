# 缓存模块 (Cache Module)

基于 Redis 和内存缓存的高性能缓存解决方案，支持自动降级与统一的服务式 API。

## 功能特性

- 双重缓存策略：Redis 主缓存 + 内存缓存备用
- 自动降级：Redis 不可用时自动切换到内存缓存
- 统一接口：通过 `ICacheService` 提供 `get/set/keys/del/delMany/expire/ttl` 等方法
- 动态键前缀与默认 TTL：通过环境变量配置
- 类型安全：完整的 TypeScript 类型支持
- 统计与健康检查：命中率、键数量、健康状态

## 安装依赖

项目已包含所需依赖，如需手动安装：

```bash
pnpm add ioredis
```

## 配置说明

在 `.env` 文件中配置 Redis 相关参数（与 `src/config/configuration.ts` 映射一致）：

```env
# Redis 基础配置
NEST_REDIS_ENABLED=true
NEST_REDIS_HOST=localhost
NEST_REDIS_PORT=6379
NEST_REDIS_PASSWORD=
NEST_REDIS_DB=0

# 缓存配置
NEST_REDIS_DEFAULT_TTL=3600      # 默认过期时间（秒）
NEST_REDIS_KEY_PREFIX=nestjs:    # 键前缀
NEST_REDIS_MAX_SIZE=1000         # 内存缓存最大条目数（回退使用）
```

当 `NEST_REDIS_ENABLED=false` 时，系统将自动使用内存缓存。

## 使用方法

### 服务注入方式

````typescript
```typescript
import { Injectable } from '@nestjs/common';
import { ICacheService } from '@/shared/cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: ICacheService) {}

  async getUserById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) return cached;
    const user = await this.userRepository.findById(id);
    if (user) await this.cacheService.set(cacheKey, user, { ttl: 3600 });
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, data);
    await this.cacheService.del(`user:${id}`);
    const listKeys = await this.cacheService.keys('user:list:*');
    if (listKeys.length > 0) await this.cacheService.delMany(listKeys);
    return user;
  }
}
````

### 缓存键命名最佳实践

```typescript
// ✅ 推荐的命名格式
'module:entity:id'; // user:profile:123
'module:entity:action:params'; // user:search:john:page:1
'module:list:filter:value'; // product:list:category:electronics

// ✅ 使用有意义的前缀（手动示例）
await cacheService.set(`user:profile:${id}`, profile, { ttl: 3600 });
await cacheService.set(`product:details:${id}`, details, { ttl: 7200 });
await cacheService.set(`order:summary:${orderId}:${userId}`, summary, { ttl: 1800 });

// ❌ 避免的命名方式
await cacheService.set(String(id), data, { ttl: 3600 }); // 太简单，容易冲突
await cacheService.set(`cache_${id}_data`, data, { ttl: 3600 }); // 无意义的前缀
```

### 4. 批量操作

```typescript
// 批量删除缓存
const keys = ['user:1', 'user:2', 'user:3'];
const deletedCount = await this.cacheService.delMany(keys);

// 模式匹配查找键
const userKeys = await this.cacheService.keys('user:*');

// 检查缓存是否存在
const exists = await this.cacheService.has('user:123');

// 设置过期时间
await this.cacheService.expire('user:123', 7200);

// 获取剩余过期时间
const ttl = await this.cacheService.ttl('user:123');
```

## 📊 监控和统计

### 缓存统计信息

```typescript
const stats = await this.cacheService.getStats();
console.log('缓存统计:', {
  hits: stats.hits, // 命中次数
  misses: stats.misses, // 未命中次数
  keys: stats.keys, // 键总数
  memoryUsage: stats.memoryUsage, // 内存使用量
});

// 计算命中率
const hitRate = (stats.hits / (stats.hits + stats.misses)) * 100;
console.log(`缓存命中率: ${hitRate.toFixed(2)}%`);
```

### 健康检查

```typescript
const isHealthy = await this.cacheService.isHealthy();
console.log(`缓存服务状态: ${isHealthy ? '健康' : '异常'}`);
```

### 重置统计

```typescript
await this.cacheService.resetStats();
```

## 🔧 高级配置

### 自定义缓存前缀

```typescript
// 使用自定义前缀
await this.cacheService.set('key', 'value', {
  prefix: 'custom:',
});
```

### 缓存工厂服务

```typescript
import { CacheFactoryService } from '@/shared/cache';

@Injectable()
export class MyService {
  constructor(private readonly cacheFactory: CacheFactoryService) {}

  async checkCacheType(): Promise<void> {
    const type = this.cacheFactory.getCurrentCacheType();
    console.log(`当前缓存类型: ${type}`);

    const config = this.cacheFactory.getCacheConfig();
    console.log('缓存配置:', config);

    const health = await this.cacheFactory.getHealthStatus();
    console.log('健康状态:', health);
  }
}
```

## 🚨 错误处理

缓存模块具有完善的错误处理机制：

1. **Redis 连接失败**: 自动降级到内存缓存
2. **缓存操作异常**: 不影响业务逻辑，记录错误日志
3. **内存缓存溢出**: LRU 淘汰策略，自动清理过期项

```typescript
try {
  const result = await this.cacheService.get('key');
} catch (error) {
  // 缓存异常不应影响业务逻辑
  console.error('缓存操作失败:', error.message);
  // 继续执行业务逻辑
}
```

## 🎨 最佳实践

### 1. 缓存键命名规范

```typescript
'module:entity:id'; // user:profile:123
'module:entity:action:params'; // user:search:john:page:1
'module:list:filter:value'; // product:list:category:electronics
// 避免过于简单或无意义的前缀
// 例如：'${id}'、'cache_${id}_data' 等
```

### 合理设置 TTL

```typescript
// 根据数据特性设置不同的过期时间
const TTL = {
  USER_PROFILE: 3600, // 用户资料：1小时
  PRODUCT_LIST: 1800, // 商品列表：30分钟
  CONFIG_DATA: 86400, // 配置数据：24小时
  TEMP_DATA: 300, // 临时数据：5分钟
};
```

### 缓存更新策略

```typescript
async updateUserWithCache(id: string, data: UpdateUserDto): Promise<User> {
  const user = await this.userRepository.update(id, data);
  await this.cacheService.set(`user:${id}`, user, { ttl: 3600 });
  return user;
}
```

### 批量操作优化

```typescript
// 批量获取时的缓存策略
async getUsersByIds(ids: string[]): Promise<User[]> {
  const users: User[] = [];
  const missedIds: string[] = [];

  // 先从缓存获取
  for (const id of ids) {
    const cached = await this.cacheService.get<User>(`user:${id}`);
    if (cached) {
      users.push(cached);
    } else {
      missedIds.push(id);
    }
  }

  // 批量查询未命中的数据
  if (missedIds.length > 0) {
    const dbUsers = await this.userRepository.findByIds(missedIds);

    // 批量写入缓存
    for (const user of dbUsers) {
      await this.cacheService.set(`user:${user.id}`, user, { ttl: 3600 });
    }

    users.push(...dbUsers);
  }

  return users;
}
```

## 🔍 故障排查

### 常见问题

1. **Redis 连接失败**

   ```bash
   # 检查 Redis 服务状态
   redis-cli ping

   # 检查网络连接
   telnet localhost 6379
   ```

2. **缓存未生效**

- 检查是否启用了 Redis（或回退到内存缓存）
- 验证缓存键是否与请求参数一致
- 检查键前缀是否与环境变量配置一致

3. **内存使用过高**

- 调整 `NEST_REDIS_MAX_SIZE` 参数
- 检查缓存过期时间设置
- 监控缓存命中率

### 调试模式

```typescript
// 启用详细日志
const logger = new Logger('CacheDebug');
logger.debug('Cache operation details...');
```

## 📝 更新日志

### v2.0.0

- 移除装饰器与拦截器用法，统一改用 `ICacheService` 手动 API
- 保留 Redis/内存双引擎与自动降级
- 统一环境变量：`NEST_REDIS_ENABLED/HOST/PORT/PASSWORD/DB/DEFAULT_TTL/KEY_PREFIX/MAX_SIZE`

### v1.0.0

- ✅ 初始版本发布
- ✅ Redis 和内存缓存支持
- ✅ 自动降级机制
- ✅ 统计和监控功能
- ✅ 完整的 TypeScript 类型支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进缓存模块！

## 📄 许可证

本项目采用 MIT 许可证。
