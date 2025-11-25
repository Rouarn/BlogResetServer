# NestJS Template

一个模块化的 NestJS 后端模板，内置认证、用户资料、文件管理、缓存、WebSocket、统一响应与完整脚本工具，开箱即用并可按需扩展。

**核心特性**

- 模块化架构与类型安全
- TypeORM + MySQL 支持
- JWT 认证与 RBAC 权限
- 文件分块上传与断点续传
- 双重缓存（Redis/内存）与装饰器集成
- WebSocket 通讯与房间管理
- Swagger API 文档与统一响应格式
- 完整脚本工具（环境、生成器、部署）

**技术栈**

- NestJS 11、TypeScript 5、TypeORM、Passport/JWT、Swagger、PNPM

**环境要求**

- Node.js >= 22.18.0，PNPM >= 10.15.0，MySQL >= 8.0

## 快速开始

- `pnpm install`
- `pnpm run env:setup` 交互式配置；`pnpm run env:check` 验证环境
- `pnpm run start:dev` 启动开发服务
- 接口 `http://localhost:8848`，文档 `http://localhost:8848/api-docs`

## 架构与全局配置

- 根模块在 `src/app.module.ts`，统一注册：配置模块、JWT 模块（全局）、数据库、时间戳管理、业务模块与共享模块。
- 全局守卫链：限流/安全 → JWT 认证 → 角色权限（`src/app.module.ts:126`）。
- 全局拦截器：统一响应格式（`src/app.module.ts:144`）。
- 全局管道与异常过滤器：验证管道与 HTTP 异常过滤（`src/app.module.ts:152`、`src/app.module.ts:161`）。
- 启动入口配置 CORS、WebSocket 适配、API 版本、静态资源与 Swagger 输出（`src/main.ts:41`、`src/main.ts:50`、`src/main.ts:63`、`src/main.ts:79`）。

## 模块详解（src/modules）

- Auth（认证）
  - 登录与安全：失败次数、锁定、状态检查（`src/modules/auth/auth.service.ts:133`）。
  - 注册：创建认证与关联用户资料（`src/modules/auth/auth.service.ts:232`）。
  - 验证码：生成/校验（缓存存储、过期检测）（`src/modules/auth/auth.service.ts:288`、`src/modules/auth/auth.service.ts:339`）。
  - 令牌管理：刷新/验证/黑名单（`src/modules/auth/auth.service.ts:489`、`src/modules/auth/auth.service.ts:551`、`src/modules/auth/auth.service.ts:616`）。
  - 密码管理：修改/重置（`src/modules/auth/auth.service.ts:390`、`src/modules/auth/auth.service.ts:436`）。
- Users（用户资料）
  - 创建、分页与详情查询（缓存集成）（`src/modules/users/users.service.ts:80`、`src/modules/users/users.service.ts:100`、`src/modules/users/users.service.ts:130`）。
  - 更新/删除/批量删除（清理相关缓存）（`src/modules/users/users.service.ts:147`、`src/modules/users/users.service.ts:182`、`src/modules/users/users.service.ts:207`）。
  - 状态切换与启/禁用、启用检查（`src/modules/users/users.service.ts:232`、`src/modules/users/users.service.ts:251`、`src/modules/users/users.service.ts:260`、`src/modules/users/users.service.ts:269`）。
- Files（文件管理）
  - 上传：单/批量，分块上传（初始化/传输/完成）、进度查询。
  - 管理：列表、详情、下载、预览、删除，权限守卫与装饰器。
  - 服务分层：分块上传（`services/chunk.service.ts`）、验证（`services/validation.service.ts`）、存储适配（`services/storage.service.ts`）与工厂（`services/storage-factory.service.ts`）。
  - 实体结构：文件与分块上传（`entities/file.entity.ts`、`entities/upload-chunk.entity.ts`）。

## 共享模块（src/shared）

