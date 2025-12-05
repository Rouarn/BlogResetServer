import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleCategoriesController } from './article_categories.controller';
import { ArticleCategoriesService } from './article_categories.service';
import { ArticleCategory } from './entities/article_category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleCategory]), CacheModule],
  controllers: [ArticleCategoriesController],
  providers: [ArticleCategoriesService],
  exports: [ArticleCategoriesService, TypeOrmModule],
})
export class ArticleCategoriesModule {}
