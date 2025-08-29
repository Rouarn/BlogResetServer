import * as cors from 'cors';
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

// ///////////////////////////////// 配置导入 ////////////////////////////////////////
import { appConfig } from './config';

// ///////////////////////////////// 函数区域 ////////////////////////////////////////

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 应用中间件
  app.use(cors(appConfig.corsOptions));
  
  // 全局配置
  app.useGlobalGuards(new RoleGuard());
  app.useGlobalFilters(new HttpFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new commonResponse());
  app.enableVersioning({ type: VersioningType.URI });
  
  // 静态资源配置
  const staticConfig = appConfig.staticAssetsOptions;
  app.useStaticAssets(join(__dirname, staticConfig.root), staticConfig.options);
  
  // Swagger文档配置（仅在开发环境启用）
  if (appConfig.swaggerOptions.enabled) {
    const swaggerConfig = appConfig.swaggerOptions;
    const options = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(swaggerConfig.prefix, app, document);
  }

  // 启动应用
  await app.listen(appConfig.port);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📝 Title: ${appConfig.appTitle}`);
  console.log(`🌍 Environment: ${appConfig.environment}`);
  
  if (appConfig.swaggerOptions.enabled) {
    console.log(`📚 Swagger docs: ${await app.getUrl()}${appConfig.swaggerOptions.prefix}`);
  }
}
bootstrap();
