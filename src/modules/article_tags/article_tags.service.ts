import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { CACHE_TOKENS } from '@/common/constants';
import type { CreateArticleTagDto } from './dto/create-article_tag.dto';
import type { UpdateArticleTagDto } from './dto/update-article_tag.dto';
import type { DeleteArticleTagDto } from './dto/delete-article_tag.dto';
import { ArticleTag } from './entities/article_tag.entity';

@Injectable()
export class ArticleTagsService {
  constructor(
    @InjectRepository(ArticleTag)
    private readonly repo: Repository<ArticleTag>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleTagDto): Promise<void> {
    const entity = this.repo.create(dto as ArticleTag);
    await this.repo.save(entity);
    return;
  }

  @Cache({ key: 'article_tags:list:page:${0}:size:${1}' })
  async findAll(current: number = 1, size: number = 10): Promise<{ data: ArticleTag[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  @Cache({ key: 'article_tags:item:${0}' })
  async findById(id: string): Promise<ArticleTag> {
    const entity = await this.repo.findOne({ where: { articleId: id } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('ArticleTag', { reason: `ArticleTag ${id} 不存在` });
    }
    return entity;
  }

  @CacheEvict({ keys: ['article_tags:item:${0}', 'article_tags:list:*'] })
  async update(id: string, dto: UpdateArticleTagDto): Promise<void> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return;
  }

  @CacheEvict({ keys: ['article_tags:item:*', 'article_tags:list:*'] })
  async remove(dto: DeleteArticleTagDto): Promise<{ message: string; deletedCount: number }> {
    if (dto.id) {
      const entity = await this.findById(dto.id);
      await this.repo.remove(entity);
      return { message: '删除成功', deletedCount: 1 };
    }
    if (dto.ids?.length) {
      const list = await this.repo.findBy({ articleId: In(dto.ids) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { reason: `要删除的记录 ${dto.ids.join(', ')} 不存在` });
      }
      await this.repo.remove(list);
      return { message: `成功删除 ${list.length} 条记录`, deletedCount: list.length };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', { reason: '必须提供要删除的记录 ID 或 ID 列表' });
  }
}
