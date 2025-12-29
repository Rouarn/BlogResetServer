import { CacheModule } from '@/shared/cache';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';
import { CategoryModule } from '@/modules/category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), CacheModule, CategoryModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService, TypeOrmModule],
})
export class ArticleModule {}