- Cache（缓存）
  - 装饰器：`@Cache`、`@CacheEvict`（键模板占位 `${0}` 等；键生成器与条件控制），见 `src/shared/cache/decorators/cache.decorator.ts`。
  - 服务实现：内存与 Redis，工厂统一创建；常量前缀与 TTL 在 `src/common/constants/cache.constant.ts`。
  - 使用示例：用户服务列表与单条缓存、更新与删除失效（参考 UsersService）。
- WebSocket（实时通信）
  - 网关、守卫与拦截器；异常过滤器与服务；在启动入口设置 `IoAdapter`。

## 公共层（src/common）

- 装饰器：`@JwtAuth`、`@Roles`、`@Public`、`@GetCurrentUser` 等。
- 守卫：`JwtAuthGuard`、`RolesGuard`、`GlobalGuard`。
- 拦截器：`ResponseInterceptor` 统一响应格式。
- 过滤器：`HttpExceptionFilter` 统一错误处理。
- 异常体系：业务/系统异常与工厂（`src/common/exceptions/index.ts`）。
- 常量：缓存键前缀与 TTL（`src/common/constants/cache.constant.ts`）、响应常量等。

## 配置与数据库

- 配置模块：应用配置服务、配置对象与验证（`src/config/app-config.service.ts`、`src/config/configuration.ts`、`src/config/validation.schema.ts`）。
- JWT：通过 `ConfigService` 异步注册（`src/app.module.ts:59`），读取 `NEST_JWT_SECRET` 与 TTL。
- 数据库模块：基础实体自动创建/更新时间（`src/database/entities/base.entity.ts`），审计拦截器与订阅者（`src/database/interceptors/audit.interceptor.ts`、`src/database/subscribers/audit.subscriber.ts`）。

## 数据库模块（src/database）

- 目标与能力
  - 自动管理时间戳：插入时同时写入 `createTime`/`updateTime`，更新时刷新 `updateTime`（`src/database/subscribers/audit.subscriber.ts:49`、`src/database/subscribers/audit.subscriber.ts:69`）。
  - 请求上下文控制：在拦截器中注入查询上下文（`QUERY_CONTEXT`），支持方法级禁用时间戳（`src/database/interceptors/audit.interceptor.ts:30`、`src/database/decorators/index.ts:11`）。
  - 删除审计：删除前记录日志（`src/database/subscribers/audit.subscriber.ts:84`）。
- 基础实体
  - `BaseEntity` 提供标准时间戳字段与序列化（`src/database/entities/base.entity.ts:16`、`src/database/entities/base.entity.ts:30`）。
- 装饰器
  - `DisableTimestamps()`：在控制器或服务方法上禁用自动更新时间戳（`src/database/decorators/index.ts:11`）。
- 拦截器与订阅者
  - 审计拦截器：读取 `DisableTimestamps` 元数据，注入 `QUERY_CONTEXT` 到请求（`src/database/interceptors/audit.interceptor.ts:24`、`src/database/interceptors/audit.interceptor.ts:35`）。
  - 审计订阅者：监听 `BaseEntity`，在 `beforeInsert`/`beforeUpdate`/`beforeRemove` 阶段处理时间戳与日志（`src/database/subscribers/audit.subscriber.ts:42`、`src/database/subscribers/audit.subscriber.ts:49`、`src/database/subscribers/audit.subscriber.ts:69`、`src/database/subscribers/audit.subscriber.ts:84`）。
- 类型与配置
  - 配置接口与令牌：`DatabaseConfig`、`DATABASE_CONFIG` 与 `QUERY_CONTEXT`（`src/database/types/index.ts:1`、`src/database/types/index.ts:27`、`src/database/types/index.ts:28`）。
  - 字段名可通过 `forRoot` 覆盖（`createTime`/`updateTime`），支持排除实体列表（`src/database/database.module.ts:25`、`src/database/types/index.ts:5`、`src/database/types/index.ts:15`）。
