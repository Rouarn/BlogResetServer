import { registerAs } from '@nestjs/config';

/**
 * 应用配置工厂函数
 *
 * 使用 NestJS 的 registerAs 函数注册名为 'app' 的配置命名空间。
 * 从环境变量中读取配置值，并提供合理的默认值。
 *
 * 功能说明：
 * - 集中定义所有应用配置的结构和默认值
 * - 支持从环境变量动态读取配置
 * - 提供类型安全的配置访问方式
 * - 按功能模块组织配置，便于维护和扩展
 *
 * 配置分组：
 * - 应用基础配置：标题、端口、环境等
 * - JWT 认证配置：密钥、令牌有效期等
 * - 静态资源配置：文件服务、上传限制等
 * - CORS 跨域配置：允许的源、凭据设置等
 * - Swagger 文档配置：标题、描述、版本等
 * - 数据库配置：连接信息、同步设置、连接池等
 *
 * 环境变量映射：
 * - NEST_GLOB_APP_TITLE → app.title
 * - NEST_PORT → app.port
 * - NEST_USER_NODE_ENV → app.environment
 * - NEST_JWT_SECRET → app.jwt.secret
 * - NEST_DATABASE_HOST → app.database.host
 * - 等等...
 *
 * 用法示例：
 * ```typescript
 * // 在服务中注入配置
 * constructor(
 *   @Inject('app') private appConfig: any,
 *   private configService: ConfigService
 * ) {}
 *
 * // 访问配置
 * const port = this.configService.get<number>('app.port');
 * const jwtSecret = this.configService.get<string>('app.jwt.secret');
 * ```
 */
export default registerAs('app', () => ({
  // 应用基础配置
  title: process.env.NEST_GLOB_APP_TITLE ?? 'NestJS Application',
  port: process.env.NEST_PORT ? parseInt(process.env.NEST_PORT, 10) : 3000,
  baseurl: process.env.NEST_BASE_URL ?? 'http://localhost:3000',
  environment: process.env.NEST_USER_NODE_ENV ?? 'development',

  // JWT 认证配置
  jwt: {
    secret: process.env.NEST_JWT_SECRET ?? 'your-secret-key',
    accessTokenTtl: process.env.NEST_JWT_ACCESS_TOKEN_TTL ?? '1d',
  },

  // 静态资源和文件上传统一配置
  static: {
    root: process.env.NEST_STATIC_ASSETS_PATH ?? './static',
    prefix: process.env.NEST_STATIC_ASSETS_PREFIX ?? '/static',
    maxAge: process.env.NEST_STATIC_ASSETS_MAXAGE ?? 86400, // 24小时缓存

    // 文件上传配置
    upload: {
      path: process.env.NEST_UPLOAD_PATH ?? './uploads', // 上传文件存储路径
      maxFileSize: process.env.NEST_UPLOAD_MAX_SIZE
        ? parseInt(process.env.NEST_UPLOAD_MAX_SIZE, 10)
        : 10 * 1024 * 1024, // 10MB
      allowedTypes: process.env.NEST_UPLOAD_ALLOWED_TYPES
        ? process.env.NEST_UPLOAD_ALLOWED_TYPES.split(',').map((type) => type.trim())
        : [], // 空数组表示允许所有类型
      maxBatchFiles: 10, // 批量上传最大文件数
    },
  },

  // CORS 跨域配置
  cors: {
    origin: process.env.NEST_CORS_ORIGINS
      ? process.env.NEST_CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:9527', 'http://192.168.31.32:8848'],
    credentials: true,
  },

  // Swagger API 文档配置
  swagger: {
    title: process.env.NEST_SWAGGER_TITLE ?? 'API Documentation',
    description: process.env.NEST_SWAGGER_DESCRIPTION ?? 'API文档',
    version: process.env.NEST_SWAGGER_VERSION ?? '1.0',
    prefix: process.env.NEST_SWAGGER_PREFIX ?? '/api-docs',
    enabled: process.env.NEST_USER_NODE_ENV !== 'production',
  },

  // Redis 缓存配置
  redis: {
    // Redis 功能开关，默认在开发环境启用，生产环境需要显式配置
    enabled:
      process.env.NEST_REDIS_ENABLED === 'true' ||
      (process.env.NEST_USER_NODE_ENV === 'development' &&
        process.env.NEST_REDIS_ENABLED !== 'false'),

    // Redis 连接配置
    host: process.env.NEST_REDIS_HOST ?? 'localhost',
    port: process.env.NEST_REDIS_PORT ? parseInt(process.env.NEST_REDIS_PORT, 10) : 6379,
    password: process.env.NEST_REDIS_PASSWORD ?? undefined,
    db: process.env.NEST_REDIS_DB ? parseInt(process.env.NEST_REDIS_DB, 10) : 0,

    // 连接选项
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true, // 延迟连接，避免启动时连接失败导致应用崩溃
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },

    // 缓存配置
    cache: {
      // 默认缓存过期时间（秒）
      defaultTtl: process.env.NEST_REDIS_DEFAULT_TTL
        ? parseInt(process.env.NEST_REDIS_DEFAULT_TTL, 10)
        : 3600,
      // 键前缀
      keyPrefix: process.env.NEST_REDIS_KEY_PREFIX ?? 'nestjs:',
      // 最大缓存大小（内存缓存fallback使用）
      maxSize: process.env.NEST_REDIS_MAX_SIZE
        ? parseInt(process.env.NEST_REDIS_MAX_SIZE, 10)
        : 1000,
    },
  },

  // WebSocket 配置
  websocket: {
    // CORS 配置
    corsOrigins: process.env.NEST_CORS_ORIGINS
      ? process.env.NEST_CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'],

    // 日志配置
    logLevel: process.env.WS_LOG_LEVEL ?? 'info',
    includeMetadata: process.env.WS_INCLUDE_METADATA === 'true',
    includeStack: process.env.WS_INCLUDE_STACK === 'true',

    // 性能配置
    performanceThreshold: process.env.WS_PERFORMANCE_THRESHOLD
      ? parseInt(process.env.WS_PERFORMANCE_THRESHOLD, 10)
      : 1000,
    slowRequestThreshold: process.env.WS_SLOW_REQUEST_THRESHOLD
      ? parseInt(process.env.WS_SLOW_REQUEST_THRESHOLD, 10)
      : 1000,
  },

  // 数据库连接配置
  database: {
    type: 'mysql' as const,
    host: process.env.NEST_DATABASE_HOST ?? 'localhost',
    port: process.env.NEST_DATABASE_PORT ? parseInt(process.env.NEST_DATABASE_PORT, 10) : 3306,
    username: process.env.NEST_DATABASE_USER ?? 'root',
    password: process.env.NEST_DATABASE_PASSWORD ?? '',
    database: process.env.NEST_DATABASE_NAME ?? 'nestjs_app',
    synchronize:
      process.env.NEST_DATABASE_SYNCHRONIZE === 'true' ||
      process.env.NEST_USER_NODE_ENV === 'development',
    // 精细化日志控制 - 默认关闭所有查询日志
    logging: process.env.NEST_DATABASE_LOGGING === 'true' ? true : false,
    // 关闭额外的数据库通知
    logNotifications: false,
    // 优化连接池配置
    extra: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    },
  },
}));
