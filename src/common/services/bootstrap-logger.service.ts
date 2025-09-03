import { Injectable, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import { AppConfigService } from 'src/config/app-config.service';
import type { FileUploadOptions } from 'src/modules/files/interfaces';

@Injectable()
export class BootstrapLoggerService {
  private readonly logger = new Logger('Bootstrap');

  /**
   * 输出静态资源配置信息
   */
  logStaticResourceConfig(
    staticConfig: { root: string; options: ServeStaticOptions; uploads: FileUploadOptions },
    staticPath: string,
  ): void {
    this.logger.log('');
    this.logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                     📁 静态资源配置 📁                            ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.logger.log('');
    this.logger.log('┌─ 📂 配置详情 ───────────────────────────────────────────────────┐');
    this.logger.log(`│ 📂 配置根目录: ${staticConfig.root}`);
    this.logger.log(`│ ⚙️  配置选项: ${JSON.stringify(staticConfig.options)}`);
    this.logger.log(`│ 📍 当前目录: ${__dirname}`);
    this.logger.log(`│ 🎯 解析路径: ${staticPath}`);
    this.logger.log('└─────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
  }

  /**
   * 输出调试面板配置信息
   */
  logDebugPanelConfig(debugPanelPath: string, port: number): void {
    this.logger.log('╔═══════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                     🛠️   调试面板配置 🛠️                            ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════╝');
    this.logger.log('');
    this.logger.log('┌─ 🎛️  面板详情 ────────────────────────────────────────────────────────┐');
    this.logger.log(`│ 📁 面板路径: ${debugPanelPath}`);
    this.logger.log(`│ 🌐 访问前缀: /debug/`);
    this.logger.log(`│ 📄 默认页面: debug-panel.html`);
    this.logger.log(`│ 🎛️  面板地址: http://localhost:${port}/debug/`);
    this.logger.log('└──────────────────────────────────────────────────────────────────────┘');
    this.logger.log('');
  }

  /**
   * 记录API文档保存信息
   * @param apiDocPath API文档文件路径
   * @param baseUrl 基础URL
   * @param staticPrefix 静态资源前缀
   */
  logApiDocumentSaved(apiDocPath: string, baseUrl: string, staticPrefix?: string): void {
    this.logger.log(`📄 API文档已保存到: ${apiDocPath}`);
    this.logger.log(`🔗 API文档访问地址: ${baseUrl}${staticPrefix ?? ''}/api-docs.json`);
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
    versionConfig: { prefix: string; defaultVersion: string },
    staticConfig: { root: string; options: ServeStaticOptions; uploads?: FileUploadOptions },
  ): Promise<void> {
    const appUrl = await app.getUrl();

    // 空行
    this.logger.log('');

    // 主标题横幅
    this.logger.log('╔' + '═'.repeat(68) + '╗');
    this.logger.log('║' + ' '.repeat(20) + '🚀 NestJS 应用启动成功! 🚀' + ' '.repeat(22) + '║');
    this.logger.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    this.logger.log('');

    // 应用信息区域
    this.logger.log('┌─ 📋 应用信息 ' + '─'.repeat(51) + '┐');
    this.logger.log(`│ 🏷️  应用名称: ${appConfig.appTitle}`);
    this.logger.log(`│ 🌍 运行环境: ${appConfig.environment}`);
    this.logger.log(`│ 🚀 服务地址: ${appUrl}`);
    this.logger.log(
      `│ 🔗 API 访问: ${appUrl}/${versionConfig.prefix}/v${versionConfig.defaultVersion}`,
    );
    if (appConfig.isDebugEnabled) {
      this.logger.log(`│ 🛠️  调试面板: ${appUrl}/debug/`);
    }
    this.logger.log(`│ ⚡ 端口号码: ${appConfig.port}`);
    this.logger.log('└' + '─'.repeat(65) + '┘');

    // API 文档区域
    if (appConfig.swaggerOptions.enabled) {
      this.logger.log('');
      this.logger.log('┌─ 📚 API 文档服务 ' + '─'.repeat(47) + '┐');
      this.logger.log(`│ 🔗 Swagger UI: ${appUrl}${appConfig.swaggerOptions.prefix}`);
      this.logger.log(
        `│ 📄 JSON 文档: ${appUrl}${staticConfig.options.prefix ?? ''}/api-docs.json`,
      );
      this.logger.log('│ 💡 提示: 可导入到 Postman、Apifox 等工具');
      this.logger.log('└' + '─'.repeat(65) + '┘');
    }

    // 空行
    this.logger.log('');

    // 状态横幅
    this.logger.log('╔' + '═'.repeat(68) + '╗');
    this.logger.log('║' + ' '.repeat(22) + '✨ 服务已就绪，等待请求... ✨' + ' '.repeat(17) + '║');
    this.logger.log('╚' + '═'.repeat(68) + '╝');

    // 空行
    this.logger.log('');
  }

  /**
   * 输出应用启动失败信息
   */
  logApplicationError(error: unknown): void {
    this.logger.error('');
    this.logger.error('╔' + '═'.repeat(50) + '╗');
    this.logger.error('║' + ' '.repeat(13) + '❌ 应用程序启动失败 ❌' + ' '.repeat(15) + '║');
    this.logger.error('╚' + '═'.repeat(50) + '╝');
    this.logger.error(
      '🔍 错误详情:',
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    this.logger.error('💡 请检查配置文件和依赖项是否正确');
    this.logger.error('');
  }
}
