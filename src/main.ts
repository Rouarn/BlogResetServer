import * as cors from 'cors';
import * as session from 'express-session';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RoleGuard } from 'src/utils/guards/global-guard';
import { HttpFilter } from 'src/utils/api/filter';
import { Response as commonResponse } from 'src/utils/api/response';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

// ///////////////////////////////// 变量区域 ////////////////////////////////////////
const configService = new ConfigService();

// ///////////////////////////////// 常量区域 ////////////////////////////////////////
// jwt
export const jwtOptions = {
  secret: configService.get('NSET_JWT_SECRET'),
  expiresIn: configService.get('NEST_JWT_ACCESS_TOKEN_TTL'),
};

// useSession
export const useSession = {
  secret: configService.get('NSET_COOKIE_SIGN_KEY'),
  name: configService.get('NSET_COOKIE_NAME'),
  rolling: configService.get('NSET_COOKIE_ROLLING') === 'true',
  resave: configService.get('NSET_COOKIE_RESAVE') === 'true',
  saveUninitialized: configService.get('NSET_COOKIE_SAVE_UNINIT') === 'true',
  cookie: {
    maxAge: Number(configService.get('NSET_COOKIE_MAXAGE')),
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

// ///////////////////////////////// 函数区域 ////////////////////////////////////////

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cors(corsOptions));
  app.use(session(useSession));
  app.useGlobalGuards(new RoleGuard());
  app.useGlobalFilters(new HttpFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new commonResponse());
  app.enableVersioning({ type: VersioningType.URI });
  app.useStaticAssets(
    join(__dirname, useStaticAssets.root),
    useStaticAssets.options,
  );
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(swaggerOptions.title)
    .setDescription(swaggerOptions.description)
    .setVersion(swaggerOptions.version)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(swaggerOptions.prefix, app, document);

  await app.listen(process.env.NEST_PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(process.env.NEST_GLOB_APP_TITLE, process.env.NEST_USER_NODE_ENV);
}
bootstrap();
