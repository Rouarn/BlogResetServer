/**
 * 应用程序启动入口文件
 *
 * 负责初始化NestJS应用程序，配置中间件、静态资源、API文档等
 * 包含完整的应用启动流程和错误处理机制
 *
 * @author NestJS Template
 * @version 1.0.0
 */

// NestJS核心模块
import { VersioningType } from '@nestjs/common'; // API版本控制类型
import { NestFactory } from '@nestjs/core'; // NestJS应用工厂
import type { NestExpressApplication } from '@nestjs/platform-express'; // Express应用类型定义
import { IoAdapter } from '@nestjs/platform-socket.io'; // Socket.IO适配器
// Swagger API文档模块
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// 第三方依赖
import cors from 'cors'; // 跨域资源共享中间件
import * as fs from 'fs'; // 文件系统操作
import * as path from 'path'; // 路径处理工具
import { join } from 'path'; // 路径拼接工具
// 应用模块和配置
import { AppModule } from './app.module'; // 应用根模块
import { appConfig } from './config'; // 应用配置服务
import { BootstrapLoggerService } from './common/services'; // 启动日志服务

/**
 * 应用程序启动函数
 *
 * 执行完整的应用初始化流程：
 * 1. 创建NestJS应用实例
 * 2. 配置CORS跨域策略
 * 3. 启用API版本控制
 * 4. 配置静态资源服务
 * 5. 设置调试面板（开发环境）
 * 6. 生成Swagger API文档
 * 7. 启动HTTP服务器
 *
 * @returns Promise<void> 异步启动完成
 */
async function bootstrap(): Promise<void> {
  try {
    // 创建NestJS应用实例，使用Express平台
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // 配置WebSocket适配器
    // 启用Socket.IO支持，用于实时通信功能
    app.useWebSocketAdapter(new IoAdapter(app));

    // 配置CORS跨域资源共享中间件
    // 允许前端应用从不同域名访问API
    app.use(cors(appConfig.corsOptions));

    // 启用API版本控制系统
    // 支持URI路径版本控制，如: /api/v1/users
    const versionConfig = appConfig.apiVersioning;

    app.enableVersioning({
      type: VersioningType.URI, // 使用URI路径方式进行版本控制
      prefix: `${versionConfig.prefix}/v`, // 版本前缀，如: /api/v
      defaultVersion: versionConfig.defaultVersion, // 默认API版本号
    });

    // 配置静态资源服务
    // 用于提供前端文件、图片、文档等静态内容
    const staticConfig = appConfig.staticAssetsOptions;

    // 处理静态资源路径解析
    // 注意：__dirname在编译后指向dist/src，需要正确解析到项目根目录
    const staticPath = staticConfig.root.startsWith('./')
      ? join(__dirname, '..', staticConfig.root.substring(2)) // 相对路径：回到项目根目录
      : join(__dirname, staticConfig.root); // 绝对路径：直接使用

    // 初始化启动日志服务并记录静态资源配置
    const bootstrapLogger = new BootstrapLoggerService();
    bootstrapLogger.logStaticResourceConfig(staticConfig, staticPath);

    // 启用静态资源服务
    app.useStaticAssets(staticPath, staticConfig.options);

    // 配置Swagger API文档系统
    // 自动生成交互式API文档，支持在线测试和导出
    if (appConfig.swaggerOptions.enabled) {
      const swaggerConfig = appConfig.swaggerOptions;

      // 构建Swagger文档配置
      const options = new DocumentBuilder()
        .addBearerAuth() // 添加Bearer Token认证支持
        .setTitle(swaggerConfig.title) // 设置API文档标题
        .setDescription(swaggerConfig.description) // 设置API文档描述
        .setVersion(swaggerConfig.version) // 设置API版本号
        .build();

      // 生成API文档对象
      const document = SwaggerModule.createDocument(app, options);

      // 设置Swagger UI访问路径
      SwaggerModule.setup(swaggerConfig.prefix, app, document);

      // 导出API文档为JSON格式
      // 便于导入到Postman、Apifox等第三方API测试工具
      const docsDir = path.join(__dirname, `${staticConfig.options.prefix}`);
      const apiDocPath = path.join(docsDir, 'api-docs.json');

      // 确保文档目录存在
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      // 处理路径冲突：如果目标路径是目录则删除
      if (fs.existsSync(apiDocPath) && fs.statSync(apiDocPath).isDirectory()) {
        fs.rmSync(apiDocPath, { recursive: true });
      }

      // 写入格式化的API文档JSON文件
      fs.writeFileSync(apiDocPath, JSON.stringify(document, null, 2));

      // 记录API文档保存信息
      bootstrapLogger.logApiDocumentSaved(
        apiDocPath,
        appConfig.baseurl,
        staticConfig.options.prefix,
      );
    }

    // 启动HTTP服务器
    // 监听指定端口，开始接收客户端请求
    await app.listen(appConfig.port);

    // 输出应用启动成功信息
    // 显示服务地址、API文档链接等重要信息
    await bootstrapLogger.logApplicationStartup(app, appConfig, versionConfig, staticConfig);
  } catch (error) {
    // 启动失败时的错误处理
    const bootstrapLogger = new BootstrapLoggerService();
    bootstrapLogger.logApplicationError(error); // 记录错误详情
    process.exit(1); // 退出进程，返回错误码
  }
}

// 执行应用启动函数
// 使用void操作符忽略Promise返回值，避免未处理的Promise警告
void bootstrap();
