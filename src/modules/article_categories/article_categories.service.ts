import { CACHE_TOKENS } from '@/common/constants';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateArticleCategoryDto } from './dto/create-article_category.dto';
import type { DeleteArticleCategoryDto } from './dto/delete-article_category.dto';
import type { UpdateArticleCategoryDto } from './dto/update-article_category.dto';
import { ArticleCategory } from './entities/article_category.entity';

@Injectable()
export class ArticleCategoriesService {
  constructor(
    @InjectRepository(ArticleCategory)
    private readonly repo: Repository<ArticleCategory>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleCategoryDto): Promise<void> {
    const entity = this.repo.create(dto as Partial<ArticleCategory>);
    await this.repo.save(entity);
    return;
  }

  @Cache({ key: 'article_categories:list:page:${0}:size:${1}' })
  async findAll(
    current: number = 1,
    size: number = 10,
  ): Promise<{ data: ArticleCategory[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  @Cache({ key: 'article_categories:item:${0}:${1}' })
  async findById(articleId: string, categoryId: string): Promise<ArticleCategory> {
    const entity = await this.repo.findOne({ where: { articleId, categoryId } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('ArticleCategory', {
        reason: `ArticleCategory ${articleId}/${categoryId} 不存在`,
      });
    }
    return entity;
  }

  @CacheEvict({ keys: ['article_categories:item:${0}:${1}', 'article_categories:list:*'] })
  async update(
    articleId: string,
    categoryId: string,
    dto: UpdateArticleCategoryDto,
  ): Promise<void> {
    const entity = await this.findById(articleId, categoryId);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return;
  }

  @CacheEvict({ keys: ['article_categories:item:*', 'article_categories:list:*'] })
  async remove(dto: DeleteArticleCategoryDto): Promise<{ message: string; deletedCount: number }> {
    if (dto.key) {
      const entity = await this.findById(dto.key.articleId, dto.key.categoryId);
      await this.repo.remove(entity);
      return { message: '删除成功', deletedCount: 1 };
    }
    if (dto.keys?.length) {
      const list = await this.repo.find({
        where: dto.keys.map((k) => ({ articleId: k.articleId, categoryId: k.categoryId })),
      });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', {
          reason: `要删除的记录 不存在`,
        });
      }
      await this.repo.remove(list);
      return { message: `成功删除 ${list.length} 条记录`, deletedCount: list.length };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', {
      reason: '必须提供要删除的记录 key 或 keys 列表',
    });
  }
}
