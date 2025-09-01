import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import type { FileUploadOptions } from '../modules/files/interfaces';

export interface UploadsConfig {
  path: string;
  maxSize: number;
  allowedTypes: string[];
}

/**
 * 应用配置服务（AppConfigService）
 *
 * 提供应用程序所有配置项的统一访问接口，封装环境变量的读取和默认值处理。
 *
 * 功能说明：
 * - 封装 ConfigService，提供类型安全的配置访问方法
 * - 支持多环境配置，自动根据环境变量调整配置
 * - 提供合理的默认值，确保应用在缺少配置时仍能正常运行
 * - 集中管理所有配置逻辑，便于维护和扩展
 *
 * 配置分类：
 * - 应用基础配置：端口、环境、标题等
 * - JWT 认证配置：密钥、过期时间等
 * - 静态资源配置：文件服务、上传限制等
 * - CORS 跨域配置：允许的源、凭据设置等
 * - 数据库配置：连接信息、同步设置等
 * - API 文档配置：Swagger 相关设置
 * - 调试配置：日志级别、调试开关等
 *
 * 依赖项：
 * - ConfigService: NestJS 配置服务，用于读取环境变量
 *
 * 用法示例：
 * ```typescript
 * constructor(private appConfig: AppConfigService) {}
 *
 * const port = this.appConfig.port;
 * const jwtOptions = this.appConfig.jwtOptions;
 * ```
 */
@Injectable()
export class AppConfigService {
  /**
   * 构造函数
   * @param configService NestJS 配置服务实例
   */
  constructor(private configService: ConfigService) {}

  /**
   * 获取应用标题
   * 根据当前环境自动添加环境后缀
   * @returns 应用标题字符串
   */
  get appTitle(): string {
    const envSuffix = this.isDevelopment
      ? ' - 开发环境'
      : this.environment === 'test'
        ? ' - 测试环境'
        : this.isProduction
          ? ' - 生产环境'
          : '';
    return `我与夏季 Ra 系统${envSuffix}`;
  }

  /**
   * 获取应用运行端口
   * @returns 端口号，默认 3000
   */
  get port(): number {
    return this.configService.get<number>('NEST_PORT', 3000);
  }

  /**
   * 获取当前运行环境
   * @returns 环境名称 ('development' | 'production' | 'test')
   */
  get environment(): string {
    return this.configService.get<string>('NEST_USER_NODE_ENV', 'development');
  }

  /**
   * 获取应用基础URL
   * @returns 基础URL，默认 http://localhost:3000
   */
  get baseurl(): string {
    return this.configService.get<string>('NEST_BASE_URL', `http://localhost:${this.port}`);
  }

  /**
   * 判断是否为开发环境
   * @returns 如果是开发环境返回 true
   */
  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * 判断是否为生产环境
   * @returns 如果是生产环境返回 true
   */
  get isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * 获取 JWT 认证配置
   * @returns JWT 配置对象，包含密钥和过期时间
   */
  get jwtOptions(): { secret: string | undefined; expiresIn: string } {
    return {
      secret: this.configService.get<string>('NEST_JWT_SECRET'),
      expiresIn: this.configService.get<string>('NEST_JWT_ACCESS_TOKEN_TTL', '1d'),
    };
  }

  /**
   * 获取静态资源服务配置
   * @returns 静态资源配置对象，包含根目录、URL 前缀和缓存设置
   */
  get staticAssetsOptions(): {
    root: string;
    options: ServeStaticOptions;
    uploads: FileUploadOptions;
  } {
    return {
      root: this.configService.get<string>('NEST_STATIC_ASSETS_PATH', './static'),
      options: {
        prefix: this.configService.get<string>('NEST_STATIC_ASSETS_PREFIX', '/static'),
        maxAge: this.configService.get<string>('NEST_STATIC_ASSETS_MAXAGE', '86400'),
      } as ServeStaticOptions,
      uploads: {
        path: this.configService.get<string>('NEST_UPLOAD_PATH', './static/uploads'),
        prefix: this.configService.get<string>('NEST_UPLOAD_PREFIX', '/uploads'),
        maxSize: this.configService.get<number>('NEST_UPLOAD_MAX_SIZE', 10485760),
        allowedTypes: this.configService.get<string[]>('NEST_UPLOAD_ALLOWED_TYPES', []),
        maxFiles: this.configService.get<number>('NEST_UPLOAD_MAX_FILES', 10),
      },
    };
  }

  /**
   * 获取 CORS 跨域配置
   * @returns CORS 配置对象，包含允许的源和凭据设置
   */
  get corsOptions(): { origin: string[]; credentials: boolean } {
    const origins = this.configService.get<string>(
      'NEST_CORS_ORIGINS',
      'http://localhost:3000,http://localhost:9527',
    );
    return {
      origin: origins.split(',').map((origin) => origin.trim()),
      credentials: true,
    };
  }

  /**
   * 判断是否启用调试模式
   * @returns 如果启用调试模式返回 true
   */
  get isDebugEnabled(): boolean {
    return this.configService.get<string>('NEST_ENABLE_DEBUG') === 'true';
  }

  /**
   * 获取日志级别
   * @returns 日志级别字符串，默认 'info'
   */
  get logLevel(): string {
    return this.configService.get<string>('NEST_LOG_LEVEL', 'info');
  }

  /**
   * 获取 Swagger API 文档配置
   * 根据环境自动调整标题和描述，生产环境默认禁用
   * @returns Swagger 配置对象
   */
  get swaggerOptions(): {
    title: string;
    description: string;
    version: string;
    prefix: string;
    enabled: boolean;
  } {
    const envSuffix = this.isDevelopment
      ? ' - 开发版'
      : this.environment === 'test'
        ? ' - 测试版'
        : '';

    return {
      title: `我与夏季 Ra API${envSuffix}`,
      description: `我与夏季 Ra 系统API文档${this.isDevelopment ? ' - 开发环境' : ''}`,
      version: '1.0.0',
      prefix: this.configService.get<string>('NEST_SWAGGER_PREFIX', '/api-docs'),
      enabled: this.environment !== 'production', // 生产环境关闭
    };
  }

  /**
   * 获取数据库连接配置
   * @returns 数据库配置对象，包含连接信息、同步设置和日志配置
   */
  get databaseConfig(): {
    type: 'mysql';
    host: string;
    port: number;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    synchronize: boolean;
    logging: boolean;
    logger: 'simple-console';
  } {
    return {
      type: 'mysql' as const,
      host: this.configService.get<string>('NEST_DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('NEST_DATABASE_PORT', 3306),
      username: this.configService.get<string>('NEST_DATABASE_USER'),
      password: this.configService.get<string>('NEST_DATABASE_PASSWORD'),
      database: this.configService.get<string>('NEST_DATABASE_NAME'),
      synchronize:
        this.configService.get<string>('NEST_DATABASE_SYNCHRONIZE') === 'true' ||
        this.isDevelopment,
      // 强制关闭查询日志，只保留错误日志
      logging: this.configService.get<string>('NEST_DATABASE_LOGGING') === 'true',
      logger: 'simple-console' as const,
    };
  }

  /**
   * 获取 API 版本控制配置
   * @returns API 版本配置对象，包含前缀和默认版本
   */
  get apiVersioning(): { prefix: string; defaultVersion: string } {
    return {
      prefix: this.configService.get<string>('API_PREFIX', 'api'),
      defaultVersion: this.configService.get<string>('API_DEFAULT_VERSION', '1'),
    };
  }
}
