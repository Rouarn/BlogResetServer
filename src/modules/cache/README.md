# 缓存模块 (Cache Module)

基于 Redis 和内存缓存的高性能缓存解决方案，支持自动降级和装饰器语法。

## 🚀 功能特性

- **双重缓存策略**: Redis 主缓存 + 内存缓存备用
- **自动降级**: Redis 不可用时自动切换到内存缓存
- **装饰器支持**: `@Cache` 和 `@CacheEvict` 装饰器
- **类型安全**: 完全的 TypeScript 类型支持
- **统计监控**: 缓存命中率、内存使用等统计信息
- **健康检查**: 缓存服务健康状态监控
- **灵活配置**: 支持环境变量和动态配置

## 📦 安装依赖

项目已包含所需依赖，如需手动安装：

```bash
npm install ioredis
# 或
pnpm add ioredis
```

## ⚙️ 配置说明

### 环境变量配置

在 `.env` 文件中配置 Redis 相关参数：

```env
# Redis 缓存配置
NEST_REDIS_ENABLED=true                    # 是否启用 Redis
NEST_REDIS_HOST=localhost                  # Redis 主机地址
NEST_REDIS_PORT=6379                       # Redis 端口
NEST_REDIS_PASSWORD=                       # Redis 密码（可选）
NEST_REDIS_DB=0                           # Redis 数据库索引

# 连接选项
NEST_REDIS_LAZY_CONNECT=true              # 延迟连接
NEST_REDIS_RETRY_DELAY_ON_FAILOVER=100    # 故障转移重试延迟
NEST_REDIS_MAX_RETRIES_PER_REQUEST=3      # 最大重试次数

# 缓存选项
NEST_REDIS_CACHE_DEFAULT_TTL=3600         # 默认过期时间（秒）
NEST_REDIS_CACHE_KEY_PREFIX=nestjs:       # 缓存键前缀
NEST_REDIS_CACHE_MAX_SIZE=1000            # 内存缓存最大条目数
```

### 禁用 Redis

当 `NEST_REDIS_ENABLED=false` 时，系统将自动使用内存缓存：

```env
NEST_REDIS_ENABLED=false
```

## 🎯 使用方法

### 1. 装饰器方式（推荐）

#### @Cache 装饰器

```typescript
import { Injectable } from '@nestjs/common';
import { Cache } from '@/modules/cache';

@Injectable()
export class UserService {
  // 基础缓存：使用用户ID作为缓存键，缓存1小时
  @Cache({ key: 'user:${0}', ttl: 3600 })
  async getUserById(id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }

  // 参数缓存：自动使用所有参数生成缓存键
  @Cache({ useArgs: true, ttl: 1800 })
  async searchUsers(query: string, page: number): Promise<User[]> {
    return await this.userRepository.search(query, page);
  }

  // 条件缓存：只有满足条件时才缓存
  @Cache({
    key: 'user:profile:${0}',
    ttl: 7200,
    condition: (id: string) => !!id && id.length > 0
  })
  async getUserProfile(id: string): Promise<UserProfile> {
    return await this.userRepository.getProfile(id);
  }
}
```

#### @CacheEvict 装饰器

```typescript
@Injectable()
export class UserService {
  // 清除单个缓存
  @CacheEvict({ key: 'user:${0}' })
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return await this.userRepository.update(id, data);
  }

  // 清除多个缓存
  @CacheEvict({ keys: ['user:${0}', 'user:profile:${0}'] })
  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  // 清除所有缓存
  @CacheEvict({ allEntries: true })
  async resetAllUsers(): Promise<void> {
    await this.userRepository.truncate();
  }
}
```

### 2. 服务注入方式

```typescript
import { Injectable } from '@nestjs/common';
import { ICacheService } from '@/modules/cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: ICacheService) {}

  async getUserById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    
    // 尝试从缓存获取
    let user = await this.cacheService.get<User>(cacheKey);
    
    if (!user) {
      // 缓存未命中，从数据库查询
      user = await this.userRepository.findById(id);
      
      if (user) {
        // 存储到缓存，过期时间1小时
        await this.cacheService.set(cacheKey, user, { ttl: 3600 });
      }
    }
    
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, data);
    
    // 更新后清除相关缓存
    await this.cacheService.del(`user:${id}`);
    await this.cacheService.del(`user:profile:${id}`);
    
    return user;
  }
}
```

### 3. 批量操作

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
  hits: stats.hits,           // 命中次数
  misses: stats.misses,       // 未命中次数
  keys: stats.keys,           // 键总数
  memoryUsage: stats.memoryUsage, // 内存使用量
});

// 计算命中率
const hitRate = stats.hits / (stats.hits + stats.misses) * 100;
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
  prefix: 'custom:' 
});
```

### 缓存工厂服务

```typescript
import { CacheFactoryService } from '@/modules/cache';

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
// 推荐的键命名格式
'module:entity:id'          // user:profile:123
'module:entity:action:args' // user:search:john:page1
'module:list:filter'        // product:list:category:electronics
```

### 2. 合理设置 TTL

```typescript
// 根据数据特性设置不同的过期时间
const TTL = {
  USER_PROFILE: 3600,      // 用户资料：1小时
  PRODUCT_LIST: 1800,      // 商品列表：30分钟
  CONFIG_DATA: 86400,      // 配置数据：24小时
  TEMP_DATA: 300,          // 临时数据：5分钟
};
```

### 3. 缓存更新策略

```typescript
// 写入时更新缓存（Write-Through）
@CacheEvict({ key: 'user:${0}' })
async updateUser(id: string, data: UpdateUserDto): Promise<User> {
  const user = await this.userRepository.update(id, data);
  // 缓存会被自动清除，下次访问时重新加载
  return user;
}

// 写入后更新缓存（Write-Behind）
async updateUserWithCache(id: string, data: UpdateUserDto): Promise<User> {
  const user = await this.userRepository.update(id, data);
  // 主动更新缓存
  await this.cacheService.set(`user:${id}`, user, { ttl: 3600 });
  return user;
}
```

### 4. 批量操作优化

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
   - 检查装饰器是否正确应用
   - 确认 CacheInterceptor 已全局注册
   - 验证缓存键是否正确生成

3. **内存使用过高**
   - 调整 `NEST_REDIS_CACHE_MAX_SIZE` 参数
   - 检查缓存过期时间设置
   - 监控缓存命中率

### 调试模式

```typescript
// 启用详细日志
const logger = new Logger('CacheDebug');
logger.debug('Cache operation details...');
```

## 📝 更新日志

### v1.0.0
- ✅ 初始版本发布
- ✅ Redis 和内存缓存支持
- ✅ 装饰器语法支持
- ✅ 自动降级机制
- ✅ 统计和监控功能
- ✅ 完整的 TypeScript 类型支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进缓存模块！

## 📄 许可证

本项目采用 MIT 许可证。