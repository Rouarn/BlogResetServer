import type { FileUploadOptions } from '@/shared/files/interfaces';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import type { Environment } from './types';

/**
 * 应用配置服务
 *
 * 提供应用程序所有配置项的统一访问接口。
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // 应用基础配置
  get appTitle(): string {
    const suffixMap: Record<Environment, string> = {
      development: ' - 开发环境',
      test: ' - 测试环境',
      production: ' - 生产环境',
    };

    const baseTitle = this.configService.get<string>('NEST_APP_TITLE', 'NestJS Template');
    const environment = this.environment as Environment;
    const suffix = suffixMap[environment] ?? '';

    return `${baseTitle}${suffix}`;
  }

  get port(): number {
    return this.configService.get<number>('NEST_PORT', 3000);
  }

  get environment(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get baseUrl(): string {
    return this.configService.get<string>('NEST_BASE_URL', `http://localhost:${this.port}`);
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  // JWT 认证配置
  get jwtOptions(): { secret: string | undefined; expiresIn: number } {
    return {
      secret: this.configService.get<string>('NEST_JWT_SECRET'),
      expiresIn: this.configService.get<number>('NEST_JWT_ACCESS_TOKEN_TTL', 3600),
    };
  }

  // 静态资源服务配置
  get staticAssetsOptions(): {
    root: string;
    options: ServeStaticOptions & FileUploadOptions;
  } {
    return {
      root: this.configService.get<string>('NEST_STATIC_ASSETS_DIR', './static'),
      options: {
        prefix: this.configService.get<string>('NEST_STATIC_ASSETS_PREFIX', '/static'),
        maxAge: this.configService.get<string>('NEST_STATIC_ASSETS_MAXAGE', '86400'),
        uploadsPath: this.configService.get<string>('NEST_STATIC_UPLOAD_PATH', './static/uploads'),
        uploadsMaxSize: this.configService.get<number>('NEST_UPLOAD_MAX_SIZE', 10485760),
        uploadsAllowedTypes: this.configService.get<string[]>('NEST_UPLOAD_ALLOWED_TYPES', []),
        uploadsMaxFiles: this.configService.get<number>('NEST_UPLOAD_MAX_FILES', 10),
      } as ServeStaticOptions & FileUploadOptions,
    };
  }

  // CORS 跨域配置
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

  // Swagger API 文档配置
  get swaggerOptions(): {
    title: string;
    description: string;
    version: string;
    prefix: string;
    filename: string;
    enabled: boolean;
  } {
    const suffixMap: Record<Environment, string> = {
      development: ' - 开发版',
      test: ' - 测试版',
      production: ' - 生产版',
    };
    const environment = this.environment as Environment;
    const suffix = suffixMap[environment] ?? '';

    const baseTitle = this.configService.get<string>('NEST_SWAGGER_TITLE', 'API Documentation');
    const description = this.configService.get<string>('NEST_SWAGGER_DESCRIPTION', 'API文档');
    const title = `${baseTitle}${suffix}`;

    return {
      title,
      description,
      version: `V${this.configService.get<string>('API_DEFAULT_VERSION', '1.0.0')}`,
      prefix: this.configService.get<string>('NEST_SWAGGER_PREFIX', '/api-docs'),
      filename: this.configService.get<string>('NEST_SWAGGER_FILENAME', 'api-docs.json'),
      enabled: environment !== 'production',
    };
  }

  // 数据库连接配置
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
      logging: this.configService.get<string>('NEST_DATABASE_LOGGING') === 'true',
      logger: 'simple-console' as const,
    };
  }

  // API 版本控制配置
  get apiVersioning(): { prefix: string; defaultVersion: string } {
    return {
      prefix: this.configService.get<string>('API_PREFIX', 'api'),
      defaultVersion: this.configService.get<string>('API_DEFAULT_VERSION', '1'),
    };
  }
}
