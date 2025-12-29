import { CACHE_TOKENS } from '@/common/constants';
import { Status } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Category } from '@/modules/category/entities/category.entity';
import { ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { DeleteArticleDto } from './dto/delete-article.dto';
import type { QueryArticleDto } from './dto/query-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

export interface ArchiveItem {
  year: string;
  articles: {
    id: number;
    title: string;
    date: Date;
    categoryId: number;
  }[];
}

export interface ArticleDetail extends Article {
  prevId: number | null;
  nextId: number | null;
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly repo: Repository<Article>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateArticleDto, userId?: string): Promise<void> {
    try {
      // 校验分类是否存在
      if (dto.categoryId) {
        const categoryExists = await this.categoryRepo.existsBy({ id: dto.categoryId });
        if (!categoryExists) {
          throw BusinessExceptionFactory.notFound('分类', { id: dto.categoryId });
        }
      }

      const { isFeatured, ...createDto } = dto;

      // 显式创建实体，避免直接转换带来的潜在问题
      const entity = this.repo.create({
        ...createDto,
        // 如果有其他默认值或需要处理的字段，可以在这里处理
        isFeatured: isFeatured ? Status.ENABLED : Status.DISABLED,
        views: 0,
        authorId: userId,
      });

      await this.repo.save(entity);
      await this.clearCache();
    } catch (error) {
      throw error; // 抛出错误以便全局异常过滤器处理
    }
  }

  async findAll(query: QueryArticleDto): Promise<{ data: Article[]; total: number }> {
    const { current = 1, size = 10, keyword, categoryId } = query;

    // Cache key needs to include search params
    const cacheKey =
      'article:list:page:' +
      current +
      ':size:' +
      size +
      ':k:' +
      (keyword ?? '') +
      ':c:' +
      (categoryId ?? '');
    const cached = await this.cacheService.get<{ data: Article[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: FindOptionsWhere<Article> = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // If keyword needs to match title OR summary, use QueryBuilder
    if (keyword) {
      const keywordParam = '%' + keyword + '%';
      const qb = this.repo
        .createQueryBuilder('article')
        .leftJoinAndSelect('article.category', 'category')
        .leftJoinAndSelect('article.author', 'author')
        .where('article.categoryId = :categoryId', { categoryId })
        .andWhere('(article.title LIKE :keyword OR article.summary LIKE :keyword)', {
          keyword: keywordParam,
        })
        .skip((current - 1) * size)
        .take(size)
        .orderBy('article.isFeatured', 'DESC') // Recommend first
        .addOrderBy('article.createdAt', 'DESC');

      if (!categoryId) {
        // Remove category condition if not provided
        // Re-construct QB simpler
        const qb2 = this.repo
          .createQueryBuilder('article')
          .leftJoinAndSelect('article.category', 'category')
          .leftJoinAndSelect('article.author', 'author')
          .where('(article.title LIKE :keyword OR article.summary LIKE :keyword)', {
            keyword: keywordParam,
          })
          .skip((current - 1) * size)
          .take(size)
          .orderBy('article.isFeatured', 'DESC')
          .addOrderBy('article.createdAt', 'DESC');

        const [data, total] = await qb2.getManyAndCount();
        const result = { data, total };
        await this.cacheService.set(cacheKey, result);
        return result;
      }

      const [data, total] = await qb.getManyAndCount();
      const result = { data, total };
      await this.cacheService.set(cacheKey, result);
      return result;
    }

    // Standard find with relations
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['category', 'author'],
      skip: (current - 1) * size,
      take: size,
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
    });

    const result = { data, total };
    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async getArchive(): Promise<ArchiveItem[]> {
    const cacheKey = 'article:archive';
    const cached = await this.cacheService.get<ArchiveItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Group by Year
    const qb = this.repo
      .createQueryBuilder('article')
      .select(['article.id', 'article.title', 'article.createdAt', 'article.categoryId'])
      .orderBy('article.createdAt', 'DESC');

    const articles = await qb.getMany();

    const groups: Record<string, ArchiveItem['articles']> = {};
    articles.forEach((article) => {
      const year = new Date(article.createdAt).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push({
        id: article.id,
        title: article.title,
        date: article.createdAt, // Frontend format
        categoryId: article.categoryId,
      });
    });

    const result: ArchiveItem[] = Object.keys(groups)
      .sort((a, b) => +b - +a)
      .map((year) => ({
        year,
        articles: groups[year],
      }));

    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async findById(id: string): Promise<ArticleDetail> {
    const articleId = +id;
    if (isNaN(articleId)) {
      throw BusinessExceptionFactory.invalidParameter('文章 ID');
    }

    const entity = await this.repo.findOne({
      where: { id: articleId },
      relations: ['category', 'author'],
    });

    if (!entity) {
      throw BusinessExceptionFactory.notFound('Article', { id });
    }

    // Increment views (Async, don't await to block response)
    this.repo.increment({ id: articleId }, 'views', 1).catch((e) => console.error(e));

    // Find Prev/Next
    const prev = await this.repo.findOne({
      where: { id: LessThan(articleId) },
      order: { id: 'DESC' },
      select: ['id', 'title'],
    });

    const next = await this.repo.findOne({
      where: { id: MoreThan(articleId) },
      order: { id: 'ASC' },
      select: ['id', 'title'],
    });

    return {
      ...entity,
      prevId: prev?.id ?? null,
      nextId: next?.id ?? null,
    };
  }

  async update(id: string, dto: UpdateArticleDto): Promise<void> {
    const articleId = +id;
    if (isNaN(articleId)) {
      throw BusinessExceptionFactory.invalidParameter('文章 ID');
    }

    try {
      // 校验分类是否存在
      if (dto.categoryId) {
        const categoryExists = await this.categoryRepo.exist({ where: { id: dto.categoryId } });
        if (!categoryExists) {
          throw BusinessExceptionFactory.notFound('分类', { id: dto.categoryId });
        }
      }

      const entity = await this.repo.findOneBy({ id: articleId });
      if (!entity) {
        throw BusinessExceptionFactory.notFound('Article', { id });
      }

      Object.assign(entity, {
        ...dto,
        ...(dto.isFeatured !== undefined
          ? { isFeatured: dto.isFeatured ? Status.ENABLED : Status.DISABLED }
          : {}),
      });
      await this.repo.save(entity);
      await this.clearCache(); // Invalidate list caches
      await this.cacheService.del('article:item:' + id);
    } catch (error) {
      console.error('Update article failed:', error);
      throw error;
    }
  }

  async remove(dto: DeleteArticleDto): Promise<{ message: string }> {
    if (dto.id) {
      await this.repo.delete(dto.id);
      await this.clearCache();
      return { message: '删除成功' };
    }
    if (dto.ids?.length) {
      await this.repo.delete(dto.ids);
      await this.clearCache();
      return { message: '成功删除 ' + dto.ids.length + ' 条记录' };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', {
      reason: '必须提供要删除的记录 ID 或 ID 列表',
    });
  }

  private async clearCache(): Promise<void> {
    const keys = await this.cacheService.keys('article:*');
    if (keys.length > 0) {
      await this.cacheService.delMany(keys);
    }
  }
}
