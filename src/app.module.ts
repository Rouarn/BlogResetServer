import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.grard';
import { JwtAuthStrategy } from './utils/passport/jwt-auth.strategy';
import { RolesGuard } from './utils/guards/roles.guard';
import {
  ConfigModule as AppConfigModule,
  appConfig,
  jwtOptions,
} from './config';

@Module({
  imports: [
    // 配置模块
    AppConfigModule,

    // JWT模块
    JwtModule.register({
      global: true,
      secret: jwtOptions.secret,
      signOptions: {
        expiresIn: jwtOptions.expiresIn,
      },
    }),

    // 数据库模块
    TypeOrmModule.forRoot({
      ...appConfig.databaseConfig,
      autoLoadEntities: true,
      retryDelay: 500,
      retryAttempts: 10,
    }),

    // 业务模块
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
