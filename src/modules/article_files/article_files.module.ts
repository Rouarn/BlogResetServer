import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticleFilesController } from './article_files.controller';
import { ArticleFilesService } from './article_files.service';
import { ArticleFile } from './entities/article_file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleFile]), CacheModule],
  controllers: [ArticleFilesController],
  providers: [ArticleFilesService],
  exports: [ArticleFilesService, TypeOrmModule],
})
export class ArticleFilesModule {}
