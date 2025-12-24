import { AppConfigService } from '@/config/app-config.service';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

@Injectable()
export class BootstrapLoggerService extends ConsoleLogger {
  constructor() {
    super();
    this.setContext('Bootstrap');
  }

  /**
   * 输出静态资源配置信息
   */
  logStaticResourceConfig(
    staticConfig: { root: string; options: ServeStaticOptions },
    staticPath: string,
  ): void {
    this.log('');
    this.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.log('║                     📁 静态资源配置 📁                            ║');
    this.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.log('');
    this.log('┌─ 📂 配置详情 ───────────────────────────────────────────────────┐');
    this.log(`│ 📂 配置根目录: ${staticConfig.root}`);
    this.log(`│ ⚙️  配置选项: ${JSON.stringify(staticConfig.options)}`);
    this.log(`│ 📍 当前目录: ${__dirname}`);
    this.log(`│ 🎯 解析路径: ${staticPath}`);
    this.log('└─────────────────────────────────────────────────────────────────┘');
    this.log('');
  }

  /**
   * 记录API文档保存信息
   * @param apiDocPath API文档文件路径
   * @param baseUrl 基础URL
   * @param staticPrefix 静态资源前缀
   * @param filename API文档文件名
   */
  logApiDocumentSaved(
    apiDocPath: string,
    baseUrl: string,
    staticPrefix?: string,
    filename?: string,
  ): void {
    this.log(`📄 API文档已保存到: ${apiDocPath}`);
    this.log(`🔗 API文档访问地址: ${baseUrl}${staticPrefix ?? ''}/${filename}`);
  }

  /**
   * 记录应用启动成功信息
   * @param app NestJS应用实例
   * @param appConfig 应用配置
   * @param versionConfig 版本配置
   * @param staticConfig 静态资源配置
   */
  async logApplicationStartup(
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

    // 空行
    this.log('');

    // 主标题横幅
    this.log('╔' + '═'.repeat(68) + '╗');
    this.log('║' + ' '.repeat(20) + '🚀 NestJS 应用启动成功! 🚀' + ' '.repeat(22) + '║');
    this.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    this.log('');

    // 应用信息区域
    this.log('┌─ 📋 应用信息 ' + '─'.repeat(51) + '┐');
    this.log(`│ 🏷️  应用名称: ${appConfig.appTitle}`);
    this.log(`│ 🌍 运行环境: ${appConfig.environment}`);
    this.log(`│ 🚀 服务地址: ${appUrl}`);
    this.log(`│ 🔗 API 访问: ${apiUrl}`);
    if (versionConfig.type === 'header') {
      this.log(
        `│ 🎫 API 版本: Header: ${versionConfig.header}, Version: ${versionConfig.defaultVersion}`,
      );
    }
    this.log(`│ ⚡ 端口号码: ${appConfig.port}`);
    this.log('└' + '─'.repeat(65) + '┘');

    // API 文档区域
    if (appConfig.swaggerOptions.enabled) {
      this.log('');
      this.log('┌─ 📚 API 文档服务 ' + '─'.repeat(47) + '┐');
      this.log(`│ 🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
      this.log(
        `│ 📄 JSON 文档: ${appUrl}${staticConfig.options.prefix ?? ''}/${appConfig.swaggerOptions.filename}`,
      );
      this.log('│ 💡 提示: 可导入到 Postman、Apifox 等工具');
      this.log('└' + '─'.repeat(65) + '┘');
    }

    // 空行
    this.log('');

    // 状态横幅
    this.log('╔' + '═'.repeat(68) + '╗');
    this.log('║' + ' '.repeat(22) + '✨ 服务已就绪，等待请求... ✨' + ' '.repeat(17) + '║');
    this.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    this.log('');
  }

  /**
   * 输出应用启动失败信息
   */
  logApplicationError(error: unknown): void {
    this.error('');
    this.error('╔' + '═'.repeat(50) + '╗');
    this.error('║' + ' '.repeat(13) + '❌ 应用程序启动失败 ❌' + ' '.repeat(15) + '║');
    this.error('╚' + '═'.repeat(50) + '╝');
    this.error(
      '🔍 错误详情:',
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    this.error('💡 请检查配置文件和依赖项是否正确');
    this.error('');
  }
}
