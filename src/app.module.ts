import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
} from '@nestjs/core/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthStrategy } from './common/strategies/jwt-auth.strategy';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GlobalGuard } from './common/guards/global.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';

import { ConfigModule as AppConfigModule, AppConfigService } from './config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 配置模块
    AppConfigModule,

    // JWT模块
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('NEST_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'NEST_JWT_ACCESS_TOKEN_TTL',
            '1d',
          ),
        },
      }),
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        ...configService.databaseConfig,
        autoLoadEntities: true,
        retryDelay: 500,
        retryAttempts: 10,
      }),
    }),

    // 业务模块
    AuthModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthStrategy,

    // 全局守卫注册
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalGuard,
    },
    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // 全局管道
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // 全局过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
