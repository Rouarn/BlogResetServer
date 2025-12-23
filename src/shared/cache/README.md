# 缓存模块 (Cache Module)

基于 Redis 的高性能缓存解决方案，支持原生 Redis 数据结构，提供统一的服务式 API 和安全禁用模式。

## 功能特性

- **完整 Redis 支持**：支持 String, Hash, List, Set, Sorted Set 等多种数据结构
- **安全禁用模式**：通过配置可完全禁用缓存服务（Noop 模式），不影响业务运行
- **统一接口**：通过 `ICacheService` 提供统一的操作方法
- **自动降级**：Redis 操作失败时自动返回安全默认值，防止服务崩溃
- **类型安全**：完整的 TypeScript 类型支持
- **统计与监控**：支持缓存命中率统计和健康检查

## 安装依赖

项目已包含所需依赖，如需手动安装：

```bash
pnpm add ioredis
```

## 配置说明

在 `.env` 文件中配置 Redis 相关参数（与 `src/config/configuration.ts` 映射一致）：

```env
# Redis 基础配置
NEST_REDIS_ENABLED=true      # 设置为 false 可完全禁用缓存
NEST_REDIS_HOST=localhost
NEST_REDIS_PORT=6379
NEST_REDIS_PASSWORD=
NEST_REDIS_DB=0

# 缓存配置
NEST_REDIS_DEFAULT_TTL=3600      # 默认过期时间（秒）
NEST_REDIS_KEY_PREFIX=nestjs:    # 键前缀
```

当 `NEST_REDIS_ENABLED=false` 时，系统将使用 `NoopCacheService`，所有缓存操作将直接返回空值或默认值（如 `null`, `0`, `false`, `[]`），不会产生任何错误，适用于无需缓存的测试环境或开发环境。

## 使用方法

### 服务注入方式

```typescript
import { Injectable } from '@nestjs/common';
import { ICacheService } from '@/shared/cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: ICacheService) {}

  async getUserById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    // 基础 String 操作
    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findById(id);
    if (user) await this.cacheService.set(cacheKey, user, { ttl: 3600 });
    return user;
  }
}
```

### 基础键值操作 (String)

```typescript
// 设置/获取
await cacheService.set('key', 'value', { ttl: 60 });
const val = await cacheService.get<string>('key');

// 批量操作
await cacheService.mset({ key1: 'val1', key2: 'val2' });
const values = await cacheService.mget(['key1', 'key2']);

// 删除
await cacheService.del('key');
```

### 哈希操作 (Hash)

```typescript
// 设置 Hash 字段
await cacheService.hset('user:1001', 'name', 'John');
await cacheService.hset('user:1001', 'age', 30);

// 获取 Hash 字段
const name = await cacheService.hget<string>('user:1001', 'name');

// 获取 Hash 所有字段
const user = await cacheService.hgetall('user:1001');

// 删除 Hash 字段
await cacheService.hdel('user:1001', 'age');
```

### 列表操作 (List)

```typescript
// 左推入/右推入
await cacheService.lpush('tasks', 'task1', 'task2');
await cacheService.rpush('tasks', 'task3');

// 获取列表范围
const tasks = await cacheService.lrange('tasks', 0, -1);

// 弹出元素
const task = await cacheService.lpop('tasks');
const len = await cacheService.llen('tasks');
```

### 集合操作 (Set)

```typescript
// 添加成员
await cacheService.sadd('tags', 'news', 'tech', 'nestjs');

// 获取所有成员
const tags = await cacheService.smembers('tags');

// 检查成员是否存在
const hasTag = await cacheService.sismember('tags', 'tech');

// 删除成员
await cacheService.srem('tags', 'news');
```

### 有序集合操作 (Sorted Set)

```typescript
// 添加成员（带分数）
await cacheService.zadd('rank', 100, 'player1');
await cacheService.zadd('rank', 90, 'player2');

// 获取排名（分数从低到高）
const topPlayers = await cacheService.zrange('rank', 0, -1);

// 获取分数
const score = await cacheService.zscore('rank', 'player1');

// 获取成员数量
const count = await cacheService.zcard('rank');
```

### 缓存键命名最佳实践

```typescript
// ✅ 推荐的命名格式
'module:entity:id'; // user:profile:123
'module:entity:action:params'; // user:search:john:page:1
'module:list:filter:value'; // product:list:category:electronics

// ✅ 使用有意义的前缀
await cacheService.set(`user:profile:${id}`, profile, { ttl: 3600 });
```

### 批量管理与工具

```typescript
// 批量删除
const keys = ['user:1', 'user:2'];
await cacheService.delMany(keys);

// 模式匹配查找键
const userKeys = await cacheService.keys('user:*');

// 检查是否存在
const exists = await cacheService.has('user:123');

// 过期时间管理
await cacheService.expire('user:123', 7200);
const ttl = await cacheService.ttl('user:123');
```

## 📊 监控和统计

```typescript
const stats = await this.cacheService.getStats();
console.log('缓存统计:', {
  hits: stats.hits, // 命中次数
  misses: stats.misses, // 未命中次数
  keys: stats.keys, // 键总数
});

// 健康检查
const isHealthy = await this.cacheService.isHealthy();
```

## 📝 更新日志

### v2.1.0

- ✨ 新增对 Hash, List, Set, Sorted Set 原生数据结构的支持
- 🐛 修复禁用 Redis 时的系统崩溃问题，引入 `NoopCacheService`
- 📝 更新文档，移除过时的内存缓存描述

### v2.0.0

- 移除装饰器与拦截器用法，统一改用 `ICacheService` 手动 API
- 统一环境变量配置
- 完整的 TypeScript 类型支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进缓存模块！

## 📄 许可证

本项目采用 MIT 许可证。
