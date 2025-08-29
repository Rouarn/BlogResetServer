import * as cors from 'cors';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { RoleGuard } from 'src/utils/guards/global-guard';
import { HttpFilter } from 'src/utils/api/filter';
import { Response as commonResponse } from 'src/utils/api/response';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

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
    console.log(`📄 API文档已保存到: ${apiDocPath}`);
  }

  // 启动应用
  await app.listen(appConfig.port);

  // 美化的启动信息输出
  const appUrl = await app.getUrl();
  console.log('\n' + '='.repeat(60));
  console.log('🎉 NestJS 应用启动成功!');
  console.log('='.repeat(60));
  console.log(`📋 应用名称: ${appConfig.appTitle}`);
  console.log(`🌍 运行环境: ${appConfig.environment}`);
  console.log(`🚀 服务地址: ${appUrl}`);
  console.log(`⚡ 端口号码: ${appConfig.port}`);

  if (appConfig.swaggerOptions.enabled) {
    console.log('\n' + '-'.repeat(40));
    console.log('📚 API 文档服务');
    console.log('-'.repeat(40));
    console.log(`🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
    console.log(
      `📄 JSON 文档: ${appUrl}${staticConfig.options.prefix}/api-docs.json`,
    );
    console.log(`💡 提示: 可导入到 Postman、Apifox 等工具`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ 服务已就绪，等待请求...');
  console.log('='.repeat(60) + '\n');
}
bootstrap();
