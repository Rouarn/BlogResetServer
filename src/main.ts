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
import { AppConfigService } from './config';

/**
 * 解析静态资源路径
 */
function resolveStaticPath(staticConfig: { root: string }): string {
  if (path.isAbsolute(staticConfig.root)) {
    return staticConfig.root;
  }

  return path.resolve(process.cwd(), staticConfig.root);
}

/**
 * 配置应用基础设置
 */
function configureApp(app: NestExpressApplication, appConfig: AppConfigService): void {
  // 配置CORS跨域策略
  app.use(cors(appConfig.corsOptions));
}

/**
 * 配置API版本控制
 */
function configureVersioning(app: NestExpressApplication, appConfig: AppConfigService): void {
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
  appConfig: AppConfigService,
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
  appConfig: AppConfigService,
): void {
  const swaggerOptions = appConfig.swaggerOptions;
  if (!swaggerOptions.enabled) return;

  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(swaggerOptions.title)
    .setDescription(swaggerOptions.description)
    .setVersion(swaggerOptions.version)
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(swaggerOptions.prefix, app, document);

  // 导出API文档为JSON
  const apiDocPath = path.join(staticPath, swaggerOptions.filename);

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
    swaggerOptions.filename,
  );
}

async function bootstrap(): Promise<void> {
  // 创建应用实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // 缓存日志直到 Logger 初始化完成
  });

  // 获取配置服务
  const appConfig = app.get(AppConfigService);

  // 初始化自定义日志服务
  const logger = app.get(BootstrapLoggerService);
  app.useLogger(logger);

  // 配置应用组件
  configureApp(app, appConfig);
  configureVersioning(app, appConfig);
  const staticPath = configureStaticAssets(app, logger, appConfig);
  configureSwagger(app, staticPath, logger, appConfig);

  // 启动应用
  const port = appConfig.port;
  await app.listen(port);

  // 打印启动完成信息
  await logger.logApplicationStartup(
    app,
    appConfig,
    appConfig.apiVersioning,
    appConfig.staticAssetsOptions,
  );
}

void bootstrap();
