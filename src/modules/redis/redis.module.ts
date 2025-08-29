import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { redisProvider } from 'src/config';

@Module({
  imports: [ConfigModule],
  providers: [redisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