- 模块用法
  - 全局启用：`DatabaseModule.forRoot({ enableTimestamps: true, fieldNames: { createTime: 'createTime', updateTime: 'updateTime' } })`（`src/app.module.ts:89`）。
  - 异步配置：`DatabaseModule.forRootAsync({ useFactory, inject, imports })`（`src/database/database.module.ts:86`）。
  - 特性模块：在子模块中启用订阅者 `DatabaseModule.forFeature()`（`src/database/database.module.ts:112`）。

### 字段命名说明与修改

- 默认属性与列名：
  - 属性名固定为 `createTime`、`updateTime`（`src/database/entities/base.entity.ts:21`、`src/database/entities/base.entity.ts:35`）。
  - 数据库列名固定为 `create_time`、`update_time`（同上装饰器 `name` 字段）。
- 在 `src/app.module.ts:86-95` 可看到 `DatabaseModule.forRoot({ fieldNames })` 的示例配置，但当前版本该配置项用于预留扩展，未覆盖 `BaseEntity` 固定字段。
- 如需修改命名：
  - 直接在 `src/database/entities/base.entity.ts` 修改装饰器的 `name`（例如改为 `created_at`、`updated_at`），并根据需要重命名属性（例如 `createdAt`、`updatedAt`）。
  - 或复制一份自定义基类（例如 `CustomBaseEntity`）并让你的实体继承该基类，保持审计订阅者对时间戳字段的处理逻辑一致。

## 工具层（src/utils）

- 辅助函数：日期、节流/防抖、深拷贝、随机字符串、UUID等（`src/utils/helpers`）。
- 验证器：邮箱、手机号、身份证、URL、日期、数字、字符串（`src/utils/validators`）。
- 认证工具：白名单路径与权限检查（`src/utils/auth/whitelist.auth.ts`）。

## 目录结构

```
nestjs-template/
├── src/
│   ├── modules/            # 业务模块（auth/users/files 等）
│   ├── shared/             # 共享模块（cache/websocket）
│   ├── common/             # 公共组件（守卫/拦截器/异常/装饰器等）
│   ├── config/             # 配置模块
│   ├── database/           # 数据库与基础实体
│   ├── utils/              # 工具库
│   └── main.ts             # 启动入口
├── scripts/                # 脚本工具（环境/生成器/部署）
├── package.json
└── README.md
```

## 脚本工具（scripts）

- 环境设置：`setup-env.js` 交互式生成 `.env`、`.env.development`、`.env.production`（随机 JWT 密钥、数据库配置等）。
- 环境检查：`check-env.js` 校验必需文件与变量、端口提示、彩色输出。
- 资源生成器：`generate-resource.js`
  - 用法：`pnpm run g:res -- posts` 或 `pnpm run g:res`（交互输入）。
  - 产物：`src/modules/<resource>/` 下生成 `entity/dto/controller/service/module`，控制器删除统一为 `DELETE /<resource>`（`id` 或 `ids`）。
  - 缓存：`@Cache` 列表/单条与 `@CacheEvict` 更新/删除失效；键模板支持 `${0}` 参数占位。
- 部署准备：`deploy.js` 构建部署包（移动 `dist` 到 `deploy/`、生成生产 `package.json`、复制环境文件、生成启动脚本）。
- 测试文件清理：`remove-spec-files.js`。

## 环境与部署

- 环境文件：`.env`（公共）、`.env.development`（开发）、`.env.production`（生产）。
- 部署流程：`pnpm run deploy:build` 生成 `deploy/`（包含 `dist/`、生产 `package.json`、启动脚本与环境复制）。

## API 与缓存约定

- 控制器返回可直接数据或包装对象，统一由响应拦截器格式化。
- 列表分页返回统一 `{ data, total }` 结构；拦截器提供统一输出。
- 缓存键前缀与 TTL 参考 `src/common/constants/cache.constant.ts`（如 `USER`、`USERS`、`USER_INFO`、`CAPTCHA` 等）。

## 安全与规范

- 严禁提交任何密钥与敏感信息；关注 `.gitignore` 设置。
- 使用 ESLint + Prettier 保持风格统一与类型安全。
- 认证失败与锁定策略、令牌黑名单、公用异常响应确保安全基线。
