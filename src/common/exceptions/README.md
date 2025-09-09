# 异常处理模块

本模块提供了完整的异常处理体系，用于统一管理应用程序中的各种异常情况。

## 📋 目录结构

```
src/common/exceptions/
├── index.ts                 # 模块导出文件
├── business.exception.ts    # 业务异常类
├── common.exception.ts      # 通用异常类
└── README.md               # 使用说明文档
```

## 🏗️ 异常类层次结构

```
HttpException (NestJS)
├── AppException (抽象基类)
│   ├── BusinessException (业务异常)
│   ├── SystemException (系统异常)
│   ├── ExternalServiceException (外部服务异常)
│   ├── ConfigurationException (配置异常)
│   ├── DatabaseException (数据库异常)
│   ├── FileOperationException (文件操作异常)
│   └── NetworkException (网络异常)
```

## 🎯 异常类型说明

### 1. BusinessException - 业务异常

用于处理业务逻辑相关的错误，如用户输入验证失败、业务规则违反等。

**特点：**
- 用户友好的错误信息
- 支持错误分类标识
- 可配置日志级别
- 支持上下文信息

**使用场景：**
- 用户输入验证失败
- 业务规则检查不通过
- 资源状态不符合操作要求
- 权限验证失败

### 2. SystemException - 系统异常

用于处理系统级别的错误，通常需要系统管理员介入。

**使用场景：**
- 数据库连接失败
- 内存不足
- 系统服务不可用
- 关键配置缺失

### 3. ExternalServiceException - 外部服务异常

用于处理调用外部服务时发生的错误。

**使用场景：**
- 第三方 API 调用失败
- 外部服务超时
- 外部服务返回错误状态

### 4. 其他异常类型

- **ConfigurationException**: 配置相关错误
- **DatabaseException**: 数据库操作错误
- **FileOperationException**: 文件操作错误
- **NetworkException**: 网络连接错误

## 🚀 使用指南

### 基础用法

```typescript
import { BusinessException, LogLevel } from '@/common/exceptions';

// 简单业务异常
throw new BusinessException('用户不存在');

// 指定状态码
throw new BusinessException('数据验证失败', HttpStatus.UNPROCESSABLE_ENTITY);

// 附加上下文信息
throw new BusinessException(
  '操作失败',
  HttpStatus.BAD_REQUEST,
  {
    userId: '12345',
    operation: 'updateProfile',
    timestamp: Date.now()
  },
  LogLevel.WARNING
);
```

### 使用工厂方法

```typescript
import { BusinessExceptionFactory, ExceptionFactory } from '@/common/exceptions';

// 业务异常工厂
throw BusinessExceptionFactory.notFound('用户');
throw BusinessExceptionFactory.validation('邮箱格式不正确');
throw BusinessExceptionFactory.forbidden('删除用户');
throw BusinessExceptionFactory.conflict('邮箱已被使用');

// 通用异常工厂
throw ExceptionFactory.system('数据库连接失败');
throw ExceptionFactory.externalService('PaymentAPI', '支付接口调用失败', 500);
throw ExceptionFactory.database('SELECT', '查询超时');
```

### 在服务中使用

```typescript
@Injectable()
export class UserService {
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw BusinessExceptionFactory.notFound('用户', { userId: id });
    }
    
    return user;
  }
  
  async updateProfile(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findById(id);
      
      // 业务规则验证
      if (user.status === UserStatus.LOCKED) {
        throw BusinessExceptionFactory.forbidden('更新用户资料', {
          reason: '用户账号已被锁定',
          userId: id
        });
      }
      
      return await this.userRepository.save({ ...user, ...data });
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error; // 重新抛出业务异常
      }
      
      // 转换为系统异常
      throw ExceptionFactory.database('UPDATE', '更新用户信息失败', error, {
        userId: id,
        data
      });
    }
  }
}
```

