/**
 * 应用程序启动入口文件
 *
 * 负责初始化NestJS应用程序，配置中间件、静态资源、API文档等
 *
 * @author NestJS Template
 * @version 1.0.0
 */

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { BootstrapLoggerService } from './common/services';
import { appConfig } from './config';

/**
 * 解析静态资源路径
 */
function resolveStaticPath(staticConfig: { root: string }): string {
  if (path.isAbsolute(staticConfig.root)) {
    return staticConfig.root;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const baseDir = isProduction ? process.cwd() : path.join(process.cwd(), 'dist');
  return path.resolve(baseDir, staticConfig.root);
}

/**
 * 配置应用基础设置
 */
function configureApp(app: NestExpressApplication): void {
  // 配置CORS跨域策略
  app.use(cors(appConfig.corsOptions));
}

/**
 * 配置API版本控制
 */
function configureVersioning(app: NestExpressApplication): void {
  const versionConfig = appConfig.apiVersioning;

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: `${versionConfig.prefix}/v`,
    defaultVersion: versionConfig.defaultVersion,
  });
}

/**
 * 配置静态资源服务
 */
function configureStaticAssets(
  app: NestExpressApplication,
  logger: BootstrapLoggerService,
): string {
  const staticConfig = appConfig.staticAssetsOptions;
  const staticPath = resolveStaticPath(staticConfig);

  logger.logStaticResourceConfig(staticConfig, staticPath);
  app.useStaticAssets(staticPath, staticConfig.options);

  return staticPath;
}

/**
 * 配置Swagger API文档
 */
function configureSwagger(
  app: NestExpressApplication,
  staticPath: string,
  logger: BootstrapLoggerService,
): void {
  if (!appConfig.swaggerOptions.enabled) return;

  const swaggerConfig = appConfig.swaggerOptions;

  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(swaggerConfig.title)
    .setDescription(swaggerConfig.description)
    .setVersion(swaggerConfig.version)
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(swaggerConfig.prefix, app, document);

  // 导出API文档为JSON
  const apiDocPath = path.join(staticPath, 'api-docs.json');

  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, { recursive: true });
  }

  if (fs.existsSync(apiDocPath) && fs.statSync(apiDocPath).isDirectory()) {
    fs.rmSync(apiDocPath, { recursive: true });
  }

  fs.writeFileSync(apiDocPath, JSON.stringify(document, null, 2));

  logger.logApiDocumentSaved(
    apiDocPath,
    appConfig.baseUrl,
    appConfig.staticAssetsOptions.options.prefix,
  );
}

/**
 * 应用程序启动函数
 */
async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const logger = new BootstrapLoggerService();

    // 配置应用基础设置
    configureApp(app);

    // 配置API版本控制
    configureVersioning(app);

    // 配置静态资源服务
    const staticPath = configureStaticAssets(app, logger);

    // 配置Swagger文档
    configureSwagger(app, staticPath, logger);

    // 启动服务器
    await app.listen(appConfig.port);

    // 记录启动信息
    await logger.logApplicationStartup(
      app,
      appConfig,
      appConfig.apiVersioning,
      appConfig.staticAssetsOptions,
    );
  } catch (error) {
    const logger = new BootstrapLoggerService();
    logger.logApplicationError(error);
    process.exit(1);
  }
}

// 启动应用
void bootstrap();
