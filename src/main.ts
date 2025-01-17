import * as cors from 'cors';
import * as session from 'express-session';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { RoleGuard } from 'src/utils/guards/global-guard';
import { HttpFilter } from 'src/utils/api/filter';
import { Response as commonResponse } from 'src/utils/api/response';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  useSession,
  useStaticAssets,
  corsOptions,
  swaggerOptions,
} from './common/config';

// ///////////////////////////////// 常量区域 ////////////////////////////////////////

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
