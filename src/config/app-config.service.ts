import type { FileUploadOptions } from '@/shared/files/interfaces';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import type { Environment } from './types';
import { CorsOptions } from 'cors';

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

    const baseTitle = this.configService.get<string>('app.title', 'NestJS Template');
    const environment = this.environment as Environment;
    const suffix = suffixMap[environment] ?? '';

    return `${baseTitle}${suffix}`;
  }

  get port(): number {
    return this.configService.get<number>('app.port', 3000);
  }

  get environment(): string {
    return this.configService.get<string>('app.environment', 'development');
  }

  get baseUrl(): string {
    return this.configService.get<string>('app.baseUrl', `http://localhost:${this.port}`);
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  // JWT 认证配置
  get jwtOptions(): {
    secret: string | undefined;
    accessTokenTtl: number;
    refreshTokenTtl: number;
  } {
    return {
      secret: this.configService.get<string>('app.jwt.secret'),
      accessTokenTtl: this.configService.get<number>('app.jwt.accessTokenTtl', 3600),
      refreshTokenTtl: this.configService.get<number>('app.jwt.refreshTokenTtl', 604800),
    };
  }

  // Bcrypt 加密配置
  get bcryptSaltRounds(): number {
    return this.configService.get<number>('app.bcrypt.saltRounds', 10);
  }

  // 认证安全配置
  get authSecurityOptions(): {
    maxLoginAttempts: number;
    baseLockDuration: number;
    maxLockDuration: number;
  } {
    return {
      maxLoginAttempts: this.configService.get<number>('app.auth.maxLoginAttempts', 5),
      baseLockDuration: this.configService.get<number>('app.auth.baseLockDuration', 1800),
      maxLockDuration: this.configService.get<number>('app.auth.maxLockDuration', 86400),
    };
  }

  // 静态资源服务配置
  get staticAssetsOptions(): {
    root: string;
    options: ServeStaticOptions & FileUploadOptions;
  } {
    return {
      root: this.configService.get<string>('app.static.root', './static'),
      options: {
        prefix: this.configService.get<string>('app.static.prefix', '/static'),
        maxAge: this.configService.get<number>('app.static.maxAge', 86400).toString(),
        uploadsPath: this.configService.get<string>('app.static.uploadsPath', './static/uploads'),
        uploadsMaxSize: this.configService.get<number>('app.static.uploadsMaxSize', 10485760),
        uploadsAllowedTypes: this.configService.get<string[]>('app.static.uploadsAllowedTypes', []),
        uploadsMaxFiles: this.configService.get<number>('app.static.uploadsMaxFiles', 10),
      } as ServeStaticOptions & FileUploadOptions,
    };
  }

  // CORS 跨域配置
  get corsOptions(): CorsOptions {
    const allowList = this.configService.get<string[]>('app.cors.origin', []);

    // 生产环境：严格检查 Origin
    if (this.isProduction) {
      return {
        origin: (requestOrigin, callback) => {
          // 允许无 Origin 的请求 (如 curl, postman, server-to-server)
          if (!requestOrigin) {
            return callback(null, true);
          }

          // 检查是否在允许列表中
          if (allowList.includes('*') || allowList.includes(requestOrigin)) {
            return callback(null, true);
          }

          callback(new Error('不允许的跨域请求'));
        },
        credentials: true,
      };
    }

    // 开发/测试环境：允许所有 localhost 和局域网 IP
    return {
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
          return callback(null, true);
        }

        // 允许白名单中的域名
        if (allowList.includes('*') || allowList.includes(requestOrigin)) {
          return callback(null, true);
        }

        // 允许本地开发环境
        // 匹配: localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x
        const isLocalDev =
          /^(http|https):\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
            requestOrigin,
          );

        if (isLocalDev) {
          return callback(null, true);
        }

        callback(null, false);
      },
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

    const baseTitle = this.configService.get<string>('app.swagger.title', 'API Documentation');
    const description = this.configService.get<string>('app.swagger.description', 'API文档');
    const title = `${baseTitle}${suffix}`;

    return {
      title,
      description,
      version: `V${this.configService.get<string>('app.api.version', '1')}`,
      prefix: this.configService.get<string>('app.swagger.prefix', '/api-docs'),
      filename: this.configService.get<string>('app.swagger.filename', 'api-docs.json'),
      enabled: environment !== 'production',
    };
  }

  // Redis 缓存配置
  get redisConfig(): {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
    options: {
      retryDelayOnFailover: number;
      enableReadyCheck: boolean;
      maxRetriesPerRequest: number;
      lazyConnect: boolean;
      keepAlive: number;
      connectTimeout: number;
      commandTimeout: number;
    };
    cache: {
      defaultTtl: number;
      keyPrefix: string;
    };
  } {
    return {
      enabled: this.configService.get<boolean>('app.redis.enabled', false),
      host: this.configService.get<string>('app.redis.host', 'localhost'),
      port: this.configService.get<number>('app.redis.port', 6379),
      password: this.configService.get<string>('app.redis.password'),
      db: this.configService.get<number>('app.redis.db', 0),
      options: {
        retryDelayOnFailover: this.configService.get<number>(
          'app.redis.options.retryDelayOnFailover',
          100,
        ),
        enableReadyCheck: this.configService.get<boolean>(
          'app.redis.options.enableReadyCheck',
          false,
        ),
        maxRetriesPerRequest: this.configService.get<number>(
          'app.redis.options.maxRetriesPerRequest',
          3,
        ),
        lazyConnect: this.configService.get<boolean>('app.redis.options.lazyConnect', true),
        keepAlive: this.configService.get<number>('app.redis.options.keepAlive', 30000),
        connectTimeout: this.configService.get<number>('app.redis.options.connectTimeout', 10000),
        commandTimeout: this.configService.get<number>('app.redis.options.commandTimeout', 5000),
      },
      cache: {
        defaultTtl: this.configService.get<number>('app.redis.cache.defaultTtl', 3600),
        keyPrefix: this.configService.get<string>('app.redis.cache.keyPrefix', 'nestjs:'),
      },
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
    tablePrefix: string;
    synchronize: boolean;
    logging: boolean;
    logger: 'simple-console';
  } {
    return {
      type: 'mysql' as const,
      host: this.configService.get<string>('app.database.host', 'localhost'),
      port: this.configService.get<number>('app.database.port', 3306),
      username: this.configService.get<string>('app.database.username'),
      password: this.configService.get<string>('app.database.password'),
      database: this.configService.get<string>('app.database.database'),
      tablePrefix: this.configService.get<string>('app.database.tablePrefix', ''),
      synchronize: this.configService.get<boolean>('app.database.synchronize', false),
      logging: this.configService.get<boolean>('app.database.logging', false),
      logger: 'simple-console' as const,
    };
  }

  // API 版本控制配置
  get apiVersioning(): {
    prefix: string;
    defaultVersion: string;
    type: 'uri' | 'header';
    header: string;
  } {
    return {
      prefix: this.configService.get<string>('app.api.prefix', 'api'),
      defaultVersion: this.configService.get<string>('app.api.version', '1'),
      type: this.configService.get<'uri' | 'header'>('app.api.type', 'header'),
      header: this.configService.get<string>('app.api.header', 'X-Api-Version'),
    };
  }
}
