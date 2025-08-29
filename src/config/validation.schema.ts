import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // 应用配置
  NEST_GLOB_APP_TITLE: Joi.string().default('NestJS Application'),
  NEST_PORT: Joi.number().default(3000),
  NEST_USER_NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // JWT配置
  NEST_JWT_SECRET: Joi.string().required(),
  NEST_JWT_ACCESS_TOKEN_TTL: Joi.string().default('1d'),

  // 静态资源配置
  NEST_STATIC_ASSETS_PATH: Joi.string().default('./static'),
  NEST_STATIC_ASSETS_URL: Joi.string().default('/static'),
  NEST_STATIC_ASSETS_MAXAGE: Joi.number().default(86400),

  // Swagger配置
  NEST_SWAGGER_TITLE: Joi.string().default('API Documentation'),
  NEST_SWAGGER_DESCRIPTION: Joi.string().default('API文档'),
  NEST_SWAGGER_VERSION: Joi.string().default('1.0'),
  NEST_SWAGGER_PREFIX: Joi.string().default('/api-docs'),

  // 数据库配置
  NEST_DATABASE_HOST: Joi.string().default('localhost'),
  NEST_DATABASE_PORT: Joi.number().default(3306),
  NEST_DATABASE_USER: Joi.string().required(),
  NEST_DATABASE_PASSWORD: Joi.string().required(),
  NEST_DATABASE_NAME: Joi.string().required(),
});
