import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import { AppModule } from './app.module';
import { appConfig } from './config';
import { BootstrapLoggerService } from './common/services/bootstrap-logger.service';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // 应用中间件
    app.use(cors(appConfig.corsOptions));

    // 版本控制 - 使用配置服务
    const versionConfig = appConfig.apiVersioning;

    app.enableVersioning({
      type: VersioningType.URI,
      prefix: `${versionConfig.prefix}/v`,
      defaultVersion: versionConfig.defaultVersion,
    });

    // 静态资源配置
    const staticConfig = appConfig.staticAssetsOptions;
    // 使用配置中的静态资源路径，处理相对路径
    // 由于__dirname是dist/src，需要回到项目根目录再解析路径
    const staticPath = staticConfig.root.startsWith('./')
      ? join(__dirname, '..', staticConfig.root.substring(2))
      : join(__dirname, staticConfig.root);

    // 静态资源配置日志
    const bootstrapLogger = new BootstrapLoggerService();
    bootstrapLogger.logStaticResourceConfig(staticConfig, staticPath);

    app.useStaticAssets(staticPath, staticConfig.options);

    // 调试面板静态路由配置（仅在开发环境启用）
    if (appConfig.environment === 'development' && appConfig.isDebugEnabled) {
      const debugPanelPath = join(__dirname, 'modules', 'debug', 'views');

      bootstrapLogger.logDebugPanelConfig(debugPanelPath, appConfig.port);

      app.useStaticAssets(debugPanelPath, {
        prefix: '/debug/',
        index: 'debug-panel.html',
      });
    }

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

      // 保存API文档为JSON文件，供第三方工具导入使用
      const docsDir = path.join(__dirname, `${staticConfig.options.prefix}`);
      const apiDocPath = path.join(docsDir, 'api-docs.json');

      // 确保目录存在
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      // 检查apiDocPath是否是目录，如果是则删除它
      if (fs.existsSync(apiDocPath) && fs.statSync(apiDocPath).isDirectory()) {
        fs.rmSync(apiDocPath, { recursive: true });
      }

      // 写入API文档文件
      fs.writeFileSync(apiDocPath, JSON.stringify(document, null, 2));
      bootstrapLogger.logApiDocumentSaved(
        apiDocPath,
        appConfig.baseurl,
        staticConfig.options.prefix,
      );
    }

    // 启动应用
    await app.listen(appConfig.port);

    // 输出应用启动成功信息
    await bootstrapLogger.logApplicationStartup(app, appConfig, versionConfig, staticConfig);
  } catch (error) {
    const bootstrapLogger = new BootstrapLoggerService();
    bootstrapLogger.logApplicationError(error);
    process.exit(1);
  }
}

void bootstrap();
