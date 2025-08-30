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
  title: process.env.NEST_GLOB_APP_TITLE || 'NestJS Application',
  port: process.env.NEST_PORT ? parseInt(process.env.NEST_PORT, 10) : 3000,
  environment: process.env.NEST_USER_NODE_ENV || 'development',

  // JWT 认证配置
  jwt: {
    secret: process.env.NEST_JWT_SECRET || 'your-secret-key',
    accessTokenTtl: process.env.NEST_JWT_ACCESS_TOKEN_TTL || '1d',
  },

  // 静态资源配置（整合文件上传和静态资源服务）
  static: {
    root: process.env.NEST_STATIC_ASSETS_PATH || './static',
    prefix: process.env.NEST_STATIC_ASSETS_URL || '/static',
    maxAge: process.env.NEST_STATIC_ASSETS_MAXAGE
      ? parseInt(process.env.NEST_STATIC_ASSETS_MAXAGE, 10)
      : 86400,
    // 文件上传配置 - 统一使用静态资源目录
    upload: {
      // 上传文件保存在静态资源目录下的 uploads 子目录
      path: process.env.NEST_STATIC_ASSETS_PATH
        ? `${process.env.NEST_STATIC_ASSETS_PATH}/uploads`
        : './static/uploads',
      maxFileSize: process.env.MAX_FILE_SIZE
        ? parseInt(process.env.MAX_FILE_SIZE, 10)
        : 10 * 1024 * 1024, // 10MB
      allowedTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : [], // 空数组表示允许所有类型
      maxBatchFiles: 10, // 批量上传最大文件数
    },
  },

  // CORS 跨域配置
  cors: {
    origin: ['http://localhost:9527', 'http://192.168.31.32:8848'],
    credentials: true,
  },

  // Swagger API 文档配置
  swagger: {
    title: process.env.NEST_SWAGGER_TITLE || 'API Documentation',
    description: process.env.NEST_SWAGGER_DESCRIPTION || 'API文档',
    version: process.env.NEST_SWAGGER_VERSION || '1.0',
    prefix: process.env.NEST_SWAGGER_PREFIX || '/api-docs',
    enabled: process.env.NEST_USER_NODE_ENV !== 'production',
  },

  // 数据库连接配置
  database: {
    type: 'mysql' as const,
    host: process.env.NEST_DATABASE_HOST || 'localhost',
    port: process.env.NEST_DATABASE_PORT ? parseInt(process.env.NEST_DATABASE_PORT, 10) : 3306,
    username: process.env.NEST_DATABASE_USER || 'root',
    password: process.env.NEST_DATABASE_PASSWORD || '',
    database: process.env.NEST_DATABASE_NAME || 'nestjs_app',
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
