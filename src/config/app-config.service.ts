import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // 应用配置
  get appTitle(): string {
    return this.configService.get<string>('NEST_GLOB_APP_TITLE', 'NestJS Application');
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
      expiresIn: this.configService.get<string>('NEST_JWT_ACCESS_TOKEN_TTL', '1d'),
    };
  }


  // 静态资源配置
  get staticAssetsOptions() {
    return {
      root: this.configService.get<string>('NEST_STATIC_ASSETS_PATH', './static'),
      options: {
        prefix: this.configService.get<string>('NEST_STATIC_ASSETS_URL', '/static'),
        maxAge: this.configService.get<string>('NEST_STATIC_ASSETS_MAXAGE', '86400'),
      } as ServeStaticOptions,
    };
  }

  // CORS配置
  get corsOptions() {
    return {
      origin: ['http://localhost:9527', 'http://192.168.31.32:8848'],
      credentials: true,
    };
  }

  // Swagger配置
  get swaggerOptions() {
    return {
      title: this.configService.get<string>('NEST_SWAGGER_TITLE', 'API Documentation'),
      description: this.configService.get<string>('NEST_SWAGGER_DESCRIPTION', 'API文档'),
      version: this.configService.get<string>('NEST_SWAGGER_VERSION', '1.0'),
      prefix: this.configService.get<string>('NEST_SWAGGER_PREFIX', '/api-docs'),
      enabled: this.isDevelopment, // 只在开发环境启用
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
      synchronize: this.isDevelopment,
      logging: this.isDevelopment,
    };
  }

  // 白名单路由
  get whiteList(): string[] {
    return ['/login/code', '/login/create'];
  }
}