import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleLikesController } from './article_likes.controller';
import { ArticleLikesService } from './article_likes.service';
import { ArticleLike } from './entities/article_like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleLike]), CacheModule],
  controllers: [ArticleLikesController],
  providers: [ArticleLikesService],
  exports: [ArticleLikesService, TypeOrmModule],
})
export class ArticleLikesModule {}
