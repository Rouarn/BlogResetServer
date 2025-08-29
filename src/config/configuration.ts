import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // 应用配置
  title: process.env.NEST_GLOB_APP_TITLE || 'NestJS Application',
  port: process.env.NEST_PORT ? parseInt(process.env.NEST_PORT, 10) : 3000,
  environment: process.env.NEST_USER_NODE_ENV || 'development',

  // JWT配置
  jwt: {
    secret: process.env.NEST_JWT_SECRET || 'your-secret-key',
    accessTokenTtl: process.env.NEST_JWT_ACCESS_TOKEN_TTL || '1d',
  },

  // 静态资源配置
  static: {
    root: process.env.NEST_STATIC_ASSETS_PATH || './static',
    prefix: process.env.NEST_STATIC_ASSETS_URL || '/static',
    maxAge: process.env.NEST_STATIC_ASSETS_MAXAGE
      ? parseInt(process.env.NEST_STATIC_ASSETS_MAXAGE, 10)
      : 86400,
  },

  // CORS配置
  cors: {
    origin: ['http://localhost:9527', 'http://192.168.31.32:8848'],
    credentials: true,
  },

  // Swagger配置
  swagger: {
    title: process.env.NEST_SWAGGER_TITLE || 'API Documentation',
    description: process.env.NEST_SWAGGER_DESCRIPTION || 'API文档',
    version: process.env.NEST_SWAGGER_VERSION || '1.0',
    prefix: process.env.NEST_SWAGGER_PREFIX || '/api-docs',
    enabled: process.env.NEST_USER_NODE_ENV !== 'production',
  },

  // 数据库配置
  database: {
    type: 'mysql' as const,
    host: process.env.NEST_DATABASE_HOST || 'localhost',
    port: process.env.NEST_DATABASE_PORT
      ? parseInt(process.env.NEST_DATABASE_PORT, 10)
      : 3306,
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
