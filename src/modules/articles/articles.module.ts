import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/shared/cache';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), CacheModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService, TypeOrmModule],
})
export class ArticlesModule {}
