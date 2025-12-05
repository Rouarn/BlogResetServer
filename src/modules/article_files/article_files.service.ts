import { CACHE_TOKENS } from '@/common/constants';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateArticleFileDto } from './dto/create-article_file.dto';
import type { DeleteArticleFileDto } from './dto/delete-article_file.dto';
import type { UpdateArticleFileDto } from './dto/update-article_file.dto';
import { ArticleFile } from './entities/article_file.entity';

@Injectable()
export class ArticleFilesService {
  constructor(
    @InjectRepository(ArticleFile)
    private readonly repo: Repository<ArticleFile>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleFileDto): Promise<void> {
    const entity = this.repo.create(dto as Partial<ArticleFile>);
    await this.repo.save(entity);
    return;
  }

  @Cache({ key: 'article_files:list:page:${0}:size:${1}' })
  async findAll(
    current: number = 1,
    size: number = 10,
  ): Promise<{ data: ArticleFile[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  @Cache({ key: 'article_files:item:${0}:${1}' })
  async findById(articleId: string, fileId: string): Promise<ArticleFile> {
    const entity = await this.repo.findOne({ where: { articleId, fileId } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('ArticleFile', {
        reason: `ArticleFile ${articleId}/${fileId} 不存在`,
      });
    }
    return entity;
  }

  @CacheEvict({ keys: ['article_files:item:${0}:${1}', 'article_files:list:*'] })
  async update(articleId: string, fileId: string, dto: UpdateArticleFileDto): Promise<void> {
    const entity = await this.findById(articleId, fileId);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    return;
  }

  @CacheEvict({ keys: ['article_files:item:*', 'article_files:list:*'] })
  async remove(dto: DeleteArticleFileDto): Promise<{ message: string; deletedCount: number }> {
    if (dto.key) {
      const entity = await this.findById(dto.key.articleId, dto.key.fileId);
      await this.repo.remove(entity);
      return { message: '删除成功', deletedCount: 1 };
    }
    if (dto.keys?.length) {
      const list = await this.repo.find({
        where: dto.keys.map((k) => ({ articleId: k.articleId, fileId: k.fileId })),
      });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { reason: `要删除的记录 不存在` });
      }
      await this.repo.remove(list);
      return { message: `成功删除 ${list.length} 条记录`, deletedCount: list.length };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', {
      reason: '必须提供要删除的记录 key 或 keys 列表',
    });
  }
}
