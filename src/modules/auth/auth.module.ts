import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth } from './entities/auth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Auth]), CacheModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
