import { CACHE_TOKENS } from '@/common/constants';
import { ArticleStatus, Status } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Category } from '@/modules/category/entities/category.entity';
import { ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
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
  prev: {
    id: number | null;
    title: string | null;
  };
  next: {
    id: number | null;
    title: string | null;
  };
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

  async create(dto: CreateArticleDto, userId?: string): Promise<Article> {
    try {
      const { isFeatured, categoryId = 0, status, ...createDto } = dto;

      // 校验分类是否存在
      if (!isNaN(categoryId)) {
        const category = await this.categoryRepo.findOneBy({ id: categoryId });
        if (!category) {
          throw BusinessExceptionFactory.notFound('分类', { id: categoryId });
        }
      }

      const finalStatus = status ?? ArticleStatus.DRAFT;

      // 显式创建实体，避免直接转换带来的潜在问题
      const entity = this.repo.create({
        ...createDto,
        categoryId,
        status: finalStatus,
        publishedAt: finalStatus === ArticleStatus.PUBLISHED ? new Date() : null,
        isFeatured: isFeatured ? Status.ENABLED : Status.DISABLED,
        views: 0,
        authorId: userId,
      });

      await this.repo.save(entity);
      await this.clearCache();
      return entity;
    } catch (error) {
      throw error; // 抛出错误以便全局异常过滤器处理
    }
  }

  async findAll(query: QueryArticleDto): Promise<{ data: Article[]; total: number }> {
    const { current = 1, size = 10, keyword, categoryId, authorId } = query;

    // 缓存键需要包含搜索参数
    const cacheKey =
      'article:list:page:' +
      current +
      ':size:' +
      size +
      ':k:' +
      (keyword ?? 'none') +
      ':c:' +
      (categoryId ?? 'none') +
      ':a:' +
      (authorId ?? 'none');
    const cached = await this.cacheService.get<{ data: Article[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const qb = this.repo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .skip((current - 1) * size)
      .take(size);

    // 1. 按作者ID筛选（用户中心 - 我的文章）
    if (authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId });
      // 按作者ID查询时，允许查看所有状态（包括草稿）
    } else {
      // 2. 公开视图：仅显示已发布文章
      qb.andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED });
    }

    // 3. 按分类筛选
    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    // 4. 按关键词筛选（标题或摘要）
    if (keyword) {
      qb.andWhere('(article.title LIKE :keyword OR article.summary LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    // 自定义排序逻辑：
    // 1. 置顶文章优先（isFeatured 倒序）
    // 2. 对于置顶文章：按更新时间倒序（最近修改的在前）
    // 3. 对于普通文章：按创建时间倒序（正常时间顺序）
    qb.addSelect(
      `CASE WHEN article.isFeatured = ${Status.ENABLED} THEN article.updatedAt ELSE article.createdAt END`,
      'sort_time',
    );
    qb.orderBy('article.isFeatured', 'DESC');
    qb.addOrderBy('sort_time', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    const result = { data, total };

    // 仅缓存公开列表（不缓存特定作者ID的查询，以避免缓存污染或通过缓存泄露隐私）
    if (!authorId) {
      await this.cacheService.set(cacheKey, result);
    }

    return result;
  }

  async getArchive(): Promise<ArchiveItem[]> {
    const cacheKey = 'article:archive';
    const cached = await this.cacheService.get<ArchiveItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 按年份分组
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
        date: article.createdAt, // 前端格式
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
    const cached = await this.cacheService.get<ArticleDetail>(`article:detail:${id}`);
    if (cached) {
      void this.incrementViews(id);
      return cached;
    }

    const entity = await this.repo.findOne({
      where: { id: +id },
      relations: ['category', 'author'],
    });

    if (!entity) {
      throw BusinessExceptionFactory.notFound('文章', { id });
    }

    // Increment views asynchronously
    void this.incrementViews(id);

    // Get prev/next article
    const prev = await this.repo.findOne({
      where: { id: LessThan(entity.id), status: ArticleStatus.PUBLISHED },
      order: { id: 'DESC' },
      select: ['id', 'title'],
    });

    const next = await this.repo.findOne({
      where: { id: MoreThan(entity.id), status: ArticleStatus.PUBLISHED },
      order: { id: 'ASC' },
      select: ['id', 'title'],
    });

    const result = {
      ...entity,
      prev: {
        id: prev?.id ?? null,
        title: prev?.title ?? null,
      },
      next: {
        id: next?.id ?? null,
        title: next?.title ?? null,
      },
    };

    await this.cacheService.set(`article:detail:${id}`, result);
    return result;
  }

  private async incrementViews(id: string): Promise<void> {
    await this.repo.increment({ id: +id }, 'views', 1);
  }

  async like(id: string): Promise<number> {
    const entity = await this.repo.findOneBy({ id: +id });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('文章', { id });
    }

    await this.repo.increment({ id: +id }, 'likes', 1);
    await this.clearCache();

    // Return the new like count
    return entity.likes + 1;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const articleId = Number(id);
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

      const { categoryId, status, ...updateDto } = dto;

      let publishedAtUpdate = {};
      if (status !== undefined) {
        if (status === ArticleStatus.DRAFT) {
          publishedAtUpdate = { status, publishedAt: null };
        } else if (status === ArticleStatus.PUBLISHED) {
          if (entity.status !== ArticleStatus.PUBLISHED || !entity.publishedAt) {
            publishedAtUpdate = { status, publishedAt: new Date() };
          } else {
            publishedAtUpdate = { status };
          }
        }
      }

      Object.assign(entity, {
        ...updateDto,
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(dto.isFeatured !== undefined
          ? { isFeatured: dto.isFeatured ? Status.ENABLED : Status.DISABLED }
          : {}),
        ...publishedAtUpdate,
      });
      await this.repo.save(entity);
      await this.clearCache();
      await this.cacheService.del('article:item:' + id);
      return entity;
    } catch (error) {
      console.error('Update article failed:', error);
      throw error;
    }
  }

  async remove(dto: DeleteArticleDto): Promise<Article[]> {
    if (dto.id) {
      const entity = await this.repo.findOneBy({ id: Number(dto.id) });
      if (!entity) {
        throw BusinessExceptionFactory.notFound('Article', { id: dto.id });
      }
      await this.repo.delete(Number(dto.id));
      await this.clearCache();
      return [entity];
    }
    if (dto.ids?.length) {
      const list = await this.repo.findBy({ id: In(dto.ids.map((id) => Number(id))) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { ids: dto.ids });
      }
      await this.repo.remove(list);
      await this.clearCache();
      return list;
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
