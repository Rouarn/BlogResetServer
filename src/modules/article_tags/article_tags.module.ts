import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleTagsController } from './article_tags.controller';
import { ArticleTagsService } from './article_tags.service';
import { ArticleTag } from './entities/article_tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleTag]), CacheModule],
  controllers: [ArticleTagsController],
  providers: [ArticleTagsService],
  exports: [ArticleTagsService, TypeOrmModule],
})
export class ArticleTagsModule {}
