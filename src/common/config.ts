/**
 * 全局配置
 * @description: 配置文件
 * @version: V1.0
 */
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

const configService = new ConfigService();
console.log(configService.get('NSET_COOKIE_MAXAGE'));

// useSession
export const useSession = {
  secret: configService.get('NSET_COOKIE_SIGN_KEY'),
  name: configService.get('NSET_COOKIE_NAME'),
  rolling: true,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: Number(configService.get('NSET_COOKIE_MAXAGE')),
    httpOnly: configService.get('NSET_COOKIE_HTTP_ONLY') === 'true',
    secure: configService.get('NSET_COOKIE_SECURE') === 'true',
    sameSite: configService.get('NSET_COOKIE_SAME_SITE'),
    domain: configService.get('NSET_COOKIE_DOMAIN'),
    path: configService.get('NSET_COOKIE_PATH'),
    signed: configService.get('NSET_COOKIE_SIGN') === 'true',
  },
};

// useStaticAssets
export const useStaticAssets = {
  root: configService.get('NEST_STATIC_ASSETS_PATH'),
  options: {
    prefix: configService.get('NEST_STATIC_ASSETS_URL'),
    maxAge: configService.get('NEST_STATIC_ASSETS_MAXAGE'),
  } as ServeStaticOptions,
};

// whiteList
export const whiteList = ['/login/code', '/login/create'];

// corsOptions
export const corsOptions = {
  origin: ['http://localhost:9527', 'http://192.168.31.32:8848'],
  credentials: true,
};

// swaggerOptions
export const swaggerOptions = {
  title: configService.get('NSET_SWAGGER_TITLE'),
  description: configService.get('NSET_SWAGGER_DESCRIPTION'),
  version: configService.get('NSET_SWAGGER_VERSION'),
  prefix: configService.get('NSET_SWAGGER_PREFIX'),
};

/** 数据库配置 */
export const dbConfig = {};
