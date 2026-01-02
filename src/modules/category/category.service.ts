import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { ICacheService } from '@/shared/cache';
import { CACHE_TOKENS } from '@/common/constants';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { DeleteCategoryDto } from './dto/delete-category.dto';
import { Category } from './entities/category.entity';

export interface CategoryWithCount {
  id: number;
  name: string;
  code: string;
  color: string;
  sortOrder: number;
  count: number;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const entity = this.repo.create(dto as Category);
    await this.repo.save(entity);
    await this.clearCache();
    return entity;
  }

  async findAllWithCount(): Promise<CategoryWithCount[]> {
    const cacheKey = 'category:list:all';
    const cached = await this.cacheService.get<CategoryWithCount[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const qb = this.repo.createQueryBuilder('category');
    qb.leftJoin('category.articles', 'article')
      .select([
        'category.id',
        'category.name',
        'category.code',
        'category.color',
        'category.sortOrder',
      ])
      .addSelect('COUNT(article.id)', 'count')
      .groupBy('category.id')
      .orderBy('category.sortOrder', 'ASC');

    const raw = await qb.getRawMany<{
      category_id: number;
      category_name: string;
      category_code: string;
      category_color: string;
      category_sortOrder: number;
      count: string;
    }>();

    // Transform raw result to match desired output
    const result: CategoryWithCount[] = raw.map((item) => ({
      id: +item.category_id,
      name: item.category_name,
      code: item.category_code,
      color: item.category_color,
      sortOrder: item.category_sortOrder,
      count: parseInt(item.count, 10) || 0,
    }));

    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async findAll(
    current: number = 1,
    size: number = 10,
  ): Promise<{ data: Category[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (current - 1) * size,
      take: size,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findById(id: string): Promise<Category> {
    const cacheKey = 'category:item:' + id;
    const cached = await this.cacheService.get<Category>(cacheKey);
    if (cached) {
      return cached;
    }
    const entity = await this.repo.findOne({ where: { id: +id } });
    if (!entity) {
      throw BusinessExceptionFactory.notFound('Category', { id });
    }
    await this.cacheService.set(cacheKey, entity);
    return entity;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    await this.repo.save(entity);
    await this.clearCache(id);
    return entity;
  }

  async remove(dto: DeleteCategoryDto): Promise<{ message: string }> {
    if (dto.id) {
      const entity = await this.findById(dto.id);
      await this.repo.remove(entity);
      await this.clearCache(dto.id);
      return { message: '成功删除 1 条记录' };
    }
    if (dto.ids?.length) {
      const ids = dto.ids.map((id) => +id);
      const list = await this.repo.findBy({ id: In(ids) });
      if (list.length === 0) {
        throw BusinessExceptionFactory.notFound('要删除的记录', { ids: dto.ids });
      }
      await this.repo.remove(list);
      await this.clearCache();
      return { message: '成功删除 ' + list.length + ' 条记录' };
    }
    throw BusinessExceptionFactory.invalidParameter('缺少删除参数', {
      reason: '必须提供要删除的记录 ID 或 ID 列表',
    });
  }

  private async clearCache(id?: string): Promise<void> {
    if (id) {
      await this.cacheService.del('category:item:' + id);
    }
    const keys = await this.cacheService.keys('category:list:*');
    if (keys.length > 0) {
      await this.cacheService.delMany(keys);
    }
  }
}
