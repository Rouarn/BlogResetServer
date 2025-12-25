import type { AppConfigService } from '@/config';
import type { LoggerService } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

export class BootstrapLogHelper {
  /**
   * 输出静态资源配置信息
   */
  static logStaticResourceConfig(
    logger: LoggerService,
    staticConfig: { root: string; options: ServeStaticOptions },
    staticPath: string,
  ): void {
    logger.log('');
    logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    logger.log('║                     📁 静态资源配置 📁                            ║');
    logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    logger.log('');
    logger.log('┌─ 📂 配置详情 ───────────────────────────────────────────────────┐');
    logger.log(`│ 📂 配置根目录: ${staticConfig.root}`);
    logger.log(`│ ⚙️  配置选项: ${JSON.stringify(staticConfig.options)}`);
    logger.log(`│ 📍 当前目录: ${__dirname}`);
    logger.log(`│ 🎯 解析路径: ${staticPath}`);
    logger.log('└─────────────────────────────────────────────────────────────────┘');
    logger.log('');
  }

  /**
   * 记录API文档保存信息
   */
  static logApiDocumentSaved(
    logger: LoggerService,
    apiDocPath: string,
    baseUrl: string,
    staticPrefix?: string,
    filename?: string,
  ): void {
    logger.log(`📄 API文档已保存到: ${apiDocPath}`);
    logger.log(`🔗 API文档访问地址: ${baseUrl}${staticPrefix ?? ''}/${filename}`);
  }

  /**
   * 记录应用启动成功信息
   */
  static async logApplicationStartup(
    logger: LoggerService,
    app: NestExpressApplication,
    appConfig: AppConfigService,
    versionConfig: {
      prefix: string;
      defaultVersion: string;
      type: 'uri' | 'header';
      header: string;
    },
    staticConfig: { root: string; options: ServeStaticOptions },
  ): Promise<void> {
    const appUrl = await app.getUrl();
    const apiUrl =
      versionConfig.type === 'uri'
        ? `${appUrl}/${versionConfig.prefix}/v${versionConfig.defaultVersion}`
        : `${appUrl}/${versionConfig.prefix}`;

    logger.log('');
    logger.log('╔' + '═'.repeat(68) + '╗');
    logger.log('║' + ' '.repeat(20) + '🚀 NestJS 应用启动成功! 🚀' + ' '.repeat(22) + '║');
    logger.log('╚' + '═'.repeat(68) + '╝');
    logger.log('');
    logger.log('┌─ 📋 应用信息 ' + '─'.repeat(51) + '┐');
    logger.log(`│ 🏷️  应用名称: ${appConfig.appTitle}`);
    logger.log(`│ 🌍 运行环境: ${appConfig.environment}`);
    logger.log(`│ 🚀 服务地址: ${appUrl}`);
    logger.log(`│ 🔗 API 访问: ${apiUrl}`);
    if (versionConfig.type === 'header') {
      logger.log(
        `│ 🎫 API 版本: Header: ${versionConfig.header}, Version: ${versionConfig.defaultVersion}`,
      );
    }
    logger.log(`│ ⚡ 端口号码: ${appConfig.port}`);
    logger.log('└' + '─'.repeat(65) + '┘');

    if (appConfig.swaggerOptions.enabled) {
      logger.log('');
      logger.log('┌─ 📚 API 文档服务 ' + '─'.repeat(47) + '┐');
      logger.log(`│ 🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
      logger.log(
        `│ 📄 JSON 文档: ${appUrl}${staticConfig.options.prefix ?? ''}/${appConfig.swaggerOptions.filename}`,
      );
      logger.log('│ 💡 提示: 可导入到 Postman、Apifox 等工具');
      logger.log('└' + '─'.repeat(65) + '┘');
    }

    logger.log('');
    logger.log('╔' + '═'.repeat(68) + '╗');
    logger.log('║' + ' '.repeat(22) + '✨ 服务已就绪，等待请求... ✨' + ' '.repeat(17) + '║');
    logger.log('╚' + '═'.repeat(68) + '╝');
    logger.log('');
  }

  /**
   * 输出应用启动失败信息
   */
  static logApplicationError(logger: LoggerService, error: unknown): void {
    logger.error('');
    logger.error('╔' + '═'.repeat(50) + '╗');
    logger.error('║' + ' '.repeat(13) + '❌ 应用程序启动失败 ❌' + ' '.repeat(15) + '║');
    logger.error('╚' + '═'.repeat(50) + '╝');
    logger.error(
      '🔍 错误详情: ' + (error instanceof Error ? (error.stack ?? error.message) : String(error)),
    );
    logger.error('💡 请检查配置文件和依赖项是否正确');
    logger.error('');
  }
}
