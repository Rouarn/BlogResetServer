import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), CacheModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService, TypeOrmModule],
})
export class ArticleModule {}
