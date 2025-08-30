import * as Joi from 'joi';

/**
 * 环境变量验证模式
 * 
 * 使用 Joi 库定义环境变量的验证规则，确保应用启动时所有必需的配置都存在且格式正确。
 * 
 * 功能说明：
 * - 验证环境变量的存在性和格式
 * - 为可选配置提供合理的默认值
 * - 确保关键配置（如数据库连接、JWT 密钥）必须提供
 * - 限制某些配置的可选值（如环境类型）
 * 
 * 验证规则分类：
 * - 必需配置：NEST_JWT_SECRET, NEST_DATABASE_USER, NEST_DATABASE_PASSWORD, NEST_DATABASE_NAME
 * - 可选配置：其他所有配置都有默认值
 * - 枚举限制：NEST_USER_NODE_ENV 只能是 'development', 'production', 'test' 之一
 * - 类型验证：端口号必须是数字，文件大小必须是数字等
 * 
 * 验证失败处理：
 * - 如果验证失败，应用将无法启动
 * - 控制台会显示详细的错误信息，指出哪些环境变量缺失或格式错误
 * 
 * 环境变量说明：
 * - NEST_GLOB_APP_TITLE: 应用标题
 * - NEST_PORT: 应用运行端口
 * - NEST_USER_NODE_ENV: 运行环境 (development/production/test)
 * - NEST_JWT_SECRET: JWT 签名密钥 (必需)
 * - NEST_JWT_ACCESS_TOKEN_TTL: JWT 令牌有效期
 * - NEST_STATIC_ASSETS_*: 静态资源相关配置
 * - MAX_FILE_SIZE: 文件上传大小限制
 * - ALLOWED_FILE_TYPES: 允许的文件类型
 * - NEST_SWAGGER_*: API 文档相关配置
 * - NEST_DATABASE_*: 数据库连接配置 (用户名、密码、数据库名必需)
 * 
 * 用法示例：
 * ```bash
 * # .env 文件示例
 * NEST_JWT_SECRET=your-super-secret-key
 * NEST_DATABASE_USER=root
 * NEST_DATABASE_PASSWORD=password
 * NEST_DATABASE_NAME=my_app_db
 * NEST_PORT=3000
 * NEST_USER_NODE_ENV=development
 * ```
 */
export const validationSchema = Joi.object({
  // 应用基础配置
  NEST_GLOB_APP_TITLE: Joi.string().default('NestJS Application'),
  NEST_PORT: Joi.number().default(3000),
  NEST_USER_NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // JWT 认证配置
  NEST_JWT_SECRET: Joi.string().required(),
  NEST_JWT_ACCESS_TOKEN_TTL: Joi.string().default('1d'),

  // 静态资源配置
  NEST_STATIC_ASSETS_PATH: Joi.string().default('./static'),
  NEST_STATIC_ASSETS_URL: Joi.string().default('/static'),
  NEST_STATIC_ASSETS_MAXAGE: Joi.number().default(86400),

  // 文件上传配置（整合在静态资源配置中）
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: Joi.string().default(''), // 空字符串表示允许所有类型

  // Swagger API 文档配置
  NEST_SWAGGER_TITLE: Joi.string().default('API Documentation'),
  NEST_SWAGGER_DESCRIPTION: Joi.string().default('API文档'),
  NEST_SWAGGER_VERSION: Joi.string().default('1.0'),
  NEST_SWAGGER_PREFIX: Joi.string().default('/api-docs'),

  // 数据库连接配置
  NEST_DATABASE_HOST: Joi.string().default('localhost'),
  NEST_DATABASE_PORT: Joi.number().default(3306),
  NEST_DATABASE_USER: Joi.string().required(),
  NEST_DATABASE_PASSWORD: Joi.string().required(),
  NEST_DATABASE_NAME: Joi.string().required(),
});
