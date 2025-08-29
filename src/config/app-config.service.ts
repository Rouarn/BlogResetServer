import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // 应用配置 (硬编码，所有环境相同)
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

  get port(): number {
    return this.configService.get<number>('NEST_PORT', 3000);
  }

  get environment(): string {
    return this.configService.get<string>('NEST_USER_NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  // JWT配置
  get jwtOptions() {
    return {
      secret: this.configService.get<string>('NEST_JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'NEST_JWT_ACCESS_TOKEN_TTL',
        '1d',
      ),
    };
  }

  // 静态资源配置
  get staticAssetsOptions() {
    return {
      root: this.configService.get<string>(
        'NEST_STATIC_ASSETS_PATH',
        './static',
      ),
      options: {
        prefix: this.configService.get<string>(
          'NEST_STATIC_ASSETS_URL',
          '/static',
        ),
        maxAge: this.configService.get<string>(
          'NEST_STATIC_ASSETS_MAXAGE',
          '86400',
        ),
      } as ServeStaticOptions,
    };
  }

  // CORS配置
  get corsOptions() {
    const origins = this.configService.get<string>(
      'NEST_CORS_ORIGINS',
      'http://localhost:3000,http://localhost:9527',
    );
    return {
      origin: origins.split(',').map((origin) => origin.trim()),
      credentials: true,
    };
  }

  // 调试配置
  get isDebugEnabled(): boolean {
    return this.configService.get<string>('NEST_ENABLE_DEBUG') === 'true';
  }

  get logLevel(): string {
    return this.configService.get<string>('NEST_LOG_LEVEL', 'info');
  }

  // Swagger配置 (应用信息硬编码)
  get swaggerOptions() {
    const envSuffix = this.isDevelopment
      ? ' - 开发版'
      : this.environment === 'test'
        ? ' - 测试版'
        : '';

    return {
      title: `我与夏季 Ra API${envSuffix}`,
      description: `我与夏季 Ra 系统API文档${this.isDevelopment ? ' - 开发环境' : ''}`,
      version: '1.0.0',
      prefix: this.configService.get<string>(
        'NEST_SWAGGER_PREFIX',
        '/api-docs',
      ),
      enabled: this.environment !== 'production', // 生产环境关闭
    };
  }

  // 数据库配置
  get databaseConfig() {
    return {
      type: 'mysql' as const,
      host: this.configService.get<string>('NEST_DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('NEST_DATABASE_PORT', 3306),
      username: this.configService.get<string>('NEST_DATABASE_USER'),
      password: this.configService.get<string>('NEST_DATABASE_PASSWORD'),
      database: this.configService.get<string>('NEST_DATABASE_NAME'),
      synchronize:
        this.configService.get<string>('NEST_DATABASE_SYNCHRONIZE') ===
          'true' || this.isDevelopment,
      // 强制关闭查询日志，只保留错误日志
      logging:
        this.configService.get<string>('NEST_DATABASE_LOGGING') === 'true'
          ? true
          : false,
      logger: 'simple-console' as const,
    };
  }

  // 白名单路由
  get whiteList(): string[] {
    return ['/login/code', '/login/create'];
  }
}
