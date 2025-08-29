import * as cors from 'cors';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { appConfig } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // 应用中间件
    app.use(cors(appConfig.corsOptions));

    // 版本控制
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    });

    // 静态资源配置
    const staticConfig = appConfig.staticAssetsOptions;
    // 使用配置中的静态资源路径，处理相对路径
    const staticPath = staticConfig.root.startsWith('./')
      ? join(__dirname, '..', staticConfig.root.substring(2))
      : join(__dirname, staticConfig.root);
    app.useStaticAssets(staticPath, staticConfig.options);

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
      const fs = require('fs');
      const path = require('path');
      const apiDocPath = path.join(
        __dirname,
        `..${staticConfig.options.prefix}/api-docs.json`,
      );
      fs.writeFileSync(apiDocPath, JSON.stringify(document, null, 2));
      logger.log(`📄 API文档已保存到: ${apiDocPath}`);
    }

    // 启动应用
    await app.listen(appConfig.port);

    // 美化的启动信息输出
    const appUrl = await app.getUrl();
    logger.log('\n' + '='.repeat(60));
    logger.log('🎉 NestJS 应用启动成功!');
    logger.log('='.repeat(60));
    logger.log(`📋 应用名称: ${appConfig.appTitle}`);
    logger.log(`🌍 运行环境: ${appConfig.environment}`);
    logger.log(`🚀 服务地址: ${appUrl}`);
    logger.log(`⚡ 端口号码: ${appConfig.port}`);

    if (appConfig.swaggerOptions.enabled) {
      logger.log('\n' + '-'.repeat(40));
      logger.log('📚 API 文档服务');
      logger.log('-'.repeat(40));
      logger.log(`🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
      logger.log(
        `📄 JSON 文档: ${appUrl}${staticConfig.options.prefix}/api-docs.json`,
      );
      logger.log(`💡 提示: 可导入到 Postman、Apifox 等工具`);
    }

    logger.log('\n' + '='.repeat(60));
    logger.log('✨ 服务已就绪，等待请求...');
    logger.log('='.repeat(60) + '\n');
  } catch (error) {
    logger.error('❌ 应用程序启动失败', error.stack || error.message);
    process.exit(1);
  }
}

bootstrap();
