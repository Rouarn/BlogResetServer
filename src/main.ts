import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

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
      const apiDocPath = path.join(__dirname, `..${staticConfig.options.prefix}/api-docs.json`);
      fs.writeFileSync(apiDocPath, JSON.stringify(document, null, 2));
      logger.log(`📄 API文档已保存到: ${apiDocPath}`);
    }

    // 启动应用
    await app.listen(appConfig.port);

    // 美化的启动信息输出
    const appUrl = await app.getUrl();

    // 空行
    logger.log('');

    // 主标题横幅
    logger.log('╔' + '═'.repeat(68) + '╗');
    logger.log('║' + ' '.repeat(20) + '🚀 NestJS 应用启动成功! 🚀' + ' '.repeat(22) + '║');
    logger.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    logger.log('');

    // 应用信息区域
    logger.log('┌─ 📋 应用信息 ' + '─'.repeat(51) + '┐');
    logger.log(`│ 🏷️  应用名称: ${appConfig.appTitle}`);
    logger.log(`│ 🌍 运行环境: ${appConfig.environment}`);
    logger.log(`│ 🚀 服务地址: ${appUrl}`);
    logger.log(`│ 🔗 API 访问: ${appUrl}/${versionConfig.prefix}/v${versionConfig.defaultVersion}`);
    logger.log(`│ ⚡ 端口号码: ${appConfig.port}`);
    logger.log('└' + '─'.repeat(65) + '┘');

    if (appConfig.swaggerOptions.enabled) {
      // 空行
      logger.log('');

      // API 文档区域
      logger.log('┌─ 📚 API 文档服务 ' + '─'.repeat(47) + '┐');
      logger.log(`│ 🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
      logger.log(`│ 📄 JSON 文档: ${appUrl}${staticConfig.options.prefix}/api-docs.json`);
      logger.log('│ 💡 提示: 可导入到 Postman、Apifox 等工具');
      logger.log('└' + '─'.repeat(65) + '┘');
    }

    // 空行
    logger.log('');

    // 状态横幅
    logger.log('╔' + '═'.repeat(68) + '╗');
    logger.log('║' + ' '.repeat(22) + '✨ 服务已就绪，等待请求... ✨' + ' '.repeat(17) + '║');
    logger.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    logger.log('');
  } catch (error) {
    // 美化的错误输出
    logger.error('');
    logger.error('╔' + '═'.repeat(50) + '╗');
    logger.error('║' + ' '.repeat(13) + '❌ 应用程序启动失败 ❌' + ' '.repeat(12) + '║');
    logger.error('╚' + '═'.repeat(50) + '╝');
    logger.error(
      '🔍 错误详情:',
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    logger.error('💡 请检查配置文件和依赖项是否正确');
    logger.error('');
    process.exit(1);
  }
}

void bootstrap();