### 在控制器中使用

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    // 参数验证
    if (!id || !isUUID(id)) {
      throw BusinessExceptionFactory.invalidParameter('用户ID', {
        providedValue: id,
        expectedFormat: 'UUID'
      });
    }
    
    return await this.userService.findById(id);
  }
  
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.userService.create(createUserDto);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw BusinessExceptionFactory.conflict('邮箱已被使用', {
          email: createUserDto.email
        });
      }
      throw error;
    }
  }
}
```

## 📊 日志级别说明

```typescript
export enum LogLevel {
  DEBUG = 'DEBUG',     // 调试信息
  INFO = 'INFO',       // 一般信息
  WARNING = 'WARNING', // 警告信息
  ERROR = 'ERROR',     // 错误信息
  CRITICAL = 'CRITICAL' // 严重错误
}
```

**级别使用建议：**
- `DEBUG`: 开发调试时使用
- `INFO`: 正常的业务流程信息（如用户登录、注销）
- `WARNING`: 需要注意但不影响系统运行的问题（如用户输入错误）
- `ERROR`: 影响功能正常使用的错误（如数据库查询失败）
- `CRITICAL`: 影响系统稳定性的严重错误（如系统服务不可用）

## 🎨 最佳实践

### 1. 异常选择原则

```typescript
// ✅ 正确：使用具体的异常类型
throw BusinessExceptionFactory.notFound('用户');
throw ExceptionFactory.database('SELECT', '查询超时');

// ❌ 错误：使用通用的 HttpException
throw new HttpException('用户不存在', 404);
```

### 2. 错误信息编写

```typescript
// ✅ 正确：用户友好的错误信息
throw new BusinessException('邮箱格式不正确，请输入有效的邮箱地址');

// ❌ 错误：技术性错误信息
throw new BusinessException('Invalid email format regex validation failed');
```

### 3. 上下文信息使用

```typescript
// ✅ 正确：提供有用的上下文信息
throw BusinessExceptionFactory.validation('用户名长度不符合要求', {
  username: 'ab',
  minLength: 3,
  maxLength: 20,
  currentLength: 2
});

// ❌ 错误：上下文信息过于简单或包含敏感信息
throw BusinessExceptionFactory.validation('验证失败', {
  password: 'user-password' // 不要包含敏感信息
});
```

### 4. 异常转换

```typescript
// ✅ 正确：将底层异常转换为业务异常
try {
  await this.externalApi.call();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    throw ExceptionFactory.externalService(
      'PaymentAPI',
      '支付服务暂时不可用，请稍后重试',
      undefined,
      { originalError: error.message }
    );
  }
  throw error;
}

// ❌ 错误：直接抛出底层异常
try {
  await this.externalApi.call();
} catch (error) {
  throw error; // 用户会看到技术性错误信息
}
```

### 5. 异常处理层次

```typescript
// Service 层：处理业务逻辑异常
@Injectable()
export class UserService {
  async deleteUser(id: string): Promise<void> {
    const user = await this.findById(id); // 可能抛出 BusinessException
    
    if (user.role === 'ADMIN') {
      throw BusinessExceptionFactory.forbidden('删除管理员用户', {
        userId: id,
        userRole: user.role
      });
    }
    
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      throw ExceptionFactory.database('DELETE', '删除用户失败', error, { userId: id });
    }
  }
}

// Controller 层：处理请求参数异常
@Controller('users')
export class UserController {
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    if (!isUUID(id)) {
      throw BusinessExceptionFactory.invalidParameter('用户ID');
    }
    
    await this.userService.deleteUser(id);
  }
}
```

## 🔧 配置建议

### 1. 全局异常过滤器配置

确保在 `app.module.ts` 中正确配置了全局异常过滤器：

```typescript
{
  provide: APP_FILTER,
  useClass: HttpExceptionFilter,
}
```

### 2. 日志配置

建议在异常过滤器中根据异常的 `logLevel` 属性进行相应的日志记录：

```typescript
// 在 HttpExceptionFilter 中
if (exception instanceof BusinessException) {
  const { logLevel, context } = exception;
  
  switch (logLevel) {
    case LogLevel.CRITICAL:
      this.logger.error(exception.message, exception.stack, context);
      break;
    case LogLevel.ERROR:
      this.logger.error(exception.message, context);
      break;
    case LogLevel.WARNING:
      this.logger.warn(exception.message, context);
      break;
    // ...
  }
}
```

## 🚨 注意事项

1. **不要在异常信息中包含敏感信息**（如密码、令牌等）
2. **异常信息应该对用户友好**，避免暴露技术细节
3. **合理使用日志级别**，避免日志噪音
4. **提供足够的上下文信息**用于问题排查，但不要过度详细
5. **在适当的层次处理异常**，避免异常在调用栈中传播过远
6. **使用工厂方法**创建常见异常，保持代码一致性
7. **及时转换底层异常**为业务异常，提供更好的用户体验

## 📚 相关文档

- [NestJS 异常处理官方文档](https://docs.nestjs.com/exception-filters)
- [HTTP 状态码参考](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [项目异常过滤器实现](../filters/http-exception.filter.ts)