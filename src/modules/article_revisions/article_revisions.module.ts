import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleRevisionsController } from './article_revisions.controller';
import { ArticleRevisionsService } from './article_revisions.service';
import { ArticleRevision } from './entities/article_revision.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleRevision]), CacheModule],
  controllers: [ArticleRevisionsController],
  providers: [ArticleRevisionsService],
  exports: [ArticleRevisionsService, TypeOrmModule],
})
export class ArticleRevisionsModule {}
