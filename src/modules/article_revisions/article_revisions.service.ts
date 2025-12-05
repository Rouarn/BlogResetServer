import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { CACHE_TOKENS } from '@/common/constants';
import type { CreateArticleRevisionDto } from './dto/create-article_revision.dto';
import type { UpdateArticleRevisionDto } from './dto/update-article_revision.dto';
import type { DeleteArticleRevisionDto } from './dto/delete-article_revision.dto';
import { ArticleRevision } from './entities/article_revision.entity';

@Injectable()
export class ArticleRevisionsService {
  constructor(
    @InjectRepository(ArticleRevision)
    private readonly repo: Repository<ArticleRevision>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleRevisionDto): Promise<void> {
    const entity = this.repo.create(dto as ArticleRevision);
    await this.repo.save(entity);
    return;
  }

  @Cache({ key: 'article_revisions:list:page:${0}:size:${1}' })
  async findAll(current: number = 1, size: number = 10): Promise<{ data: ArticleRevision[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  @Cache({ key: 'article_revisions:item:${0}' })
  async findById(id: string): Promise<ArticleRevision> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('ArticleRevision', { reason: `ArticleRevision ${id} 不存在` });
    }
    return entity;
  }

  @CacheEvict({ keys: ['article_revisions:item:${0}', 'article_revisions:list:*'] })
  async update(id: string, dto: UpdateArticleRevisionDto): Promise<void> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return;
  }

  @CacheEvict({ keys: ['article_revisions:item:*', 'article_revisions:list:*'] })
  async remove(dto: DeleteArticleRevisionDto): Promise<{ message: string; deletedCount: number }> {
    if (dto.id) {
      const entity = await this.findById(dto.id);
      await this.repo.remove(entity);
      return { message: '删除成功', deletedCount: 1 };
    }
    if (dto.ids?.length) {
      const list = await this.repo.findBy({ id: In(dto.ids) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { reason: `要删除的记录 ${dto.ids.join(', ')} 不存在` });
      }
      await this.repo.remove(list);
      return { message: `成功删除 ${list.length} 条记录`, deletedCount: list.length };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', { reason: '必须提供要删除的记录 ID 或 ID 列表' });
  }
}
