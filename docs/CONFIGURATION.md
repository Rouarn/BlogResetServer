# 配置管理最佳实践

## 概述

本项目采用了统一的配置管理方案，通过环境变量和配置服务来管理应用的各种配置项。

## 配置结构

### 1. 配置文件组织

```
src/config/
├── configuration.ts      # 配置注册
├── validation.schema.ts  # 环境变量验证规则
└── app-config.service.ts # 配置服务类
```

### 2. 环境变量文件

- `.env` - 生产环境配置
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置（可选）

## 配置分类

### 应用基础配置
- `NEST_GLOB_APP_TITLE` - 应用标题
- `NEST_PORT` - 应用端口
- `NEST_USER_NODE_ENV` - 运行环境

### JWT配置
- `NEST_JWT_SECRET` - JWT密钥
- `NEST_JWT_ACCESS_TOKEN_TTL` - 访问令牌过期时间


### 静态资源配置
- `NEST_STATIC_ASSETS_PATH` - 静态资源路径
- `NEST_STATIC_ASSETS_URL` - 静态资源URL前缀
- `NEST_STATIC_ASSETS_MAXAGE` - 缓存时间

### Swagger配置
- `NEST_SWAGGER_TITLE` - API文档标题
- `NEST_SWAGGER_DESCRIPTION` - API文档描述
- `NEST_SWAGGER_VERSION` - API版本
- `NEST_SWAGGER_PREFIX` - 文档访问路径

### 数据库配置
- `NEST_DATABASE_HOST` - 数据库主机
- `NEST_DATABASE_PORT` - 数据库端口
- `NEST_DATABASE_USER` - 数据库用户名
- `NEST_DATABASE_PASSWORD` - 数据库密码
- `NEST_DATABASE_NAME` - 数据库名称

## 使用方式

### 1. 在模块中使用配置

```typescript
import { AppConfigService } from './config/app-config.service';

@Injectable()
export class SomeService {
  constructor(private appConfig: AppConfigService) {}

  someMethod() {
    const jwtSecret = this.appConfig.jwtOptions.secret;
    const isDev = this.appConfig.isDevelopment;
  }
}
```

### 2. 导入预配置的选项

```typescript
import { jwtOptions, whiteList, corsOptions } from './config';

// 直接使用预配置的选项
const secret = jwtOptions.secret;
const routes = whiteList;
```

### 3. 在main.ts中使用

```typescript
import { appConfig } from './config';

const port = appConfig.port;
const isDev = appConfig.isDevelopment;
```

### 4. 在app.module.ts中配置

```typescript
import { configuration, validationSchema, appConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(appConfig.databaseConfig),
  ],
})
export class AppModule {}
```

## 安全建议

1. **生产环境密钥**: 确保生产环境使用强密钥
2. **环境隔离**: 不同环境使用不同的配置文件
3. **敏感信息**: 敏感配置项不要提交到版本控制
4. **验证规则**: 使用Joi验证环境变量的有效性

## 环境变量命名规范

- 应用配置: `NEST_*`
- 数据库配置: `NEST_DATABASE_*`
- Swagger配置: `NEST_SWAGGER_*`
- 其他配置: `NEST_*`

## 最佳实践

1. **类型安全**: 使用TypeScript类型定义
2. **默认值**: 为所有配置项提供合理默认值
3. **验证**: 使用Joi验证环境变量
4. **文档**: 及时更新配置文档
5. **环境区分**: 开发和生产环境配置分离