import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core/constants';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.grard';
import { AuthModule } from './auth/auth.module';
import { JwtAuthStrategy } from './utils/passport/jwt-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './utils/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NEST_DATABASE_HOST: Joi.string().required(),
        NEST_DATABASE_PORT: Joi.number().required(),
        NEST_DATABASE_USER: Joi.string().required(),
        NEST_DATABASE_PASSWORD: Joi.string().required(),
        NEST_DATABASE_NAME: Joi.string().required(),
      }),
      envFilePath: ['.env', `.env.${process.env.RUNNING_ENV}`],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('NEST_JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get('NEST_JWT_ACCESS_TOKEN_TTL'),
          },
        };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql', //数据库类型
      username: process.env.NEST_DATABASE_USER, //账号
      password: process.env.NEST_DATABASE_PASSWORD, //密码
      host: process.env.NEST_DATABASE_HOST, //host
      port: Number(process.env.NEST_DATABASE_PORT), // 端口号
      database: process.env.NEST_DATABASE_NAME, //库名
      // entities: [__dirname + '/**/*.entity{.ts,.js}'], //实体文件
      synchronize: true, //synchronize字段代表是否自动将实体类同步到数据库
      retryDelay: 500, //重试连接数据库间隔
      retryAttempts: 10, //重试连接数据库的次数
      autoLoadEntities: true, //如果为true,将自动加载实体 forFeature()方法注册的每个实体都将自动添加到配置对象的实体数组中
    }),
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
