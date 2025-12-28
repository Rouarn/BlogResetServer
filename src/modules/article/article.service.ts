import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { ICacheService } from '@/shared/cache';
import { CACHE_TOKENS } from '@/common/constants';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';
import type { DeleteArticleDto } from './dto/delete-article.dto';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly repo: Repository<Article>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleDto): Promise<void> {
    const entity = this.repo.create(dto as Article);
    await this.repo.save(entity);
    return;
  }

  async findAll(
    current: number = 1,
    size: number = 10,
  ): Promise<{ data: Article[]; total: number }> {
    const cacheKey = 'article:list:page:' + current + ':size:' + size;
    const cached = await this.cacheService.get<{ data: Article[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    const result = { data, total };
    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async findById(id: string): Promise<Article> {
    const cacheKey = 'article:item:' + id;
    const cached = await this.cacheService.get<Article>(cacheKey);
    if (cached) {
      return cached;
    }
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('Article', { id });
    }
    await this.cacheService.set(cacheKey, entity);
    return entity;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<void> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    await this.cacheService.del('article:item:' + id);
    const keys = await this.cacheService.keys('article:list:*');
    if (keys.length > 0) {
      await this.cacheService.delMany(keys);
    }
    return;
  }

  async remove(dto: DeleteArticleDto): Promise<{ message: string }> {
    if (dto.id) {
      const entity = await this.findById(dto.id);
      await this.repo.remove(entity);
      await this.cacheService.del('article:item:' + dto.id);
      const keys = await this.cacheService.keys('article:list:*');
      if (keys.length > 0) {
        await this.cacheService.delMany(keys);
      }
      return { message: '删除成功' };
    }
    if (dto.ids?.length) {
      const list = await this.repo.findBy({ id: In(dto.ids) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { ids: dto.ids });
      }
      await this.repo.remove(list);
      const patterns = ['article:item:*', 'article:list:*'];
      for (const p of patterns) {
        const keys = await this.cacheService.keys(p);
        if (keys.length > 0) {
          await this.cacheService.delMany(keys);
        }
      }
      return { message: `成功删除 ${list.length} 条记录` };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', {
      reason: '必须提供要删除的记录 ID 或 ID 列表',
    });
  }
}
